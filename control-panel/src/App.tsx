import './App.css'
import ScreenSelector from './modules/ScreenSelector'

function App() {
  return (
    <>
      <header className="cp-header">
        <ScreenSelector />
      </header>
      <aside className="cp-left">Element layout</aside>
      <aside className="cp-right">Properties layout</aside>
    </>
  )
}

export default App
