import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import axiosInstance from '../../../api';
import { CurrentUser, CurrentLeague } from '../../../types';
import './AddMemberToLeagueComponent.css';
import 'bootstrap/dist/css/bootstrap.min.css';

interface AddMemberToLeagueComponentProps {
  currentUser: CurrentUser;
  currentLeague: CurrentLeague;
}

interface FoundUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
}

const AddMemberToLeagueComponent = ({ currentUser, currentLeague }: AddMemberToLeagueComponentProps) => {
  const [username, setUsername] = useState<string>('');
  const [isVampire, setIsVampire] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [foundUser, setFoundUser] = useState<FoundUser | null>(null);
  const [remainingSpots, setRemainingSpots] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeagueMembersCount = async () => {
      if (!currentLeague?.league_id) return;
      try {
        const response = await axiosInstance.get(`/league_members/getLeagueMembersByLeagueId/${currentLeague.league_id}`);
        setRemainingSpots(10 - response.data.length);
      } catch (error) {
        const msg = isAxiosError(error)
          ? error.response?.data?.message || error.message
          : 'Error fetching league member count.';
        console.error('AddMemberToLeague: Error fetching league members count:', msg);
        setRemainingSpots(null);
        setMessage('Error fetching league member count. Please try again.');
      }
    };
    fetchLeagueMembersCount();
  }, [currentLeague?.league_id]);

  const validateUsername = (value: string): boolean => {
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    return usernameRegex.test(value) && value.length >= 3 && value.length <= 50;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
      // Step 1: Look up username
      try {
        const response = await axiosInstance.get(`/users/getUserByUsername/${trimmedUsername}`);
        if (response.data?.id) {
          setFoundUser(response.data);
          setMessage(`User found: ${response.data.first_name} ${response.data.last_name} (${response.data.username}). Click "Add to League" to invite.`);
        } else {
          setMessage('No user found with this username.');
        }
      } catch (error) {
        const msg = isAxiosError(error) && error.response?.status === 404
          ? 'No user found with this username.'
          : `Error checking username. Please verify the backend server is running at ${axiosInstance.defaults.baseURL}.`;
        console.error('AddMemberToLeague: Error fetching user:', error);
        setMessage(msg);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Step 2: Add to league
      try {
        const response = await axiosInstance.post('/league_members/create', {
          league_id: currentLeague.league_id,
          user_id: foundUser.id,
          role: 'invited',
          team_name: null,
          remaining_faab_budget: null,
          is_vamp: isVampire ? 1 : 0,
        });

        if (response.data.status === 'success') {
          setMessage(`User ${foundUser.first_name} ${foundUser.last_name} invited to league successfully!`);
          setFoundUser(null);
          setUsername('');
          setIsVampire(false);
          setRemainingSpots(prev => prev !== null ? prev - 1 : null);
          setTimeout(() => navigate('/dashboard'), 2000);
        } else {
          setMessage(response.data.message || 'Error adding user to league. Please try again.');
        }
      } catch (error) {
        const msg = isAxiosError(error)
          ? error.response?.data?.message || error.message
          : `Error adding user to league. Please verify the backend server is running at ${axiosInstance.defaults.baseURL}.`;
        console.error('AddMemberToLeague: Error adding user to league:', error);
        setMessage(msg);
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
            <p
              className="text-center mb-3"
              style={{ color: remainingSpots === 0 ? '#e74c3c' : '#2ecc71', fontFamily: 'Poppins, sans-serif', fontSize: '14px' }}
            >
              {remainingSpots === 0
                ? 'League is full (10 members)'
                : `${remainingSpots} spot${remainingSpots === 1 ? '' : 's'} left in the league`}
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