import { useState, useEffect } from 'react';
import axiosInstance from '../../api';
import { LeagueMember, RosterRules } from '../../types';
import './DirectAddPlayerComponent.css';

interface DirectAddPlayer {
  id: number | string;
  player_id?: string;
  player_name?: string | null;
  name?: string;
  position?: string | null;
  team?: string | null;
  playingPosition?: string;
}

interface RosterEntry {
  id: number | string;
  player_id?: string;
  name?: string;
  player_name?: string;
  position?: string | null;
  playingPosition?: string;
  team?: string | null;
  is_rostered?: boolean | number;
  league_member?: LeagueMember;
}

interface DirectAddPlayerProps {
  player: DirectAddPlayer;
  league_member: LeagueMember;
  userRoster: RosterEntry[];
  onClose: () => void;
  onClaimSuccess?: () => void;
}

const DirectAddPlayerComponent = ({
  player,
  league_member,
  userRoster,
  onClose,
  onClaimSuccess,
}: DirectAddPlayerProps) => {
  const [rosterRules, setRosterRules] = useState<RosterRules | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDropPlayerForm, setShowDropPlayerForm] = useState<boolean>(false);
  const [playerToDrop, setPlayerToDrop] = useState<string>('');
  const [showFinalConfirmForm, setShowFinalConfirmForm] = useState<boolean>(false);

  useEffect(() => {
    const rosterType = league_member.is_vamp ? 2 : 1;
    const fetchRosterRules = async () => {
      try {
        const response = await axiosInstance.get(
          `/roster_rules/getRosterRulesByLeagueId/${league_member.league_id}/${rosterType}`
        );
        setRosterRules(response.data || null);
      } catch (err: unknown) {
        console.error('Error fetching roster rules:', err);
      }
    };
    fetchRosterRules();
  }, [league_member, userRoster]);

  const getPlayerInfoById = (id: string | number): Partial<RosterEntry> => {
    return userRoster.find(p => String(p.id) === String(id)) ?? {};
  };

  const addOrUpdateRosteredPlayer = async () => {
    try {
      const freeAgentsRes = await axiosInstance.get('/players/getPlayers');
      const leagueRosteredRes = await axiosInstance.get(
        `/rostered_players/getRosteredPlayersByLeagueId/${league_member.league_id}`
      );
      const rosteredIds = new Set<string | number>(
        (Array.isArray(leagueRosteredRes.data) ? leagueRosteredRes.data : [])
          .filter((r: { is_rostered: number }) => r.is_rostered === 1)
          .map((r: { player_id: string | number }) => r.player_id)
      );
      const validFreeAgents = (Array.isArray(freeAgentsRes.data) ? freeAgentsRes.data : []).filter(
        (p: { id: string | number }) => p.id && !rosteredIds.has(p.id)
      );

      const isStillFreeAgent = validFreeAgents.some(
        (p: { id: string | number }) => String(p.id) === String(player.id)
      );
      if (!isStillFreeAgent) {
        setError('This player is no longer available to be added from waivers.');
        return;
      }

      if (playerToDrop) {
        const dropPlayerInfo = getPlayerInfoById(playerToDrop);
        const dropBody = {
          is_rostered: 0,
          player_id: dropPlayerInfo.player_id,
          roster_position: 'BENCH',
          league_member_id: league_member.id,
        };
        console.log('Drop player update body:', dropBody);
        await axiosInstance.put(`/rostered_players/update/${playerToDrop}`, dropBody);
      }

      let existingId: number | null = null;
      try {
        const checkResponse = await axiosInstance.get(
          `/rostered_players/getRosteredPlayerByLeagueAndPlayerId/${league_member.league_id}/${player.id}`
        );
        if (checkResponse.data && checkResponse.data.id) {
          existingId = checkResponse.data.id;
        }
      } catch {
        console.log('Rostered player not found, will create new record.');
      }

      if (existingId) {
        await axiosInstance.put(`/rostered_players/update/${existingId}`, {
          league_member_id: league_member.id,
          player_id: player.id,
          roster_position: 'BENCH',
          is_rostered: 1,
        });
        setSuccessMessage('Player updated and added to your roster!');
      } else {
        await axiosInstance.post('/rostered_players/create', {
          league_member_id: league_member.id,
          player_id: player.id,
          roster_position: 'BENCH',
          is_rostered: 1,
        });
        setSuccessMessage('Player added to your roster!');
      }
      setShowFinalConfirmForm(false);
      setShowDropPlayerForm(false);
      setPlayerToDrop('');
      if (onClaimSuccess) onClaimSuccess();
    } catch (err: unknown) {
      setError('Error adding player to roster.');
      console.error(err);
    }
  };

  const handleConfirm = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setError(null);

    const maxRosterSize = rosterRules?.max_roster_size;
    const currentRosterCount = userRoster.length;

    if (typeof maxRosterSize === 'number' && currentRosterCount >= maxRosterSize) {
      setShowDropPlayerForm(true);
      return;
    }

    await addOrUpdateRosteredPlayer();
  };

  const handleDropSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPlayerToDrop(e.target.value);
    if (e.target.value) {
      setShowFinalConfirmForm(true);
    } else {
      setShowFinalConfirmForm(false);
    }
  };

  const handleFinalConfirm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await addOrUpdateRosteredPlayer();
  };

  const handleCancel = () => {
    setShowDropPlayerForm(false);
    setShowFinalConfirmForm(false);
    setPlayerToDrop('');
    setError(null);
    onClose();
  };

  if (!player || !league_member) return null;

  const dropPlayerInfo = getPlayerInfoById(playerToDrop);

  return (
    <div className="modal-overlay">
      <div className="direct-add-modal animate__animated animate__fadeInUp">
        <div className="direct-add-modal-header">
          <h2 className="modal-title">
            {showFinalConfirmForm
              ? 'Confirm Drop & Add'
              : showDropPlayerForm
              ? 'Drop a Player to Add New Player'
              : 'Confirm Player Addition'}
          </h2>
          <button className="close-btn" onClick={handleCancel}>×</button>
        </div>
        <div className="direct-add-modal-content">
          {error && <div className="error-message">{error}</div>}
          {successMessage && (
            <div className="success-message">
              {successMessage}
              <div style={{ fontSize: '0.9em', marginTop: '8px', color: '#555' }}>
                This window will close automatically.
              </div>
            </div>
          )}
          {!showDropPlayerForm && !showFinalConfirmForm && (
            <>
              <div className="player-info-card">
                <h3 className="player-info-title">Player Details</h3>
                <div className="player-info-grid">
                  <div className="info-item">
                    <span className="info-label">Player:</span>
                    <span className="info-value">{player.player_name || player.name}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Position:</span>
                    <span className="info-value">{player.position || 'Unknown'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Team:</span>
                    <span className="info-value">{player.team || 'Unknown'}</span>
                  </div>
                </div>
              </div>
              <div className="confirm-section">
                <p className="confirm-message">
                  Are you sure you want to add{' '}
                  <strong>{player.player_name || player.name}</strong> to your roster?
                </p>
                <div className="form-buttons">
                  <button type="button" className="submit-btn" onClick={handleConfirm}>
                    Confirm
                  </button>
                  <button type="button" className="cancel-btn" onClick={handleCancel}>
                    Cancel
                  </button>
                </div>
              </div>
            </>
          )}
          {showDropPlayerForm && !showFinalConfirmForm && (
            <form className="drop-player-form">
              <h3 className="form-section-title">Drop a Player</h3>
              <p className="form-note">
                Your roster is full. Please select a player to drop to make room for the new player.
              </p>
              <label className="form-label">
                Player to Drop:
                <select
                  className="form-select"
                  value={playerToDrop}
                  onChange={handleDropSelect}
                  required
                >
                  <option value="">Select a player to drop</option>
                  {userRoster.map(rosteredPlayer => (
                    <option key={String(rosteredPlayer.id)} value={String(rosteredPlayer.id)}>
                      {rosteredPlayer.name} ({rosteredPlayer.playingPosition}, {rosteredPlayer.team})
                    </option>
                  ))}
                </select>
              </label>
              <div className="form-buttons">
                <button type="button" className="cancel-btn" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </form>
          )}
          {showFinalConfirmForm && (
            <form className="final-confirm-form" onSubmit={handleFinalConfirm}>
              <h3 className="form-section-title">Confirm Drop & Add</h3>
              <div className="player-info-card">
                <div className="player-info-grid">
                  <div className="info-item">
                    <span className="info-label">Player to Add:</span>
                    <span className="info-value">
                      {player.player_name || player.name} ({player.playingPosition}, {player.team})
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Player to Drop:</span>
                    <span className="info-value">
                      {dropPlayerInfo.name
                        ? `${dropPlayerInfo.name} (${dropPlayerInfo.playingPosition}, ${dropPlayerInfo.team})`
                        : 'No player selected'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="confirm-section">
                <p className="confirm-message">
                  Confirm you want to drop <strong>{dropPlayerInfo.name}</strong> and add{' '}
                  <strong>{player.player_name || player.name}</strong> to your roster.
                </p>
                <div className="form-buttons">
                  <button type="submit" className="submit-btn">Confirm</button>
                  <button type="button" className="cancel-btn" onClick={handleCancel}>Cancel</button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default DirectAddPlayerComponent;