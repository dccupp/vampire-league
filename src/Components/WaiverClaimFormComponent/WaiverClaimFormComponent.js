import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api';
import './WaiverClaimFormComponent.css';

const WaiverClaimFormComponent = ({ player, league_member, userRoster, onClose, onClaimSuccess }) => {
  const [faabAmount, setFaabAmount] = useState('');
  const [rosteredPlayerToDrop, setRosteredPlayerToDrop] = useState('');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showDropPlayerForm, setShowDropPlayerForm] = useState(false);

  useEffect(() => {
    if (!player || !league_member || (!player.player_id && !player.id)) {
      setError('Invalid player or league member information');
    }
  }, [player, league_member]);

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
    if (!league_member?.league_id || !userRoster) {
      setError('Missing league or roster information');
      return false;
    }

    try {
      const rosterTypeId = league_member.is_vamp ? 2 : 1;
      const response = await axiosInstance.get(`/roster_rules/getRosterRulesByLeagueId/${league_member.league_id}/${rosterTypeId}`);
      const rosterRules = response.data;

      if (rosterRules && typeof rosterRules.max_roster_size === 'number') {
        return userRoster.filter(p => p.is_rostered === 1).length >= rosterRules.max_roster_size;
      }
      setError('Invalid roster rules');
      return false;
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch roster rules');
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const playerId = player?.player_id || player?.id;
    if (!league_member?.league_id || !league_member?.id || !playerId) {
      setError('Missing required information');
      return;
    }

    if (!faabAmount || isNaN(faabAmount) || faabAmount < 0) {
      setError('Enter a valid FAAB amount (non-negative number)');
      return;
    }

    const remainingFaab = league_member.remaining_faab_budget || 0;
    if (parseInt(faabAmount) > remainingFaab) {
      setError(`FAAB amount exceeds remaining budget of $${remainingFaab}`);
      return;
    }

    const claimData = {
      league_id: parseInt(league_member.league_id),
      league_member_id: parseInt(league_member.id),
      player_id: playerId,
      faab_claim_amount: parseInt(faabAmount),
      is_active: 1,
      ...(showDropPlayerForm && rosteredPlayerToDrop && { rostered_player_to_drop: parseInt(rosteredPlayerToDrop) })
    };

    if (showDropPlayerForm && !rosteredPlayerToDrop) {
      setError('Please select a player to drop');
      return;
    }

    try {
      const response = await axiosInstance.post('/waiver_claims/create', claimData);
      if (response.data.status === 'success') {
        setSuccessMessage('Waiver claim submitted successfully!');
        setShowDropPlayerForm(false);
        setRosteredPlayerToDrop('');
        setFaabAmount('');
      } else {
        setError(response.data.message || 'Failed to create waiver claim');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create waiver claim');
    }
  };

  const handleRosterCheck = async (e) => {
    e.preventDefault();
    const isRosterFull = await checkRosterSize();
    if (isRosterFull && !showDropPlayerForm) {
      setShowDropPlayerForm(true);
    } else {
      handleSubmit(e);
    }
  };

  if (!player || !league_member) return null;

  return (
    <div className="modal-overlay">
      <div className="waiver-claim-modal animate__animated animate__fadeInUp">
        <div className="waiver-claim-modal-header">
          <h2 className="modal-title">{showDropPlayerForm ? 'Drop a Player' : 'Place Waiver Claim'}</h2>
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
                    <span className="info-value">{player.position || player.playingPosition}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Team:</span>
                    <span className="info-value">{player.team}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Remaining FAAB:</span>
                    <span className="info-value">${league_member.remaining_faab_budget || 0}</span>
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
                  <button type="submit" className="submit-btn">Submit Claim</button>
                  <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
                </div>
              </form>
            </div>
          ) : (
            <div className="drop-player-form-section">
              <form onSubmit={handleSubmit} className="waiver-claim-form">
                <h3 className="form-section-title">Drop a Player</h3>
                <p className="form-note">Your roster is full. Please select a player to drop to proceed with the waiver claim.</p>
                <label className="form-label">
                  Player to Drop:
                  <select
                    className="form-select"
                    value={rosteredPlayerToDrop}
                    onChange={(e) => setRosteredPlayerToDrop(e.target.value)}
                    required
                  >
                    <option value="">Select a player to drop</option>
                    {userRoster.map((rosteredPlayer) => (
                      <option key={rosteredPlayer.id} value={rosteredPlayer.id}>
                        {rosteredPlayer.name} ({rosteredPlayer.playingPosition}, {rosteredPlayer.team})
                      </option>
                    ))}
                  </select>
                </label>
                <div className="form-buttons">
                  <button type="submit" className="submit-btn">Submit Claim</button>
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