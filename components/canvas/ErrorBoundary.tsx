'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  onError?: () => void
}
interface State {
  hasError: boolean
  error: Error | null
}

export class CanvasErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch() {
    this.props.onError?.()
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex h-screen items-center justify-center bg-black px-6 text-white" role="alert">
          <section className="max-w-md text-center">
            <h1 className="mb-2 text-lg text-red-400">Could not render the 3D scene</h1>
            <p className="text-sm text-gray-500">
              Reload the page. If the problem persists, check the browser console for WebGL or asset errors.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error ? (
              <pre className="mt-4 overflow-auto rounded border border-red-900/50 bg-red-950/20 p-3 text-left text-xs text-red-200">
                {this.state.error.message}
              </pre>
            ) : null}
          </section>
        </main>
      )
    }
    return this.props.children
  }
}
