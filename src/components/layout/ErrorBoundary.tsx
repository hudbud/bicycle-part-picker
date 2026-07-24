import { Component, type ReactNode } from 'react'
import { Window, WindowHeader, WindowContent } from 'react95'
import { EmptyState } from '@/components/ui/EmptyState'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error('Unhandled error in route:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <Window style={{ width: '100%', maxWidth: 640, margin: '0 auto' }}>
          <WindowHeader active><span>Something went wrong</span></WindowHeader>
          <WindowContent>
            <EmptyState
              heading="This page hit a snag"
              subtext="The data behind it may be corrupted or incomplete. Try going back home."
              action={{ label: 'Go home', onClick: () => window.location.assign('/') }}
            />
          </WindowContent>
        </Window>
      )
    }
    return this.props.children
  }
}
