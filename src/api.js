import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

if (!API_URL) {
  console.error('REACT_APP_API_URL is not defined in .env file');
}

const axiosInstance = axios.create({
  baseURL: API_URL
});

export default axiosInstance;