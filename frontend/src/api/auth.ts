import client from './client'
import type { AuthResponse } from '@/types'

export function login(token: string) {
  return client.post<AuthResponse>('/auth/login', { token })
}

export function verifyToken() {
  return client.get<AuthResponse>('/auth/verify')
}
