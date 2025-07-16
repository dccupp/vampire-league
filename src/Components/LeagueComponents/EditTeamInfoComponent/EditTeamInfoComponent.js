import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../api'; // Use centralized axiosInstance
import './EditTeamInfoComponent.css';

const EditTeamInfoComponent = ({ currentUser, currentLeague }) => {
  const [teamName, setTeamName] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch current team name
  useEffect(() => {
    const fetchTeamName = async () => {
      if (currentUser?.id && currentLeague?.league_id) {
        setIsLoading(true);
        try {
          console.log('Fetching team name for user:', currentUser.id, 'league:', currentLeague.league_id);
          const response = await axiosInstance.get(`/league_members/getLeagueMembersByLeagueId/${currentLeague.league_id}`);
          console.log('League members response:', response.data);
          const member = response.data.find(m => m.user_id === currentUser.id);
          if (member) {
            setTeamName(member.team_name || '');
          } else {
            setMessage('You are not a member of this league.');
            setMessageType('error');
          }
        } catch (error) {
          console.error('Error fetching team name:', error.response || error);
          setMessage(`Failed to load team information: ${error.response?.data?.message || error.message}`);
          setMessageType('error');
        } finally {
          setIsLoading(false);
        }
      } else {
        setMessage('Missing user or league information.');
        setMessageType('error');
      }
    };
    fetchTeamName();
  }, [currentUser, currentLeague]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) {
      setMessage('Team name cannot be empty.');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Updating team name to:', teamName);
      const response = await axiosInstance.put(`/league_members/updateTeamName/${currentLeague.league_id}/${currentUser.id}`, {
        team_name: teamName
      });
      console.log('Update team name response:', response.data);
      if (response.data.status === 'success') {
        setMessage('Team name updated successfully.');
        setMessageType('success');
      } else {
        console.error('Update failed:', response.data);
        setMessage(response.data.message || 'Failed to update team name.');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error updating team name:', error.response || error);
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
              />
            </div>
            <button
              type="submit"
              className="btn-success"
              disabled={!teamName.trim() || isLoading}
            >
              Update Team Name
            </button>
          </form>
        )}
        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default EditTeamInfoComponent;