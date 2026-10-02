import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import authService from '../services/auth.service'

export default function Auth({ mode, setMode, onSuccess }) {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setError('')
    try {
      if (mode === 'register') {
        await authService.register(form)
      }
      const result = await authService.login(form)
      onSuccess(result)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return <main className="narrow-page auth-page"><p className="eyebrow">WELCOME TO THE FARM</p><h1>{mode === 'login' ? 'Come on in.' : 'Start your jar list.'}</h1><form className="form-panel" onSubmit={submit}>{error && <p className="form-error">{error}</p>}<label>Username<input required value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} /></label><label>Password<input required type="password" minLength="8" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label><button className="primary-button" type="submit">{mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight size={17} /></button></form><button className="text-button centered" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Need an account? Register' : 'Already registered? Sign in'}</button></main>
}