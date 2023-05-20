import React from 'react'
import { Outlet, Link } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import './header.css'
import state from '../contexts/state'
import Button from '../components/Button'
import { poseidon1 } from 'poseidon-lite/poseidon1'

export default observer(() => {
  const { auth, ui } = React.useContext(state)
  return (
    <>
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type="checkbox"
            onChange={(e) => {
              ui.useSmallField = e.target.checked
            }}
            checked={ui.useSmallField}
          />
          <span>Use small field</span>
          <div style={{ width: '4px' }} />
        </div>
        <div className="links">
          {auth.hasRegistered ? (
            <div>
              <div>my pubkey: {ui.fieldElement(auth.identity.pubkey)}</div>
              <div>
                my token: {ui.fieldElement(poseidon1([auth.identity.token.y]))}
              </div>
            </div>
          ) : (
            <Button onClick={async () => auth.register()}>Register</Button>
          )}
        </div>
      </div>
      <Outlet />
    </>
  )
})
