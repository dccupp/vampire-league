import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PlayerCard from '../../PlayerCard/PlayerCard';
import './AddPlayerToTeamComponent.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const AddPlayerToTeamComponent = ({ currentUser, currentLeague }) => {
  const [playerName, setPlayerName] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [players, setPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [leagueMembers, setLeagueMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [rosterRules, setRosterRules] = useState(null);
  const [rosterSlots, setRosterSlots] = useState([]);
  const [rosteredPlayers, setRosteredPlayers] = useState([]);
  const [leagueRosteredPlayerIds, setLeagueRosteredPlayerIds] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // Fetch all players for autocomplete
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await axios.get('http://localhost:3000/players/getPlayers');
        setPlayers(response.data);
      } catch (error) {
        console.error('Error fetching players:', error);
        setMessage('Failed to load players.');
        setMessageType('error');
      }
    };
    fetchPlayers();
  }, []);

  // Fetch league members for dropdown
  useEffect(() => {
    const fetchLeagueMembers = async () => {
      if (currentLeague?.league_id) {
        try {
          const response = await axios.get(`http://localhost:3000/league_members/getLeagueMembersByLeagueId/${currentLeague.league_id}`);
          setLeagueMembers(response.data);
        } catch (error) {
          console.error('Error fetching league members:', error);
          setMessage('Failed to load league members.');
          setMessageType('error');
        }
      }
    };
    fetchLeagueMembers();
  }, [currentLeague]);

  // Fetch roster rules and construct roster slots
  useEffect(() => {
    const fetchRosterRules = async () => {
      if (currentLeague?.league_id) {
        try {
          const response = await axios.get(`http://localhost:3000/roster_rules/getRosterRulesByLeagueId/${currentLeague.league_id}/1`);
          setRosterRules(response.data);
          // Construct roster slots based on roster rules
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
            const count = response.data[key] || 0;
            for (let i = 1; i <= count; i++) {
              slots.push({ sPosition: `${position}${i}`, position });
            }
          });
          setRosterSlots(slots);
        } catch (error) {
          console.error('Error fetching roster rules:', error);
          setMessage('Failed to load roster rules.');
          setMessageType('error');
        }
      }
    };
    fetchRosterRules();
  }, [currentLeague]);

  // Fetch rostered player IDs for the entire league
  useEffect(() => {
    const fetchLeagueRosteredPlayers = async () => {
      if (currentLeague?.league_id) {
        try {
          const response = await axios.get(`http://localhost:3000/rostered_players/getRosteredPlayersByLeagueId/${currentLeague.league_id}`);
          const rosteredPlayerIds = response.data
            .filter(player => player.is_rostered === 1)
            .map(player => player.player_id);
          setLeagueRosteredPlayerIds(rosteredPlayerIds);
        } catch (error) {
          console.error('Error fetching league rostered players:', error);
          setMessage('Failed to load league rostered players.');
          setMessageType('error');
        }
      }
    };
    fetchLeagueRosteredPlayers();
  }, [currentLeague]);

  // Fetch rostered players for selected member
  useEffect(() => {
    const fetchRosteredPlayers = async () => {
      if (selectedMember) {
        try {
          const response = await axios.get(`http://localhost:3000/rostered_players/getRosteredPlayersByLeagueMemberId/${selectedMember}`);
          console.log('Retrieved rostered players for selected member:', response.data);
          setRosteredPlayers(response.data);
          if (response.data.length === 0) {
            setMessage('No players rostered yet.');
            setMessageType('info');
          } else {
            setMessage('');
          }
        } catch (error) {
          console.error('Error fetching rostered players:', error);
          setMessage('Failed to load rostered players.');
          setMessageType('error');
        }
      } else {
        setRosteredPlayers([]);
      }
    };
    fetchRosteredPlayers();
  }, [selectedMember]);

  // Handle autocomplete filtering
  const handlePlayerNameChange = (e) => {
    const value = e.target.value;
    setPlayerName(value);
    if (value.length > 0) {
      const filtered = players.filter(
        player =>
          player.player_name.toLowerCase().includes(value.toLowerCase()) &&
          !leagueRosteredPlayerIds.includes(player.player_id)
      );
      setFilteredPlayers(filtered);
    } else {
      setFilteredPlayers([]);
    }
  };

  // Handle player selection
  const handlePlayerSelect = (player) => {
    setSelectedPlayer(player);
    setPlayerName(player.player_name);
    setFilteredPlayers([]);
  };

  // Handle league member selection
  const handleMemberSelect = (e) => {
    const memberId = e.target.value;
    setSelectedMember(memberId);
    const selectedMemberRecord = leagueMembers.find(member => member.id === parseInt(memberId));
    console.log('Selected league member record:', selectedMemberRecord);
  };

  // Find the first available slot for a player
  const findAvailableSlot = (playerPosition) => {
    const assignedPositions = rosteredPlayers
      .filter(player => player.is_rostered === 1 && player.roster_position)
      .map(player => player.roster_position);
    console.log('Assigned roster positions:', assignedPositions);
    const allowedPositions = playerPosition === 'RB' || playerPosition === 'WR' || playerPosition === 'TE' ? [playerPosition, 'FLEX', 'BENCH'] :
                            playerPosition === 'QB' || playerPosition === 'DEF' || playerPosition === 'K' ? [playerPosition, 'BENCH'] :
                            [playerPosition];

    for (const slot of rosterSlots) {
      if (!assignedPositions.includes(slot.sPosition) && allowedPositions.includes(slot.position)) {
        const rosterPosition = slot.position === 'BENCH' ? 'BENCH' : slot.sPosition;
        console.log(`Found available slot for ${playerPosition}: ${rosterPosition}`);
        return rosterPosition;
      }
    }
    console.log(`No available slot for ${playerPosition}`);
    return null;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlayer || !selectedMember) {
      setMessage('Please select a player and a league member.');
      setMessageType('error');
      return;
    }

    // Check if player is already rostered in the league
    if (leagueRosteredPlayerIds.includes(selectedPlayer.player_id)) {
      setMessage('This player is already rostered by another league member.');
      setMessageType('error');
      return;
    }

    // Check if max roster size is reached
    const currentRosterCount = rosteredPlayers.filter(player => player.is_rostered === 1).length;
    const maxRosterSize = rosterRules?.max_roster_size || 13;
    if (currentRosterCount >= maxRosterSize) {
      setMessage('Roster is full. Maximum roster size reached.');
      setMessageType('error');
      return;
    }

    // Find available slot for the player
    const rosterPosition = findAvailableSlot(selectedPlayer.position);
    if (!rosterPosition) {
      setMessage('No available roster slot for this player\'s position.');
      setMessageType('error');
      return;
    }

    try {
      const response = await axios.post('http://localhost:3000/rostered_players/create', {
        league_member_id: selectedMember,
        player_id: selectedPlayer.player_id,
        roster_position: rosterPosition,
        is_rostered: 1
      });
      if (response.data.status === 'success') {
        setMessage('Player added successfully.');
        setMessageType('success');
        // Refetch rostered players
        const rosterResponse = await axios.get(`http://localhost:3000/rostered_players/getRosteredPlayersByLeagueMemberId/${selectedMember}`);
        console.log('Retrieved rostered players after adding:', rosterResponse.data);
        setRosteredPlayers(rosterResponse.data);
        // Update league rostered player IDs
        setLeagueRosteredPlayerIds([...leagueRosteredPlayerIds, selectedPlayer.player_id]);
        // Clear selection
        setSelectedPlayer(null);
        setPlayerName('');
      } else {
        setMessage(response.data.message || 'Failed to add player.');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error adding player:', error);
      setMessage('Error adding player: ' + (error.response?.data?.message || error.message));
      setMessageType('error');
    }
  };

  // Assign rostered players to slots
  const assignPlayersToSlots = () => {
    const assignedSlots = [...rosterSlots];
    const availablePlayers = [...rosteredPlayers.filter(player => player.is_rostered === 1)];

    console.log('Assigning players to slots. Available players:', availablePlayers);
    console.log('Available slots:', rosterSlots.map(slot => slot.sPosition));

    assignedSlots.forEach(slot => {
      slot.player = null; // Initialize slot as empty
      let player = null;
      if (slot.position === 'BENCH') {
        // Assign BENCH players to the first available BENCH slot
        player = availablePlayers.find(p => p.roster_position === 'BENCH');
        if (player) {
          console.log(`Assigning player ${player.player_name} to BENCH slot ${slot.sPosition}`);
          slot.player = {
            name: player.player_name,
            playingPosition: player.position,
            team: player.team
          };
          // Remove assigned player
          const playerIndex = availablePlayers.findIndex(p => p.roster_position === 'BENCH');
          if (playerIndex !== -1) {
            availablePlayers.splice(playerIndex, 1);
          }
        }
      } else {
        // Match non-BENCH players by exact roster_position
        player = availablePlayers.find(p => p.roster_position === slot.sPosition);
        if (player) {
          console.log(`Assigning player ${player.player_name} to slot ${slot.sPosition}`);
          slot.player = {
            name: player.player_name,
            playingPosition: player.position,
            team: player.team
          };
          // Remove assigned player
          const playerIndex = availablePlayers.findIndex(p => p.roster_position === slot.sPosition);
          if (playerIndex !== -1) {
            availablePlayers.splice(playerIndex, 1);
          }
        }
      }
    });

    console.log('Assigned slots:', assignedSlots.map(slot => ({
      sPosition: slot.sPosition,
      player: slot.player ? slot.player.name : null
    })));

    return assignedSlots;
  };

  const populatedSlots = assignPlayersToSlots();

  return (
    <div className="add-player-container">
      <div className="content-wrapper">
        <div className="add-player-form animate__animated animate__fadeIn">
          <h3>Add Player to Team</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="vampire-label">Player Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter player name"
                value={playerName}
                onChange={handlePlayerNameChange}
                autoComplete="off"
              />
              {filteredPlayers.length > 0 && (
                <ul className="autocomplete-list">
                  {filteredPlayers.map(player => (
                    <li
                      key={player.player_id}
                      onClick={() => handlePlayerSelect(player)}
                    >
                      {player.player_name} ({player.position}, {player.team})
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="form-group">
              <label className="vampire-label">League Member</label>
              <select
                className="form-control"
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
            </div>
            <button
              type="submit"
              className="btn-success"
              disabled={!playerName || !selectedMember}
            >
              Add Player
            </button>
          </form>
          {message && (
            <div className={`message ${messageType}`}>
              {message}
            </div>
          )}
        </div>
        {rosterRules && (
          <div className="roster-table-container animate__animated animate__fadeIn">
            <h3>Roster Preview</h3>
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