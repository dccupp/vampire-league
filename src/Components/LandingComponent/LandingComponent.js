import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api'; // Use centralized axiosInstance
import './LandingComponent.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const LandingComponent = ({ currentUser, setCurrentLeague, setIsCommissioner, getCachedMembership, getCachedLeague }) => {
  const [leagues, setLeagues] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch user's league memberships
  useEffect(() => {
    if (currentUser?.id) {
      const fetchLeagues = async () => {
        setIsDataLoading(true);
        try {
          const response = await getCachedMembership(currentUser.id);
          const memberships = Array.isArray(response) ? response : [];
          setLeagues(memberships.filter(m => m.role === 'player' || m.role === 'commish'));
          setInvitations(memberships.filter(m => m.role === 'invited'));
          setError('');
        } catch (err) {
          console.error('LandingComponent: Error fetching league memberships:', err.response || err);
          if (err.response?.status === 404) {
            setLeagues([]);
            setInvitations([]);
            setError('');
          } else {
            setError(err.response?.data?.message || 'Failed to load leagues. Please try again.');
          }
        } finally {
          setIsDataLoading(false);
        }
      };
      fetchLeagues();
    } else {
      setError('User not logged in. Please log in to view leagues.');
      setLeagues([]);
      setIsDataLoading(false);
    }
  }, [currentUser, getCachedMembership]);

  // Handle league selection
  const handleSelectLeague = async (league) => {
    setIsLoading(true);
    setError('');
    try {
      const [leagueResponse, membershipResponse] = await Promise.all([
        getCachedLeague(league.league_id),
        getCachedMembership(currentUser.id)
      ]);
      const membership = membershipResponse.find(m => m.league_id === league.league_id);
      const selectedLeague = {
        league_id: leagueResponse.league_id,
        name: leagueResponse.name,
        role: membership?.role || 'player',
        is_active: leagueResponse.is_active || 0
      };
      localStorage.setItem('league', JSON.stringify(selectedLeague));
      setCurrentLeague(selectedLeague);
      setIsCommissioner(membership && membership.role === 'commish');
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to select league. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle accepting an invitation
  const handleAcceptInvitation = async (league) => {
    setIsLoading(true);
    setError('');
    try {
      const roleResponse = await axiosInstance.put(`/league_members/updateRole/${league.league_id}/${currentUser.id}`, { role: 'player' });
      if (roleResponse.data.status !== 'success') {
        throw new Error(roleResponse.data.message || 'Failed to accept invitation');
      }

      const teamName = currentUser.first_name ? `${currentUser.first_name}'s Team` : 'Default Team';
      const teamNameResponse = await axiosInstance.put(`/league_members/updateTeamName/${league.league_id}/${currentUser.id}`, { team_name: teamName });
      if (teamNameResponse.data.status !== 'success') {
        throw new Error(teamNameResponse.data.message || 'Failed to set team name');
      }

      setLeagues([...leagues, { ...league, role: 'player', team_name: teamName }]);
      setInvitations(invitations.filter(i => i.league_id !== league.league_id));
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || `Failed to accept invitation. Please verify the backend server is running at ${axiosInstance.defaults.baseURL}.`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isDataLoading) {
    return (
      <div className="landing-container">
        <div className="landing-content animate__animated animate__fadeIn">
          <p className="text-center">Loading leagues...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-container">
      <div className="landing-content animate__animated animate__fadeIn">
        <h3 className="text-center mb-4">Welcome, {currentUser?.first_name || 'User'}!</h3>
        {error && <p className="text-danger text-center">{error}</p>}

        <div className="section mb-4">
          <h4>Your Leagues</h4>
          {leagues.length > 0 ? (
            <ul className="league-list">
              {leagues.map((league) => (
                <li key={league.league_id} className="league-item">
                  <span
                    className={`league-link ${isLoading ? 'disabled' : ''}`}
                    style={{ cursor: isLoading ? 'not-allowed' : 'pointer' }}
                    onClick={() => !isLoading && handleSelectLeague(league)}
                  >
                    {league.name} ({league.role === 'commish' ? 'Commissioner' : 'Member'}{league.is_vamp ? ', Vampire Player' : ''})
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-data">You are not a member of any leagues yet.</p>
          )}
        </div>

        <div className="section mb-4">
          <h4>League Invitations</h4>
          {invitations.length > 0 ? (
            <ul className="league-list">
              {invitations.map((invitation) => (
                <li key={invitation.league_id} className="league-item">
                  <button
                    className={`league-link ${isLoading ? 'disabled' : ''}`}
                    style={{ cursor: isLoading ? 'not-allowed' : 'pointer', background: 'none', border: 'none', padding: 0, textAlign: 'left' }}
                    onClick={() => !isLoading && handleAcceptInvitation(invitation)}
                    disabled={isLoading}
                  >
                    {invitation.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-data">No pending invitations.</p>
          )}
        </div>

        {currentUser?.email_address === 'dccupp@gmail.com' && (
          <div className="section">
            <h4>Create a New League</h4>
            <Link
              to="/create-league"
              state={{ currentUser }}
              className={`btn btn-success w-100 ${isLoading ? 'disabled' : ''}`}
            >
              Create League
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingComponent;