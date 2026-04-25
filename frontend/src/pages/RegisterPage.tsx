import { useState, type FormEvent, type ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.tsx'
import { type RegisterData, getErrorMessage } from '../services/api'

type Gender = 'MALE' | 'FEMALE' | 'OTHER'

interface RegisterForm {
  first_name: string
  last_name: string
  email: string
  phone_number: string
  password: string
  date_of_birth: string
  gender: Gender | ''
}

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<RegisterForm>({
    first_name: '', last_name: '', email: '', phone_number: '', password: '', date_of_birth: '', gender: '',
  })
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
      // Client-side validation
      if (!form.phone_number || !/^\d{10}$/.test(form.phone_number)) {
        setError('Phone number must be 10 digits.')
        setLoading(false)
        return
      }
      if (form.password.length < 6) {
        setError('Password must be at least 6 characters.')
        setLoading(false)
        return
      }
      if (!form.date_of_birth) {
        setError('Please select your date of birth.')
        setLoading(false)
        return
      }
      // Check age (must be 18+)
      const birthDate = new Date(form.date_of_birth)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      if (age < 18) {
        setError('You must be at least 18 years old to register.')
        setLoading(false)
        return
      }
      const data: RegisterData = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone_number: form.phone_number,
        password: form.password,
        date_of_birth: form.date_of_birth,
        gender: form.gender as Gender
      }
      await register(data)
      navigate('/login')
    } catch (err) {
      setError(getErrorMessage(err))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-fb-gray flex items-center justify-center px-4 py-8">
      <div className="card p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center">Create New Account</h2>
        <p className="text-fb-text-2 text-center text-sm mt-1">Quick and easy.</p>
        <hr className="border-fb-gray-2 my-4" />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <input name="first_name" placeholder="First name" required value={form.first_name} onChange={handleChange}
              className="w-1/2 border border-fb-gray-3 rounded-lg px-3 py-2 text-sm outline-none focus:border-fb-blue" />
            <input name="last_name" placeholder="Last name" required value={form.last_name} onChange={handleChange}
              className="w-1/2 border border-fb-gray-3 rounded-lg px-3 py-2 text-sm outline-none focus:border-fb-blue" />
          </div>
          <input name="email" type="email" placeholder="Email" required value={form.email} onChange={handleChange}
            className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 text-sm outline-none focus:border-fb-blue" />
          <input name="phone_number" type="tel" placeholder="Phone number (10 digits)" required value={form.phone_number} onChange={handleChange}
            className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 text-sm outline-none focus:border-fb-blue" maxLength={10} pattern="[0-9]{10}" />
          <input name="password" type="password" placeholder="New password" required value={form.password} onChange={handleChange}
            className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 text-sm outline-none focus:border-fb-blue" />

          <div>
            <label className="text-xs text-fb-text-2 mb-1 block">Date of Birth</label>
            <input name="date_of_birth" type="date" required value={form.date_of_birth} onChange={handleChange}
              className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 text-sm outline-none focus:border-fb-blue" />
          </div>

          <div>
            <label className="text-xs text-fb-text-2 mb-1 block">Gender</label>
            <div className="flex gap-2">
              {([['MALE', 'Male'], ['FEMALE', 'Female'], ['OTHER', 'Other']] as [Gender, string][]).map(([val, label]) => (
                <label key={val}
                  className={`flex-1 flex items-center justify-between border rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors
                    ${form.gender === val ? 'border-fb-blue bg-blue-50' : 'border-fb-gray-3'}`}
                >
                  {label}
                  <input type="radio" name="gender" value={val} className="accent-fb-blue"
                    onChange={handleChange} checked={form.gender === val} required />
                </label>
              ))}
            </div>
          </div>

          <p className="text-xs text-fb-text-2 leading-relaxed">
            By clicking Register, you agree to our{' '}
            <span className="text-fb-blue cursor-pointer">Terms</span> and{' '}
            <span className="text-fb-blue cursor-pointer">Privacy Policy</span>.
          </p>

          <button type="submit" disabled={loading}
            className="w-full bg-fb-green hover:opacity-90 text-white font-bold py-2 rounded-lg transition-opacity disabled:opacity-50">
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="text-center mt-4">
          <Link to="/login" className="text-fb-blue text-sm hover:underline">Already have an account?</Link>
        </div>
      </div>
    </div>
  )
}
