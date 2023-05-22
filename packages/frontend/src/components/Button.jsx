import React from 'react'
import './button.css'

export default ({ style, children, loadingText, onClick }) => {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [loadingMsg, setLoadingMsg] = React.useState()
  const handleClick = async () => {
    if (loading) return
    if (typeof onClick !== 'function') return
    try {
      setLoading(true)
      setLoadingMsg('Loading...')
      await onClick(setLoadingMsg)
    } catch (err) {
      console.log(err)
      setError(err.toString())
      setTimeout(() => setError(''), 2000)
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="button-outer">
      <div
        className="button-inner"
        style={{ ...(style || {}) }}
        onClick={handleClick}
      >
        {!loading && !error ? children : null}
        {loading ? loadingText ?? loadingMsg : null}
        {error ? error : null}
      </div>
    </div>
  )
}
