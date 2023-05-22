import React from 'react'
import { Link } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import './home.css'
import Tooltip from '../components/Tooltip'
import Button from '../components/Button'
import { SERVER } from '../config'

import state from '../contexts/state'

export default observer(() => {
  const { auth, ui } = React.useContext(state)
  const [newTokenProof, setNewTokenProof] = React.useState(null)
  const [recoveryCode, setRecoveryCode] = React.useState()

  if (!recoveryCode && auth.recoveryCodes.length)
    setRecoveryCode(auth.recoveryCodes[0].code)

  return (
    <div
      className="container"
      style={{ flexWrap: 'wrap', flexDirection: 'row' }}
    >
      <div className="container">
        <div>Registered Identities</div>
        {auth.identities.map((id) => {
          const isMe = id.pubkey.toString() === auth.identity.pubkey.toString()
          return (
            <div
              key={id.pubkey}
              style={{
                padding: '4px',
                border: '1px solid black',
                margin: '4px',
              }}
            >
              <div
                style={{
                  borderBottom: '1px solid black',
                  paddingBottom: '2px',
                  marginBottom: '2px',
                }}
              >
                pubkey: {ui.fieldElement(id.pubkey)}{' '}
                {isMe ? <span style={{ fontWeight: 'bold' }}>(me)</span> : null}
              </div>
              {auth.tokensByIdentity[id.pubkey].map((token) => (
                <div
                  key={token.hash}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '2px',
                  }}
                >
                  <div>
                    {`token${token.index}`}: {ui.fieldElement(token.hash)}
                  </div>
                  {isMe ? (
                    <Button
                      style={{ marginLeft: '4px' }}
                      onClick={() => auth.removeToken(token.hash)}
                    >
                      Disable
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          )
        })}
      </div>
      <div style={{ flex: 1 }} />
      <div className="container">
        {auth.hasRegistered ? (
          <div
            className="container"
            style={{ padding: '4px', border: '1px solid black' }}
          >
            <Button
              onClick={async () => {
                setNewTokenProof(null)
                const proof = await auth.addToken()
                setNewTokenProof(proof)
              }}
            >
              Add Token
            </Button>
            {newTokenProof ? (
              <div>
                <div>Added token with</div>
                <div>x: {ui.fieldElement(newTokenProof.token.x)}</div>
                <div>y: {ui.fieldElement(newTokenProof.token.y)}</div>
                <div>hash: {ui.fieldElement(newTokenProof.tokenHash)}</div>
              </div>
            ) : null}
            <div style={{ height: '10px' }} />
            <div>Add a new token that can be used to control the identity.</div>
          </div>
        ) : null}
        {auth.hasRegistered ? (
          <div
            className="container"
            style={{ padding: '4px', border: '1px solid black' }}
          >
            <select
              onChange={(e) => setRecoveryCode(e.target.value)}
              value={recoveryCode}
            >
              {auth.recoveryCodes.map(({ code }) => (
                <option key={code} value={code}>
                  {code.slice(0, 20)}
                </option>
              ))}
            </select>
            <div style={{ height: '2px' }} />
            <Button
              onClick={async () => {
                await auth.recoverIdentity(recoveryCode)
              }}
            >
              Recover Account
            </Button>
            <div style={{ height: '10px' }} />
            <div>Use these recovery codes to reset your account tokens.</div>
          </div>
        ) : null}
        <div className="container">
          <div>Events</div>
          {[...auth.events]
            .reverse()
            .map(({ pubkey, action, tokenHash, tx }) => (
              <div
                key={`${pubkey}${action}${tokenHash}`}
                style={{
                  padding: '4px',
                  border: '1px solid black',
                  margin: '2px',
                  display: 'flex',
                }}
              >
                <a
                  href={`https://sepolia.etherscan.io/tx/${tx}`}
                  target="_blank"
                >
                  tx
                </a>
                <div style={{ width: '5px', height: '5px' }} />
                <div>
                  Identity <strong>{ui.fieldElement(pubkey)}</strong> {action}{' '}
                  <strong>{ui.fieldElement(tokenHash)}</strong>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
})
