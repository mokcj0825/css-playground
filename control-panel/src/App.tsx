import { useState } from 'react'
import './App.css'
import ScreenSelector from './modules/ScreenSelector'
import Palette from './modules/Palette'
import ElementLayout from './modules/ElementLayout'
import PropertiesLayout from './modules/PropertiesLayout'

function App() {
  const [selectedElement, setSelectedElement] = useState<{
    id: string
    type: string
    label: string
  } | null>(null)

  const handleElementUpdate = (elementId: string, css: Record<string, string>) => {
    console.log('App.tsx: handleElementUpdate called:', { elementId, css })
    // Call the updateElementCSS function exposed by ElementLayout
    if ((window as any).updateElementCSS) {
      console.log('App.tsx: Calling updateElementCSS function')
      ;(window as any).updateElementCSS(elementId, css)
    } else {
      console.log('App.tsx: updateElementCSS function not found on window')
    }
  }

  return (
    <>
      <header className="cp-header">
        <ScreenSelector />
      </header>
      <aside className="cp-palette">
        <Palette />
      </aside>
      <aside className="cp-elements">
        <ElementLayout 
          onElementSelect={(element) => {
            console.log('App.tsx: Element selected:', element)
            setSelectedElement(element)
          }}
          onElementUpdate={handleElementUpdate}
        />
      </aside>
      <aside className="cp-properties">
        <PropertiesLayout 
          selectedElement={selectedElement} 
          onPropertyChange={(elementId, property, value) => {
            console.log('Property changed:', { elementId, property, value })
          }}
          onElementUpdate={handleElementUpdate}
        />
      </aside>
    </>
  )
}

export default App
