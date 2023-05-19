import BaseProof from 'auth/src/BaseProof.js'
import prover from 'auth/provers/default.js'
import { ethers } from 'ethers'
import TransactionManager from '../TransactionManager.mjs'
import { APP_ADDRESS } from '../config.mjs'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const ABI = require('auth/abi/Auth.json')

export default ({ app }) => {
  app.post('/api/tx', async (req, res) => {
    try {
      const { publicSignals, proof, circuit, func } = req.body
      const _proof = new BaseProof(publicSignals, proof, prover)
      _proof.circuit = circuit
      const valid = await _proof.verify()
      if (!valid) {
        res.status(400).json({ error: 'Invalid proof' })
        return
      }
      const appContract = new ethers.Contract(APP_ADDRESS, ABI)
      const calldata = appContract.interface.encodeFunctionData(func, [
        _proof.publicSignals,
        _proof.proof,
      ])
      const hash = await TransactionManager.queueTransaction(
        APP_ADDRESS,
        calldata
      )
      res.json({ hash })
    } catch (error) {
      console.log(error)
      res.status(500).json({ error })
    }
  })
}
