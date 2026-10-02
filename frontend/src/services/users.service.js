import apiClient from './apiClient'

class UsersService {
  async getCurrentUser() {
    const { data } = await apiClient.get('/api/auth/user/')
    return data
  }
}

const usersService = new UsersService()
export default usersService