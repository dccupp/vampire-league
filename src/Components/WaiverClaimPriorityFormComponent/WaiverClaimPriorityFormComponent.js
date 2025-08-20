import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api';
import './WaiverClaimPriorityFormComponent.css';

const WaiverClaimPriorityFormComponent = ({ currentUser, currentLeague }) => {
  const [waiverClaims, setWaiverClaims] = useState([]);
  const [leagueMember, setLeagueMember] = useState(null);
  const [playerNames, setPlayerNames] = useState({});
  const [priorities, setPriorities] = useState({});
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    const fetchData = async () => {
      if (!leagueMember?.id) return;

      try {
        const response = await axiosInstance.get(`/waiver_claims/getWaiverClaimsByLeagueMemberId/${leagueMember.id}`, {
          params: { is_active: 1 }
        });
        const claims = Array.isArray(response.data) ? response.data : [];
        setWaiverClaims(claims);

        // Initialize priorities
        setPriorities(claims.reduce((acc, claim) => ({
          ...acc,
          [claim.id]: claim.league_member_priority || ''
        }), {}));

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

        if (claims.length === 0) {
          setError('No active waiver claims found');
        }
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to load waiver claims');
      }
    };

    fetchData();
  }, [leagueMember?.id]);

  const handlePriorityChange = (claimId, value) => {
    setPriorities(prev => ({
      ...prev,
      [claimId]: value ? parseInt(value) : ''
    }));
  };

  const validatePriorities = () => {
    const priorityValues = Object.values(priorities).filter(val => val !== '');
    const uniqueValues = new Set(priorityValues);
    
    // Check if all claims have a priority
    if (priorityValues.length !== waiverClaims.length) {
      return 'All claims must have a priority assigned';
    }
    
    // Check for duplicate priorities
    if (uniqueValues.size !== priorityValues.length) {
      return 'Each claim must have a unique priority';
    }
    
    // Check if priorities are within valid range
    const validPriorities = Array.from({ length: waiverClaims.length }, (_, i) => i + 1);
    const invalidPriority = priorityValues.find(val => !validPriorities.includes(val));
    if (invalidPriority) {
      return 'Priority values must be between 1 and the number of claims';
    }
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const validationError = validatePriorities();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const updatePromises = waiverClaims.map(claim => 
        axiosInstance.put(`/waiver_claims/update/${claim.id}`, {
          league_id: parseInt(leagueMember.league_id),
          league_member_id: parseInt(leagueMember.id),
          player_id: claim.player_id,
          faab_claim_amount: claim.faab_claim_amount,
          is_active: 1,
          ...(claim.rostered_player_to_drop && { rostered_player_to_drop: parseInt(claim.rostered_player_to_drop) }),
          league_member_priority: parseInt(priorities[claim.id])
        })
      );

      const responses = await Promise.all(updatePromises);
      const allSuccessful = responses.every(res => res.data.status === 'success');

      if (allSuccessful) {
        setSuccessMessage('Waiver claim priorities updated successfully!');
        setTimeout(() => {
          setSuccessMessage(null);
        }, 2000);
      } else {
        setError('Failed to update some waiver claim priorities');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update waiver claim priorities');
    }
  };

  if (isLoading) {
    return <div className="waiver-priority-container">Loading waiver claims...</div>;
  }

  return (
    <div className="waiver-priority-container animate__animated animate__fadeIn">
      <div className="header-container">
        <h2 className="waiver-priority-title">{currentLeague?.name ? `${currentLeague.name} Waiver Claim Priorities` : 'Waiver Claim Priorities'}</h2>
        <button className="view-claims-btn" onClick={() => navigate('/active-waiver-claims')}>
          View Claims
        </button>
      </div>
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      <div className="table-wrapper">
        <table className="waiver-priority-table">
          <thead>
            <tr>
              <th>Player</th>
              <th>FAAB Bid ($)</th>
              <th>Player to Drop</th>
              <th>Priority</th>
            </tr>
          </thead>
          <tbody>
            {waiverClaims.length > 0 ? (
              waiverClaims.map((claim) => (
                <tr key={claim.id} className="waiver-priority-row">
                  <td>{playerNames[claim.player_id] || 'Unknown Player'}</td>
                  <td>${claim.faab_claim_amount || 0}</td>
                  <td>{claim.rostered_player_to_drop ? playerNames[claim.rostered_player_to_drop] || 'Unknown Player' : 'None'}</td>
                  <td>
                    <select
                      className="priority-select"
                      value={priorities[claim.id] || ''}
                      onChange={(e) => handlePriorityChange(claim.id, e.target.value)}
                    >
                      <option value="">Select Priority</option>
                      {Array.from({ length: waiverClaims.length }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
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
      {waiverClaims.length > 0 && (
        <div className="submit-button-container">
          <button className="submit-btn" onClick={handleSubmit}>Submit Waiver Priorities</button>
        </div>
      )}
    </div>
  );
};

export default WaiverClaimPriorityFormComponent;