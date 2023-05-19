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

  return (
    <div className="container">
      <div className="container" style={{ flexDirection: 'column' }}>
        <div>
          <div>Registered Identities</div>
          {auth.identities.map((id) => {
            const isMe =
              id.pubkey.toString() === auth.identity.pubkey.toString()
            return (
              <div
                key={id.pubkey}
                style={{
                  padding: '4px',
                  border: '1px solid black',
                  margin: '4px',
                }}
              >
                <div style={{ borderBottom: '1px solid black' }}>
                  pubkey: {ui.fieldElement(id.pubkey)}{' '}
                  {isMe ? (
                    <span style={{ fontWeight: 'bold' }}>(me)</span>
                  ) : null}
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
      </div>
      <div style={{ padding: '4px', border: '1px solid black' }}>
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
      </div>
    </div>
  )
})
