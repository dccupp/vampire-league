import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api';
import WaiverClaimFormComponent from '../WaiverClaimFormComponent/WaiverClaimFormComponent';
import './ActiveWaiverClaimsComponent.css';

const ActiveWaiverClaimsComponent = ({ currentUser, currentLeague }) => {
  const [waiverClaims, setWaiverClaims] = useState([]);
  const [leagueMember, setLeagueMember] = useState(null);
  const [playerNames, setPlayerNames] = useState({});
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [userRoster, setUserRoster] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeagueMember = async () => {
      if (!currentUser?.id || !currentLeague?.league_id) {
        setError('Missing user or league information');
        setIsLoading(false);
        return;
      }

      try {
        const response = await axiosInstance.get(`/league_members/getLeagueMembersByUserId/${currentUser.id}`);
        const member = Array.isArray(response.data) ? response.data.find(m => m.league_id === currentLeague.league_id) : null;
        if (member) {
          setLeagueMember(member);
        } else {
          setError('User is not a member of this league');
        }
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to load league member data');
      }
      setIsLoading(false);
    };

    fetchLeagueMember();
  }, [currentUser?.id, currentLeague?.league_id]);

  const fetchPlayerNames = async (claims) => {
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
            const playerResponse = await axiosInstance.get(`/players/getPlayerById/${rosterResponse.data.player_id}`);
            return { id, name: playerResponse.data.player_name || 'Unknown Player' };
          }
        } else {
          const playerResponse = await axiosInstance.get(`/players/getPlayerById/${id}`);
          return { id, name: playerResponse.data.player_name || 'Unknown Player' };
        }
      } catch {
        return { id, name: 'Unknown Player' };
      }
    });

    const names = await Promise.all(namePromises);
    setPlayerNames(names.reduce((acc, { id, name }) => ({ ...acc, [id]: name }), {}));
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!leagueMember?.id) return;

      try {
        const [claimsResponse, rosterResponse] = await Promise.all([
          axiosInstance.get(`/waiver_claims/getWaiverClaimsByLeagueMemberId/${leagueMember.id}`, {
            params: { is_active: 1 }
          }),
          axiosInstance.get(`/rostered_players/getRosteredPlayersByLeagueMemberId/${leagueMember.id}`)
        ]);

        const claims = Array.isArray(claimsResponse.data) ? claimsResponse.data : [];
        setWaiverClaims(claims);

        const rosteredPlayers = Array.isArray(rosterResponse.data)
          ? rosterResponse.data
              .filter(r => r.is_rostered === 1)
              .map(p => ({
                ...p,
                name: p.player_name,
                playingPosition: p.position,
                league_member: leagueMember
              }))
          : [];
        setUserRoster(rosteredPlayers);

        await fetchPlayerNames(claims);

        if (claims.length === 0) {
          setError('No active waiver claims found');
        }
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to load waiver claims');
      }
    };

    fetchData();
  }, [leagueMember, currentLeague?.league_id]);

  const handleClaimSuccess = async () => {
    setSelectedClaim(null);
    try {
      const response = await axiosInstance.get(`/waiver_claims/getWaiverClaimsByLeagueMemberId/${leagueMember.id}`, {
        params: { is_active: 1 }
      });
      const claims = Array.isArray(response.data) ? response.data : [];
      setWaiverClaims(claims);
      await fetchPlayerNames(claims);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to refresh waiver claims');
    }
  };

  const handleDeleteClaim = async (claimId) => {
    try {
      const response = await axiosInstance.delete(`/waiver_claims/delete/${claimId}`);
      if (response.data.status === 'success') {
        const claimsResponse = await axiosInstance.get(`/waiver_claims/getWaiverClaimsByLeagueMemberId/${leagueMember.id}`, {
          params: { is_active: 1 }
        });
        const claims = Array.isArray(claimsResponse.data) ? claimsResponse.data : [];
        setWaiverClaims(claims);
        await fetchPlayerNames(claims);
      } else {
        setError(response.data.message || 'Failed to delete waiver claim');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete waiver claim');
    }
  };

  const handleEditClaim = async (claim) => {
    try {
      const playerResponse = await axiosInstance.get(`/players/getPlayerById/${claim.player_id}`);
      const playerData = playerResponse.data || {};
      setSelectedClaim({
        id: claim.id,
        player: {
          player_id: claim.player_id,
          player_name: claim.player_name,
          position: playerData.position || 'Unknown',
          team: playerData.team || 'Unknown'
        },
        faab_claim_amount: claim.faab_claim_amount,
        rostered_player_to_drop: claim.rostered_player_to_drop,
        rostered_player_to_drop_name: claim.rostered_player_to_drop_name
      });
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load player details for editing');
    }
  };

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
      <div className="header-container">
        <h2 className="active-waiver-claims-title">{currentLeague?.name ? `${currentLeague.name} Active Waiver Claims` : 'Active Waiver Claims'}</h2>
        {/* <button className="manage-priorities-btn" onClick={() => navigate('/manage-waiver-priority')}>
          Manage Priorities
        </button> */}
      </div>
      {error && <div className="error-message">{error}</div>}
      <div className="table-wrapper">
        <table className="waiver-claims-table">
          <thead>
            <tr>
              <th>Player</th>
              <th>FAAB Bid ($)</th>
              <th>Player to Drop</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {claimsWithNames.length > 0 ? (
              [...claimsWithNames]
                .sort((a, b) => {
                  const pa = a.league_member_priority !== undefined && a.league_member_priority !== null ? a.league_member_priority : Infinity;
                  const pb = b.league_member_priority !== undefined && b.league_member_priority !== null ? b.league_member_priority : Infinity;
                  return pa - pb;
                })
                .map((claim, index) => (
                  <tr
                    key={claim.id || index}
                    className="waiver-claim-row"
                    onClick={() => handleEditClaim(claim)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{claim.player_name}</td>
                    <td>${claim.faab_claim_amount || 0}</td>
                    <td>{claim.rostered_player_to_drop_name}</td>
                    <td>
                      <button
                        className="delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClaim(claim.id);
                        }}
                      >
                        Delete Claim
                      </button>
                    </td>
                  </tr>
                ))
            ) : (
              <tr>
                <td colSpan="4" className="empty-message">No active waiver claims available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {selectedClaim && (
        <WaiverClaimFormComponent
          player={selectedClaim.player}
          league_member={leagueMember}
          userRoster={userRoster}
          onClose={() => setSelectedClaim(null)}
          onClaimSuccess={handleClaimSuccess}
          claim={selectedClaim}
        />
      )}
    </div>
  );
};

export default ActiveWaiverClaimsComponent;