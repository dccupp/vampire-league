import { useState, useEffect, SyntheticEvent } from 'react';
import { isAxiosError } from 'axios';
import axiosInstance from '../../api';
import { Player, RosteredPlayer, LeagueMember, WaiverClaim } from '../../types';
import './WaiverClaimFormComponent.css';

interface WaiverClaimFormProps {
  player: Player;
  league_member: LeagueMember;
  claim: WaiverClaim | null;
  userRoster: RosteredPlayer[];
  onClose: () => void;
  onClaimSuccess: () => void;
}

const WaiverClaimFormComponent = ({ player, league_member, userRoster, onClose, onClaimSuccess, claim }: WaiverClaimFormProps) => {
  const [faabAmount, setFaabAmount] = useState<string>(claim ? String(claim.faab_claim_amount) : '');
  const [rosteredPlayerToDrop, setRosteredPlayerToDrop] = useState<number | null>(claim?.rostered_player_to_drop ?? null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [existingClaims, setExistingClaims] = useState<WaiverClaim[]>([]);
  const [isRosterFull, setIsRosterFull] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isEditMode = !!claim;

  const activeRosterCount = userRoster.filter(p => !!p.is_rostered).length;

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const rosterTypeId = league_member.is_vamp ? 2 : 1;
        const [rulesRes, claimsRes] = await Promise.all([
          axiosInstance.get(`/roster_rules/getRosterRulesByLeagueId/${league_member.league_id}/${rosterTypeId}`),
          axiosInstance.get(`/waiver_claims/getWaiverClaimsByLeagueMemberId/${league_member.id}`, {
            params: { is_active: 1 },
          }),
        ]);

        const rosterRules = rulesRes.data;
        if (rosterRules && typeof rosterRules.max_roster_size === 'number') {
          setIsRosterFull(activeRosterCount >= rosterRules.max_roster_size);
        }

        setExistingClaims(Array.isArray(claimsRes.data) ? claimsRes.data : []);
      } catch (err) {
        setError(isAxiosError(err) ? err.response?.data?.message || 'Failed to load claim data' : 'Failed to load claim data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [league_member.id, league_member.league_id, league_member.is_vamp, activeRosterCount]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        onClaimSuccess();
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, onClaimSuccess, onClose]);

  const checkDuplicateClaim = (): boolean => {
    return existingClaims.some(existingClaim =>
      existingClaim.id !== (claim?.id ?? null) &&
      String(existingClaim.player_id) === player.player_id &&
      (existingClaim.rostered_player_to_drop ?? null) === rosteredPlayerToDrop
    );
  };

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const faabAmountInt = parseInt(faabAmount, 10);

    if (!faabAmount || isNaN(faabAmountInt) || faabAmountInt < 0) {
      setError('Enter a valid FAAB amount (non-negative number)');
      return;
    }

    const remainingFaab = league_member.remaining_faab_budget || 0;
    if (faabAmountInt > remainingFaab) {
      setError(`FAAB amount exceeds remaining budget of $${remainingFaab}`);
      return;
    }

    if (isRosterFull && !rosteredPlayerToDrop) {
      setError('Please select a player to drop');
      return;
    }

    if (checkDuplicateClaim()) {
      setError('A claim for this player and drop selection already exists');
      return;
    }

    const claimData = {
      league_id: league_member.league_id,
      league_member_id: league_member.id,
      player_id: player.player_id,
      faab_claim_amount: faabAmountInt,
      is_active: 1,
      ...(rosteredPlayerToDrop != null && { rostered_player_to_drop: rosteredPlayerToDrop }),
      ...(!isEditMode && { league_member_priority: existingClaims.length + 1 }),
    };

    try {
      const response = isEditMode
        ? await axiosInstance.put(`/waiver_claims/update/${claim.id}`, claimData)
        : await axiosInstance.post('/waiver_claims/create', claimData);
      if (response.data.status === 'success') {
        setSuccessMessage(isEditMode ? 'Waiver claim updated successfully!' : 'Waiver claim submitted successfully!');
        setRosteredPlayerToDrop(null);
        setFaabAmount('');
      } else {
        setError(response.data.message || `Failed to ${isEditMode ? 'update' : 'create'} waiver claim`);
      }
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} waiver claim` : `Failed to ${isEditMode ? 'update' : 'create'} waiver claim`);
    }
  };

  if (isLoading) return (
    <div className="wcf-modal-overlay">
      <div className="wcf-modal">
        <div className="wcf-modal-content">Loading...</div>
      </div>
    </div>
  );

  return (
    <div className="wcf-modal-overlay">
      <div className="wcf-modal animate__animated animate__fadeInUp">
        <div className="wcf-modal-header">
          <h2 className="wcf-modal-title">{isEditMode ? 'Edit Waiver Claim' : 'Place Waiver Claim'}</h2>
          <button className="wcf-close-btn" onClick={onClose}>×</button>
        </div>
        <div className="wcf-modal-content">
          {error && <div className="wcf-error-message">{error}</div>}
          {successMessage && <div className="wcf-success-message">{successMessage}</div>}
          <div className="wcf-player-info-card">
            <h3 className="wcf-player-info-title">Player Details</h3>
            <div className="wcf-player-info-grid">
              <div className="wcf-info-item">
                <span className="wcf-info-label">Player:</span>
                <span className="wcf-info-value">{player.player_name}</span>
              </div>
              <div className="wcf-info-item">
                <span className="wcf-info-label">Position:</span>
                <span className="wcf-info-value">{player.position || 'Unknown'}</span>
              </div>
              <div className="wcf-info-item">
                <span className="wcf-info-label">Team:</span>
                <span className="wcf-info-value">{player.team || 'Unknown'}</span>
              </div>
              <div className="wcf-info-item">
                <span className="wcf-info-label">Remaining FAAB:</span>
                <span className="wcf-info-value">${league_member.remaining_faab_budget || 0}</span>
              </div>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="wcf-form">
            <div className="wcf-form-section">
              <h3 className="wcf-form-section-title">Waiver Claim</h3>
              <label className="wcf-form-label">
                FAAB Bid Amount ($):
                <input
                  type="number"
                  className="wcf-form-input"
                  value={faabAmount}
                  onChange={(e) => setFaabAmount(e.target.value)}
                  min="0"
                  step="1"
                  placeholder="Enter FAAB amount"
                  required
                />
              </label>
              <label className="wcf-form-label">
                Player to Drop:
                <select
                  className="wcf-form-select"
                  value={rosteredPlayerToDrop?.toString() ?? ''}
                  onChange={(e) => setRosteredPlayerToDrop(
                    e.target.value && e.target.value !== 'none' ? parseInt(e.target.value, 10) : null
                  )}
                  required={isRosterFull}
                >
                  <option value="">Select a player to drop</option>
                  {!isRosterFull && <option value="none">Do Not Drop Player</option>}
                  {userRoster.map((rosteredPlayer) => (
                    <option key={rosteredPlayer.id} value={rosteredPlayer.id}>
                      {rosteredPlayer.player_name} ({rosteredPlayer.position}, {rosteredPlayer.team})
                    </option>
                  ))}
                </select>
              </label>
              {isRosterFull && (
                <p className="wcf-form-note">Your roster is full. You must select a player to drop.</p>
              )}
            </div>
            <div className="wcf-form-buttons">
              <button type="submit" className="wcf-submit-btn">{isEditMode ? 'Update Claim' : 'Submit Claim'}</button>
              <button type="button" className="wcf-cancel-btn" onClick={onClose}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WaiverClaimFormComponent;
