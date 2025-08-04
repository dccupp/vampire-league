import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api';
import './WaiverClaimFormComponent.css';

const WaiverClaimFormComponent = ({ player, league_member, userRoster, onClose, onClaimSuccess, claim }) => {
  const [faabAmount, setFaabAmount] = useState(claim ? String(claim.faab_claim_amount) : '');
  const [rosteredPlayerToDrop, setRosteredPlayerToDrop] = useState(claim?.rostered_player_to_drop || '');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showDropPlayerForm, setShowDropPlayerForm] = useState(false);
  const [leagueMemberData, setLeagueMemberData] = useState(league_member);
  const [existingClaims, setExistingClaims] = useState([]);
  const [isRosterFull, setIsRosterFull] = useState(null);
  const isEditMode = !!claim;

  useEffect(() => {
    const fetchLeagueMemberData = async () => {
      if (!league_member?.id || !league_member?.league_id || league_member.remaining_faab_budget !== undefined) {
        return;
      }

      try {
        const response = await axiosInstance.get(`/league_members/getLeagueMembersByUserId/${league_member.id}`);
        const member = Array.isArray(response.data) ? response.data.find(m => m.league_id === league_member.league_id) : null;
        if (member) {
          setLeagueMemberData(member);
        } else {
          setError('Failed to load league member data');
        }
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to load league member data');
      }
    };

    fetchLeagueMemberData();
  }, [league_member]);

  useEffect(() => {
    const fetchExistingClaims = async () => {
      if (!leagueMemberData?.id) return;

      try {
        const response = await axiosInstance.get(`/waiver_claims/getWaiverClaimsByLeagueMemberId/${leagueMemberData.id}`, {
          params: { is_active: 1 }
        });
        setExistingClaims(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to load existing claims');
      }
    };

    fetchExistingClaims();
  }, [leagueMemberData?.id]);

  useEffect(() => {
    if (!player || !leagueMemberData || (!player.player_id && !player.id)) {
      setError('Invalid player or league member information');
    }
  }, [player, leagueMemberData]);

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

  const checkRosterSize = async () => {
    if (!leagueMemberData?.league_id || !userRoster) {
      setError('Missing league or roster information');
      return false;
    }

    try {
      const rosterTypeId = leagueMemberData.is_vamp ? 2 : 1;
      const response = await axiosInstance.get(`/roster_rules/getRosterRulesByLeagueId/${leagueMemberData.league_id}/${rosterTypeId}`);
      const rosterRules = response.data;

      if (rosterRules && typeof rosterRules.max_roster_size === 'number') {
        const activeRosterCount = userRoster.filter(p => p.is_rostered === 1).length;
        return activeRosterCount >= rosterRules.max_roster_size;
      }
      setError('Invalid roster rules');
      return false;
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch roster rules');
      return false;
    }
  };

  const checkDuplicateClaim = () => {
    const playerId = player?.player_id || player?.id;
    const dropPlayerId = rosteredPlayerToDrop ? parseInt(rosteredPlayerToDrop) : null;
    
    return existingClaims.some(existingClaim => 
      existingClaim.id !== (claim?.id || null) &&
      existingClaim.player_id === playerId &&
      (existingClaim.rostered_player_to_drop || null) === dropPlayerId
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const playerId = player?.player_id || player?.id;
    if (!leagueMemberData?.league_id || !leagueMemberData?.id || !playerId) {
      setError('Missing required information');
      return;
    }

    if (!faabAmount || isNaN(faabAmount) || faabAmount < 0) {
      setError('Enter a valid FAAB amount (non-negative number)');
      return;
    }

    const remainingFaab = leagueMemberData.remaining_faab_budget || 0;
    if (parseInt(faabAmount) > remainingFaab) {
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
      league_id: parseInt(leagueMemberData.league_id),
      league_member_id: parseInt(leagueMemberData.id),
      player_id: playerId,
      faab_claim_amount: parseInt(faabAmount),
      is_active: 1,
      ...(rosteredPlayerToDrop && rosteredPlayerToDrop !== 'none' && { rostered_player_to_drop: parseInt(rosteredPlayerToDrop) }),
      ...(!isEditMode && { league_member_priority: existingClaims.length + 1 })
    };

    try {
      const response = isEditMode
        ? await axiosInstance.put(`/waiver_claims/update/${claim.id}`, claimData)
        : await axiosInstance.post('/waiver_claims/create', claimData);
      if (response.data.status === 'success') {
        setSuccessMessage(isEditMode ? 'Waiver claim updated successfully!' : 'Waiver claim submitted successfully!');
        setShowDropPlayerForm(false);
        setRosteredPlayerToDrop('');
        setFaabAmount('');
      } else {
        setError(response.data.message || `Failed to ${isEditMode ? 'update' : 'create'} waiver claim`);
      }
    } catch (error) {
      setError(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} waiver claim`);
    }
  };

  const handleRosterCheck = async (e) => {
    e.preventDefault();
    setError(null);

    const rosterFull = await checkRosterSize();
    setIsRosterFull(rosterFull);
    setShowDropPlayerForm(true);
  };

  if (!player || !leagueMemberData) return null;

  return (
    <div className="modal-overlay">
      <div className="waiver-claim-modal animate__animated animate__fadeInUp">
        <div className="waiver-claim-modal-header">
          <h2 className="modal-title">{showDropPlayerForm ? 'Drop a Player' : (isEditMode ? 'Edit Waiver Claim' : 'Place Waiver Claim')}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="waiver-claim-modal-content">
          {error && <div className="error-message">{error}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}
          {!showDropPlayerForm ? (
            <div className="main-form-section">
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
                  <div className="info-item">
                    <span className="info-label">Remaining FAAB:</span>
                    <span className="info-value">${leagueMemberData.remaining_faab_budget || 0}</span>
                  </div>
                </div>
              </div>
              <form onSubmit={handleRosterCheck} className="waiver-claim-form">
                <h3 className="form-section-title">Waiver Claim</h3>
                <label className="form-label">
                  FAAB Bid Amount ($):
                  <input
                    type="number"
                    className="form-input"
                    value={faabAmount}
                    onChange={(e) => setFaabAmount(e.target.value)}
                    min="0"
                    step="1"
                    placeholder="Enter FAAB amount"
                    required
                  />
                </label>
                <div className="form-buttons">
                  <button type="submit" className="submit-btn">{isEditMode ? 'Update Claim' : 'Submit Claim'}</button>
                  <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
                </div>
              </form>
            </div>
          ) : (
            <div className="drop-player-form-section">
              <form onSubmit={handleSubmit} className="waiver-claim-form">
                <h3 className="form-section-title">Drop a Player</h3>
                <p className="form-note">
                  {isRosterFull
                    ? 'Your roster is full. Please select a player to drop to proceed with the waiver claim.'
                    : 'Please select a player to drop or choose "Do Not Drop Player" to proceed.'}
                </p>
                <label className="form-label">
                  Player to Drop:
                  <select
                    className="form-select"
                    value={rosteredPlayerToDrop}
                    onChange={(e) => setRosteredPlayerToDrop(e.target.value)}
                    required={isRosterFull}
                  >
                    <option value="">Select a player to drop</option>
                    {!isRosterFull && <option value="none">Do Not Drop Player</option>}
                    {userRoster.map((rosteredPlayer) => (
                      <option key={rosteredPlayer.id} value={rosteredPlayer.id}>
                        {rosteredPlayer.name} ({rosteredPlayer.playingPosition}, {rosteredPlayer.team})
                      </option>
                    ))}
                  </select>
                </label>
                <div className="form-buttons">
                  <button type="submit" className="submit-btn">{isEditMode ? 'Update Claim' : 'Submit Claim'}</button>
                  <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WaiverClaimFormComponent;