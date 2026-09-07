import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

export class GameBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Wildkin could not render the adventure.', error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return <main className="error-recovery"><span className="eyebrow">A LITTLE BUMP IN THE TRAIL</span><h1>The adventure needs a breather.</h1><p>The game encountered an unexpected problem. Your existing browser save has not been deleted. Reload to return to the last saved moment.</p><button className="primary-button" onClick={() => window.location.reload()}>Reload adventure</button><a className="text-button" href="https://github.com/xavierxmorris/wildkin-mosslight/issues" target="_blank" rel="noreferrer">Report a problem on GitHub</a></main>
  }
}
