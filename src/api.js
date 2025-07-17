import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.vampireleaguefootball.com' 
  : process.env.REACT_APP_API_URL || 'http://localhost:8000';

const axiosInstance = axios.create({
  baseURL: API_URL
});

export default axiosInstance;