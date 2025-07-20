import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost/vampire_project/vamp_api';
// const API_URL = process.env.REACT_APP_API_URL || '/api';

const axiosInstance = axios.create({
  baseURL: API_URL
});

export default axiosInstance;