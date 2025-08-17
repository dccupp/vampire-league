import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axiosInstance from '../../../api';
import PlayerCard from '../../PlayerCard/PlayerCard';
import './AddPlayerToTeamComponent.css';

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
  const [isLoadingRoster, setIsLoadingRoster] = useState(false);
  const itemsPerPage = 20;

  const nflTeams = useMemo(() => [
    'All', 'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE',
    'DAL', 'DEN', 'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC', 'LAC',
    'LAR', 'LV', 'MIA', 'MIN', 'NE', 'NO', 'NYG', 'NYJ', 'PHI',
    'PIT', 'SEA', 'SF', 'TB', 'TEN', 'WAS'
  ], []);

  // Utility to show messages with timeout
  const showMessage = useCallback((msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setIsMessageExiting(false);
    setTimeout(() => {
      setIsMessageExiting(true);
      setTimeout(() => setMessage(''), 500);
    }, 5000);
  }, []);

  // Transform player data for PlayerCard
  const transformPlayer = useCallback(player => ({
    player_id: player.player_id,
    name: player.player_name || player.name || 'Unknown',
    playingPosition: player.position || player.playingPosition || 'N/A',
    team: player.team || 'N/A'
  }), []);

  // Fetch initial data
  // eslint-disable-next-line no-unused-vars
  const fetchData = useCallback(async () => {
    if (!currentLeague?.league_id) {
      showMessage('Missing league information', 'error');
      return;
    }

    try {
      const [playersRes, membersRes, leagueRosteredRes] = await Promise.all([
        axiosInstance.get('/players/getPlayers'),
        axiosInstance.get(`/league_members/getLeagueMembersByLeagueId/${currentLeague.league_id}`),
        axiosInstance.get(`/rostered_players/getRosteredPlayersByLeagueId/${currentLeague.league_id}`)
      ]);

      setPlayers(Array.isArray(playersRes.data) ? playersRes.data.map(transformPlayer) : []);
      setLeagueMembers(Array.isArray(membersRes.data) ? membersRes.data : []);
      setLeagueRosteredPlayerIds(
        Array.isArray(leagueRosteredRes.data)
          ? leagueRosteredRes.data.filter(player => player.is_rostered === 1).map(player => player.player_id)
          : []
      );
    } catch (error) {
      showMessage('Failed to load data.', 'error');
    }
  }, [currentLeague, showMessage, transformPlayer]);

  // Fetch roster rules and rostered players
  const fetchMemberData = useCallback(async () => {
    if (!selectedMember || !currentLeague?.league_id) {
      setRosterRules(null);
      setRosterSlots([]);
      setRosteredPlayers([]);
      setIsLoadingRoster(false);
      return;
    }

    setIsLoadingRoster(true);
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
        { key: 'wide_receiver_tight_end_count', position: 'WR/TE' },
        { key: 'flex_count', position: 'FLEX' },
        { key: 'bench_count', position: 'BENCH' }
      ];
      positions.forEach(({ key, position }) => {
        const count = rosterRulesRes.data[key] || 0;
        for (let i = 1; i <= count; i++) {
          slots.push({ sPosition: `${position}${i}`, position });
        }
      });
      setRosterSlots(slots);

      const rosteredPlayersData = Array.isArray(rosteredPlayersRes.data) 
        ? rosteredPlayersRes.data.filter(rp => rp.roster_position !== 'IR')
        : [];
      const enrichedRosteredPlayers = rosteredPlayersData.map(rp => {
        const playerDetails = players.find(p => p.player_id === rp.player_id) || {};
        return {
          ...rp,
          name: playerDetails.name || 'Unknown',
          playingPosition: playerDetails.playingPosition || 'N/A',
          team: playerDetails.team || 'N/A'
        };
      });
      setRosteredPlayers(enrichedRosteredPlayers);
    } catch (error) {
      showMessage('Failed to load roster data.', 'error');
    } finally {
      setIsLoadingRoster(false);
    }
  }, [selectedMember, currentLeague, leagueMembers, players, showMessage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchMemberData();
  }, [fetchMemberData]);

  const filteredPlayers = useMemo(() => {
    return players.filter(player => 
      !leagueRosteredPlayerIds.includes(player.player_id) &&
      (nameFilter ? player.name.toLowerCase().includes(nameFilter.toLowerCase()) : true) &&
      (teamFilter !== 'All' ? player.team === teamFilter : true) &&
      (positionFilter !== 'All' ? player.playingPosition === positionFilter : true)
    );
  }, [players, nameFilter, teamFilter, positionFilter, leagueRosteredPlayerIds]);

  const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage);
  const currentPlayers = filteredPlayers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const findAvailableSlot = useCallback((playerPosition) => {
    if (!rosterRules || !rosterSlots.length) return null;

    const positionCounts = rosteredPlayers.reduce((counts, player) => {
      counts[player.playingPosition] = (counts[player.playingPosition] || 0) + 1;
      return counts;
    }, {});

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
      validPositions.push('FLEX', 'WR/TE');
    }
    validPositions.push('BENCH');

    return rosterSlots.find(slot => 
      validPositions.includes(slot.position) && 
      !rosteredPlayers.some(player => player.roster_position === slot.sPosition)
    )?.sPosition || null;
  }, [rosterRules, rosterSlots, rosteredPlayers]);

  const populatedSlots = useMemo(() => {
    if (!rosteredPlayers.length || !rosterSlots.length) {
      return rosterSlots.map(slot => ({ ...slot, player: null }));
    }
    return rosterSlots.map(slot => ({
      ...slot,
      player: rosteredPlayers.find(player => player.roster_position === slot.sPosition) || null
    }));
  }, [rosterSlots, rosteredPlayers]);

  const handlePlayerSelect = (player) => {
    setSelectedPlayer(player);
  };

  const handleMemberSelect = (e) => {
    setSelectedMember(e.target.value);
    setSelectedPlayer(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlayer || !selectedMember) {
      showMessage('Please select a player and a league member.', 'error');
      return;
    }

    const rosterPosition = findAvailableSlot(selectedPlayer.playingPosition);
    if (!rosterPosition) {
      showMessage('No available roster slots for this player.', 'error');
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
        showMessage(`Successfully added ${selectedPlayer.name} to roster.`, 'success');
        setSelectedPlayer(null);
        const rosteredPlayersRes = await axiosInstance.get(`/rostered_players/getRosteredPlayersByLeagueMemberId/${selectedMember}`);
        const enrichedRosteredPlayers = Array.isArray(rosteredPlayersRes.data) 
          ? rosteredPlayersRes.data
              .filter(rp => rp.roster_position !== 'IR')
              .map(rp => {
                const playerDetails = players.find(p => p.player_id === rp.player_id) || {};
                return {
                  ...rp,
                  name: playerDetails.name || 'Unknown',
                  playingPosition: playerDetails.playingPosition || 'N/A',
                  team: playerDetails.team || 'N/A'
                };
              })
          : [];
        setRosteredPlayers(enrichedRosteredPlayers);
        setLeagueRosteredPlayerIds(prev => [...prev, selectedPlayer.player_id]);
      } else {
        showMessage(response.data.message || 'Failed to add player.', 'error');
      }
    } catch (error) {
      showMessage('Failed to add player.', 'error');
    }
  };

  return (
    <div className="apt-container">
      <h2 className="apt-section-title">Add Player to Team</h2>
      {message && (
        <div className={`apt-message apt-message-${messageType} ${isMessageExiting ? 'apt-message-exiting' : ''}`}>
          {message}
        </div>
      )}
      <div className="apt-content">
        <div className="apt-search-section">
          <form onSubmit={handleSubmit} className="apt-search-form">
            <div className="apt-form-group">
              <label className="apt-filter-label">
                Name:
                <input
                  type="text"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  placeholder="Search by name"
                  className="apt-filter-input"
                />
              </label>
            </div>
            <div className="apt-form-group">
              <label className="apt-filter-label">
                Team:
                <select
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                  className="apt-filter-select"
                >
                  {nflTeams.map(team => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="apt-form-group">
              <label className="apt-filter-label">
                Position:
                <select
                  value={positionFilter}
                  onChange={(e) => setPositionFilter(e.target.value)}
                  className="apt-filter-select"
                >
                  <option value="All">All</option>
                  <option value="QB">QB</option>
                  <option value="RB">RB</option>
                  <option value="WR">WR</option>
                  <option value="TE">TE</option>
                </select>
              </label>
            </div>
            <div className="apt-form-group">
              <label className="apt-filter-label">
                League Member:
                <select
                  value={selectedMember}
                  onChange={handleMemberSelect}
                  className="apt-filter-select"
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
              className="apt-btn-add"
              disabled={!selectedPlayer || !selectedMember}
            >
              Add Player
            </button>
          </form>
          <table className="apt-player-table">
            <thead>
              <tr>
                <th>Player</th>
              </tr>
            </thead>
            <tbody>
              {currentPlayers.length > 0 ? (
                currentPlayers.map((player, index) => (
                  <tr key={player.player_id} className="apt-player-row">
                    <td className="apt-player-cell">
                      <PlayerCard
                        player={player}
                        index={index}
                        onClick={() => handlePlayerSelect(player)}
                        isSelected={selectedPlayer && selectedPlayer.player_id === player.player_id}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="apt-empty-message">No players available</td>
                </tr>
              )}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="apt-pagination">
              <button
                className="apt-pagination-btn"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                <svg className="apt-pagination-icon" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                </svg>
              </button>
              <span className="apt-pagination-current">{currentPage} / {totalPages}</span>
              <button
                className="apt-pagination-btn"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                <svg className="apt-pagination-icon" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
                </svg>
              </button>
            </div>
          )}
        </div>
        <div className="apt-roster-section">
          <h3 className="apt-section-title">Roster Preview</h3>
          {isLoadingRoster ? (
            <div className="apt-loading-message">Loading roster...</div>
          ) : rosterRules ? (
            <div className="apt-table-responsive">
              <table className="apt-roster-table">
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
                      className="apt-roster-row"
                      {...(slot.position !== 'BENCH' ? { 'data-position': slot.sPosition } : {})}
                    >
                      <td className="apt-slot-cell">{slot.position}</td>
                      <td className="apt-player-cell">
                        {slot.player ? (
                          <PlayerCard
                            player={slot.player}
                            index={slot.sPosition}
                            onClick={() => {}}
                            isSelected={false}
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
          ) : (
            <div className="apt-empty-message">Select a league member to view roster</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddPlayerToTeamComponent;