import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import axiosInstance from '../../api';
import './Registration.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const Registration = () => {
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const validateForm = (): string | null => {
    if (!username || !email || !firstName || !lastName || !password || !confirmPassword) {
      return 'All fields are required.';
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username) || username.length < 3 || username.length > 50) {
      return 'Username must be 3-50 characters and contain only letters, numbers, or underscores.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Invalid email format. Please enter a valid email.';
    }

    const nameRegex = /^[a-zA-Z\s-]{1,50}$/;
    if (!nameRegex.test(firstName)) {
      return 'First name must be 1-50 characters and contain only letters, spaces, or hyphens.';
    }
    if (!nameRegex.test(lastName)) {
      return 'Last name must be 1-50 characters and contain only letters, spaces, or hyphens.';
    }

    if (password.length < 8) {
      return 'Password must be at least 8 characters.';
    }

    if (password !== confirmPassword) {
      return 'Passwords do not match.';
    }

    return null;
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    const validationError = validateForm();
    if (validationError) {
      setMessage(validationError);
      setIsLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.post('/users/register', {
        username: username.trim(),
        email_address: email.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        password,
      });

      if (response.data.status === 'success') {
        localStorage.setItem('user', JSON.stringify({
          id: response.data.id,
          username: username.trim(),
          email_address: email.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        }));
        setMessage('Registration successful! Redirecting to login...');
        setTimeout(() => navigate('/'), 2000);
      } else {
        setMessage(response.data.message || 'Error registering. Please try again.');
      }
    } catch (error) {
      const msg = isAxiosError(error)
        ? error.response?.data?.message || `Error registering. Please verify the backend server is running at ${axiosInstance.defaults.baseURL}.`
        : 'Error registering. Please try again.';
      setMessage(msg);
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
          <button type="submit" className="btn btn-success w-100" disabled={isLoading}>
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