import { useState, FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import axiosInstance from '../../api';
import { CurrentUser } from '../../types';
import DemoInfoModal from '../DemoInfoModal/DemoInfoModal';
import './Login.css';

interface LoginProps {
  setCurrentUser: (user: CurrentUser) => void;
  currentUser: CurrentUser | null;
}

const Login = ({ setCurrentUser, currentUser }: LoginProps) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
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
      const response = await axiosInstance.post('/users/login', {
        username: trimmedUsername,
        password,
      });

      if (response.data.status === 'success') {
        const userData: CurrentUser = {
          id: response.data.data.id,
          username: response.data.data.username,
          email_address: response.data.data.email_address,
          first_name: response.data.data.first_name,
          last_name: response.data.data.last_name,
        };
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.removeItem('league');
        setCurrentUser(userData);
        setMessage('Login successful! Redirecting to landing...');
        setTimeout(() => navigate('/landing'), 500);
      } else {
        setMessage(response.data.message || 'Error logging in. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      if (isAxiosError(error)) {
        if (error.response) {
          const status = error.response.status;
          if (status === 404) {
            setMessage(`Error: API endpoint not found. Ensure the backend server is running at ${axiosInstance.defaults.baseURL}.`);
          } else if (status === 401) {
            setMessage('Invalid username or password.');
          } else if (status === 500) {
            setMessage('Server error: ' + (error.response.data?.message || 'Unknown server issue.'));
          } else {
            setMessage('Error: ' + (error.response.data?.message || 'Failed to connect to the server.'));
          }
        } else if (error.request) {
          setMessage(`No response from server. Ensure the backend is running at ${axiosInstance.defaults.baseURL}.`);
        } else {
          setMessage('Error: ' + error.message);
        }
      } else {
        setMessage('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (currentUser) {
    return <Navigate to="/landing" />;
  }

  return (
    <div className="lgn-container">
      <div className="lgn-card animate__animated animate__fadeIn">
        <h3 className="lgn-title">Vampire League Football</h3>
        <form onSubmit={handleLogin}>
          <div className="lgn-form-group">
            <input
              type="text"
              className="lgn-input"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value.trim())}
              required
              disabled={isLoading}
            />
          </div>
          <div className="lgn-form-group">
            <input
              type="password"
              className="lgn-input"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <button type="submit" className="lgn-submit-btn" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
          {message && (
            <p className={`lgn-message ${message.includes('successful') ? 'success' : 'error'}`}>
              {message}
            </p>
          )}
        </form>
        <a href="/register" className="lgn-link">Don't have an account? Register</a>
        <DemoInfoModal context="Login" variant="link" />
      </div>
      <p className="lgn-disclaimer">
        This is a private, non-commercial site. Access is by invitation only.{' '}
        If you would like a demonstration, you can reach me at {' '}
        <a
          href="https://www.linkedin.com/in/dennis-cupp-46129231"
          target="_blank"
          rel="noopener noreferrer"
          className="lgn-disclaimer-link"
        >
          my LinkedIn.
        </a>
      </p>
    </div>
  );
};

export default Login;
