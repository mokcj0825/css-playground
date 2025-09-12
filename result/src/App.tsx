import { useEffect, useRef, useState } from 'react'
import './App.css'

type ScreenSizeMessage = { type: 'screenSize'; width: number; height: number }

function isScreenSizeMessage(value: unknown): value is ScreenSizeMessage {
  if (typeof value !== 'object' || value === null) return false
  const maybe = value as { type?: unknown; width?: unknown; height?: unknown }
  return (
    maybe.type === 'screenSize' &&
    typeof maybe.width === 'number' && Number.isFinite(maybe.width) && maybe.width > 0 &&
    typeof maybe.height === 'number' && Number.isFinite(maybe.height) && maybe.height > 0
  )
}

function App() {
  const [screenSize, setScreenSize] = useState<{ width: number; height: number } | null>(null)
  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const ws = new WebSocket(`${protocol}://localhost:4000`)
    socketRef.current = ws

    ws.onmessage = (event) => {
      try {
        const parsed: unknown = JSON.parse(event.data)
        if (isScreenSizeMessage(parsed)) {
          setScreenSize({ width: parsed.width, height: parsed.height })
        }
      } catch {
        // ignore non-JSON
      }
    }

    return () => {
      ws.close()
    }
  }, [])

  const style: React.CSSProperties | undefined = screenSize
    ? { width: `${screenSize.width}px`, height: `${screenSize.height}px` }
    : undefined

  return (
    <div className="viewport-stage">
      {screenSize && <div className="viewport-box" style={style} />}
    </div>
  )
}

export default App
