import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../api';
import './ActivateLeagueComponent.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const ActivateLeagueComponent = ({ currentUser, currentLeague }) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [canActivate, setCanActivate] = useState(false);
  const [memberCount, setMemberCount] = useState(null);
  const [leagueMemberId, setLeagueMemberId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkLeagueConditions = async () => {
      if (!currentUser?.id || !currentLeague?.league_id) {
        console.error('ActivateLeague: Missing currentUser.id or currentLeague.league_id', { currentUser, currentLeague });
        setMessage('User or league data is missing. Please try again.');
        setCanActivate(false);
        return;
      }

      try {
        const membersResponse = await axiosInstance.get(`/league_members/getLeagueMembersByLeagueId/${currentLeague.league_id}`);
        const count = membersResponse.data.length;
        setMemberCount(count);
        console.log('ActivateLeague: Member count', count);

        const leagueResponse = await axiosInstance.get(`/leagues/getLeagueById/${currentLeague.league_id}`);
        const isActive = leagueResponse.data.is_active;
        console.log('ActivateLeague: League is_active', isActive);

        const memberResponse = await axiosInstance.get(`/league_members/getLeagueMembersByUserId/${currentUser.id}`);
        const leagueMember = memberResponse.data.find(member => member.league_id === currentLeague.league_id);
        console.log('ActivateLeague: League member', leagueMember);

        if (leagueMember && leagueMember.role === 'commish') {
          setLeagueMemberId(leagueMember.id);
          if (isActive) {
            setMessage('League is already activated.');
            setCanActivate(false);
          } else {
            setCanActivate(count >= 10);
            if (count < 10) {
              setMessage('League requires 10 members to activate.');
            }
          }
        } else {
          setMessage('Only the league commissioner can activate the league.');
          setCanActivate(false);
        }
      } catch (error) {
        console.error('ActivateLeague: Error checking league conditions:', error.response || error);
        setMessage('Error checking league conditions. Please try again.');
        setCanActivate(false);
      }
    };
    checkLeagueConditions();
  }, [currentUser, currentLeague]);

  const handleActivateLeague = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    try {
      const response = await axiosInstance.post(`/leagues/activate/${currentLeague.league_id}`, {
        league_member_id: leagueMemberId
      });
      if (response.data.status !== 'success') {
        throw new Error(response.data.message || 'Failed to activate league');
      }

      setMessage('League activated successfully!');
      setCanActivate(false);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('ActivateLeague: Error activating league:', error.response || error);
      setMessage(error.message || `Error activating league. Please verify the backend server is running at ${axiosInstance.defaults.baseURL}.`);
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
            <p className={`message mt-3 ${message.includes('successfully') ? 'success' : 'error'}`}>
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

export default ActivateLeagueComponent;