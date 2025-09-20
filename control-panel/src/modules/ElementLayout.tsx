import React, { useState } from 'react'
import { documentSerializer } from '../utils/serialization'
import { middlewareClient } from '../utils/middleware'

interface ElementNode {
  id: string
  type: string
  label: string
  children: ElementNode[]
  parent?: string
  css?: Record<string, string>
}

interface ElementLayoutProps {
  onElementSelect?: (element: ElementNode) => void
  onDocumentChange?: (document: any) => void
  onElementUpdate?: (elementId: string, css: Record<string, string>) => void
}

export default function ElementLayout({ onElementSelect, onDocumentChange, onElementUpdate }: ElementLayoutProps) {
  const [elements, setElements] = useState<ElementNode[]>([])
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [dragOverElement, setDragOverElement] = useState<string | null>(null)
  const [dropZone, setDropZone] = useState<'child' | 'sibling' | null>(null)

  // Update element CSS and resend document
  const updateElementCSS = async (elementId: string, css: Record<string, string>) => {
    console.log('ElementLayout: updateElementCSS called:', { elementId, css })
    setElements(prev => {
      console.log('ElementLayout: Current elements before update:', prev)
      const updated = updateElementInTree(prev, elementId, css)
      console.log('ElementLayout: Updated elements:', updated)
      // Trigger serialization with updated elements
      serializeAndSend(updated, 'update', elementId, { css })
      return updated
    })
  }

  // Helper function to update element CSS in the tree
  const updateElementInTree = (elements: ElementNode[], targetId: string, css: Record<string, string>): ElementNode[] => {
    console.log('ElementLayout: updateElementInTree called:', { elements, targetId, css })
    return elements.map(element => {
      console.log('ElementLayout: Checking element:', element.id, 'against target:', targetId)
      if (element.id === targetId) {
        console.log('ElementLayout: Found target element, updating CSS')
        const updated = {
          ...element,
          css: { ...element.css, ...css }
        }
        console.log('ElementLayout: Updated element:', updated)
        return updated
      }
      if (element.children.length > 0) {
        return {
          ...element,
          children: updateElementInTree(element.children, targetId, css)
        }
      }
      return element
    })
  }

  // Expose updateElementCSS to parent component
  React.useEffect(() => {
    if (onElementUpdate) {
      // This is a bit of a hack, but we need to expose the function to the parent
      (window as any).updateElementCSS = updateElementCSS
    }
  }, [onElementUpdate])

  // Serialize and send document changes
  const serializeAndSend = async (currentElements: ElementNode[], actionType: string, elementId?: string, data?: any) => {
    try {
      console.log('Starting serialization with elements:', currentElements)
      
      // Create action
      const action = documentSerializer.createElementAction(
        actionType as 'add' | 'remove' | 'move',
        elementId || '',
        data
      )
      
      // Add to serializer
      documentSerializer.addAction(action)
      
      // Serialize current document with updated elements
      const document = documentSerializer.serializeDocument(currentElements)
      
      console.log('Serialized document:', document)
      
      // Send to middleware
      const success = await middlewareClient.sendDocument(document)
      console.log('Middleware response:', success)
      
      // Notify parent component
      onDocumentChange?.(document)
      
      console.log('Document serialized and sent successfully')
    } catch (error) {
      console.error('Failed to serialize and send document:', error)
    }
  }

  const handleDragOver = (e: React.DragEvent, targetId?: string, zone?: 'child' | 'sibling') => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    
    if (targetId) {
      setDragOverElement(targetId)
      setDropZone(zone || null)
    } else {
      setDragOverElement(null)
      setDropZone(null)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're leaving the entire drop area
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverElement(null)
      setDropZone(null)
    }
  }

  const handleDrop = (e: React.DragEvent, targetId?: string, zone?: 'child' | 'sibling') => {
    e.preventDefault()
    e.stopPropagation() // Prevent event bubbling
    
    setDragOverElement(null)
    setDropZone(null)
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'))
      if (data.type === 'palette-item') {
        const newElement: ElementNode = {
          id: `${data.element}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: data.element,
          label: data.label,
          children: [],
          parent: targetId && zone === 'child' ? targetId : undefined,
          css: {} // Initialize with empty CSS object
        }

        console.log('Dropping element:', { targetId, zone, newElement })

        if (targetId && zone === 'child') {
          // Add as child to existing element
          setElements(prev => {
            console.log('Adding as child to:', targetId)
            const updated = addElementAsChild(prev, targetId, newElement)
            // Trigger serialization with updated elements
            serializeAndSend(updated, 'add', newElement.id, { element: newElement, parentId: targetId })
            return updated
          })
        } else if (targetId && zone === 'sibling') {
          // Add as sibling to existing element
          setElements(prev => {
            console.log('Adding as sibling to:', targetId)
            const updated = addElementAsSibling(prev, targetId, newElement)
            // Trigger serialization with updated elements
            serializeAndSend(updated, 'add', newElement.id, { element: newElement, parentId: targetId })
            return updated
          })
        } else {
          // Add as root element
          setElements(prev => {
            console.log('Adding as root element')
            const updated = [...prev, newElement]
            // Trigger serialization with updated elements
            serializeAndSend(updated, 'add', newElement.id, { element: newElement })
            return updated
          })
        }
      }
    } catch (error) {
      console.error('Failed to parse drag data:', error)
    }
  }

  const addElementAsChild = (elements: ElementNode[], parentId: string, newElement: ElementNode): ElementNode[] => {
    return elements.map(element => {
      if (element.id === parentId) {
        return {
          ...element,
          children: [...element.children, newElement]
        }
      }
      if (element.children.length > 0) {
        return {
          ...element,
          children: addElementAsChild(element.children, parentId, newElement)
        }
      }
      return element
    })
  }

  const addElementAsSibling = (elements: ElementNode[], siblingId: string, newElement: ElementNode): ElementNode[] => {
    const result: ElementNode[] = []
    
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i]
      
      if (element.id === siblingId) {
        // Insert new element after the sibling
        result.push(element)
        result.push(newElement)
      } else {
        result.push(element)
        // Check children recursively
        if (element.children.length > 0) {
          element.children = addElementAsSibling(element.children, siblingId, newElement)
        }
      }
    }
    
    return result
  }

  const removeElement = (elementId: string) => {
    setElements(prev => {
      const updated = removeElementFromTree(prev, elementId)
      // Trigger serialization with updated elements
      serializeAndSend(updated, 'remove', elementId)
      return updated
    })
    if (selectedElementId === elementId) {
      setSelectedElementId(null)
    }
  }

  const removeElementFromTree = (elements: ElementNode[], targetId: string): ElementNode[] => {
    return elements.filter(element => {
      if (element.id === targetId) {
        return false
      }
      if (element.children.length > 0) {
        element.children = removeElementFromTree(element.children, targetId)
      }
      return true
    })
  }

  const handleElementClick = (element: ElementNode) => {
    console.log('ElementLayout: Element clicked:', element)
    setSelectedElementId(element.id)
    onElementSelect?.(element)
  }

  const renderElement = (element: ElementNode, depth: number = 0) => {
    const isSelected = selectedElementId === element.id
    const hasChildren = element.children.length > 0
    const isDragOver = dragOverElement === element.id
    
    return (
      <div key={element.id} className="cp-element-node">
        {/* Sibling drop zone - above element */}
        <div
          className={`cp-drop-zone cp-drop-sibling ${isDragOver && dropZone === 'sibling' ? 'active' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleDragOver(e, element.id, 'sibling')
          }}
          onDragLeave={handleDragLeave}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleDrop(e, element.id, 'sibling')
          }}
        >
          {isDragOver && dropZone === 'sibling' && (
            <div className="cp-drop-indicator">Drop as sibling</div>
          )}
        </div>
        
        <div
          className={`cp-element-item ${isSelected ? 'selected' : ''} ${isDragOver && dropZone === 'child' ? 'drag-over-child' : ''}`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => handleElementClick(element)}
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleDragOver(e, element.id, 'child')
          }}
          onDragLeave={handleDragLeave}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleDrop(e, element.id, 'child')
          }}
        >
          <div className="cp-element-content">
            <span className="cp-element-icon">
              {hasChildren ? '📁' : '📄'}
            </span>
            <span className="cp-element-label">{element.label}</span>
            <span className="cp-element-type">&lt;{element.type}&gt;</span>
          </div>
          <button
            className="cp-element-remove"
            onClick={(e) => {
              e.stopPropagation()
              removeElement(element.id)
            }}
            title="Remove element"
          >
            ×
          </button>
          {isDragOver && dropZone === 'child' && (
            <div className="cp-drop-indicator-child">Drop as child</div>
          )}
        </div>
        
        {hasChildren && (
          <div className="cp-element-children">
            {element.children.map(child => renderElement(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="cp-element-layout">
      <div className="cp-element-header">
        <h3>Element Layout</h3>
        <div className="cp-element-stats">
          {elements.length} root element{elements.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      <div
        className="cp-element-tree"
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
          handleDragOver(e)
        }}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          handleDrop(e)
        }}
      >
        {elements.length === 0 ? (
          <div className="cp-element-empty">
            <div className="cp-element-empty-icon">📁</div>
            <div className="cp-element-empty-text">
              Drag elements from the Palette to start building
            </div>
          </div>
        ) : (
          elements.map(element => renderElement(element))
        )}
      </div>
    </div>
  )
}
