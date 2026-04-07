import type { ReactNode } from 'react'
import { TopBar } from './TopBar'
import { ToastContainer } from '@/components/ui/Toast'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-page flex flex-col">
      <TopBar />
      <main className="flex-1">{children}</main>
      <ToastContainer />
    </div>
  )
}
