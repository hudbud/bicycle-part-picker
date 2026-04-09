import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import styled from 'styled-components'

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

interface SignupFormProps {
  onSuccess: () => void
  onSwitchMode: () => void
}

export function SignupForm({ onSuccess, onSwitchMode }: SignupFormProps) {
  const signup = useAuthStore((s) => s.signup)
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      await signup(email, password, displayName)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Input label="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" required />
      <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" />
      <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" required autoComplete="new-password" />
      {error && <p style={{ fontSize: 12, color: '#c0392b' }}>{error}</p>}
      <Button type="submit" disabled={loading} fullWidth>
        {loading ? 'Creating account…' : 'Create account'}
      </Button>
      <p style={{ fontSize: 12, textAlign: 'center' }}>
        Already have an account?{' '}
        <button type="button" onClick={onSwitchMode} style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: 12 }}>
          Sign in
        </button>
      </p>
    </Form>
  )
}
