import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import axiosInstance from '../../api';
import { CurrentUser } from '../../types';
import './Login.css';
import 'bootstrap/dist/css/bootstrap.min.css';

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

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
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

  const name: string = "";
  const isAdmin: boolean = true;
  const notifications: number = 0;

  const nameDisplay = name || "Guest";
  console.log(nameDisplay);

  const adminDisplay = isAdmin && "Admin Access Granted";
  console.log(adminDisplay);

  const notificationDisplay = notifications || "No Notifications";
  console.log(notificationDisplay);

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
          <button type="submit" className="btn btn-success w-100" disabled={isLoading}>
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