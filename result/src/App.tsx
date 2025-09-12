import { useEffect, useRef, useState } from 'react'
import './App.css'

type Message = {
  type: string
  [key: string]: unknown
}

type ReceivedMessage = {
  id: string
  data: Message
}

function App() {
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState<ReceivedMessage[]>([])
  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const ws = new WebSocket(`${protocol}://localhost:4000`)
    socketRef.current = ws

    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onerror = () => setConnected(false)
    ws.onmessage = (event) => {
      const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`
      try {
        const data: Message = JSON.parse(event.data)
        setMessages((prev) => [{ id: makeId(), data }, ...prev].slice(0, 50))
      } catch {
        const data: Message = { type: 'raw', value: String(event.data) }
        setMessages((prev) => [{ id: makeId(), data }, ...prev].slice(0, 50))
      }
    }

    return () => {
      ws.close()
    }
  }, [])

  const sendPing = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'ping', at: Date.now() }))
    }
  }

  return (
    <div className="ws-container">
      <div className="ws-header">
        <span>Status: {connected ? 'connected' : 'disconnected'}</span>
        <button disabled={!connected} onClick={sendPing}>Send ping</button>
      </div>
      <ul className="ws-feed">
        {messages.map((m) => (
          <li key={m.id}>
            <code>{JSON.stringify(m.data)}</code>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App
