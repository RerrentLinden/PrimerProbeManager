import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '@/api/auth'
import { AUTH_TOKEN_KEY } from '@/api/client'
import Logo from '@/components/common/Logo'

export default function LoginPage() {
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!token.trim()) return
      setLoading(true)
      setError('')
      try {
        const { data } = await login(token.trim())
        if (data.valid) {
          localStorage.setItem(AUTH_TOKEN_KEY, token.trim())
          navigate('/primers', { replace: true })
        } else {
          setError(data.message || '验证失败')
        }
      } catch {
        setError('连接失败，请检查服务状态')
      } finally {
        setLoading(false)
      }
    },
    [token, navigate],
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-lab-bg p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8 flex flex-col items-center">
          <Logo size={64} />
          <h1 className="text-2xl font-bold text-lab-text mt-3">Manager</h1>
          <p className="text-xs font-semibold tracking-[0.18em] text-lab-muted/85 mt-1.5">PrimerProbeManager</p>
          <p className="text-sm text-lab-muted mt-1">引探管理系统</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-lab-muted mb-1">
              访问令牌
            </label>
            <input
              id="token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="请输入 Token"
              className="input-field"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm text-lab-danger bg-lab-danger/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <button type="submit" disabled={loading || !token.trim()} className="btn-primary w-full">
            {loading ? '验证中...' : '登录'}
          </button>
        </form>
      </div>
    </div>
  )
}
