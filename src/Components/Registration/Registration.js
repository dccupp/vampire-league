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
  const navigate = useNavigate(); // Hook for navigation

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
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
        setMessage('Registration successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/'); // Redirect to login page
        }, 2000); // Redirect after 2 seconds
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      setMessage('Error registering. Please try again.');
    }
  };

  return (
    <div className="register-container d-flex justify-content-center align-items-center">
      <form className="register-form bg-dark p-4 rounded shadow" onSubmit={handleRegister}>
        <h2 className="text-center text-light mb-4">Fantasy Football Register</h2>
        <div className="mb-3">
          <input
            type="email"
            className="form-control"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <input
            type="password"
            className="form-control"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary w-100">Register</button>
        {message && <p className="text-center mt-3 text-danger">{message}</p>}
        <a href="/" className="text-center d-block mt-3 text-warning">Already have an account? Login here</a>
      </form>
    </div>
  );
}

export default Registration;
