import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import './Login.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';

// Configure Axios instance to ensure correct backend port
// Ensure HTTPS is used in production to secure password transmission
const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000'
});

const Login = ({ setCurrentUser, currentUser }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      setMessage('Username and password are required.');
      setIsLoading(false);
      return;
    }

    try {
      const apiUrl = '/users/login';
      const response = await axiosInstance.post(apiUrl, {
        username: trimmedUsername,
        password
      });

      if (response.data.status === 'success') {
        const userData = {
          id: response.data.data.id,
          username: response.data.data.username,
          email_address: response.data.data.email_address,
          first_name: response.data.data.first_name,
          last_name: response.data.data.last_name
        };
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.removeItem('league'); // Clear stale league data
        setCurrentUser(userData);
        setMessage('Login successful! Redirecting to landing...');
        // Reduced delay to 500ms to improve UX while ensuring currentUser is set
        setTimeout(() => {
          navigate('/landing');
        }, 500);
      } else {
        if (response.data.message === 'Username and password are required') {
          setMessage('Username and password are required.');
        } else if (response.data.message === 'Invalid credentials') {
          setMessage('Invalid username or password. Please try again.');
        } else {
          setMessage('Error logging in. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error logging in:', error);
      if (error.response && error.response.status === 404) {
        setMessage(`Error: Endpoint not found. Please verify the backend server is running at http://localhost:3000 and the endpoint /users/login is accessible.`);
      } else if (error.response && error.response.status === 401) {
        setMessage('Invalid username or password. Please try again.');
      } else {
        setMessage(`Error logging in. Please verify the backend server is running at http://localhost:3000 or check your network connection.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (currentUser) {
    return <Navigate to="/landing" />;
  }

  return (
    <div className="login-container">
      <div className="login-form animate__animated animate__fadeIn">
        <form onSubmit={handleLogin}>
          <h3 className="text-center mb-4">Vampire League Football</h3>
          <div className="form-group mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value.trim())}
              required
              disabled={isLoading}
            />
          </div>
          <div className="form-group mb-3">
            <input
              type="password"
              className="form-control"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            className="btn btn-success w-100"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
          {message && (
            <p className={`message mt-3 ${message.includes('successful') ? 'success' : 'error'}`}>
              {message}
            </p>
          )}
          <a href="/register" className="register-link">Don't have an account? Register</a>
        </form>
      </div>
    </div>
  );
};

export default Login;