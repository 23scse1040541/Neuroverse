import axios from 'axios'

const baseURL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8000'

export function createClient(getToken) {
  const inst = axios.create({ baseURL: baseURL + '/api' })
  inst.interceptors.request.use(cfg => {
    const t = getToken?.()
    if (t) cfg.headers.Authorization = `Bearer ${t}`
    return cfg
  })
  return inst
}
