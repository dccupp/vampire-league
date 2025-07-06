import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddMemberToLeagueComponent.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';

// Configure Axios instance to ensure correct backend port
const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000'
});

const AddMemberToLeagueComponent = ({ currentUser, currentLeague }) => {
  const [username, setUsername] = useState('');
  const [isVampire, setIsVampire] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [foundUser, setFoundUser] = useState(null);
  const [remainingSpots, setRemainingSpots] = useState(null);
  const navigate = useNavigate();

  // Fetch the number of current league members on component mount
  useEffect(() => {
    const fetchLeagueMembersCount = async () => {
      if (currentLeague?.league_id) {
        try {
          const response = await axiosInstance.get(`/league_members/getLeagueMembersByLeagueId/${currentLeague.league_id}`);
          console.log('AddMemberToLeague: Response from getLeagueMembersByLeagueId:', {
            status: response.status,
            data: response.data
          });
          const memberCount = response.data.length;
          setRemainingSpots(10 - memberCount);
        } catch (error) {
          console.error('AddMemberToLeague: Error fetching league members count:', error);
          console.log('AddMemberToLeague: Detailed error info:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
          });
          setRemainingSpots(null);
          setMessage('Error fetching league member count. Please try again.');
        }
      }
    };
    fetchLeagueMembersCount();
  }, [currentLeague]);

  const validateUsername = (username) => {
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    return usernameRegex.test(username) && username.length >= 3 && username.length <= 50;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setMessage('Username is required.');
      setIsLoading(false);
      return;
    }

    if (!validateUsername(trimmedUsername)) {
      setMessage('Invalid username format. Must be 3-50 characters, containing only letters, numbers, or underscores.');
      setIsLoading(false);
      return;
    }

    if (!foundUser) {
      // Step 1: Check username
      try {
        const apiUrl = `/users/getUserByUsername/${trimmedUsername}`;
        console.log(`AddMemberToLeague: Preparing GET request to http://localhost:3000${apiUrl}`);
        console.log('AddMemberToLeague: Request config:', {
          method: 'GET',
          url: apiUrl,
          baseURL: 'http://localhost:3000',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          usernameSent: trimmedUsername,
          globalBaseURL: axios.defaults.baseURL
        });
        const response = await axiosInstance.get(apiUrl, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        console.log('AddMemberToLeague: Full response from getUserByUsername:', {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data
        });

        if (response.data && response.data.id) {
          setFoundUser(response.data);
          setMessage(`User found: ${response.data.first_name} ${response.data.last_name} (${response.data.username}). Click "Add to League" to invite.`);
        } else {
          setMessage('No user found with this username.');
          console.log('AddMemberToLeague: No user data returned, response:', response.data);
        }
      } catch (error) {
        console.error('AddMemberToLeague: Error fetching user:', error);
        console.log('AddMemberToLeague: Detailed error info:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers,
          message: error.message,
          config: error.config,
          requestUrl: error.config?.url,
          baseURL: error.config?.baseURL,
          globalBaseURL: axios.defaults.baseURL
        });
        if (error.response && error.response.status === 404) {
          setMessage('No user found with this username.');
        } else {
          setMessage(`Error checking username. Please verify the backend server is running at http://localhost:3000 and the endpoint /users/getUserByUsername is accessible.`);
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      // Step 2: Add to league
      try {
        console.log('AddMemberToLeague: Calling POST /league_members/create with data:', {
          league_id: currentLeague.league_id,
          user_id: foundUser.id,
          role: 'invited',
          team_name: null,
          remaining_faab_budget: null,
          is_vamp: isVampire ? 1 : 0
        });
        const response = await axiosInstance.post('/league_members/create', {
          league_id: currentLeague.league_id,
          user_id: foundUser.id,
          role: 'invited',
          team_name: null,
          remaining_faab_budget: null,
          is_vamp: isVampire ? 1 : 0
        });
        console.log('AddMemberToLeague: Response from create:', response.data);

        if (response.data.status === 'success') {
          setMessage(`User ${foundUser.first_name} ${foundUser.last_name} invited to league successfully!`);
          setFoundUser(null);
          setUsername('');
          setIsVampire(false);
          setRemainingSpots(prev => prev !== null ? prev - 1 : null);
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          if (response.data.message === 'League has reached the maximum of 10 members') {
            setMessage('Cannot add user: League has reached the maximum of 10 members.');
          } else if (response.data.message === 'User is already a member of this league') {
            setMessage('Cannot add user: They are already a member of this league.');
          } else if (response.data.message === 'A vampire player is already set for this league') {
            setMessage('Cannot add user: A vampire player is already set for this league.');
          } else {
            setMessage(response.data.message || 'Error adding user to league. Please try again.');
          }
        }
      } catch (error) {
        console.error('AddMemberToLeague: Error adding user to league:', error);
        console.log('AddMemberToLeague: Error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
        if (error.response && error.response.status === 400 && error.response.data.message === 'League has reached the maximum of 10 members') {
          setMessage('Cannot add user: League has reached the maximum of 10 members.');
        } else if (error.response && error.response.status === 400 && error.response.data.message === 'User is already a member of this league') {
          setMessage('Cannot add user: They are already a member of this league.');
        } else if (error.response && error.response.status === 400 && error.response.data.message === 'A vampire player is already set for this league') {
          setMessage('Cannot add user: A vampire player is already set for this league.');
        } else {
          setMessage(`Error adding user to league. Please verify the backend server is running at http://localhost:3000.`);
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="add-member-container">
      <div className="add-member-form animate__animated animate__fadeIn">
        <form onSubmit={handleSubmit}>
          <h3 className="text-center mb-4">Add Member to League</h3>
          {remainingSpots !== null && (
            <p className="text-center mb-3" style={{ color: remainingSpots === 0 ? '#e74c3c' : '#2ecc71', fontFamily: 'Poppins, sans-serif', fontSize: '14px' }}>
              {remainingSpots === 0 ? 'League is full (10 members)' : `${remainingSpots} spot${remainingSpots === 1 ? '' : 's'} left in the league`}
            </p>
          )}
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
            <div className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="isVampire"
                checked={isVampire}
                onChange={(e) => setIsVampire(e.target.checked)}
                disabled={isLoading || remainingSpots === 0}
              />
              <label className="form-check-label vampire-label" htmlFor="isVampire">
                Set As Vampire Player
              </label>
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-success w-100"
            disabled={isLoading || remainingSpots === 0}
          >
            {isLoading ? 'Processing...' : (foundUser ? 'Add to League' : 'Check Username')}
          </button>
          {message && (
            <p className={`message mt-3 ${message.includes('successful') || message.startsWith('User found') ? 'success' : 'error'}`}>
              {message}
            </p>
          )}
          <a href="/dashboard" className="add-member-link">Back to Dashboard</a>
        </form>
      </div>
    </div>
  );
};

export default AddMemberToLeagueComponent;