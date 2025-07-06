import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Registration.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';

// Configure Axios instance to ensure correct backend port
const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000'
});

const Registration = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    // Check for required fields
    if (!username || !email || !firstName || !lastName || !password || !confirmPassword) {
      return 'All fields are required.';
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username) || username.length < 3 || username.length > 50) {
      return 'Username must be 3-50 characters and contain only letters, numbers, or underscores.';
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Invalid email format. Please enter a valid email.';
    }

    // Validate firstName and lastName (letters, spaces, hyphens, 1-50 characters)
    const nameRegex = /^[a-zA-Z\s-]{1,50}$/;
    if (!nameRegex.test(firstName)) {
      return 'First name must be 1-50 characters and contain only letters, spaces, or hyphens.';
    }
    if (!nameRegex.test(lastName)) {
      return 'Last name must be 1-50 characters and contain only letters, spaces, or hyphens.';
    }

    // Validate password length
    if (password.length < 8) {
      return 'Password must be at least 8 characters.';
    }

    // Validate password match
    if (password !== confirmPassword) {
      return 'Passwords do not match.';
    }

    return null; // No errors
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    // Client-side validation
    const validationError = validateForm();
    if (validationError) {
      setMessage(validationError);
      setIsLoading(false);
      return;
    }

    try {
      const apiUrl = '/users/register';
      console.log(`Registration: Preparing POST request to http://localhost:3000${apiUrl}`);
      console.log('Registration: Request config:', {
        method: 'POST',
        url: apiUrl,
        baseURL: 'http://localhost:3000',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        data: {
          username: username.trim(),
          email_address: email.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          password: '******' // Masked for security
        }
      });
      const response = await axiosInstance.post(apiUrl, {
        username: username.trim(),
        email_address: email.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        password
      });
      console.log('Registration: Full response from register:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      });

      if (response.data.status === 'success') {
        localStorage.setItem('user', JSON.stringify({
          id: response.data.id,
          username: username.trim(),
          email_address: email.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim()
        }));
        setMessage('Registration successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        if (response.data.message === 'Username already exists') {
          setMessage('Username already exists. Please use a different username.');
        } else if (response.data.message === 'Email already exists') {
          setMessage('Email already exists. Please use a different email.');
        } else if (response.data.message === 'Invalid email format') {
          setMessage('Invalid email format. Please enter a valid email.');
        } else if (response.data.message === 'Username must be 3-50 characters') {
          setMessage('Username must be 3-50 characters.');
        } else if (response.data.message === 'Username must contain only letters, numbers, and underscores') {
          setMessage('Username must contain only letters, numbers, and underscores.');
        } else if (response.data.message === 'Password must be at least 8 characters') {
          setMessage('Password must be at least 8 characters.');
        } else {
          setMessage('Error registering. Please try again.');
        }
      }
    } catch (error) {
      console.error('Registration: Error registering:', error);
      console.log('Registration: Detailed error info:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        message: error.message
      });
      setMessage('Error registering. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-form animate__animated animate__fadeIn">
        <form onSubmit={handleRegister}>
          <h3 className="text-center mb-4">Fantasy Football Register</h3>
          <div className="form-group mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value.trim())}
              required
              disabled={isLoading}
            />
          </div>
          <div className="form-group mb-3">
            <input
              type="email"
              className="form-control"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
              required
              disabled={isLoading}
            />
          </div>
          <div className="form-group mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value.trim())}
              required
              disabled={isLoading}
            />
          </div>
          <div className="form-group mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value.trim())}
              required
              disabled={isLoading}
            />
          </div>
          <div className="form-group mb-3">
            <input
              type="password"
              className="form-control"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="form-group mb-3">
            <input
              type="password"
              className="form-control"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            className="btn btn-success w-100"
            disabled={isLoading}
          >
            {isLoading ? 'Registering...' : 'Register'}
          </button>
          {message && (
            <p className={`message mt-3 ${message.includes('successful') ? 'success' : 'error'}`}>
              {message}
            </p>
          )}
          <a href="/" className="register-link">Already have an account? Login</a>
        </form>
      </div>
    </div>
  );
};

export default Registration;