import type { SerializedDocument, Action } from './serialization'

// Middleware communication utilities

export class MiddlewareClient {
  private baseUrl: string
  private isConnected: boolean = false

  constructor(baseUrl: string = 'http://localhost:4000') {
    this.baseUrl = baseUrl
  }

  // Send complete document to middleware
  async sendDocument(document: SerializedDocument): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/updateDocument`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(document)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('Document sent successfully:', result)
      return result.ok === true
    } catch (error) {
      console.error('Failed to send document:', error)
      return false
    }
  }

  // Send individual action to middleware
  async sendAction(action: Action): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/updateAction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(action)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('Action sent successfully:', result)
      return result.ok === true
    } catch (error) {
      console.error('Failed to send action:', error)
      return false
    }
  }

  // Send batch of actions
  async sendActions(actions: Action[]): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/updateActions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ actions })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('Actions sent successfully:', result)
      return result.ok === true
    } catch (error) {
      console.error('Failed to send actions:', error)
      return false
    }
  }

  // Check middleware health
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`)
      const result = await response.json()
      this.isConnected = result.status === 'ok'
      return this.isConnected
    } catch (error) {
      console.error('Middleware health check failed:', error)
      this.isConnected = false
      return false
    }
  }

  // Get connection status
  getConnectionStatus(): boolean {
    return this.isConnected
  }

  // Send screen size update (existing functionality)
  async sendScreenSize(width: number, height: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/setScreenSize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ width, height })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.ok === true
    } catch (error) {
      console.error('Failed to send screen size:', error)
      return false
    }
  }
}

// Singleton instance
export const middlewareClient = new MiddlewareClient()
