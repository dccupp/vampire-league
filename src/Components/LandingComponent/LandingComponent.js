import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api';
import './LandingComponent.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const LandingComponent = ({ currentUser, setCurrentLeague, setIsCommissioner, getCachedMembership, getCachedLeague }) => {
  const [leagues, setLeagues] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser?.id) {
      const fetchLeagues = async () => {
        setIsDataLoading(true);
        try {
          const response = await getCachedMembership(currentUser.id);
          const memberships = Array.isArray(response) ? response : [];
          const filteredLeagues = memberships.filter(m => m.role === 'player' || m.role === 'commish');
          const filteredInvitations = memberships.filter(m => m.role === 'invited');
          setLeagues(filteredLeagues);
          setInvitations(filteredInvitations);
          setError('');
        } catch (err) {
          console.error('LandingComponent: Error fetching league memberships:', err);
          setError(err.response?.data?.message || 'Failed to load leagues. Please try again.');
          setLeagues([]);
          setInvitations([]);
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

  const handleSelectLeague = async (league) => {
    setIsLoading(true);
    setError('');
    try {
      const [leagueResponse, membershipResponse] = await Promise.all([
        getCachedLeague(league.league_id),
        axiosInstance.get(`/league_members/getLeagueMembersByUserId/${currentUser.id}`)
      ]);
      if (!leagueResponse || !leagueResponse.league_id) {
        throw new Error('Invalid league response data');
      }
      if (!Array.isArray(membershipResponse.data)) {
        throw new Error('Invalid membership response data');
      }
      setCurrentLeague(leagueResponse);
      localStorage.setItem('league', JSON.stringify(leagueResponse));
      const isCommish = membershipResponse.data.some(m => m.league_id === league.league_id && m.role === 'commish');
      setIsCommissioner(isCommish);
      navigate('/dashboard');
    } catch (err) {
      console.error('LandingComponent: Error selecting league:', err);
      setError(err.response?.data?.message || 'Failed to select league. Please try again.');
      setIsLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitation) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await axiosInstance.put(`/league_members/updateRole/${invitation.league_id}/${currentUser.id}`, {
        role: 'player'
      });
      if (response.data.status === 'success') {
        const updatedMemberships = await getCachedMembership(currentUser.id);
        const memberships = Array.isArray(updatedMemberships) ? updatedMemberships : [];
        setLeagues(memberships.filter(m => m.role === 'player' || m.role === 'commish'));
        setInvitations(memberships.filter(m => m.role === 'invited'));
        // Automatically select the league after accepting the invitation
        const acceptedLeague = memberships.find(m => m.league_id === invitation.league_id && m.user_id === currentUser.id);
        if (acceptedLeague) {
          const leagueResponse = await getCachedLeague(invitation.league_id);
          if (leagueResponse && leagueResponse.league_id) {
            setCurrentLeague(leagueResponse);
            localStorage.setItem('league', JSON.stringify(leagueResponse));
            setIsCommissioner(acceptedLeague.role === 'commish');
            navigate('/dashboard');
          } else {
            throw new Error('Failed to fetch league details after accepting invitation');
          }
        } else {
          throw new Error('Failed to find accepted league in memberships');
        }
      } else {
        setError(response.data.message || 'Failed to accept invitation.');
      }
    } catch (err) {
      console.error('LandingComponent: Error accepting invitation:', err);
      setError(err.response?.data?.message || 'Failed to accept invitation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="landing-container">
      <div className="landing-content animate__animated animate__fadeIn">
        <h2 className="text-center mb-4">Welcome to Vampire League Football</h2>
        {error && (
          <p className="error-message animate__animated animate__fadeIn">{error}</p>
        )}
        {isDataLoading ? (
          <p className="loading-message">Loading leagues...</p>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
};

export default LandingComponent;