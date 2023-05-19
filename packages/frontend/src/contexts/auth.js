import { createContext } from 'react'
import { makeAutoObservable } from 'mobx'
import { APP_ADDRESS, provider, SERVER } from '../config'
import prover from './prover'
import Identity from 'auth/src/Identity'

export default class Auth {

  constructor() {
    this.hasRegistered = false
    this.identity = null
    this.identities = []
    this.tokensByIdentity = {}
    makeAutoObservable(this)
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
    await this.identity.sync.start()
    this.identity.sync.waitForSync().then(() =>
      Promise.all([
        this.loadIdentities(),
        this.loadHasRegistered()])
    )
  }

  async loadHasRegistered() {
    const id = await this.identity.sync._db.findOne('Identity', {
      where: {
        pubkey: this.identity.pubkey.toString(),
      }
    })
    this.hasRegistered = !!id
  }

  async loadIdentities() {
    const identities = await this.identity.sync._db.findMany('Identity', {
      where: {
        pubkey: { ne: '0'}
      }
    })
    this.identities = identities
    for (const id of identities) {
      const tokens = await this.identity.sync._db.findMany('Token', {
        where: {
          hash: {
            ne: '0'
          },
          pubkey: id.pubkey,
        }
      })
      this.tokensByIdentity = {
        ...this.tokensByIdentity,
        [id.pubkey]: tokens
      }
    }
  }

  async register() {
    await new Promise(r => setTimeout(r, 1))
    const regProof = await this.identity.registerProof()
    const token = this.identity.token
    const pubkey = this.identity.pubkey
    const { hash } = await this.sendTx(regProof,'register','register')
    await provider.waitForTransaction(hash)
    await this.identity.sync.waitForSync()
    await this.loadHasRegistered()
    await this.loadIdentities()
    localStorage.setItem('id', JSON.stringify({
      pubkey: this.identity.pubkey.toString(),
      token: {
        x: this.identity.token.x.toString(),
        y: this.identity.token.y.toString(),
      }
    }))
  }

  async addToken() {
    await new Promise(r => setTimeout(r, 1))
    const tokenProof = await this.identity.addTokenProof()
    const { hash } = await this.sendTx(tokenProof,'addToken','addToken')
    await provider.waitForTransaction(hash)
    await this.identity.sync.waitForSync()
    await this.loadIdentities()
    return tokenProof
  }

  async removeToken(tokenHash) {
    await new Promise(r => setTimeout(r, 1))
    const tokenProof = await this.identity.removeTokenProof({ tokenHash })
    const { hash } = await this.sendTx(tokenProof,'removeToken','removeToken')
    await provider.waitForTransaction(hash)
    await this.identity.sync.waitForSync()
    await this.loadIdentities()
  }

  async sendTx(proof, circuit, func) {
    const data = await fetch(`${SERVER}/api/tx`, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            publicSignals: proof.publicSignals,
            proof: proof.proof,
            circuit,
            func,
        }, (_,v) => typeof v === 'bigint' ? v.toString() : v),
    }).then((r) => r.json())
    return data
  }

}
