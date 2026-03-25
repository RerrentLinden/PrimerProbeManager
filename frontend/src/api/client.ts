import axios from 'axios'

const AUTH_TOKEN_KEY = 'primer_manager_token'

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export { AUTH_TOKEN_KEY }
export default client
