import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Registration.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const Registration = () => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      // Mock token for testing; uncomment API call for production
      const mockToken = 'mock-auth-token';
      console.log('Registration: Setting authToken'); // Debug log
      localStorage.setItem('authToken', mockToken);
      setMessage('Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/');
      }, 2000);
      /*
      const response = await fetch('http://localhost/vampire_football/vamp_api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_address: email,
          first_name: firstName,
          last_name: lastName,
          password: password,
        }),
      });
      const data = await response.json();
      if (data.status === 'success') {
        console.log('Registration: Setting authToken from API'); // Debug log
        localStorage.setItem('authToken', data.token || 'mock-auth-token');
        setMessage('Registration successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setMessage(data.message);
      }
      */
    } catch (error) {
      console.error('Registration: Error:', error); // Debug log
      setMessage('Error registering. Please try again.');
    }
  };

  return (
    <div className="register-form animate__animated animate__fadeIn">
      <form onSubmit={handleRegister}>
        <h3 className="text-center mb-3">Fantasy Football Register</h3>
        <input
          type="email"
          className="form-control mb-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="text"
          className="form-control mb-2"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
        <input
          type="text"
          className="form-control mb-2"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
        <input
          type="password"
          className="form-control mb-2"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="btn btn-success w-100">Register</button>
        {message && <p className="error-message mt-2">{message}</p>}
        <a href="/" className="register-link d-block mt-2 text-center">Already have an account? Login</a>
      </form>
    </div>
  );
};

export default Registration;