import React, { useEffect, useRef, useState } from 'react'
import './App.css'

// Types for serialized data (matching control panel)
interface SerializedElement {
  id: string
  type: string
  label: string
  children: SerializedElement[]
  parent?: string
  css: Record<string, string>
  attributes?: Record<string, string>
}

interface SerializedDocument {
  elements: SerializedElement[]
  metadata: {
    version: string
    timestamp: number
    screenSize?: {
      width: number
      height: number
    }
  }
}

// Removed unused Message type

function isScreenSizeMessage(value: unknown): value is { type: 'screenSize'; width: number; height: number } {
  if (typeof value !== 'object' || value === null) return false
  const maybe = value as { type?: unknown; width?: unknown; height?: unknown }
  return (
    maybe.type === 'screenSize' &&
    typeof maybe.width === 'number' && Number.isFinite(maybe.width) && maybe.width > 0 &&
    typeof maybe.height === 'number' && Number.isFinite(maybe.height) && maybe.height > 0
  )
}

function isDocumentUpdateMessage(value: unknown): value is { type: 'documentUpdate'; document: SerializedDocument } {
  if (typeof value !== 'object' || value === null) return false
  const maybe = value as { type?: unknown; document?: unknown }
  return maybe.type === 'documentUpdate' && typeof maybe.document === 'object'
}

// Component to render a single element
function ElementRenderer({ element }: { element: SerializedElement }) {
  const Tag = element.type as keyof React.JSX.IntrinsicElements
  
  console.log('Result App: Rendering element:', element)
  
  // Convert CSS object to React style object
  const style: React.CSSProperties = {}
  Object.entries(element.css).forEach(([property, value]) => {
    // Convert kebab-case to camelCase for React
    const camelProperty = property.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
    style[camelProperty as keyof React.CSSProperties] = value as any
  })

  console.log('Result App: Converted style object:', style)

  // Generate attributes
  const attributes: any = {
    id: element.id,
    style,
    ...element.attributes
  }

  console.log('Result App: Final attributes:', attributes)

  return React.createElement(Tag, attributes, 
    element.children.map(child => (
      <ElementRenderer key={child.id} element={child} />
    ))
  )
}

function App() {
  const [screenSize, setScreenSize] = useState<{ width: number; height: number } | null>(null)
  const [document, setDocument] = useState<SerializedDocument | null>(null)
  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const ws = new WebSocket(`${protocol}://localhost:4000`)
    socketRef.current = ws

    ws.onopen = () => {
      console.log('Result app WebSocket connected')
    }

    ws.onclose = () => {
      console.log('Result app WebSocket disconnected')
    }

    ws.onerror = (error) => {
      console.error('Result app WebSocket error:', error)
    }

    ws.onmessage = (event) => {
      try {
        console.log('Result app received message:', event.data)
        const parsed: unknown = JSON.parse(event.data)
        console.log('Parsed message:', parsed)
        
        if (isScreenSizeMessage(parsed)) {
          console.log('Processing screen size message')
          setScreenSize({ width: parsed.width, height: parsed.height })
        } else if (isDocumentUpdateMessage(parsed)) {
          console.log('Processing document update message:', parsed.document)
          console.log('Result App: Setting new document state')
          setDocument(parsed.document)
        } else {
          console.log('Unknown message type:', parsed)
        }
      } catch (error) {
        console.error('Failed to parse message:', error)
      }
    }

    return () => {
      ws.close()
    }
  }, [])

  const containerStyle: React.CSSProperties = {
    width: screenSize ? `${screenSize.width}px` : '100%',
    height: screenSize ? `${screenSize.height}px` : '100vh',
    minHeight: '200px',
    border: '1px solid #ccc',
    margin: '20px auto',
    padding: '20px',
    backgroundColor: '#fff',
    overflow: 'auto'
  }

  return (
    <div className="result-app">
      <div className="result-container" style={containerStyle}>
        {document && document.elements.length > 0 ? (
          <>
            {console.log('Result App: Rendering elements:', document.elements)}
            {document.elements.map(element => (
              <ElementRenderer key={element.id} element={element} />
            ))}
          </>
        ) : (
          <div className="empty-state">
            <p>No elements to display</p>
            <p>Add elements from the Control Panel to see them here</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
