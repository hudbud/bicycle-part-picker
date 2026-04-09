import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { LoginForm } from './LoginForm'
import { SignupForm } from './SignupForm'
import { Tabs, Tab, TabBody } from 'react95'

interface AuthModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AuthModal({ open, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  const handleSuccess = () => { onSuccess?.(); onClose() }

  return (
    <Modal open={open} onClose={onClose} style={{ maxWidth: 360, width: '100%' }}>
      <Tabs value={mode} onChange={(val) => setMode(val as 'login' | 'signup')}>
        <Tab value="login">Sign in</Tab>
        <Tab value="signup">Create account</Tab>
      </Tabs>
      <TabBody>
        {mode === 'login'
          ? <LoginForm onSuccess={handleSuccess} onSwitchMode={() => setMode('signup')} />
          : <SignupForm onSuccess={handleSuccess} onSwitchMode={() => setMode('login')} />
        }
      </TabBody>
    </Modal>
  )
}
