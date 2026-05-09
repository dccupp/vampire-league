import { useState, useEffect } from 'react';
import { isAxiosError } from 'axios';
import axiosInstance from '../../../api';
import { CurrentUser, CurrentLeague } from '../../../types';
import './EditTeamInfoComponent.css';

interface EditTeamInfoComponentProps {
  currentUser: CurrentUser;
  currentLeague: CurrentLeague;
}

const EditTeamInfoComponent = ({ currentUser, currentLeague }: EditTeamInfoComponentProps) => {
  const [teamName, setTeamName] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<string>('');
  const [isMessageFading, setIsMessageFading] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (message) {
      setIsMessageFading(false);
      const timer = setTimeout(() => {
        setIsMessageFading(true);
        setTimeout(() => {
          setMessage('');
          setMessageType('');
          setIsMessageFading(false);
        }, 500);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    const fetchTeamName = async () => {
      if (!currentUser?.id || !currentLeague?.league_id) {
        setMessage('Missing user or league information. Please ensure you are logged in and have selected a league.');
        setMessageType('error');
        return;
      }

      setIsLoading(true);
      try {
        const response = await axiosInstance.get(`/league_members/getLeagueMembersByLeagueId/${currentLeague.league_id}`);
        if (!Array.isArray(response.data)) {
          setMessage('Invalid response from server. Please try again later.');
          setMessageType('error');
          return;
        }

        const member = response.data.find(m => m.user_id === currentUser.id);
        if (member) {
          setTeamName(member.team_name || '');
        } else {
          setMessage('You are not a member of this league. Please join the league first.');
          setMessageType('error');
        }
      } catch (error) {
        const msg = isAxiosError(error)
          ? error.response?.data?.message || error.message
          : 'Failed to load team information.';
        setMessage('Failed to load team information: ' + msg);
        setMessageType('error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamName();
  }, [currentUser?.id, currentLeague?.league_id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedTeamName = teamName.trim();
    if (!trimmedTeamName) {
      setMessage('Team name cannot be empty or just spaces.');
      setMessageType('error');
      return;
    }
    if (trimmedTeamName.length > 50) {
      setMessage('Team name cannot exceed 50 characters.');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axiosInstance.put(
        `/league_members/updateTeamName/${currentLeague.league_id}/${currentUser.id}`,
        { team_name: trimmedTeamName }
      );
      if (response.data.status === 'success') {
        setMessage('Team name updated successfully!');
        setMessageType('success');
      } else {
        setMessage(response.data.message || 'Failed to update team name.');
        setMessageType('error');
      }
    } catch (error) {
      const msg = isAxiosError(error)
        ? error.response?.data?.message || error.message
        : 'Error updating team name.';
      setMessage('Error updating team name: ' + msg);
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="eti-container">
      <div className="eti-card animate__animated animate__fadeIn">
        <h2 className="eti-title">Edit Team Info</h2>

        {isLoading ? (
          <div className="eti-loading">Loading...</div>
        ) : (
          <form onSubmit={handleSubmit} className="eti-form">
            <div className="eti-field">
              <label className="eti-label">Team Name</label>
              <input
                type="text"
                className="eti-input"
                placeholder="Enter team name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                disabled={isLoading}
                maxLength={50}
              />
              <span className="eti-char-count">{teamName.length} / 50</span>
            </div>
            <button
              type="submit"
              className="eti-submit"
              disabled={!teamName.trim() || teamName.length > 50 || isLoading}
            >
              Update Team Name
            </button>
          </form>
        )}

        {message && (
          <div className={`eti-message eti-message--${messageType} animate__animated ${isMessageFading ? 'animate__fadeOut' : 'animate__fadeIn'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default EditTeamInfoComponent;
