import React, { useState } from 'react';
import './Login.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Navigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Mock token for testing; uncomment API call for production
      const mockToken = 'mock-auth-token';
      console.log('Login: Setting authToken'); // Debug log
      localStorage.setItem('authToken', mockToken);
      setIsAuthenticated(true);
      /*
      const response = await fetch('http://localhost/vampire_football/vamp_api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_address: email,
          password: password,
        }),
      });
      const data = await response.json();
      if (data.token) {
        console.log('Login: Setting authToken from API'); // Debug log
        localStorage.setItem('authToken', data.token);
        setIsAuthenticated(true);
      } else {
        setMessage('Login Error');
      }
      */
    } catch (error) {
      console.error('Login: Error:', error); // Debug log
      setMessage('Error logging in. Please try again.');
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="login-form animate__animated animate__fadeIn">
      <form onSubmit={handleLogin}>
        <h3 className="text-center mb-3">Vampire League Football</h3>
        <input
          type="email"
          className="form-control"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="form-control"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="btn btn-success">Login</button>
        {message && <p className="error-message">{message}</p>}
        <a href="/register" className="register-link">Don't have an account? Register</a>
      </form>
    </div>
  );
};

export default Login;