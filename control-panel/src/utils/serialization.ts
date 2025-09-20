// Types for serialization system
export interface SerializedElement {
  id: string
  type: string
  label: string
  children: SerializedElement[]
  parent?: string
  css: Record<string, string>
  attributes?: Record<string, string>
}

export interface SerializedDocument {
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

export interface ElementAction {
  type: 'add' | 'remove' | 'move' | 'update'
  elementId: string
  data?: {
    element?: SerializedElement
    parentId?: string
    newParentId?: string
    css?: Record<string, string>
  }
  timestamp: number
}

export interface PropertyAction {
  type: 'css-update'
  elementId: string
  property: string
  value: string
  timestamp: number
}

export type Action = ElementAction | PropertyAction

// Serialization utilities for converting internal state to JSON format

export class DocumentSerializer {
  private elements: SerializedElement[] = []
  private actions: Action[] = []

  // Convert internal element structure to serialized format
  serializeElement(element: any): SerializedElement {
    return {
      id: element.id,
      type: element.type,
      label: element.label,
      children: element.children ? element.children.map((child: any) => this.serializeElement(child)) : [],
      parent: element.parent,
      css: element.css || {},
      attributes: element.attributes || {}
    }
  }

  // Serialize entire document structure
  serializeDocument(elements: any[], screenSize?: { width: number; height: number }): SerializedDocument {
    this.elements = elements.map(element => this.serializeElement(element))
    
    return {
      elements: this.elements,
      metadata: {
        version: '1.0.0',
        timestamp: Date.now(),
        screenSize
      }
    }
  }

  // Add action to history
  addAction(action: Action) {
    this.actions.push(action)
  }

  // Get all actions
  getActions(): Action[] {
    return [...this.actions]
  }

  // Clear actions history
  clearActions() {
    this.actions = []
  }

  // Generate JSON string for transmission
  toJSON(document: SerializedDocument): string {
    return JSON.stringify(document, null, 2)
  }

  // Generate compact JSON for efficient transmission
  toCompactJSON(document: SerializedDocument): string {
    return JSON.stringify(document)
  }

  // Create element action
  createElementAction(
    type: 'add' | 'remove' | 'move',
    elementId: string,
    data?: any
  ): Action {
    return {
      type,
      elementId,
      data,
      timestamp: Date.now()
    }
  }

  // Create CSS property action
  createPropertyAction(
    elementId: string,
    property: string,
    value: string
  ): Action {
    return {
      type: 'css-update',
      elementId,
      property,
      value,
      timestamp: Date.now()
    }
  }

  // Generate HTML structure from serialized elements
  generateHTML(elements: SerializedElement[]): string {
    return elements.map(element => this.elementToHTML(element)).join('\n')
  }

  // Convert single element to HTML
  private elementToHTML(element: SerializedElement): string {
    const tag = element.type
    const attributes = this.generateAttributes(element)
    const children = element.children.length > 0 
      ? `\n${this.generateHTML(element.children).split('\n').map(line => '  ' + line).join('\n')}\n`
      : ''
    
    return `<${tag}${attributes}>${children}</${tag}>`
  }

  // Generate attributes string
  private generateAttributes(element: SerializedElement): string {
    const attrs: string[] = []
    
    // Add ID
    attrs.push(`id="${element.id}"`)
    
    // Add CSS classes if any
    if (element.attributes?.class) {
      attrs.push(`class="${element.attributes.class}"`)
    }
    
    // Add other attributes
    Object.entries(element.attributes || {}).forEach(([key, value]) => {
      if (key !== 'class') {
        attrs.push(`${key}="${value}"`)
      }
    })
    
    return attrs.length > 0 ? ' ' + attrs.join(' ') : ''
  }

  // Generate CSS from serialized elements
  generateCSS(elements: SerializedElement[]): string {
    return elements.map(element => this.elementToCSS(element)).join('\n')
  }

  // Convert single element to CSS
  private elementToCSS(element: SerializedElement): string {
    if (Object.keys(element.css).length === 0) return ''
    
    const cssRules = Object.entries(element.css)
      .map(([property, value]) => `  ${property}: ${value};`)
      .join('\n')
    
    return `#${element.id} {\n${cssRules}\n}`
  }

  // Generate complete document with HTML and CSS
  generateCompleteDocument(elements: SerializedElement[]): string {
    const html = this.generateHTML(elements)
    const css = this.generateCSS(elements)
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Document</title>
  <style>
${css}
  </style>
</head>
<body>
${html}
</body>
</html>`
  }
}

// Singleton instance
export const documentSerializer = new DocumentSerializer()
