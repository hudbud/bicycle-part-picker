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

interface LoginFormProps {
  onSuccess: () => void
  onSwitchMode: () => void
}

export function LoginForm({ onSuccess, onSwitchMode }: LoginFormProps) {
  const login = useAuthStore((s) => s.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" />
      <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required autoComplete="current-password" />
      {error && <p style={{ fontSize: 12, color: '#c0392b' }}>{error}</p>}
      <Button type="submit" disabled={loading} fullWidth>
        {loading ? 'Signing in…' : 'Sign in'}
      </Button>
      <p style={{ fontSize: 12, textAlign: 'center' }}>
        No account?{' '}
        <button type="button" onClick={onSwitchMode} style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: 12 }}>
          Create one
        </button>
      </p>
    </Form>
  )
}
