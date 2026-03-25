import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '@/api/auth'
import { AUTH_TOKEN_KEY } from '@/api/client'

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
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-lab-text">
            <span className="text-lab-accent">Primer</span>Manager
          </h1>
          <p className="text-sm text-lab-muted mt-1">引物探针管理系统</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-slate-700 mb-1">
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
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button type="submit" disabled={loading || !token.trim()} className="btn-primary w-full">
            {loading ? '验证中...' : '登录'}
          </button>
        </form>
      </div>
    </div>
  )
}
