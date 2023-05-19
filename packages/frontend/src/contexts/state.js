import { createContext } from 'react'
import Interface from './interface'
import Auth from './auth'

const state = {}

const ui = new Interface(state)
const auth = new Auth(state)

Object.assign(state, {
  ui,
  auth,
})

export default createContext(state)
