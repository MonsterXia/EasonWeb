import axios from 'axios'

// CommonServerAPI authenticates browser requests using HttpOnly auth_token cookies.
export const request = axios.create({ withCredentials: true, timeout: 10000 })
export default request
