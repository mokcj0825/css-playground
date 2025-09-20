import { useState } from 'react'

export default function Palette() {
  const [selectedCategory, setSelectedCategory] = useState<string>('basic')

  const categories = [
    { id: 'basic', label: 'Basic' },
    { id: 'layout', label: 'Layout' },
    { id: 'media', label: 'Media' },
    { id: 'forms', label: 'Forms' }
  ]

  const paletteItems = {
    basic: [
      { id: 'div', label: 'Div', icon: '📦' },
      { id: 'span', label: 'Span', icon: '📝' },
      { id: 'p', label: 'Paragraph', icon: '📄' },
      { id: 'h1', label: 'Heading 1', icon: '🏷️' },
      { id: 'h2', label: 'Heading 2', icon: '🏷️' },
      { id: 'button', label: 'Button', icon: '🔘' }
    ],
    layout: [
      { id: 'container', label: 'Container', icon: '📦' },
      { id: 'flex', label: 'Flex', icon: '↔️' },
      { id: 'grid', label: 'Grid', icon: '⊞' },
      { id: 'section', label: 'Section', icon: '📑' },
      { id: 'article', label: 'Article', icon: '📰' },
      { id: 'aside', label: 'Aside', icon: '📋' }
    ],
    media: [
      { id: 'img', label: 'Image', icon: '🖼️' },
      { id: 'video', label: 'Video', icon: '🎥' },
      { id: 'audio', label: 'Audio', icon: '🔊' },
      { id: 'iframe', label: 'Iframe', icon: '🖥️' }
    ],
    forms: [
      { id: 'input', label: 'Input', icon: '📝' },
      { id: 'textarea', label: 'Textarea', icon: '📄' },
      { id: 'select', label: 'Select', icon: '📋' },
      { id: 'checkbox', label: 'Checkbox', icon: '☑️' },
      { id: 'radio', label: 'Radio', icon: '🔘' },
      { id: 'label', label: 'Label', icon: '🏷️' }
    ]
  }

  const handleDragStart = (e: React.DragEvent, item: { id: string; label: string }) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({
      type: 'palette-item',
      element: item.id,
      label: item.label
    }))
  }

  return (
    <div className="cp-palette">
      <div className="cp-palette-header">
        <h3>Palette</h3>
        <div className="cp-palette-categories">
          {categories.map(category => (
            <button
              key={category.id}
              className={`cp-category-btn ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="cp-palette-items">
        {paletteItems[selectedCategory as keyof typeof paletteItems]?.map(item => (
          <div
            key={item.id}
            className="cp-palette-item"
            draggable
            onDragStart={(e) => handleDragStart(e, item)}
            title={`Drag to add ${item.label}`}
          >
            <span className="cp-palette-icon">{item.icon}</span>
            <span className="cp-palette-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
