import apiClient from './apiClient'

class AuthService {
  async login(credentials) {
    const headers = await apiClient.getCsrfHeaders()
    const { data } = await apiClient.post('/api/auth/login/', credentials, { headers })
    return data
  }

  async register(credentials) {
    const headers = await apiClient.getCsrfHeaders()
    const { data } = await apiClient.post('/api/auth/register/', credentials, { headers })
    return data
  }

  async logout() {
    const headers = await apiClient.getCsrfHeaders()
    const { data } = await apiClient.post('/api/auth/logout/', {}, { headers })
    return data
  }
}

const authService = new AuthService()
export default authService