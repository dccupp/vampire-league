import { useState, useEffect, FormEvent } from 'react';
import { isAxiosError } from 'axios';
import axiosInstance from '../../../api';

import { useUser } from '../../../context/UserContext';
import { useLeague } from '../../../context/LeagueContext';

import './ActivateLeagueComponent.css';

const ActivateLeagueComponent = () => {
  const { currentUser } = useUser();
  const { currentLeague, setCurrentLeague, leagueMembers, currentLeagueMember, isCommissioner } = useLeague();
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<string>('');
  const [isMessageFading, setIsMessageFading] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [canActivate, setCanActivate] = useState<boolean>(false);

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
    const checkLeagueConditions = () => {
      if (!currentUser?.id || !currentLeague?.league_id) {
        setMessage('User or league data is missing. Please try again.');
        setMessageType('error');
        setCanActivate(false);
        setIsLoading(false);
        return;
      }

      const members = Array.isArray(leagueMembers) ? leagueMembers : [];
      const validMembers = members.filter(member => ['player', 'commish'].includes(member.role));
      const commishCount = members.filter(member => member.role === 'commish').length;

      const isActive = currentLeague.is_active;

      if (!isCommissioner) {
        setMessage('Only the league commissioner can activate the league.');
        setMessageType('error');
        setCanActivate(false);
      } else if (isActive) {
        setMessage('League is already activated.');
        setMessageType('error');
        setCanActivate(false);
      } else if (commishCount > 1) {
        setMessage('League has multiple commissioners. Only one commissioner is allowed.');
        setMessageType('error');
        setCanActivate(false);
      } else if (validMembers.length !== 10) {
        setMessage(`League has ${validMembers.length} valid members (player or commish). Need exactly 10.`);
        setMessageType('error');
        setCanActivate(false);
      } else {
        setCanActivate(true);
      }
    };

    checkLeagueConditions();
  }, [currentUser?.id, currentLeague?.league_id, leagueMembers, isCommissioner]);

  const handleActivateLeague = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (currentLeagueMember?.league_id !== currentLeague?.league_id) {
      setMessage('Cannot activate league: User is not a member.');
      setMessageType('error');
      return;
    }
    setMessage('');
    setIsLoading(true);

    try {
      const response = await axiosInstance.post(`/leagues/activate/${currentLeague?.league_id}/${currentLeagueMember?.id}`, {});
      if (response.data.status !== 'success') {
        throw new Error(response.data.message || 'Failed to activate league');
      }
      setMessage('League activated successfully!');
      setMessageType('success');
      setCanActivate(false);
      if(currentLeague) {
        setCurrentLeague({ ...currentLeague, is_active: true });
      }
    } catch (error) {
      console.error('ActivateLeagueComponent: Error activating league:', error);
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
    <div className="alc-container">
      <div className="alc-card animate__animated animate__fadeIn">
        <h3 className="alc-title">Activate League</h3>
        <form onSubmit={handleActivateLeague}>
          {message && (
            <p className={`alc-message ${messageType} animate__animated ${isMessageFading ? 'animate__fadeOut' : 'animate__fadeIn'}`}>
              {message}
            </p>
          )}
          <button type="submit" className="alc-submit-btn" disabled={isLoading || !canActivate}>
            {isLoading ? 'Activating...' : 'Activate League'}
          </button>
        </form>
        <a href="/dashboard" className="alc-back-link">Back to Dashboard</a>
      </div>
    </div>
  );
};

export default ActivateLeagueComponent;
