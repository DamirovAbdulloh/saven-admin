import { defineStore } from 'pinia'
import api from '@/api/client'

interface AdminUser {
  id: number
  login: string
  first_name: string
  last_name: string
  email: string
  phone: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('savin_token') as string | null,
    user: null as AdminUser | null,
    loading: false,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
  },
  actions: {
    async login(login: string, password: string) {
      const { data } = await api.post('/auth/login/', { login, password })
      this.token = data.token
      this.user = data.user
      localStorage.setItem('savin_token', data.token)
    },
    async fetchMe() {
      if (!this.token) return
      try {
        const { data } = await api.get('/auth/me/')
        this.user = data
      } catch {
        this.logout()
      }
    },
    async logout() {
      try {
        await api.post('/auth/logout/')
      } catch {
        /* ignore network errors on logout */
      }
      this.token = null
      this.user = null
      localStorage.removeItem('savin_token')
    },
    setToken(token: string) {
      this.token = token
      localStorage.setItem('savin_token', token)
    },
  },
})
