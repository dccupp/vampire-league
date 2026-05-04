import { useState, useEffect } from 'react';
import { isAxiosError } from 'axios';
import axiosInstance from '../../../api';
import { CurrentUser, CurrentLeague } from '../../../types';
import './ActivateLeagueComponent.css';
import 'bootstrap/dist/css/bootstrap.min.css';

interface ActivateLeagueComponentProps {
  currentUser: CurrentUser;
  currentLeague: CurrentLeague;
}

const ActivateLeagueComponent = ({ currentUser, currentLeague }: ActivateLeagueComponentProps) => {
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<string>('');
  const [isMessageFading, setIsMessageFading] = useState<boolean>(false);
  const [leagueMemberId, setLeagueMemberId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [canActivate, setCanActivate] = useState<boolean>(false);
  const [memberCount, setMemberCount] = useState<number | null>(null);

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
    const checkLeagueConditions = async () => {
      if (!currentUser?.id || !currentLeague?.league_id) {
        setMessage('User or league data is missing. Please try again.');
        setMessageType('error');
        setCanActivate(false);
        setIsLoading(false);
        return;
      }

      try {
        const [membersResponse, leagueResponse, memberResponse] = await Promise.all([
          axiosInstance.get(`/league_members/getLeagueMembersByLeagueId/${currentLeague.league_id}`),
          axiosInstance.get(`/leagues/getLeagueById/${currentLeague.league_id}`),
          axiosInstance.get(`/league_members/getLeagueMembersByUserId/${currentUser.id}`),
        ]);

        const members = Array.isArray(membersResponse.data) ? membersResponse.data : [];
        const validMembers = members.filter(member => ['player', 'commish'].includes(member.role));
        const commishCount = members.filter(member => member.role === 'commish').length;
        const count = validMembers.length;
        setMemberCount(count);

        const isActive = leagueResponse.data.is_active;

        const leagueMember = Array.isArray(memberResponse.data)
          ? memberResponse.data.find(member => member.league_id === currentLeague.league_id)
          : null;

        if (!leagueMember || leagueMember.role !== 'commish') {
          setMessage('Only the league commissioner can activate the league.');
          setMessageType('error');
          setCanActivate(false);
        } else if (isActive) {
          setLeagueMemberId(leagueMember.id);
          setMessage('League is already activated.');
          setMessageType('error');
          setCanActivate(false);
        } else if (commishCount > 1) {
          setLeagueMemberId(leagueMember.id);
          setMessage('League has multiple commissioners. Only one commissioner is allowed.');
          setMessageType('error');
          setCanActivate(false);
        } else if (count !== 10) {
          setLeagueMemberId(leagueMember.id);
          setMessage(`League has ${count} valid members (player or commish). Need exactly 10.`);
          setMessageType('error');
          setCanActivate(false);
        } else {
          setLeagueMemberId(leagueMember.id);
          setCanActivate(true);
        }
      } catch (error) {
        const msg = isAxiosError(error)
          ? error.response?.data?.message || error.message
          : 'Error checking league conditions.';
        setMessage('Error checking league conditions: ' + msg);
        setMessageType('error');
        setCanActivate(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkLeagueConditions();
  }, [currentUser?.id, currentLeague?.league_id]);

  const handleActivateLeague = async (e: React.FormEvent<HTMLFormElement>) => {
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
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      const msg = isAxiosError(error)
        ? error.response?.data?.message || error.message
        : error instanceof Error ? error.message : 'Failed to activate league.';
      setMessage('Failed to activate league: ' + msg);
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
            <p
              className="text-center mb-3"
              style={{ color: memberCount !== 10 ? '#e74c3c' : '#2ecc71', fontFamily: 'Poppins, sans-serif', fontSize: '14px' }}
            >
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
          <button type="submit" className="btn btn-success w-100" disabled={isLoading || !canActivate}>
            {isLoading ? 'Activating...' : 'Activate League'}
          </button>
          <a href="/dashboard" className="activate-league-link">Back to Dashboard</a>
        </form>
      </div>
    </div>
  );
};

export default ActivateLeagueComponent;