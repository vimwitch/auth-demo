import { ethers } from 'ethers'
import config from 'auth/config.js'

const prod = NODE_ENV === 'production'

const _APP_ADDRESS = prod
  ? '0x1D332327d9F965c473D79BBDc0B7196Cf8473e6A'
  : undefined

export const APP_ADDRESS = _APP_ADDRESS ?? config.APP_ADDRESS
export const ETH_PROVIDER_URL = config.ETH_PROVIDER_URL

export const provider = ETH_PROVIDER_URL.startsWith('http')
  ? new ethers.providers.JsonRpcProvider(ETH_PROVIDER_URL)
  : new ethers.providers.WebSocketProvider(ETH_PROVIDER_URL)

export const SERVER = prod ? 'https://relay.zketh.io' : 'http://localhost:8000'
export const KEY_SERVER = prod
  ? 'https://keys.zketh.io/v0/'
  : 'http://127.0.0.1:8000/build/'
//: 'http://localhost:8000/build/'
// export const KEY_SERVER = 'https://keys.unirep.io/2-beta-1/'
