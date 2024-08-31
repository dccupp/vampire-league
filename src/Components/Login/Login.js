import React, { useState } from 'react';
import './Login.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
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

      if (data.status === 'success') {
        setMessage('Login successful!');
        // Here you can redirect the user to another page or save the user data
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      setMessage('Error logging in. Please try again.');
    }
  };

  return (
    <div className="login-container">
    <form className="login-form" onSubmit={handleLogin}>
      <h3 className="text-center mb-4">Vampire League Football</h3>
      <input
        type="email"
        placeholder="Enter email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Enter password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Login</button>
      {message && <p>{message}</p>}
      <a href="/register" className="register-link">Don't have an account? Register</a>
    </form>
  </div>
);
}

export default Login;