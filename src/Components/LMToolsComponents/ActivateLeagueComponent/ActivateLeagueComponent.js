import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

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

  // Fetch league member ID and check conditions
  useEffect(() => {
    const checkLeagueConditions = async () => {
      if (!currentUser?.id || !currentLeague?.league_id) {
        console.error('ActivateLeague: Missing currentUser.id or currentLeague.league_id', { currentUser, currentLeague });
        setMessage('User or league data is missing. Please try again.');
        setMessageType('error');
        setCanActivate(false);
        setIsLoading(false);
        return;
      }

      try {
        const membersResponse = await axiosInstance.get(`/league_members/getLeagueMembersByLeagueId/${currentLeague.league_id}`);
        const count = Array.isArray(membersResponse.data) ? membersResponse.data.length : 0;
        setMemberCount(count);

        const leagueResponse = await axiosInstance.get(`/leagues/getLeagueById/${currentLeague.league_id}`);
        const isActive = leagueResponse.data.is_active;

        const memberResponse = await axiosInstance.get(`/league_members/getLeagueMembersByUserId/${currentUser.id}`);
        const leagueMember = Array.isArray(memberResponse.data) ? memberResponse.data.find(member => member.league_id === currentLeague.league_id) : null;

        if (leagueMember && leagueMember.role === 'commish') {
          setLeagueMemberId(leagueMember.id);
          if (isActive) {
            setMessage('League is already activated.');
            setMessageType('error');
            setCanActivate(false);
          } else {
            setCanActivate(count >= 10);
            if (count < 10) {
              setMessage('League requires 10 members to activate.');
              setMessageType('error');
            }
          }
        } else {
          setMessage('Only the league commissioner can activate the league.');
          setMessageType('error');
          setCanActivate(false);
        }
      } catch (error) {
        console.error('ActivateLeague: Error checking league conditions:', error.response || error);
        setMessage('Error checking league conditions: ' + (error.response?.data?.message || error.message));
        setMessageType('error');
        setCanActivate(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkLeagueConditions();
  }, [currentUser, currentLeague]);

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
      const payload = {
        league_member_id: leagueMemberId,
        leagueMemberId: leagueMemberId, // Alternative key
        user_id: currentUser.id // Fallback
      };
      const response = await axiosInstance.post(`/leagues/activate/${currentLeague.league_id}`, payload);
      if (response.data.status !== 'success') {
        throw new Error(response.data.message || 'Failed to activate league');
      }
      setMessage('League activated successfully!');
      setMessageType('success');
      setCanActivate(false);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('ActivateLeague: Error activating league:', error.response || error);
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
            <p className="text-center mb-3" style={{ color: memberCount < 10 ? '#e74c3c' : '#2ecc71', fontFamily: 'Poppins, sans-serif', fontSize: '14px' }}>
              {memberCount < 10
                ? `League has ${memberCount} members. Need 10 members to activate.`
                : 'League has 10 members and is ready to activate.'}
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