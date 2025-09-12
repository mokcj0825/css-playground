import { useEffect, useMemo, useState } from 'react'

type DeviceKey = 'custom' | 'desktop' | 'tablet' | 'mobile' | 'window'

const PRESETS: Record<DeviceKey, { label: string; width: number; height: number }> = {
  custom: { label: 'Custom', width: 1280, height: 720 },
  window: { label: 'Same as this window', width: 0, height: 0 },
  desktop: { label: 'Desktop', width: 1440, height: 900 },
  tablet: { label: 'Tablet', width: 768, height: 1024 },
  mobile: { label: 'Mobile', width: 375, height: 812 }
}

export default function ScreenSelector() {
  const [device, setDevice] = useState<DeviceKey>('desktop')
  const [width, setWidth] = useState<number>(PRESETS.desktop.width)
  const [height, setHeight] = useState<number>(PRESETS.desktop.height)

  const options = useMemo(() => Object.entries(PRESETS) as [DeviceKey, { label: string; width: number; height: number }][], [])

  useEffect(() => {
    if (device === 'window') {
      const applyWindowSize = () => {
        setWidth(window.innerWidth)
        setHeight(window.innerHeight)
      }
      applyWindowSize()
      window.addEventListener('resize', applyWindowSize)
      return () => window.removeEventListener('resize', applyWindowSize)
    } else if (device !== 'custom') {
      setWidth(PRESETS[device].width)
      setHeight(PRESETS[device].height)
    }
  }, [device])

  const toggleOrientation = () => {
    setWidth(height)
    setHeight(width)
  }

  // Notify middleware whenever dimensions change (and on first load)
  useEffect(() => {
    const controller = new AbortController()
    const send = async () => {
      try {
        await fetch('http://localhost:4000/setScreenSize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ width, height }),
          signal: controller.signal
        })
      } catch {
        // ignore network errors for now
      }
    }
    send()
    return () => controller.abort()
  }, [width, height])

  return (
    <form className="cp-screen-selector" onSubmit={(e) => e.preventDefault()}>
      <label className="cp-field">
        <span className="cp-label">Device</span>
        <select
          className="cp-select"
          value={device}
          onChange={(e) => setDevice(e.target.value as DeviceKey)}
        >
          {options.map(([key, meta]) => (
            <option key={key} value={key}>{meta.label}</option>
          ))}
        </select>
      </label>
      <label className="cp-field">
        <span className="cp-label">Width</span>
        <input
          className="cp-input"
          type="number"
          min={1}
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
          disabled={device !== 'custom'}
        />
      </label>
      <label className="cp-field">
        <span className="cp-label">Height</span>
        <input
          className="cp-input"
          type="number"
          min={1}
          value={height}
          onChange={(e) => setHeight(Number(e.target.value))}
          disabled={device !== 'custom'}
        />
      </label>
      <button type="button" className="cp-button" onClick={toggleOrientation}>
        Toggle orientation
      </button>
    </form>
  )
}


