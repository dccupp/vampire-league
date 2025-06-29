import React, { useState } from 'react';
import './Login.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = ({ setCurrentUser, currentUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post('/users/login', {
        email_address: email,
        password: password,
      });

      const { status, data, message } = response.data;

      if (status === 'success') {
        console.log('Login: Setting user data');
        const userData = {
          id: data.id,
          email_address: data.email_address,
          first_name: data.first_name,
          last_name: data.last_name,
        };
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.removeItem('league'); // Ensure no stale league data
        setCurrentUser(userData);
        navigate('/landing');
      } else {
        if (message === 'Email not found') {
          setMessage('Email address not found. Please register or try another email.');
        } else if (message === 'Invalid password') {
          setMessage('Invalid password. Please try again.');
        } else {
          setMessage('Error logging in. Please try again.');
        }
      }
    } catch (error) {
      console.error('Login: Error:', error);
      setMessage('Error logging in. Please check your connection and try again.');
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
              type="email"
              className="form-control"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
          {message && <p className="error-message mt-3">{message}</p>}
          <a href="/register" className="register-link">Don't have an account? Register</a>
        </form>
      </div>
    </div>
  );
};

export default Login;