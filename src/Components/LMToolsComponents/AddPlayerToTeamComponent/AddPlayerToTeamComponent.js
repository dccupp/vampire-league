import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axiosInstance from '../../../api';
import PlayerCard from '../../PlayerCard/PlayerCard';
import './AddPlayerToTeamComponent.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const AddPlayerToTeamComponent = ({ currentUser, currentLeague }) => {
  const [nameFilter, setNameFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('All');
  const [positionFilter, setPositionFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [players, setPlayers] = useState([]);
  const [leagueMembers, setLeagueMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [rosterRules, setRosterRules] = useState(null);
  const [rosterSlots, setRosterSlots] = useState([]);
  const [rosteredPlayers, setRosteredPlayers] = useState([]);
  const [leagueRosteredPlayerIds, setLeagueRosteredPlayerIds] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isMessageExiting, setIsMessageExiting] = useState(false);
  const itemsPerPage = 20;

  const nflTeams = useMemo(() => [
    'All', 'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE',
    'DAL', 'DEN', 'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC', 'LAC',
    'LAR', 'LV', 'MIA', 'MIN', 'NE', 'NO', 'NYG', 'NYJ', 'PHI',
    'PIT', 'SEA', 'SF', 'TB', 'TEN', 'WAS'
  ], []);

  // Fetch players, league members, and rostered player IDs
  const fetchData = useCallback(async () => {
    if (!currentLeague?.league_id) {
      setMessage('Missing league information');
      setMessageType('error');
      setIsMessageExiting(false);
      setTimeout(() => {
        setIsMessageExiting(true);
        setTimeout(() => setMessage(''), 500);
      }, 5000);
      return;
    }

    try {
      const [playersRes, membersRes, leagueRosteredRes] = await Promise.all([
        axiosInstance.get('/players/getPlayers'),
        axiosInstance.get(`/league_members/getLeagueMembersByLeagueId/${currentLeague.league_id}`),
        axiosInstance.get(`/rostered_players/getRosteredPlayersByLeagueId/${currentLeague.league_id}`)
      ]);

      setPlayers(Array.isArray(playersRes.data) ? playersRes.data : []);
      setLeagueMembers(Array.isArray(membersRes.data) ? membersRes.data : []);
      setLeagueRosteredPlayerIds(
        Array.isArray(leagueRosteredRes.data)
          ? leagueRosteredRes.data
              .filter(player => player.is_rostered === 1)
              .map(player => player.player_id)
          : []
      );
    } catch (error) {
      console.error('AddPlayerToTeam: Error fetching data:', error.response || error);
      setMessage('Failed to load data.');
      setMessageType('error');
      setIsMessageExiting(false);
      setTimeout(() => {
        setIsMessageExiting(true);
        setTimeout(() => setMessage(''), 500);
      }, 5000);
    }
  }, [currentLeague]);

  // Fetch roster rules and rostered players for selected member
  useEffect(() => {
    const fetchMemberData = async () => {
      if (!selectedMember || !currentLeague?.league_id) {
        setRosterRules(null);
        setRosterSlots([]);
        setRosteredPlayers([]);
        return;
      }

      try {
        const selectedMemberData = leagueMembers.find(member => member.id === parseInt(selectedMember));
        const rosterTypeId = selectedMemberData?.is_vamp === 1 ? 2 : 1;
        const [rosterRulesRes, rosteredPlayersRes] = await Promise.all([
          axiosInstance.get(`/roster_rules/getRosterRulesByLeagueId/${currentLeague.league_id}/${rosterTypeId}`),
          axiosInstance.get(`/rostered_players/getRosteredPlayersByLeagueMemberId/${selectedMember}`)
        ]);

        setRosterRules(rosterRulesRes.data);
        const slots = [];
        const positions = [
          { key: 'quarterback_count', position: 'QB' },
          { key: 'running_back_count', position: 'RB' },
          { key: 'wide_receiver_count', position: 'WR' },
          { key: 'tight_end_count', position: 'TE' },
          { key: 'flex_count', position: 'FLEX' },
          { key: 'bench_count', position: 'BENCH' },
        ];
        positions.forEach(({ key, position }) => {
          const count = rosterRulesRes.data[key] || 0;
          for (let i = 1; i <= count; i++) {
            slots.push({ sPosition: `${position}${i}`, position });
          }
        });
        setRosterSlots(slots);
        setRosteredPlayers(Array.isArray(rosteredPlayersRes.data) ? rosteredPlayersRes.data : []);
      } catch (error) {
        console.error('AddPlayerToTeam: Error fetching member data:', error.response || error);
        setMessage('Failed to load roster data.');
        setMessageType('error');
        setIsMessageExiting(false);
        setTimeout(() => {
          setIsMessageExiting(true);
          setTimeout(() => setMessage(''), 500);
        }, 5000);
      }
    };

    fetchMemberData();
  }, [selectedMember, currentLeague, leagueMembers]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredPlayers = useMemo(() => {
    let result = players.filter(player => 
      !leagueRosteredPlayerIds.includes(player.player_id) &&
      (nameFilter ? player.player_name.toLowerCase().includes(nameFilter.toLowerCase()) : true) &&
      (teamFilter !== 'All' ? player.team === teamFilter : true) &&
      (positionFilter !== 'All' ? player.position === positionFilter : true)
    );
    return result;
  }, [players, nameFilter, teamFilter, positionFilter, leagueRosteredPlayerIds]);

  const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage);
  const currentPlayers = filteredPlayers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const assignPlayersToSlots = (slots, rosteredPlayers) => {
    if (!rosteredPlayers.length || !slots.length) {
      return slots.map(slot => ({ ...slot, player: null }));
    }
    const assignedSlots = slots.map(slot => {
      const matchedPlayer = rosteredPlayers.find(player => player.roster_position === slot.sPosition);
      return { ...slot, player: matchedPlayer || null };
    });
    return assignedSlots;
  };

  const populatedSlots = useMemo(() => {
    return assignPlayersToSlots(rosterSlots, rosteredPlayers);
  }, [rosterSlots, rosteredPlayers]);

  const findAvailableSlot = (playerPosition) => {
    if (!rosterRules || !rosterSlots.length) return null;
    const positionCounts = {};
    rosteredPlayers.forEach(player => {
      positionCounts[player.position] = (positionCounts[player.position] || 0) + 1;
    });

    const maxCounts = {
      QB: rosterRules.max_qb_count || 4,
      RB: rosterRules.max_rb_count || 8,
      WR: rosterRules.max_wr_count || 8,
      TE: rosterRules.max_te_count || 4
    };

    if ((positionCounts[playerPosition] || 0) >= maxCounts[playerPosition]) {
      return null;
    }

    const validPositions = [playerPosition];
    if (['RB', 'WR', 'TE'].includes(playerPosition)) {
      validPositions.push('FLEX');
    }
    validPositions.push('BENCH');

    for (const slot of rosterSlots) {
      if (validPositions.includes(slot.position) && !rosteredPlayers.some(player => player.roster_position === slot.sPosition)) {
        return slot.sPosition;
      }
    }
    return null;
  };

  const handlePlayerSelect = (player) => {
    setSelectedPlayer(player);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlayer || !selectedMember) {
      setMessage('Please select a player and a league member.');
      setMessageType('error');
      setIsMessageExiting(false);
      setTimeout(() => {
        setIsMessageExiting(true);
        setTimeout(() => setMessage(''), 500);
      }, 5000);
      return;
    }

    if (rosteredPlayers.length >= (rosterRules?.max_roster_size || Infinity)) {
      setMessage('Roster is full.');
      setMessageType('error');
      setIsMessageExiting(false);
      setTimeout(() => {
        setIsMessageExiting(true);
        setTimeout(() => setMessage(''), 500);
      }, 5000);
      return;
    }

    if (leagueRosteredPlayerIds.includes(selectedPlayer.player_id)) {
      setMessage('Player is already rostered in this league.');
      setMessageType('error');
      setIsMessageExiting(false);
      setTimeout(() => {
        setIsMessageExiting(true);
        setTimeout(() => setMessage(''), 500);
      }, 5000);
      return;
    }

    const positionCounts = {};
    rosteredPlayers.forEach(player => {
      positionCounts[player.position] = (positionCounts[player.position] || 0) + 1;
    });

    const maxCounts = {
      QB: rosterRules?.max_qb_count || 4,
      RB: rosterRules?.max_rb_count || 8,
      WR: rosterRules?.max_wr_count || 8,
      TE: rosterRules?.max_te_count || 4
    };

    if ((positionCounts[selectedPlayer.position] || 0) >= maxCounts[selectedPlayer.position]) {
      setMessage(`Cannot add player: Maximum ${selectedPlayer.position} limit reached.`);
      setMessageType('error');
      setIsMessageExiting(false);
      setTimeout(() => {
        setIsMessageExiting(true);
        setTimeout(() => setMessage(''), 500);
      }, 5000);
      return;
    }

    const rosterPosition = findAvailableSlot(selectedPlayer.position);
    if (!rosterPosition) {
      setMessage('No available roster slot for this player.');
      setMessageType('error');
      setIsMessageExiting(false);
      setTimeout(() => {
        setIsMessageExiting(true);
        setTimeout(() => setMessage(''), 500);
      }, 5000);
      return;
    }

    try {
      const response = await axiosInstance.post('/rostered_players/create', {
        league_member_id: parseInt(selectedMember),
        player_id: selectedPlayer.player_id,
        roster_position: rosterPosition,
        is_rostered: 1
      });

      if (response.data.status === 'success') {
        setMessage('Player added successfully.');
        setMessageType('success');
        setIsMessageExiting(false);
        setTimeout(() => {
          setIsMessageExiting(true);
          setTimeout(() => setMessage(''), 500);
        }, 5000);

        setSelectedPlayer(null);
        const rosteredPlayersRes = await axiosInstance.get(`/rostered_players/getRosteredPlayersByLeagueMemberId/${selectedMember}`);
        setRosteredPlayers(Array.isArray(rosteredPlayersRes.data) ? rosteredPlayersRes.data : []);
        setLeagueRosteredPlayerIds(prev => [...prev, selectedPlayer.player_id]);
      } else {
        setMessage(response.data.message || 'Failed to add player.');
        setMessageType('error');
        setIsMessageExiting(false);
        setTimeout(() => {
          setIsMessageExiting(true);
          setTimeout(() => setMessage(''), 500);
        }, 5000);
      }
    } catch (error) {
      console.error('AddPlayerToTeam: Error adding player:', error.response || error);
      setMessage('Failed to add player.');
      setMessageType('error');
      setIsMessageExiting(false);
      setTimeout(() => {
        setIsMessageExiting(true);
        setTimeout(() => setMessage(''), 500);
      }, 5000);
    }
  };

  const handleMemberSelect = (e) => {
    setSelectedMember(e.target.value);
    setSelectedPlayer(null);
  };

  return (
    <div className="add-player-container">
      <h2 className="section-title">Add Player to Team</h2>
      {message && (
        <div className={`message ${messageType} ${isMessageExiting ? 'exiting' : ''}`}>
          {message}
        </div>
      )}
      <div className="add-player-content">
        <div className="search-section">
          <form onSubmit={handleSubmit} className="search-form">
            <div className="form-group">
              <label>
                Name:
                <input
                  type="text"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  placeholder="Search by name"
                  className="form-control"
                />
              </label>
            </div>
            <div className="form-group">
              <label>
                Team:
                <select
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                  className="form-control"
                >
                  {nflTeams.map(team => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="form-group">
              <label>
                Position:
                <select
                  value={positionFilter}
                  onChange={(e) => setPositionFilter(e.target.value)}
                  className="form-control"
                >
                  <option value="All">All</option>
                  <option value="QB">QB</option>
                  <option value="RB">RB</option>
                  <option value="WR">WR</option>
                  <option value="TE">TE</option>
                </select>
              </label>
            </div>
            <div className="form-group">
              <label>
                League Member:
                <select
                  value={selectedMember}
                  onChange={handleMemberSelect}
                  className="form-control"
                >
                  <option value="">Select a league member</option>
                  {leagueMembers.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.username} - {member.team_name || 'No Team Name'}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              type="submit"
              className="btn-add"
              disabled={!selectedPlayer || !selectedMember}
            >
              Add Player
            </button>
          </form>
          <table className="player-table">
            <thead>
              <tr>
                <th>Player</th>
              </tr>
            </thead>
            <tbody>
              {currentPlayers.length > 0 ? (
                currentPlayers.map((player, index) => (
                  <tr key={player.player_id} className="player-row">
                    <td className="player-cell">
                      <PlayerCard
                        player={player}
                        index={index}
                        onClick={() => handlePlayerSelect(player)}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="empty-message">No players available</td>
                </tr>
              )}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                <svg className="pagination-icon" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                </svg>
              </button>
              <span className="pagination-current">{currentPage} / {totalPages}</span>
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                <svg className="pagination-icon" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
                </svg>
              </button>
            </div>
          )}
        </div>
        {rosterRules && (
          <div className="roster-section">
            <h3 className="section-title">Roster Preview</h3>
            <div className="table-responsive">
              <table className="roster-table">
                <thead>
                  <tr>
                    <th>Slot</th>
                    <th>Player</th>
                  </tr>
                </thead>
                <tbody>
                  {populatedSlots.map(slot => (
                    <tr
                      key={slot.sPosition}
                      className="roster-row"
                      {...(slot.position !== 'BENCH' ? { 'data-position': slot.sPosition } : {})}
                    >
                      <td className="slot-cell">{slot.position}</td>
                      <td className="player-cell">
                        {slot.player ? (
                          <PlayerCard
                            player={slot.player}
                            index={slot.sPosition}
                            onClick={() => {}}
                          />
                        ) : (
                          'Empty'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddPlayerToTeamComponent;