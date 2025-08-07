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

  // Fetch all players and league data
  const fetchData = useCallback(async () => {
    if (!currentLeague?.league_id) {
      setMessage('Missing league information');
      setMessageType('error');
      setIsMessageExiting(false);
      setTimeout(() => {
        setIsMessageExiting(true);
        setTimeout(() => setMessage(''), 500); // Match animation duration
      }, 5000);
      return;
    }

    try {
      const [playersRes, membersRes, leagueRosteredRes, rosterRulesRes] = await Promise.all([
        axiosInstance.get('/players/getPlayers'),
        axiosInstance.get(`/league_members/getLeagueMembersByLeagueId/${currentLeague.league_id}`),
        axiosInstance.get(`/rostered_players/getRosteredPlayersByLeagueId/${currentLeague.league_id}`),
        axiosInstance.get(`/roster_rules/getRosterRulesByLeagueId/${currentLeague.league_id}/1`)
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch rostered players for selected member
  useEffect(() => {
    const fetchRosteredPlayers = async () => {
      if (selectedMember) {
        try {
          const response = await axiosInstance.get(`/rostered_players/getRosteredPlayersByLeagueMemberId/${selectedMember}`);
          setRosteredPlayers(Array.isArray(response.data) ? response.data : []);
          if (response.data.length === 0) {
            setMessage('No players rostered yet.');
            setMessageType('info');
            setIsMessageExiting(false);
            setTimeout(() => {
              setIsMessageExiting(true);
              setTimeout(() => setMessage(''), 500);
            }, 5000);
          } else {
            setMessage('');
          }
        } catch (error) {
          console.error('AddPlayerToTeam: Error fetching rostered players:', error.response || error);
          setMessage('Failed to load rostered players.');
          setMessageType('error');
          setIsMessageExiting(false);
          setTimeout(() => {
            setIsMessageExiting(true);
            setTimeout(() => setMessage(''), 500);
          }, 5000);
        }
      } else {
        setRosteredPlayers([]);
      }
    };
    fetchRosteredPlayers();
  }, [selectedMember]);

  // Filter players
  const filteredPlayers = useMemo(() => {
    return players.filter(player => {
      const matchesName = player.player_name.toLowerCase().includes(nameFilter.toLowerCase());
      const matchesTeam = teamFilter !== 'All' ? player.team.toUpperCase() === teamFilter.toUpperCase() : true;
      const matchesPosition = positionFilter !== 'All' ? player.position === positionFilter : true;
      return matchesName && matchesTeam && matchesPosition && !leagueRosteredPlayerIds.includes(player.player_id);
    }).map(player => ({
      ...player,
      name: player.player_name,
      playingPosition: player.position
    }));
  }, [players, nameFilter, teamFilter, positionFilter, leagueRosteredPlayerIds]);

  const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage);
  const currentPlayers = filteredPlayers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Handle player selection
  const handlePlayerSelect = (player) => {
    setSelectedPlayer(player);
  };

  // Handle league member selection
  const handleMemberSelect = (e) => {
    setSelectedMember(e.target.value);
  };

  // Find available slot
  const findAvailableSlot = (playerPosition) => {
    const assignedPositions = rosteredPlayers
      .filter(player => player.is_rostered === 1 && player.roster_position)
      .map(player => player.roster_position);
    const allowedPositions = playerPosition === 'RB' || playerPosition === 'WR' || playerPosition === 'TE' ? [playerPosition, 'FLEX', 'BENCH'] :
                            playerPosition === 'QB' || playerPosition === 'DEF' || playerPosition === 'K' ? [playerPosition, 'BENCH'] :
                            [playerPosition];

    for (const slot of rosterSlots) {
      if (!assignedPositions.includes(slot.sPosition) && allowedPositions.includes(slot.position)) {
        const rosterPosition = slot.position === 'BENCH' ? 'BENCH' : slot.sPosition;
        return rosterPosition;
      }
    }
    return null;
  };

  // Handle form submission
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

    if (leagueRosteredPlayerIds.includes(selectedPlayer.player_id)) {
      setMessage('This player is already rostered by another league member.');
      setMessageType('error');
      setIsMessageExiting(false);
      setTimeout(() => {
        setIsMessageExiting(true);
        setTimeout(() => setMessage(''), 500);
      }, 5000);
      return;
    }

    const currentRosterCount = rosteredPlayers.filter(player => player.is_rostered === 1).length;
    const maxRosterSize = rosterRules?.max_roster_size || 13;
    if (currentRosterCount >= maxRosterSize) {
      setMessage('Roster is full. Maximum roster size reached.');
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
      setMessage('No available roster slot for this player\'s position.');
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
        league_member_id: selectedMember,
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
        const rosterResponse = await axiosInstance.get(`/rostered_players/getRosteredPlayersByLeagueMemberId/${selectedMember}`);
        setRosteredPlayers(rosterResponse.data);
        setLeagueRosteredPlayerIds([...leagueRosteredPlayerIds, selectedPlayer.player_id]);
        setSelectedPlayer(null);
        setCurrentPage(1);
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
      setMessage(`Error adding player: ${error.response?.data?.message || error.message}`);
      setMessageType('error');
      setIsMessageExiting(false);
      setTimeout(() => {
        setIsMessageExiting(true);
        setTimeout(() => setMessage(''), 500);
      }, 5000);
    }
  };

  // Assign rostered players to slots
  const assignPlayersToSlots = () => {
    const assignedSlots = [...rosterSlots];
    const availablePlayers = [...rosteredPlayers.filter(player => player.is_rostered === 1)];

    assignedSlots.forEach(slot => {
      slot.player = null;
      let player = null;
      if (slot.position === 'BENCH') {
        player = availablePlayers.find(p => p.roster_position === 'BENCH');
        if (player) {
          slot.player = {
            name: player.player_name,
            playingPosition: player.position,
            team: player.team
          };
          const playerIndex = availablePlayers.findIndex(p => p.roster_position === 'BENCH');
          if (playerIndex !== -1) {
            availablePlayers.splice(playerIndex, 1);
          }
        }
      } else {
        player = availablePlayers.find(p => p.roster_position === slot.sPosition);
        if (player) {
          slot.player = {
            name: player.player_name,
            playingPosition: player.position,
            team: player.team
          };
          const playerIndex = availablePlayers.findIndex(p => p.roster_position === slot.sPosition);
          if (playerIndex !== -1) {
            availablePlayers.splice(playerIndex, 1);
          }
        }
      }
    });

    return assignedSlots;
  };

  const populatedSlots = assignPlayersToSlots();

  return (
    <div className="add-player-container">
      <h2 className="add-player-title">Add Player to Team</h2>
      {message && (
        <div className={`message ${messageType} ${isMessageExiting ? 'message-exit' : ''}`}>
          {message}
        </div>
      )}
      <div className="add-player-sections">
        <div className="search-section">
          <h3 className="section-title">Search Players</h3>
          <form onSubmit={handleSubmit}>
            <div className="filters-container">
              <label className="filter-label">
                Name
                <input
                  type="text"
                  className="filter-input"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  placeholder="Enter player name"
                />
              </label>
              <label className="filter-label">
                Team
                <select
                  className="filter-select"
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                >
                  {nflTeams.map(team => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </label>
              <label className="filter-label">
                Position
                <select
                  className="filter-select"
                  value={positionFilter}
                  onChange={(e) => setPositionFilter(e.target.value)}
                >
                  <option value="All">All</option>
                  <option value="QB">QB</option>
                  <option value="RB">RB</option>
                  <option value="WR">WR</option>
                  <option value="TE">TE</option>
                  <option value="DEF">DEF</option>
                  <option value="K">K</option>
                </select>
              </label>
              <label className="filter-label">
                League Member
                <select
                  className="filter-select"
                  value={selectedMember}
                  onChange={handleMemberSelect}
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