import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { LoginForm } from './LoginForm'
import { SignupForm } from './SignupForm'

interface AuthModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AuthModal({ open, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  const handleSuccess = () => {
    onSuccess?.()
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} className="max-w-sm w-full">
      <div className="p-6">
        <div className="flex gap-4 mb-6 border-b border-border-default">
          <button
            onClick={() => setMode('login')}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              mode === 'login'
                ? 'border-accent text-accent'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            Sign in
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              mode === 'signup'
                ? 'border-accent text-accent'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            Create account
          </button>
        </div>
        {mode === 'login' ? (
          <LoginForm onSuccess={handleSuccess} onSwitchMode={() => setMode('signup')} />
        ) : (
          <SignupForm onSuccess={handleSuccess} onSwitchMode={() => setMode('login')} />
        )}
      </div>
    </Modal>
  )
}
