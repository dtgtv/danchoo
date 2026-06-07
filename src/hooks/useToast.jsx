import { useState, useCallback } from 'react'

export function useToast() {
  const [msg, setMsg] = useState(null)
  const showToast = useCallback((text, ms = 2500) => {
    setMsg(text)
    setTimeout(() => setMsg(null), ms)
  }, [])
  const Toast = msg ? (
    <div style={{
      position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
      background: '#0f0f14', color: '#fff', padding: '10px 20px',
      borderRadius: 24, fontSize: 13, zIndex: 9999, whiteSpace: 'nowrap'
    }}>{msg}</div>
  ) : null
  return { showToast, Toast }
}
