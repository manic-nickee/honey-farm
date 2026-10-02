import axios from 'axios'

class ApiClient {
  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || '',
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    })

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const data = error.response?.data
        const detail = data?.error || (data && Object.values(data).flat().join(' ')) || error.message || 'Something went wrong.'
        return Promise.reject(new Error(detail))
      },
    )
  }

  get(path, config) {
    return this.client.get(path, config)
  }

  post(path, body, config) {
    return this.client.post(path, body, config)
  }

  async getCsrfHeaders() {
    const { data } = await this.get('/api/auth/csrf/')
    const token = document.cookie.split('; ').find((row) => row.startsWith('csrftoken='))?.split('=')[1] || data.csrfToken
    return token ? { 'X-CSRFToken': token } : {}
  }
}

export default new ApiClient()