import React, { useState, useEffect, useMemo } from 'react';
import axiosInstance from '../../api';
import './ActiveWaiverClaimsComponent.css';

const ActiveWaiverClaimsComponent = ({ currentUser, currentLeague }) => {
  const [waiverClaims, setWaiverClaims] = useState([]);
  const [leagueMemberId, setLeagueMemberId] = useState(null);
  const [playerNames, setPlayerNames] = useState({});
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeagueMemberId = async () => {
      if (!currentUser?.id || !currentLeague?.league_id) {
        setError('Missing user or league information');
        setIsLoading(false);
        return;
      }

      try {
        const response = await axiosInstance.get(`/league_members/getLeagueMembersByUserId/${currentUser.id}`);
        const member = Array.isArray(response.data) ? response.data.find(m => m.league_id === currentLeague.league_id) : null;
        if (member) {
          setLeagueMemberId(member.id);
        } else {
          setError('User is not a member of this league');
        }
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to load league member data');
      }
      setIsLoading(false);
    };

    fetchLeagueMemberId();
  }, [currentUser?.id, currentLeague?.league_id]);

  useEffect(() => {
    const fetchActiveWaiverClaims = async () => {
      if (!leagueMemberId) return;

      try {
        const response = await axiosInstance.get(`/waiver_claims/getWaiverClaimsByLeagueMemberId/${leagueMemberId}`, {
          params: { is_active: 1 }
        });
        const claims = Array.isArray(response.data) ? response.data : [];
        setWaiverClaims(claims);

        const ids = new Set();
        claims.forEach(claim => {
          if (claim.player_id) ids.add({ type: 'player', id: claim.player_id });
          if (claim.rostered_player_to_drop) ids.add({ type: 'rostered', id: claim.rostered_player_to_drop });
        });

        const namePromises = Array.from(ids).map(async ({ type, id }) => {
          try {
            if (type === 'rostered') {
              const rosterResponse = await axiosInstance.post('/rostered_players/getRosteredPlayerById', { id });
              if (rosterResponse.data?.player_id) {
                const playerResponse = await axiosInstance.post('/players/getPlayerById', { player_id: rosterResponse.data.player_id });
                return { id, name: playerResponse.data.player_name || 'Unknown Player' };
              }
            } else {
              const playerResponse = await axiosInstance.post('/players/getPlayerById', { player_id: id });
              return { id, name: playerResponse.data.player_name || 'Unknown Player' };
            }
          } catch {
            return { id, name: 'Unknown Player' };
          }
        });

        const names = await Promise.all(namePromises);
        setPlayerNames(names.reduce((acc, { id, name }) => ({ ...acc, [id]: name }), {}));

        if (claims.length === 0) {
          setError('No active waiver claims found');
        }
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to load waiver claims');
      }
    };

    fetchActiveWaiverClaims();
  }, [leagueMemberId]);

  const claimsWithNames = useMemo(() => {
    return waiverClaims.map(claim => ({
      ...claim,
      player_name: playerNames[claim.player_id] || 'Unknown Player',
      rostered_player_to_drop_name: claim.rostered_player_to_drop ? playerNames[claim.rostered_player_to_drop] || 'Unknown Player' : 'None'
    }));
  }, [waiverClaims, playerNames]);

  if (isLoading) {
    return <div className="active-waiver-claims-container">Loading waiver claims...</div>;
  }

  return (
    <div className="active-waiver-claims-container animate__animated animate__fadeIn">
      <h2 className="active-waiver-claims-title">{currentLeague?.name ? `${currentLeague.name} Active Waiver Claims` : 'Active Waiver Claims'}</h2>
      {error && <div className="error-message">{error}</div>}
      <div className="table-wrapper">
        <table className="waiver-claims-table">
          <thead>
            <tr>
              <th>Player</th>
              <th>FAAB Bid ($)</th>
              <th>Player to Drop</th>
            </tr>
          </thead>
          <tbody>
            {claimsWithNames.length > 0 ? (
              claimsWithNames.map((claim, index) => (
                <tr key={claim.id || index} className="waiver-claim-row">
                  <td>{claim.player_name}</td>
                  <td>${claim.faab_claim_amount || 0}</td>
                  <td>{claim.rostered_player_to_drop_name}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="empty-message">No active waiver claims available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActiveWaiverClaimsComponent;