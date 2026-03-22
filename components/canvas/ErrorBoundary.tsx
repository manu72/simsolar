'use client'

import { Component, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class CanvasErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center bg-black text-white">
          <div className="text-center">
            <p className="text-red-400 text-lg mb-2">Could not load Earth textures</p>
            <p className="text-gray-500 text-sm">Check that files exist in /public/textures/</p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
