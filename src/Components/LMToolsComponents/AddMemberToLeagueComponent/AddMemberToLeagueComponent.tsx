import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import axiosInstance from '../../../api';

import { useLeague } from '../../../context/LeagueContext';

import './AddMemberToLeagueComponent.css';

interface FoundUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
}

const AddMemberToLeagueComponent = () => {
  const { currentLeague } = useLeague();
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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
      try {
        const response = await axiosInstance.post('/league_members/create', {
          league_id: currentLeague?.league_id,
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

  const isSuccess = message.includes('successful') || message.startsWith('User found');

  return (
    <div className="aml-container">
      <div className="aml-card animate__animated animate__fadeIn">
        <h3 className="aml-title">Add Member to League</h3>
        {remainingSpots !== null && (
          <p className={`aml-spots-text${remainingSpots === 0 ? ' full' : ''}`}>
            {remainingSpots === 0
              ? 'League is full (10 members)'
              : `${remainingSpots} spot${remainingSpots === 1 ? '' : 's'} left in the league`}
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="aml-form-group">
            <input
              type="text"
              className="aml-input"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value.trim())}
              required
              disabled={isLoading}
            />
          </div>
          <div className="aml-form-group">
            <div className="aml-checkbox-group">
              <input
                type="checkbox"
                className="aml-checkbox"
                id="isVampire"
                checked={isVampire}
                onChange={(e) => setIsVampire(e.target.checked)}
                disabled={isLoading || remainingSpots === 0}
              />
              <label className="aml-checkbox-label" htmlFor="isVampire">
                Set As Vampire Player
              </label>
            </div>
          </div>
          <button
            type="submit"
            className="aml-submit-btn"
            disabled={isLoading || remainingSpots === 0}
          >
            {isLoading ? 'Processing...' : (foundUser ? 'Add to League' : 'Check Username')}
          </button>
          {message && (
            <p className={`aml-message ${isSuccess ? 'success' : 'error'}`}>
              {message}
            </p>
          )}
        </form>
        <a href="/dashboard" className="aml-back-link">Back to Dashboard</a>
      </div>
    </div>
  );
};

export default AddMemberToLeagueComponent;
