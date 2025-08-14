import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../api';
import './EditTeamInfoComponent.css';

const EditTeamInfoComponent = ({ currentUser, currentLeague }) => {
  const [teamName, setTeamName] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isMessageFading, setIsMessageFading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Clear message after 3 seconds with fade-out
  useEffect(() => {
    if (message) {
      setIsMessageFading(false);
      const timer = setTimeout(() => {
        setIsMessageFading(true);
        setTimeout(() => {
          setMessage('');
          setMessageType('');
          setIsMessageFading(false);
        }, 500); // Match animate__fadeOut duration
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Fetch current team name
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
        setMessage(`Failed to load team information: ${error.response?.data?.message || error.message}`);
        setMessageType('error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTeamName();
  }, [currentUser, currentLeague]);

  // Handle form submission
  const handleSubmit = async (e) => {
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
      const response = await axiosInstance.put(`/league_members/updateTeamName/${currentLeague.league_id}/${currentUser.id}`, {
        team_name: trimmedTeamName
      });
      if (response.data.status === 'success') {
        setMessage('Team name updated successfully!');
        setMessageType('success');
      } else {
        setMessage(response.data.message || 'Failed to update team name.');
        setMessageType('error');
      }
    } catch (error) {
      setMessage(`Error updating team name: ${error.response?.data?.message || error.message}`);
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="edit-team-container">
      <div className="edit-team-form animate__animated animate__fadeIn">
        <h3>Edit Team Information</h3>
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="vampire-label">Team Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter team name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                disabled={isLoading}
                maxLength={50}
              />
            </div>
            <button
              type="submit"
              className="btn-success"
              disabled={!teamName.trim() || teamName.length > 50 || isLoading}
            >
              Update Team Name
            </button>
          </form>
        )}
        {message && (
          <div className={`message ${messageType} animate__animated ${isMessageFading ? 'animate__fadeOut' : 'animate__fadeIn'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default EditTeamInfoComponent;