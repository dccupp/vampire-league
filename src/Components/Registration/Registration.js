import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Registration.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';

const Registration = () => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post('/users/register', {
        email_address: email,
        first_name: firstName,
        last_name: lastName,
        password: password,
      });

      const { status, message, id } = response.data;

      if (status === 'success') {
        console.log('Registration: Setting user data');
        localStorage.setItem('user', JSON.stringify({
          id,
          email_address: email,
          first_name: firstName,
          last_name: lastName,
        }));
        setMessage('Registration successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        if (message === 'Email already exists') {
          setMessage('Email already exists. Please use a different email.');
        } else if (message === 'Invalid email format') {
          setMessage('Invalid email format. Please enter a valid email.');
        } else if (message === 'Password must be at least 8 characters') {
          setMessage('Password must be at least 8 characters.');
        } else {
          setMessage('Error registering. Please try again.');
        }
      }
    } catch (error) {
      console.error('Registration: Error:', error);
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
              type="email"
              className="form-control"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              onChange={(e) => setFirstName(e.target.value)}
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
              onChange={(e) => setLastName(e.target.value)}
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
          <button
            type="submit"
            className="btn btn-success w-100"
            disabled={isLoading}
          >
            {isLoading ? 'Registering...' : 'Register'}
          </button>
          {message && <p className="message mt-3">{message}</p>}
          <a href="/" className="register-link">Already have an account? Login</a>
        </form>
      </div>
    </div>
  );
};

export default Registration;