import { createContext } from 'react'
import { makeAutoObservable, runInAction, action } from 'mobx'
import { APP_ADDRESS, provider, SERVER } from '../config'
import prover from './prover'
import Identity from 'auth/src/Identity'

export default class Auth {
  constructor(state) {
    this.state = state
    this.hasRegistered = false
    this.identities = []
    this.tokensByIdentity = {}
    this.loading = true
    this.identity = null
    this.recoveryCodes = []
    this.events = []
    makeAutoObservable(this, {
      identity: false,
      state: false,
    })
    if (typeof window !== 'undefined') {
      this.load()
    }
  }

  // must be called in browser, not in SSR
  async load() {
    // load the identity keypair from local storage if available
    // should contain pubkey and token
    const id = JSON.parse(localStorage.getItem('id') ?? 'null') ?? {}
    this.identity = new Identity({
      address: APP_ADDRESS,
      prover,
      provider,
      ...id,
    })
    this.identity.sync.on(
      'AddToken',
      action(({ event, decodedData }) => {
        const { pubkey, tokenHash } = decodedData
        console.log(event)
        this.events = [
          ...this.events,
          {
            action: 'added token with hash',
            pubkey,
            tokenHash,
            tx: event.transactionHash,
          },
        ]
      })
    )
    this.identity.sync.on(
      'RemoveToken',
      action(({ event, decodedData }) => {
        const { pubkey, tokenHash } = decodedData
        this.events = [
          ...this.events,
          {
            action: 'removed token with hash',
            pubkey,
            tokenHash,
            tx: event.transactionHash,
          },
        ]
      })
    )
    this.identity.sync.on(
      'Register',
      action(({ event, decodedData }) => {
        const { pubkey, tokenHash } = decodedData
        this.events = [
          ...this.events,
          {
            action: 'registered with hash',
            pubkey,
            tokenHash,
            tx: event.transactionHash,
          },
        ]
      })
    )
    this.identity.sync.on(
      'RecoverIdentity',
      action(({ event, decodedData }) => {
        const { pubkey, tokenHash } = decodedData
        this.events = [
          ...this.events,
          {
            action: 'reset account with token',
            pubkey,
            tokenHash,
            tx: event.transactionHash,
          },
        ]
      })
    )
    await this.identity.sync.start()
    this.identity.sync
      .waitForSync()
      .then(() => runInAction(() => (this.loading = false)))
    this.identity.sync.on('pollEnd', () =>
      Promise.all([
        this.loadIdentities(),
        this.loadRecoveryCodes(),
        this.loadHasRegistered(),
      ])
    )
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.identity.sync.start()
      } else {
        this.identity.sync.stop()
      }
    })
    const codes = localStorage.getItem(this.identity.pubkey.toString())
    if (codes) {
      const parsed = JSON.parse(codes)
      await this.identity.sync._db.create('RecoveryCode', parsed)
    }
  }

  async loadRecoveryCodes() {
    this.recoveryCodes = await this.identity.sync._db.findMany('RecoveryCode', {
      where: {
        pubkey: this.identity.pubkey.toString(),
      },
    })
  }

  async loadHasRegistered() {
    const id = await this.identity.sync._db.findOne('Identity', {
      where: {
        pubkey: this.identity.pubkey.toString(),
      },
    })
    runInAction(() => (this.hasRegistered = !!id))
  }

  async loadIdentities() {
    const identities = await this.identity.sync._db.findMany('Identity', {
      where: {
        pubkey: { ne: '0' },
      },
    })
    runInAction(() => (this.identities = identities))
    for (const id of identities) {
      const tokens = await this.identity.sync._db.findMany('Token', {
        where: {
          hash: {
            ne: '0',
          },
          pubkey: id.pubkey.toString(),
        },
      })
      runInAction(
        () =>
          (this.tokensByIdentity = {
            ...this.tokensByIdentity,
            [id.pubkey]: tokens,
          })
      )
    }
  }

  async register() {
    await new Promise((r) => setTimeout(r, 1))
    const regProof = await this.identity.registerProof()
    const token = this.identity.token
    const pubkey = this.identity.pubkey
    // commit the recovery codes to local storage
    const codes = await this.identity.sync._db.findMany('RecoveryCode', {
      where: {
        pubkey: pubkey.toString(),
      },
    })
    localStorage.setItem(pubkey.toString(), JSON.stringify(codes))
    const { hash } = await this.sendTx(regProof, 'register', 'register')
    await provider.waitForTransaction(hash)
    await this.identity.sync.waitForSync()
    await this.loadHasRegistered()
    await this.loadIdentities()
    localStorage.setItem(
      'id',
      JSON.stringify({
        pubkey: this.identity.pubkey.toString(),
        token: {
          x: this.identity.token.x.toString(),
          y: this.identity.token.y.toString(),
        },
      })
    )
  }

  async addToken() {
    await new Promise((r) => setTimeout(r, 1))
    const tokenProof = await this.identity.addTokenProof()
    const { hash } = await this.sendTx(tokenProof, 'addToken', 'addToken')
    await provider.waitForTransaction(hash)
    await this.identity.sync.waitForSync()
    return tokenProof
  }

  async removeToken(tokenHash) {
    await new Promise((r) => setTimeout(r, 1))
    const tokenProof = await this.identity.removeTokenProof({ tokenHash })
    const { hash } = await this.sendTx(tokenProof, 'removeToken', 'removeToken')
    await provider.waitForTransaction(hash)
    await this.identity.sync.waitForSync()
  }

  async recoverIdentity(recoveryCode) {
    await new Promise((r) => setTimeout(r, 1))
    const proof = await this.identity.recoveryProof({ recoveryCode })
    this.identity.token = proof.token
    localStorage.setItem(
      'id',
      JSON.stringify({
        token: {
          x: proof.token.x.toString(),
          y: proof.token.y.toString(),
        },
        pubkey: this.identity.pubkey.toString(),
      })
    )
    const { hash } = await this.sendTx(
      proof,
      'recoverIdentity',
      'recoverIdentity'
    )
    await provider.waitForTransaction(hash)
    await this.identity.sync.waitForSync()
  }

  async sendTx(proof, circuit, func) {
    const data = await fetch(`${SERVER}/api/tx`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(
        {
          publicSignals: proof.publicSignals,
          proof: proof.proof,
          circuit,
          func,
        },
        (_, v) => (typeof v === 'bigint' ? v.toString() : v)
      ),
    }).then((r) => r.json())
    return data
  }
}
