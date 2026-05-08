import { useState, useEffect, useMemo } from 'react';
import { isAxiosError } from 'axios';
import axiosInstance from '../../api';
import { CurrentUser, CurrentLeague, LeagueMember, RosteredPlayer, WaiverClaim, Player } from '../../types';
import WaiverClaimFormComponent from '../WaiverClaimFormComponent/WaiverClaimFormComponent';
import './ActiveWaiverClaimsComponent.css';

interface ActiveWaiverClaimsProps {
  currentUser: CurrentUser;
  currentLeague: CurrentLeague;
}

type RosterEntry = RosteredPlayer & {
  name: string;
  playingPosition: string;
  league_member: LeagueMember;
};

type EnrichedWaiverClaim = WaiverClaim & {
  player_name: string;
  rostered_player_to_drop_name: string;
};

interface SelectedClaimPlayer {
  player_id: number;
  player_name: string | null;
  position: string;
  team: string;
}

interface SelectedClaim {
  id: number;
  player: SelectedClaimPlayer;
  faab_claim_amount: number;
  rostered_player_to_drop: number | null;
  rostered_player_to_drop_name: string;
}

const ActiveWaiverClaimsComponent = ({ currentUser, currentLeague }: ActiveWaiverClaimsProps) => {
  const [waiverClaims, setWaiverClaims] = useState<WaiverClaim[]>([]);
  const [leagueMember, setLeagueMember] = useState<LeagueMember | null>(null);
  const [playerNames, setPlayerNames] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedClaim, setSelectedClaim] = useState<SelectedClaim | null>(null);
  const [userRoster, setUserRoster] = useState<RosterEntry[]>([]);

  useEffect(() => {
    const fetchLeagueMember = async () => {
      if (!currentUser?.id || !currentLeague?.league_id) {
        setError('Missing user or league information');
        setIsLoading(false);
        return;
      }
      try {
        const response = await axiosInstance.get(
          `/league_members/getLeagueMembersByUserId/${currentUser.id}`
        );
        const member: LeagueMember | undefined = Array.isArray(response.data)
          ? response.data.find((m: LeagueMember) => m.league_id === currentLeague.league_id)
          : undefined;
        if (member) {
          setLeagueMember(member);
        } else {
          setError('User is not a member of this league');
        }
      } catch (err: unknown) {
        setError(
          isAxiosError(err)
            ? err.response?.data?.message || 'Failed to load league member data'
            : 'Failed to load league member data'
        );
      }
      setIsLoading(false);
    };
    fetchLeagueMember();
  }, [currentUser?.id, currentLeague?.league_id]);

  const fetchPlayerNames = async (claims: WaiverClaim[]) => {
    type PlayerRef = { type: 'player' | 'rostered'; id: number };
    const idList: PlayerRef[] = [];
    claims.forEach(claim => {
      if (claim.player_id) idList.push({ type: 'player', id: claim.player_id });
      if (claim.rostered_player_to_drop)
        idList.push({ type: 'rostered', id: claim.rostered_player_to_drop });
    });

    const namePromises = idList.map(async ({ type, id }): Promise<{ id: number; name: string }> => {
      try {
        if (type === 'rostered') {
          const rosterResponse = await axiosInstance.get(
            `/rostered_players/getRosteredPlayerById/${id}`
          );
          if (rosterResponse.data?.player_id) {
            const playerResponse = await axiosInstance.get(
              `/players/getPlayerById/${rosterResponse.data.player_id}`
            );
            return { id, name: playerResponse.data.player_name || 'Unknown Player' };
          }
          return { id, name: 'Unknown Player' };
        } else {
          const playerResponse = await axiosInstance.get(`/players/getPlayerById/${id}`);
          return { id, name: playerResponse.data.player_name || 'Unknown Player' };
        }
      } catch {
        return { id, name: 'Unknown Player' };
      }
    });

    const names = await Promise.all(namePromises);
    setPlayerNames(names.reduce<Record<number, string>>((acc, { id, name }) => ({ ...acc, [id]: name }), {}));
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!leagueMember?.id) return;
      try {
        const [claimsResponse, rosterResponse] = await Promise.all([
          axiosInstance.get(
            `/waiver_claims/getWaiverClaimsByLeagueMemberId/${leagueMember.id}`,
            { params: { is_active: 1 } }
          ),
          axiosInstance.get(
            `/rostered_players/getRosteredPlayersByLeagueMemberId/${leagueMember.id}`
          ),
        ]);

        const claims: WaiverClaim[] = Array.isArray(claimsResponse.data)
          ? claimsResponse.data
          : [];
        setWaiverClaims(claims);

        const rosteredPlayers: RosterEntry[] = Array.isArray(rosterResponse.data)
          ? rosterResponse.data
              .filter((r: RosteredPlayer) => r.is_rostered)
              .map((p: RosteredPlayer) => ({
                ...p,
                name: p.player_name,
                playingPosition: p.position,
                league_member: leagueMember,
              }))
          : [];
        setUserRoster(rosteredPlayers);

        await fetchPlayerNames(claims);

        if (claims.length === 0) {
          setError('No active waiver claims found');
        }
      } catch (err: unknown) {
        setError(
          isAxiosError(err)
            ? err.response?.data?.message || 'Failed to load waiver claims'
            : 'Failed to load waiver claims'
        );
      }
    };
    fetchData();
  }, [leagueMember, currentLeague?.league_id]);

  const handleClaimSuccess = async () => {
    setSelectedClaim(null);
    try {
      const response = await axiosInstance.get(
        `/waiver_claims/getWaiverClaimsByLeagueMemberId/${leagueMember!.id}`,
        { params: { is_active: 1 } }
      );
      const claims: WaiverClaim[] = Array.isArray(response.data) ? response.data : [];
      setWaiverClaims(claims);
      await fetchPlayerNames(claims);
    } catch (err: unknown) {
      setError(
        isAxiosError(err)
          ? err.response?.data?.message || 'Failed to refresh waiver claims'
          : 'Failed to refresh waiver claims'
      );
    }
  };

  const handleDeleteClaim = async (claimId: number) => {
    try {
      const response = await axiosInstance.delete(`/waiver_claims/delete/${claimId}`);
      if (response.data.status === 'success') {
        const claimsResponse = await axiosInstance.get(
          `/waiver_claims/getWaiverClaimsByLeagueMemberId/${leagueMember!.id}`,
          { params: { is_active: 1 } }
        );
        const claims: WaiverClaim[] = Array.isArray(claimsResponse.data) ? claimsResponse.data : [];
        setWaiverClaims(claims);
        await fetchPlayerNames(claims);
      } else {
        setError(response.data.message || 'Failed to delete waiver claim');
      }
    } catch (err: unknown) {
      setError(
        isAxiosError(err)
          ? err.response?.data?.message || 'Failed to delete waiver claim'
          : 'Failed to delete waiver claim'
      );
    }
  };

  const handleEditClaim = async (claim: EnrichedWaiverClaim) => {
    try {
      const playerResponse = await axiosInstance.get(`/players/getPlayerById/${claim.player_id}`);
      const playerData = playerResponse.data || {};
      setSelectedClaim({
        id: claim.id,
        player: {
          player_id: claim.player_id,
          player_name: claim.player_name,
          position: playerData.position || 'Unknown',
          team: playerData.team || 'Unknown',
        },
        faab_claim_amount: claim.faab_claim_amount,
        rostered_player_to_drop: claim.rostered_player_to_drop,
        rostered_player_to_drop_name: claim.rostered_player_to_drop_name,
      });
    } catch (err: unknown) {
      setError(
        isAxiosError(err)
          ? err.response?.data?.message || 'Failed to load player details for editing'
          : 'Failed to load player details for editing'
      );
    }
  };

  const claimsWithNames = useMemo((): EnrichedWaiverClaim[] => {
    return waiverClaims.map(claim => ({
      ...claim,
      player_name: playerNames[claim.player_id] || 'Unknown Player',
      rostered_player_to_drop_name: claim.rostered_player_to_drop
        ? playerNames[claim.rostered_player_to_drop] || 'Unknown Player'
        : 'None',
    }));
  }, [waiverClaims, playerNames]);

  if (isLoading) {
    return <div className="awc-container">Loading waiver claims...</div>;
  }

  return (
    <div className="awc-container animate__animated animate__fadeIn">
      <div className="awc-header">
        <h2 className="awc-title">
          {currentLeague?.name ? `${currentLeague.name} Active Waiver Claims` : 'Active Waiver Claims'}
        </h2>
      </div>
      {error && <div className="awc-error-message">{error}</div>}
      <div className="awc-table-wrapper">
        <table className="awc-table">
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
                  const pa =
                    a.league_member_priority != null ? a.league_member_priority : Infinity;
                  const pb =
                    b.league_member_priority != null ? b.league_member_priority : Infinity;
                  return pa - pb;
                })
                .map((claim, index) => (
                  <tr
                    key={claim.id || index}
                    className="awc-row"
                    onClick={() => handleEditClaim(claim)}
                  >
                    <td>{claim.player_name}</td>
                    <td>${claim.faab_claim_amount || 0}</td>
                    <td>{claim.rostered_player_to_drop_name}</td>
                    <td>
                      <button
                        className="awc-delete-btn"
                        onClick={e => {
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
                <td colSpan={4} className="awc-empty-message">
                  No active waiver claims available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {selectedClaim && (
        <WaiverClaimFormComponent
          player={selectedClaim.player as unknown as Player}
          league_member={leagueMember as LeagueMember}
          userRoster={userRoster}
          onClose={() => setSelectedClaim(null)}
          onClaimSuccess={handleClaimSuccess}
          claim={selectedClaim as unknown as WaiverClaim}
        />
      )}
    </div>
  );
};

export default ActiveWaiverClaimsComponent;