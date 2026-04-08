import { useState, type FormEvent, type ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { type Gender } from '../data/mockData.ts'

interface RegisterForm {
  first_name:    string
  last_name:     string
  email:         string
  password:      string
  date_of_birth: string
  gender:        Gender | ''
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form,      setForm]      = useState<RegisterForm>({
    first_name: '', last_name: '', email: '', password: '', date_of_birth: '', gender: '',
  })
  const [submitted, setSubmitted] = useState(false)

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => navigate('/login'), 2000)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-fb-gray flex items-center justify-center">
        <div className="card p-8 text-center max-w-sm w-full">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-bold mb-2">Đăng ký thành công!</h2>
          <p className="text-fb-text-2 text-sm">Đang chuyển về trang đăng nhập...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-fb-gray flex items-center justify-center px-4 py-8">
      <div className="card p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center">Tạo tài khoản mới</h2>
        <p className="text-fb-text-2 text-center text-sm mt-1">Nhanh chóng và dễ dàng.</p>
        <hr className="border-fb-gray-2 my-4" />

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <input name="first_name" placeholder="Họ" required value={form.first_name} onChange={handleChange}
              className="w-1/2 border border-fb-gray-3 rounded-lg px-3 py-2 text-sm outline-none focus:border-fb-blue" />
            <input name="last_name"  placeholder="Tên" required value={form.last_name}  onChange={handleChange}
              className="w-1/2 border border-fb-gray-3 rounded-lg px-3 py-2 text-sm outline-none focus:border-fb-blue" />
          </div>
          <input name="email" type="email" placeholder="Email" required value={form.email} onChange={handleChange}
            className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 text-sm outline-none focus:border-fb-blue" />
          <input name="password" type="password" placeholder="Mật khẩu mới" required value={form.password} onChange={handleChange}
            className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 text-sm outline-none focus:border-fb-blue" />

          <div>
            <label className="text-xs text-fb-text-2 mb-1 block">Ngày sinh</label>
            <input name="date_of_birth" type="date" required value={form.date_of_birth} onChange={handleChange}
              className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 text-sm outline-none focus:border-fb-blue" />
          </div>

          <div>
            <label className="text-xs text-fb-text-2 mb-1 block">Giới tính</label>
            <div className="flex gap-2">
              {([['MALE', 'Nam'], ['FEMALE', 'Nữ'], ['OTHER', 'Khác']] as [Gender, string][]).map(([val, label]) => (
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
            Bằng cách nhấp vào Đăng ký, bạn đồng ý với{' '}
            <span className="text-fb-blue cursor-pointer">Điều khoản</span> và{' '}
            <span className="text-fb-blue cursor-pointer">Chính sách quyền riêng tư</span> của chúng tôi.
          </p>

          <button type="submit"
            className="w-full bg-fb-green hover:opacity-90 text-white font-bold py-2 rounded-lg transition-opacity">
            Đăng ký
          </button>
        </form>

        <div className="text-center mt-4">
          <Link to="/login" className="text-fb-blue text-sm hover:underline">Bạn đã có tài khoản?</Link>
        </div>
      </div>
    </div>
  )
}
