import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import axiosInstance from '../../api';
import { CurrentUser, CurrentLeague, LeagueMember, League } from '../../types';
import { useUser } from '../../context/UserContext';
import { useLeague } from '../../context/LeagueContext';
import './LandingComponent.css';

const LandingComponent = () => {
  const { currentUser } = useUser();
  const { setCurrentLeague, setIsCommissioner, getCachedMembership, getCachedLeague } = useLeague();
  const [leagues, setLeagues] = useState<LeagueMember[]>([]);
  const [invitations, setInvitations] = useState<LeagueMember[]>([]);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser?.id) {
      setError('User not logged in. Please log in to view leagues.');
      setLeagues([]);
      setIsDataLoading(false);
      return;
    }

    const fetchLeagues = async () => {
      setIsDataLoading(true);
      try {
        const memberships = await getCachedMembership(currentUser.id);
        const list = Array.isArray(memberships) ? memberships : [];
        setLeagues(list.filter(m => m.role === 'player' || m.role === 'commish'));
        setInvitations(list.filter(m => m.role === 'invited'));
        setError('');
      } catch (err) {
        const msg = isAxiosError(err)
          ? err.response?.data?.message || err.message
          : 'Failed to load leagues. Please try again.';
        console.error('LandingComponent: Error fetching league memberships:', err);
        setError(msg);
        setLeagues([]);
        setInvitations([]);
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchLeagues();
  }, [currentUser?.id, getCachedMembership]);

  const handleSelectLeague = async (league: LeagueMember) => {
    setIsLoading(true);
    setError('');
    if(!currentUser) return;
    
    try {
      const [leagueResponse, membershipResponse] = await Promise.all([
        getCachedLeague(league.league_id),
        getCachedMembership(currentUser.id),
      ]);

      if (!leagueResponse?.league_id) {
        throw new Error('Invalid league response data');
      }
      if (!Array.isArray(membershipResponse)) {
        throw new Error('Invalid membership response data');
      }

      setCurrentLeague(leagueResponse);
      localStorage.setItem('league', JSON.stringify(leagueResponse));
      const isCommish = membershipResponse.some(
        (m: LeagueMember) => m.league_id === league.league_id && m.role === 'commish'
      );
      setIsCommissioner(isCommish);
      navigate('/dashboard');
    } catch (err) {
      const msg = isAxiosError(err)
        ? err.response?.data?.message || err.message
        : err instanceof Error ? err.message : 'Failed to select league. Please try again.';
      console.error('LandingComponent: Error selecting league:', err);
      setError(msg);
      setIsLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitation: LeagueMember) => {
    setIsLoading(true);
    setError('');
    if(!currentUser) return;

    try {
      const leagueMemberResponse = await axiosInstance.get(
        `/league_members/getLeagueMemberByLeagueAndUserId/${invitation.league_id}/${currentUser.id}`
      );
      if (!leagueMemberResponse.data) {
        throw new Error('Invalid league member response data');
      }
      const rosterTypeId = leagueMemberResponse.data.is_vamp ? 2 : 1;

      const [roleResponse, teamNameResponse, rosterRulesResponse] = await Promise.all([
        axiosInstance.put(`/league_members/updateRole/${invitation.league_id}/${currentUser.id}`, {
          role: 'player',
        }),
        axiosInstance.put(`/league_members/updateTeamName/${invitation.league_id}/${currentUser.id}`, {
          team_name: `Team ${currentUser.first_name ?? currentUser.id}`,
        }),
        axiosInstance.get(`/roster_rules/getRosterRulesByLeagueId/${invitation.league_id}/${rosterTypeId}`),
      ]);

      if (roleResponse.data.status !== 'success') {
        throw new Error(roleResponse.data.message || 'Failed to accept invitation.');
      }
      if (teamNameResponse.data.status !== 'success') {
        throw new Error(teamNameResponse.data.message || 'Failed to set team name.');
      }
      if (!rosterRulesResponse.data || typeof rosterRulesResponse.data.beginning_faab !== 'number') {
        throw new Error(`Roster rules for roster_type_id=${rosterTypeId} not found or invalid beginning_faab.`);
      }

      const faabResponse = await axiosInstance.put(
        `/league_members/updateRemainingFaabBudget/${invitation.league_id}/${currentUser.id}`,
        { remaining_faab_budget: rosterRulesResponse.data.beginning_faab }
      );
      if (faabResponse.data.status !== 'success') {
        throw new Error(faabResponse.data.message || 'Failed to set FAAB budget.');
      }

      const [updatedMemberships, leagueResponse] = await Promise.all([
        getCachedMembership(currentUser.id),
        getCachedLeague(invitation.league_id),
      ]);

      const memberships = Array.isArray(updatedMemberships) ? updatedMemberships : [];
      setLeagues(memberships.filter(m => m.role === 'player' || m.role === 'commish'));
      setInvitations(memberships.filter(m => m.role === 'invited'));

      const acceptedLeague = memberships.find(
        m => m.league_id === invitation.league_id && m.user_id === currentUser.id
      );
      if (!acceptedLeague) {
        throw new Error('Failed to find accepted league in memberships');
      }
      if (!leagueResponse?.league_id) {
        throw new Error('Failed to fetch league details after accepting invitation');
      }

      setCurrentLeague(leagueResponse);
      localStorage.setItem('league', JSON.stringify(leagueResponse));
      setIsCommissioner(acceptedLeague.role === 'commish');
      navigate('/dashboard');
    } catch (err) {
      const msg = isAxiosError(err)
        ? err.response?.data?.message || err.message
        : err instanceof Error ? err.message : 'Failed to accept invitation. Please try again.';
      console.error('LandingComponent: Error accepting invitation:', err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDenyInvitation = async (invitation: LeagueMember) => {
    setIsLoading(true);
    setError('');
    if(!currentUser) return;

    try {
      const response = await axiosInstance.put(
        `/league_members/updateRole/${invitation.league_id}/${currentUser.id}`,
        { role: 'declined' }
      );
      if (response.data.status === 'success') {
        const updatedMemberships = await getCachedMembership(currentUser.id);
        const memberships = Array.isArray(updatedMemberships) ? updatedMemberships : [];
        setLeagues(memberships.filter(m => m.role === 'player' || m.role === 'commish'));
        setInvitations(memberships.filter(m => m.role === 'invited'));
      } else {
        setError(response.data.message || 'Failed to decline invitation.');
      }
    } catch (err) {
      const msg = isAxiosError(err)
        ? err.response?.data?.message || err.message
        : 'Failed to decline invitation. Please try again.';
      console.error('LandingComponent: Error declining invitation:', err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="lc-container">
      <div className="lc-card animate__animated animate__fadeIn">
        <h2 className="lc-title">Welcome to Vampire League Football</h2>
        {error && (
          <p className="lc-error animate__animated animate__fadeIn">{error}</p>
        )}
        {isDataLoading ? (
          <p className="lc-loading">Loading leagues...</p>
        ) : (
          <>
            <div className="lc-section">
              <h4 className="lc-section-title">Your Leagues</h4>
              {leagues.length > 0 ? (
                <ul className="lc-list">
                  {leagues.map(league => (
                    <li key={league.league_id} className="lc-list-item">
                      <span
                        className={`lc-league-link${isLoading ? ' disabled' : ''}`}
                        onClick={() => !isLoading && handleSelectLeague(league)}
                      >
                        {league.name} ({league.role === 'commish' ? 'Commissioner' : 'Member'}{league.is_vamp ? ', Vampire Player' : ''})
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="lc-no-data">You are not a member of any leagues yet.</p>
              )}
            </div>

            <div className="lc-section">
              <h4 className="lc-section-title">League Invitations</h4>
              {invitations.length > 0 ? (
                <ul className="lc-list">
                  {invitations.map(invitation => (
                    <li key={invitation.league_id} className="lc-list-item lc-invitation-row">
                      <span className="lc-invitation-name">{invitation.name}</span>
                      <button
                        className="lc-btn-accept"
                        onClick={() => !isLoading && handleAcceptInvitation(invitation)}
                        disabled={isLoading}
                      >
                        Accept
                      </button>
                      <button
                        className="lc-btn-decline"
                        onClick={() => !isLoading && handleDenyInvitation(invitation)}
                        disabled={isLoading}
                      >
                        Decline
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="lc-no-data">No pending invitations.</p>
              )}
            </div>

            {currentUser?.email_address === 'dccupp@gmail.com' && (
              <div className="lc-section">
                <h4 className="lc-section-title">Create a New League</h4>
                <Link
                  to="/create-league"
                  state={{ currentUser }}
                  className={`lc-btn-create${isLoading ? ' disabled' : ''}`}
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
