import { ethers } from 'ethers'
import config from 'auth/config.js'

const prod = NODE_ENV === 'production'

const _APP_ADDRESS = prod
  ? '0x099451bfeA1B01A9D6915Ed4CC93cf45e83E88fD'
  : undefined

export const APP_ADDRESS = _APP_ADDRESS ?? config.APP_ADDRESS
export const ETH_PROVIDER_URL = prod
  ? 'https://sepolia.unirep.io'
  : config.ETH_PROVIDER_URL

export const provider = ETH_PROVIDER_URL.startsWith('http')
  ? new ethers.providers.StaticJsonRpcProvider(ETH_PROVIDER_URL)
  : new ethers.providers.WebSocketProvider(ETH_PROVIDER_URL)

export const SERVER = prod
  ? 'https://auth-relay.unirep.io'
  : 'http://localhost:8000'
export const KEY_SERVER = prod
  ? 'https://auth-relay.unirep.io/build/'
  : 'http://127.0.0.1:8000/build/'
//: 'http://localhost:8000/build/'
// export const KEY_SERVER = 'https://keys.unirep.io/2-beta-1/'
