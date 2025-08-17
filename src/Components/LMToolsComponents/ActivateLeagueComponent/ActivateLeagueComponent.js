import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axiosInstance from '../../../api';
import './ActivateLeagueComponent.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const ActivateLeagueComponent = ({ currentUser, currentLeague }) => {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isMessageFading, setIsMessageFading] = useState(false);
  const [leagueMemberId, setLeagueMemberId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [canActivate, setCanActivate] = useState(false);
  const [memberCount, setMemberCount] = useState(null);

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

  // Fetch league member ID and check activation conditions
  useEffect(() => {
    const checkLeagueConditions = async () => {
      if (!currentUser?.id || !currentLeague?.league_id) {
        setMessage('User or league data is missing. Please try again.');
        setMessageType('error');
        setCanActivate(false);
        setIsLoading(false);
        return;
      }

      try {
        // Fetch league members to check count and roles
        const membersResponse = await axiosInstance.get(`/league_members/getLeagueMembersByLeagueId/${currentLeague.league_id}`);
        const members = Array.isArray(membersResponse.data) ? membersResponse.data : [];
        const validMembers = members.filter(member => ['player', 'commish'].includes(member.role));
        const commishCount = members.filter(member => member.role === 'commish').length;
        const memberCount = validMembers.length;
        setMemberCount(memberCount);

        // Check if league is already active
        const leagueResponse = await axiosInstance.get(`/leagues/getLeagueById/${currentLeague.league_id}`);
        const isActive = leagueResponse.data.is_active;

        // Verify user's commissioner role
        const memberResponse = await axiosInstance.get(`/league_members/getLeagueMembersByUserId/${currentUser.id}`);
        const leagueMember = Array.isArray(memberResponse.data) 
          ? memberResponse.data.find(member => member.league_id === currentLeague.league_id) 
          : null;

        if (leagueMember && leagueMember.role === 'commish') {
          setLeagueMemberId(leagueMember.id);
          if (isActive) {
            setMessage('League is already activated.');
            setMessageType('error');
            setCanActivate(false);
          } else if (commishCount > 1) {
            setMessage('League has multiple commissioners. Only one commissioner is allowed.');
            setMessageType('error');
            setCanActivate(false);
          } else if (memberCount !== 10) {
            setMessage(`League has ${memberCount} valid members (player or commish). Need exactly 10.`);
            setMessageType('error');
            setCanActivate(false);
          } else {
            setCanActivate(true);
          }
        } else {
          setMessage('Only the league commissioner can activate the league.');
          setMessageType('error');
          setCanActivate(false);
        }
      } catch (error) {
        setMessage('Error checking league conditions: ' + (error.response?.data?.message || error.message));
        setMessageType('error');
        setCanActivate(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkLeagueConditions();
  }, [currentUser, currentLeague]);

  // Handle league activation
  const handleActivateLeague = async (e) => {
    e.preventDefault();
    if (!leagueMemberId) {
      setMessage('Cannot activate league: User is not a member.');
      setMessageType('error');
      return;
    }
    setMessage('');
    setIsLoading(true);

    try {
      const response = await axiosInstance.post(`/leagues/activate/${currentLeague.league_id}/${leagueMemberId}`, {});
      if (response.data.status !== 'success') {
        throw new Error(response.data.message || 'Failed to activate league');
      }
      setMessage('League activated successfully!');
      setMessageType('success');
      setCanActivate(false);
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      setMessage('Failed to activate league: ' + (error.response?.data?.message || error.message));
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="activate-league-container">
      <div className="activate-league-form animate__animated animate__fadeIn">
        <form onSubmit={handleActivateLeague}>
          <h3 className="text-center mb-4">Activate League</h3>
          {memberCount !== null && (
            <p className="text-center mb-3" style={{ color: memberCount !== 10 ? '#e74c3c' : '#2ecc71', fontFamily: 'Poppins, sans-serif', fontSize: '14px' }}>
              {memberCount !== 10
                ? `League has ${memberCount} valid members (player or commish). Need exactly 10.`
                : 'League has 10 valid members and is ready to activate.'}
            </p>
          )}
          {message && (
            <p className={`message mt-3 ${messageType} animate__animated ${isMessageFading ? 'animate__fadeOut' : 'animate__fadeIn'}`}>
              {message}
            </p>
          )}
          <button
            type="submit"
            className="btn btn-success w-100"
            disabled={isLoading || !canActivate}
          >
            {isLoading ? 'Activating...' : 'Activate League'}
          </button>
          <a href="/dashboard" className="activate-league-link">Back to Dashboard</a>
        </form>
      </div>
    </div>
  );
};

ActivateLeagueComponent.propTypes = {
  currentUser: PropTypes.object,
  currentLeague: PropTypes.shape({
    league_id: PropTypes.number,
    name: PropTypes.string
  }),
};

export default ActivateLeagueComponent;