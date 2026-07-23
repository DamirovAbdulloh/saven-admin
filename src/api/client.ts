import axios from 'axios'

// Lokal dev: vite proxy orqali "/api" ishlaydi (vite.config.ts -> VITE_BACKEND_URL).
// Production (Render): admin panel backend'dan ALOHIDA domenda tursa, build
// vaqtida VITE_API_URL to'liq manzil bilan o'rnatiladi (.env.production'ga qarang).
const API_BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('savin_token')
  if (token) {
    config.headers.Authorization = `Token ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('savin_token')
      if (window.location.pathname !== '/auth') {
        window.location.href = '/auth'
      }
    }
    return Promise.reject(error)
  },
)

export default api
