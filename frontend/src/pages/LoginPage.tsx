import { useState, type FormEvent, type ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.tsx'

interface LoginForm {
  email: string
  password: string
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<LoginForm>({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-fb-gray flex items-center justify-center px-4">
      <div className="w-full max-w-4xl flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
        {/* Brand */}
        <div className="lg:flex-1 text-center lg:text-left">
          <h1 className="text-fb-blue font-bold text-5xl lg:text-6xl" style={{ fontFamily: 'Georgia, serif' }}>
            facebook
          </h1>
          <p className="mt-4 text-xl lg:text-2xl text-fb-text leading-snug">
            Facebook helps you connect<br className="hidden lg:block" /> and share with the people in your life.
          </p>
        </div>

        {/* Card */}
        <div className="w-full max-w-sm">
          <div className="card p-4 space-y-3">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                name="email"
                type="email"
                placeholder="Email or phone number"
                required
                value={form.email}
                onChange={handleChange}
                className="w-full border border-fb-gray-3 rounded-lg px-4 py-3 text-sm outline-none focus:border-fb-blue"
              />
              <input
                name="password"
                type="password"
                placeholder="Password"
                required
                value={form.password}
                onChange={handleChange}
                className="w-full border border-fb-gray-3 rounded-lg px-4 py-3 text-sm outline-none focus:border-fb-blue"
              />
              <button type="submit" disabled={loading} className="btn-primary text-base py-3">
                {loading ? 'Logging in...' : 'Log In'}
              </button>
            </form>
            <p className="text-center text-sm text-fb-blue hover:underline cursor-pointer">Forgotten password?</p>
            <hr className="border-fb-gray-2" />
            <div className="flex justify-center">
              <Link to="/register"
                className="bg-fb-green hover:opacity-90 text-white font-semibold px-5 py-3 rounded-lg transition-opacity">
                Create New Account
              </Link>
            </div>
          </div>
          <p className="text-center text-xs text-fb-text-2 mt-4">
            Demo: <span className="font-mono">alice@example.com</span> / <span className="font-mono">password123</span>
          </p>
        </div>
      </div>
    </div>
  )
}
