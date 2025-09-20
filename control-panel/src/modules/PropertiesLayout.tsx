import { useState, useEffect } from 'react'
import { documentSerializer } from '../utils/serialization'
import { middlewareClient } from '../utils/middleware'

interface CSSProperty {
  name: string
  value: string
  type: 'text' | 'number' | 'color' | 'select' | 'slider'
  options?: string[]
  min?: number
  max?: number
  step?: number
  unit?: string
}

interface CSSPropertyGroup {
  name: string
  label: string
  properties: CSSProperty[]
}

interface PropertiesLayoutProps {
  selectedElement?: {
    id: string
    type: string
    label: string
  } | null
  onPropertyChange?: (elementId: string, property: string, value: string) => void
  onElementUpdate?: (elementId: string, css: Record<string, string>) => void
}

export default function PropertiesLayout({ selectedElement, onPropertyChange, onElementUpdate }: PropertiesLayoutProps) {
  const [cssProperties, setCssProperties] = useState<Record<string, string>>({})
  const [activeGroup, setActiveGroup] = useState<string>('layout')

  const propertyGroups: CSSPropertyGroup[] = [
    {
      name: 'layout',
      label: 'Layout',
      properties: [
        { name: 'display', value: 'block', type: 'select', options: ['block', 'inline', 'inline-block', 'flex', 'grid', 'none'] },
        { name: 'position', value: 'static', type: 'select', options: ['static', 'relative', 'absolute', 'fixed', 'sticky'] },
        { name: 'width', value: 'auto', type: 'text', unit: 'px' },
        { name: 'height', value: 'auto', type: 'text', unit: 'px' },
        { name: 'margin', value: '0', type: 'text', unit: 'px' },
        { name: 'padding', value: '0', type: 'text', unit: 'px' },
        { name: 'border', value: 'none', type: 'text' },
        { name: 'border-radius', value: '0', type: 'text', unit: 'px' }
      ]
    },
    {
      name: 'typography',
      label: 'Typography',
      properties: [
        { name: 'font-family', value: 'inherit', type: 'text' },
        { name: 'font-size', value: '16', type: 'number', unit: 'px', min: 8, max: 72, step: 1 },
        { name: 'font-weight', value: 'normal', type: 'select', options: ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'] },
        { name: 'line-height', value: '1.5', type: 'number', min: 0.5, max: 3, step: 0.1 },
        { name: 'text-align', value: 'left', type: 'select', options: ['left', 'center', 'right', 'justify'] },
        { name: 'text-decoration', value: 'none', type: 'select', options: ['none', 'underline', 'line-through', 'overline'] },
        { name: 'letter-spacing', value: '0', type: 'text', unit: 'px' },
        { name: 'text-transform', value: 'none', type: 'select', options: ['none', 'uppercase', 'lowercase', 'capitalize'] }
      ]
    },
    {
      name: 'colors',
      label: 'Colors',
      properties: [
        { name: 'color', value: '#000000', type: 'color' },
        { name: 'background-color', value: 'transparent', type: 'color' },
        { name: 'border-color', value: '#000000', type: 'color' },
        { name: 'opacity', value: '1', type: 'slider', min: 0, max: 1, step: 0.1 }
      ]
    },
    {
      name: 'flexbox',
      label: 'Flexbox',
      properties: [
        { name: 'flex-direction', value: 'row', type: 'select', options: ['row', 'row-reverse', 'column', 'column-reverse'] },
        { name: 'justify-content', value: 'flex-start', type: 'select', options: ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'] },
        { name: 'align-items', value: 'stretch', type: 'select', options: ['stretch', 'flex-start', 'flex-end', 'center', 'baseline'] },
        { name: 'flex-wrap', value: 'nowrap', type: 'select', options: ['nowrap', 'wrap', 'wrap-reverse'] },
        { name: 'gap', value: '0', type: 'text', unit: 'px' }
      ]
    },
    {
      name: 'effects',
      label: 'Effects',
      properties: [
        { name: 'box-shadow', value: 'none', type: 'text' },
        { name: 'text-shadow', value: 'none', type: 'text' },
        { name: 'transform', value: 'none', type: 'text' },
        { name: 'transition', value: 'none', type: 'text' },
        { name: 'filter', value: 'none', type: 'text' }
      ]
    }
  ]

  useEffect(() => {
    if (selectedElement) {
      console.log('Properties Layout: Element selected:', selectedElement)
      // Load existing properties for the selected element
      // For now, we'll start with empty properties
      // In a real app, this would come from the element's current CSS
      setCssProperties({})
    } else {
      console.log('Properties Layout: No element selected')
      setCssProperties({})
    }
  }, [selectedElement])

  const handlePropertyChange = async (propertyName: string, value: string) => {
    console.log('Properties Layout: handlePropertyChange called:', { propertyName, value, selectedElement })
    
    // Add units for numeric values if they don't have units
    let processedValue = value
    if (propertyName === 'width' || propertyName === 'height' || propertyName === 'margin' || propertyName === 'padding') {
      if (value && !isNaN(Number(value)) && !value.includes('px') && !value.includes('%') && !value.includes('em') && !value.includes('rem')) {
        processedValue = value + 'px'
      }
    }
    
    const updatedCss = {
      ...cssProperties,
      [propertyName]: processedValue
    }
    
    console.log('Properties Layout: Processed value:', processedValue, 'Updated CSS:', updatedCss)
    setCssProperties(updatedCss)
    
    if (selectedElement) {
      console.log('Properties Layout: Selected element exists, processing update')
      
      // Create property action
      const action = documentSerializer.createPropertyAction(
        selectedElement.id,
        propertyName,
        value
      )
      
      // Add to serializer
      documentSerializer.addAction(action)
      
      // Send action to middleware
      await middlewareClient.sendAction(action)
      
      // Notify parent component about the complete CSS update
      console.log('Properties Layout: Calling onElementUpdate with:', { elementId: selectedElement.id, css: updatedCss })
      onElementUpdate?.(selectedElement.id, updatedCss)
      onPropertyChange?.(selectedElement.id, propertyName, value)
      
      console.log('CSS Property changed and sent:', { propertyName, value, elementId: selectedElement.id, updatedCss })
    } else {
      console.log('Properties Layout: No selected element, cannot update')
    }
  }

  const renderPropertyInput = (property: CSSProperty) => {
    const currentValue = cssProperties[property.name] || property.value

    switch (property.type) {
      case 'select':
        return (
          <select
            className="cp-property-select"
            value={currentValue}
            onChange={(e) => handlePropertyChange(property.name, e.target.value)}
          >
            {property.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        )

      case 'color':
        return (
          <div className="cp-property-color">
            <input
              type="color"
              className="cp-color-input"
              value={currentValue}
              onChange={(e) => handlePropertyChange(property.name, e.target.value)}
            />
            <input
              type="text"
              className="cp-color-text"
              value={currentValue}
              onChange={(e) => handlePropertyChange(property.name, e.target.value)}
              placeholder={property.value}
            />
          </div>
        )

      case 'number':
        return (
          <div className="cp-property-number">
            <input
              type="number"
              className="cp-number-input"
              value={currentValue}
              min={property.min}
              max={property.max}
              step={property.step}
              onChange={(e) => handlePropertyChange(property.name, e.target.value)}
            />
            {property.unit && <span className="cp-property-unit">{property.unit}</span>}
          </div>
        )

      case 'slider':
        return (
          <div className="cp-property-slider">
            <input
              type="range"
              className="cp-slider-input"
              value={currentValue}
              min={property.min}
              max={property.max}
              step={property.step}
              onChange={(e) => handlePropertyChange(property.name, e.target.value)}
            />
            <span className="cp-slider-value">{currentValue}</span>
          </div>
        )

      default: // text
        return (
          <div className="cp-property-text">
            <input
              type="text"
              className="cp-text-input"
              value={currentValue}
              onChange={(e) => handlePropertyChange(property.name, e.target.value)}
              placeholder={property.value}
            />
            {property.unit && <span className="cp-property-unit">{property.unit}</span>}
          </div>
        )
    }
  }

  return (
    <div className="cp-properties-layout">
      <div className="cp-properties-header">
        <h3>Properties</h3>
        {selectedElement ? (
          <div className="cp-selected-element">
            <span className="cp-element-icon">
              {selectedElement.type === 'div' ? '📦' : '📄'}
            </span>
            <span className="cp-element-name">{selectedElement.label}</span>
          </div>
        ) : (
          <div className="cp-no-selection">Select an element to edit properties</div>
        )}
      </div>

      {selectedElement && (
        <>
          <div className="cp-property-groups">
            {propertyGroups.map(group => (
              <button
                key={group.name}
                className={`cp-group-btn ${activeGroup === group.name ? 'active' : ''}`}
                onClick={() => setActiveGroup(group.name)}
              >
                {group.label}
              </button>
            ))}
          </div>

          <div className="cp-properties-content">
            {propertyGroups
              .find(group => group.name === activeGroup)
              ?.properties.map(property => (
                <div key={property.name} className="cp-property-row">
                  <label className="cp-property-label">
                    {property.name.replace('-', ' ')}
                  </label>
                  {renderPropertyInput(property)}
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  )
}
