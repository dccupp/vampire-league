import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PlayerCard from '../PlayerCard/PlayerCard';
import './RosterTableComponent.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const RosterTableComponent = ({ currentUser, currentLeague }) => {
  const [rosterSlots, setRosterSlots] = useState([]);
  const [rosteredPlayers, setRosteredPlayers] = useState([]);
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [leagueMemberId, setLeagueMemberId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rosterRules, setRosterRules] = useState(null);

  // Fetch league member ID
  useEffect(() => {
    const fetchLeagueMemberId = async () => {
      if (!currentUser?.id || !currentLeague?.league_id) {
        setMessage('Invalid user or league data.');
        setMessageType('error');
        setIsLoading(false);
        return;
      }
      try {
        const response = await axios.get(`http://localhost:3000/league_members/getLeagueMembersByUserId/${currentUser.id}`);
        const member = response.data.find(m => m.league_id === currentLeague.league_id);
        if (member) {
          setLeagueMemberId(member.id);
        } else {
          setMessage('User is not a member of this league.');
          setMessageType('error');
        }
      } catch (error) {
        console.error('Error fetching league member ID:', error);
        setMessage('Failed to load league member data.');
        setMessageType('error');
      }
      setIsLoading(false);
    };
    fetchLeagueMemberId();
  }, [currentUser, currentLeague]);

  // Fetch roster rules
  useEffect(() => {
    const fetchRosterRules = async () => {
      if (currentLeague?.league_id) {
        try {
          const response = await axios.get(`http://localhost:3000/roster_rules/getRosterRulesByLeagueId/${currentLeague.league_id}/1`);
          setRosterRules(response.data);
        } catch (error) {
          console.error('Error fetching roster rules:', error);
          setMessage('Failed to load roster rules.');
          setMessageType('error');
        }
      }
    };
    fetchRosterRules();
  }, [currentLeague]);

  // Fetch rostered players and construct roster slots
  useEffect(() => {
    const fetchRosteredPlayers = async () => {
      if (leagueMemberId && rosterRules) {
        try {
          const response = await axios.get(`http://localhost:3000/rostered_players/getRosteredPlayersByLeagueMemberId/${leagueMemberId}`);
          setRosteredPlayers(response.data);
          if (response.data.length === 0) {
            setMessage('No players rostered yet.');
            setMessageType('info');
          } else {
            setMessage('');
          }
          const slots = constructRosterSlots(rosterRules, response.data);
          setRosterSlots(slots);
        } catch (error) {
          console.error('Error fetching rostered players:', error);
          setMessage('Failed to load rostered players.');
          setMessageType('error');
        }
      }
    };
    fetchRosteredPlayers();
  }, [leagueMemberId, rosterRules]);

  // Construct roster slots based on rules and players
  const constructRosterSlots = (rules, players) => {
    const slots = [];
    const positions = [
      { key: 'quarterback_count', position: 'QB', allowed: ['QB'] },
      { key: 'running_back_count', position: 'RB', allowed: ['RB'] },
      { key: 'wide_receiver_count', position: 'WR', allowed: ['WR'] },
      { key: 'tight_end_count', position: 'TE', allowed: ['TE'] },
      { key: 'flex_count', position: 'FLEX', allowed: ['RB', 'WR', 'TE'] },
    ];

    // Add starting positions
    positions.forEach(({ key, position, allowed }) => {
      const count = rules[key] || 0;
      for (let i = 1; i <= count; i++) {
        slots.push({
          sPosition: `${position}${i}`,
          position,
          data: { sPosition: `${position}${i}`, allowedPositions: allowed },
          player: null
        });
      }
    });

    // Handle BENCH slots
    const benchPlayers = players.filter(p => p.roster_position === 'BENCH');
    const benchCount = rules.bench_count || 0;
    const totalBenchSlots = Math.max(benchPlayers.length, benchCount);
    for (let i = 1; i <= totalBenchSlots; i++) {
      slots.push({
        sPosition: `BENCH${i}`,
        position: 'BENCH',
        data: { sPosition: `BENCH${i}`, allowedPositions: ['QB', 'RB', 'WR', 'TE', 'DEF', 'K'] },
        player: null
      });
    }

    // Assign players to slots
    const availablePlayers = [...players];
    slots.forEach(slot => {
      const player = availablePlayers.find(p => p.roster_position === slot.sPosition || (slot.position === 'BENCH' && p.roster_position === 'BENCH'));
      if (player) {
        slot.player = {
          name: player.player_name,
          playingPosition: player.position,
          team: player.team,
          slot: slot.sPosition
        };
        availablePlayers.splice(availablePlayers.indexOf(player), 1);
      }
    });

    return slots;
  };

  // Get eligible slots for a player
  const getEligibleSlots = (playerIndex) => {
    if (playerIndex == null || !rosterSlots[playerIndex]?.player) return [];
    const { playingPosition } = rosterSlots[playerIndex].player;
    return rosterSlots.reduce((eligible, slot, index) => {
      if (slot.data.allowedPositions.includes(playingPosition)) {
        eligible.push(index);
      }
      return eligible;
    }, []);
  };

  // Handle player click for selection or movement
  const handlePlayerClick = async (index) => {
    if (selectedPlayerIndex == null) {
      if (rosterSlots[index]?.player) {
        setSelectedPlayerIndex(index);
      }
      return;
    }

    const sourcePlayer = rosterSlots[selectedPlayerIndex].player;
    const targetPlayer = rosterSlots[index]?.player;
    const eligibleSlots = getEligibleSlots(selectedPlayerIndex);

    if (!eligibleSlots.includes(index)) {
      setSelectedPlayerIndex(null);
      return;
    }

    try {
      const sourcePlayerId = rosteredPlayers.find(p => p.player_name === sourcePlayer.name && p.position === sourcePlayer.playingPosition)?.player_id;
      const targetPlayerId = targetPlayer && rosteredPlayers.find(p => p.player_name === targetPlayer.name && p.position === targetPlayer.playingPosition)?.player_id;

      if (!targetPlayer) {
        // Move to empty slot
        await axios.put(`http://localhost:3000/rostered_players/update/${rosteredPlayers.find(p => p.player_id === sourcePlayerId).id}`, {
          league_member_id: leagueMemberId,
          player_id: sourcePlayerId,
          roster_position: rosterSlots[index].position === 'BENCH' ? 'BENCH' : rosterSlots[index].sPosition,
          is_rostered: 1
        });
      } else {
        // Handle occupied slot
        const sourcePosition = sourcePlayer.playingPosition;
        const targetPosition = targetPlayer.playingPosition;
        const targetRowAllowed = rosterSlots[index].data.allowedPositions;
        const sourceRowAllowed = rosterSlots[selectedPlayerIndex].data.allowedPositions;

        if (sourcePosition === targetPosition || (targetRowAllowed.includes(sourcePosition) && sourceRowAllowed.includes(targetPosition))) {
          // Swap players
          await axios.put(`http://localhost:3000/rostered_players/update/${rosteredPlayers.find(p => p.player_id === sourcePlayerId).id}`, {
            league_member_id: leagueMemberId,
            player_id: sourcePlayerId,
            roster_position: rosterSlots[index].position === 'BENCH' ? 'BENCH' : rosterSlots[index].sPosition,
            is_rostered: 1
          });
          await axios.put(`http://localhost:3000/rostered_players/update/${rosteredPlayers.find(p => p.player_id === targetPlayerId).id}`, {
            league_member_id: leagueMemberId,
            player_id: targetPlayerId,
            roster_position: rosterSlots[selectedPlayerIndex].position === 'BENCH' ? 'BENCH' : rosterSlots[selectedPlayerIndex].sPosition,
            is_rostered: 1
          });
        } else {
          // Move source to target, target to BENCH
          await axios.put(`http://localhost:3000/rostered_players/update/${rosteredPlayers.find(p => p.player_id === sourcePlayerId).id}`, {
            league_member_id: leagueMemberId,
            player_id: sourcePlayerId,
            roster_position: rosterSlots[index].position === 'BENCH' ? 'BENCH' : rosterSlots[index].sPosition,
            is_rostered: 1
          });
          await axios.put(`http://localhost:3000/rostered_players/update/${rosteredPlayers.find(p => p.player_id === targetPlayerId).id}`, {
            league_member_id: leagueMemberId,
            player_id: targetPlayerId,
            roster_position: 'BENCH',
            is_rostered: 1
          });
        }
      }

      // Sync with backend
      const response = await axios.get(`http://localhost:3000/rostered_players/getRosteredPlayersByLeagueMemberId/${leagueMemberId}`);
      setRosteredPlayers(response.data);
      const updatedSlots = constructRosterSlots(rosterRules, response.data);
      setRosterSlots(updatedSlots);
      setSelectedPlayerIndex(null);
    } catch (error) {
      console.error('Error moving player:', error);
      setMessage('Failed to move player.');
      setMessageType('error');
    }
  };

  if (isLoading) {
    return <div className="fantasy-roster-container">Loading roster data...</div>;
  }

  if (!rosterSlots.length || messageType === 'error') {
    return <div className="fantasy-roster-container">{message || 'Error: Invalid roster structure.'}</div>;
  }

  const eligibleSlots = getEligibleSlots(selectedPlayerIndex);

  return (
    <div className="fantasy-roster-container animate__animated animate__fadeIn">
      <h2 className="roster-title">{currentLeague?.name ? `${currentLeague.name} Roster` : 'Team Roster'}</h2>
      {message && <div className={`message ${messageType}`}>{message}</div>}
      <div className="table-responsive">
        <table className="roster-table">
          <thead>
            <tr>
              <th>Slot</th>
              <th>Player</th>
            </tr>
          </thead>
          <tbody>
            {rosterSlots.map((rosterEntry, index) => (
              <tr
                key={rosterEntry.sPosition}
                className="roster-row"
                {...(rosterEntry.position !== 'BENCH' ? { 'data-position': rosterEntry.sPosition } : {})}
              >
                <td className="slot-cell">{rosterEntry.position}</td>
                <td className={`player-cell ${eligibleSlots.includes(index) ? 'slot-eligible' : ''}`}>
                  {rosterEntry.player ? (
                    <PlayerCard
                      player={rosterEntry.player}
                      index={index}
                      onClick={handlePlayerClick}
                    />
                  ) : (
                    <div
                      className="empty-slot"
                      onClick={() => handlePlayerClick(index)}
                    >
                      Empty
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RosterTableComponent;