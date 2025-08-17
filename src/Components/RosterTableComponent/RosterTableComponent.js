import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../api';
import { getCurrentFantasyWeek, getGamesByWeekAndYear } from '../../api/seasonService';
import PlayerCard from '../PlayerCard/PlayerCard';
import './RosterTableComponent.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const RosterTableComponent = ({ currentUser, currentLeague }) => {
  const [rosterSlots, setRosterSlots] = useState([]);
  const [rosteredPlayers, setRosteredPlayers] = useState([]);
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isMessageFading, setIsMessageFading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [rosterRules, setRosterRules] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalPlayer, setModalPlayer] = useState(null);
  const [modalMode, setModalMode] = useState('playerInfo');
  const [leagueMemberId, setLeagueMemberId] = useState(null);

  // Transform rostered player data for consistency
  const transformRosteredPlayer = useCallback(rosteredPlayer => ({
    ...rosteredPlayer,
    player: {
      player_id: rosteredPlayer.player_id,
      player_name: rosteredPlayer.player_name || 'Unknown Player',
      position: rosteredPlayer.position || 'Unknown',
      team: rosteredPlayer.team || 'Unknown',
      is_injured: rosteredPlayer.is_injured || false,
    },
    roster_position: rosteredPlayer.roster_position ? rosteredPlayer.roster_position.toUpperCase() : 'BENCH',
  }), []);

  // Clear message after 3 seconds with fade-out
  useEffect(() => {
    if (message) {
      setIsMessageFading(false);
      const timer = setTimeout(() => {
        setIsMessageFading(true);
        setTimeout(() => {
          setMessage('');
          setMessageType('');
          setIsMessageFading(false);
        }, 500);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Validate if a player can be moved to a target slot
  const isValidMove = (player, targetPosition) => {
    if (!player || !player.player) {
      return false;
    }
    const playerPosition = player.player.position;
    const isInjured = player.player.is_injured; // Check injury status for IR slots
    switch (targetPosition) {
      case 'QB':
        return playerPosition === 'QB';
      case 'RB':
        return playerPosition === 'RB';
      case 'WR':
        return playerPosition === 'WR';
      case 'TE':
        return playerPosition === 'TE';
      case 'WRT':
        return ['WR', 'TE'].includes(playerPosition);
      case 'FLEX':
        return ['RB', 'WR', 'TE'].includes(playerPosition);
      case 'BENCH':
        return true;
      case 'IR':
        return isInjured;
      default:
        return false;
    }
  };

  // Construct roster slots from roster rules and rostered players
  useEffect(() => {
    if (rosterRules && rosteredPlayers.length > 0) {
      const constructRosterSlots = () => {
        const slots = [];
        const positionCounts = [
          { position: 'QB', count: rosterRules.quarterback_count || 0 },
          { position: 'RB', count: rosterRules.running_back_count || 0 },
          { position: 'WR', count: rosterRules.wide_receiver_count || 0 },
          { position: 'TE', count: rosterRules.tight_end_count || 0 },
          { position: 'WRT', count: rosterRules.wide_receiver_tight_end_count || 0 },
          { position: 'FLEX', count: rosterRules.flex_count || 0 },
          { position: 'BENCH', count: rosterRules.bench_count || 0 },
          { position: 'IR', count: rosterRules.ir_count || 0 },
        ];

        // Create all possible slots
        positionCounts.forEach(({ position, count }) => {
          for (let i = 0; i < count; i++) {
            const sPosition = `${position}${i + 1}`;
            slots.push({ position, sPosition, player: null });
          }
        });

        // Assign players to slots based on roster_position matching sPosition
        const assignedPlayers = [...rosteredPlayers];
        slots.forEach(slot => {
          const player = assignedPlayers.find(p => p.roster_position === slot.sPosition || (slot.position === 'BENCH' && p.roster_position === 'BENCH'));
          if (player) {
            slot.player = {
              name: player.player.player_name,
              playingPosition: player.player.position,
              team: player.player.team,
              schedule: player.schedule,
              is_injured: player.player.is_injured,
            };
            assignedPlayers.splice(assignedPlayers.indexOf(player), 1);
          }
        });

        // For any remaining players (beyond min BENCH), add extra BENCH rows above IR slots
        let irSlots = slots.filter(s => s.position === 'IR');
        let nonIrSlots = slots.filter(s => s.position !== 'IR');
        assignedPlayers.forEach(player => {
          nonIrSlots.push({
            position: 'BENCH',
            sPosition: `BENCH${nonIrSlots.filter(s => s.position === 'BENCH').length + 1}`,
            player: {
              name: player.player.player_name,
              playingPosition: player.player.position,
              team: player.player.team,
              schedule: player.schedule,
              is_injured: player.player.is_injured,
            },
          });
        });

        // --- BENCH row limiting logic ---
        // After all slots are created, limit empty BENCH rows to bench_count
        const benchCount = rosterRules.bench_count || 0;
  // (removed unused irOnly variable)
        let benchSlots = nonIrSlots.filter(s => s.position === 'BENCH');
        let nonBenchNonIrSlots = nonIrSlots.filter(s => s.position !== 'BENCH' && s.position !== 'IR');
        const filledBenchSlots = benchSlots.filter(s => s.player);
        const emptyBenchSlots = benchSlots.filter(s => !s.player);
        // Only keep up to bench_count empty BENCH slots
        const limitedEmptyBenchSlots = emptyBenchSlots.slice(0, benchCount);
        // Final slots: non-BENCH/non-IR + filled BENCH + limited empty BENCH + IR
        return [
          ...nonBenchNonIrSlots,
          ...filledBenchSlots,
          ...limitedEmptyBenchSlots,
          ...irSlots
        ];
      };

      const slots = constructRosterSlots();
      setRosterSlots(slots);
    }
  }, [rosterRules, rosteredPlayers]);

  // Fetch league member, roster rules, rostered players, and schedule data
  useEffect(() => {
    const fetchRosterData = async () => {
      if (!currentUser?.id || !currentLeague?.league_id) {
        setMessage('Invalid user or league data.');
        setMessageType('error');
        setIsLoading(false);
        return;
      }

      try {
        // Step 1: Fetch league member
        const memberResponse = await axiosInstance.get(`/league_members/getLeagueMembersByUserId/${currentUser.id}`);
        const members = Array.isArray(memberResponse.data) ? memberResponse.data : [];
        if (!members.length) {
          setMessage('No league members found for user.');
          setMessageType('error');
          setIsLoading(false);
          return;
        }

        const member = members.find(m => String(m.league_id) === String(currentLeague.league_id));
        if (!member) {
          setMessage('User is not a member of this league.');
          setMessageType('error');
          setIsLoading(false);
          return;
        }
        setLeagueMemberId(member.id);
        const isVamp = member.is_vamp;

        if (isVamp) {
          setMessage('Vampire league member detected. Special roster rules may apply.');
          setMessageType('info');
        }

        // Step 2: Fetch roster rules and rostered players
        const rosterTypeId = isVamp ? 2 : 1;
        const [rulesResponse, rosterResponse] = await Promise.all([
          axiosInstance.get(`/roster_rules/getRosterRulesByLeagueId/${currentLeague.league_id}/${rosterTypeId}`),
          axiosInstance.get(`/rostered_players/getRosteredPlayersByLeagueMemberId/${member.id}`),
        ]);

        const rules = rulesResponse.data && typeof rulesResponse.data === 'object' ? rulesResponse.data : null;
        if (!rules) {
          setMessage('No roster rules found for league.');
          setMessageType('error');
          setIsLoading(false);
          return;
        }
        setRosterRules(rules);

        const rosteredPlayersData = Array.isArray(rosterResponse.data) ? rosterResponse.data : [];
        // Transform rostered players to include player details and id
        const combinedRosteredPlayers = rosteredPlayersData.map(rosteredPlayer => ({
          ...transformRosteredPlayer(rosteredPlayer),
          id: rosteredPlayer.id,
        }));

        // Step 3: Fetch current fantasy week
        const weekResponse = await getCurrentFantasyWeek();
        if (weekResponse.status !== 'success') {
          throw new Error(weekResponse.message || 'Failed to fetch current fantasy week');
        }

        const { year, week } = weekResponse.data;

        // Step 4: Fetch NFL schedule for the current year and week
        const scheduleResponse = await getGamesByWeekAndYear(year, week);
        if (scheduleResponse.status !== 'success') {
          throw new Error(scheduleResponse.message || 'Failed to fetch NFL schedule');
        }
        const games = scheduleResponse.data || [];

        // Step 5: Add schedule data to each rostered player
        const updatedRosteredPlayers = combinedRosteredPlayers.map(player => {
          const game = games.find(g => g.team === player.player.team);
          if (game) {
            const dateObj = new Date(game.date);
            return {
              ...player,
              schedule: {
                date: game.date,
                day: dateObj.toLocaleString('en-US', { weekday: 'short' }),
                est_time: game.est_time || 'TBD',
                location: game.location || 'Unknown',
              },
            };
          }
          return { ...player, schedule: null };
        });


        // Step 6: Set rostered players state
        setRosteredPlayers(updatedRosteredPlayers);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching roster data:', {
          message: error.response?.data?.message || error.message,
          status: error.response?.status,
        });
        setMessage('Failed to load roster data.');
        setMessageType('error');
        setIsLoading(false);
      }
    };

    fetchRosterData();
  }, [currentUser, currentLeague, transformRosteredPlayer]);

  // Handle moving a player to a target slot or swapping
  const handleMovePlayer = async (sourceIndex, targetIndex) => {
    const sourcePlayer = rosterSlots[sourceIndex]?.player;
    const targetPlayer = rosterSlots[targetIndex]?.player;
    const sourceRosteredPlayer = rosteredPlayers.find(p => p.player.player_name === sourcePlayer?.name && p.player.position === sourcePlayer?.playingPosition);
    const targetRosteredPlayer = targetPlayer && rosteredPlayers.find(p => p.player.player_name === targetPlayer.name && p.player.position === targetPlayer.playingPosition);

    if (!sourceRosteredPlayer || !isValidMove(sourceRosteredPlayer, rosterSlots[targetIndex].position)) {
      setMessage('Invalid move.');
      setMessageType('error');
      setSelectedPlayerIndex(null);
      return;
    }

    try {
      // Move to empty slot
      if (!targetPlayer) {
        await axiosInstance.put(`/rostered_players/update/${sourceRosteredPlayer.id}`, {
          league_member_id: leagueMemberId,
          player_id: sourceRosteredPlayer.player.player_id,
          roster_position: rosterSlots[targetIndex].position === 'BENCH' ? 'BENCH' : rosterSlots[targetIndex].sPosition,
          is_rostered: 1,
        });
      } else {
        // Check if swap is possible
        const targetSlotValid = isValidMove(sourceRosteredPlayer, rosterSlots[targetIndex].position);
        const sourceSlotValid = isValidMove(targetRosteredPlayer, rosterSlots[sourceIndex].position);

        if (targetSlotValid && sourceSlotValid) {
          // Swap players
          await Promise.all([
            axiosInstance.put(`/rostered_players/update/${sourceRosteredPlayer.id}`, {
              league_member_id: leagueMemberId,
              player_id: sourceRosteredPlayer.player.player_id,
              roster_position: rosterSlots[targetIndex].position === 'BENCH' ? 'BENCH' : rosterSlots[targetIndex].sPosition,
              is_rostered: 1,
            }),
            axiosInstance.put(`/rostered_players/update/${targetRosteredPlayer.id}`, {
              league_member_id: leagueMemberId,
              player_id: targetRosteredPlayer.player.player_id,
              roster_position: rosterSlots[sourceIndex].position === 'BENCH' ? 'BENCH' : rosterSlots[sourceIndex].sPosition,
              is_rostered: 1,
            }),
          ]);
        } else {
          // Move source to target, target to BENCH (no empty bench slot required)
          await Promise.all([
            axiosInstance.put(`/rostered_players/update/${sourceRosteredPlayer.id}`, {
              league_member_id: leagueMemberId,
              player_id: sourceRosteredPlayer.player.player_id,
              roster_position: rosterSlots[targetIndex].position === 'BENCH' ? 'BENCH' : rosterSlots[targetIndex].sPosition,
              is_rostered: 1,
            }),
            axiosInstance.put(`/rostered_players/update/${targetRosteredPlayer.id}`, {
              league_member_id: leagueMemberId,
              player_id: targetRosteredPlayer.player.player_id,
              roster_position: 'BENCH',
              is_rostered: 1,
            }),
          ]);
        }
      }

      // Sync with backend
      const rosterResponse = await axiosInstance.get(`/rostered_players/getRosteredPlayersByLeagueMemberId/${leagueMemberId}`);
      const rosteredPlayersData = Array.isArray(rosterResponse.data) ? rosterResponse.data : [];
      const updatedRosteredPlayers = rosteredPlayersData.map(rosteredPlayer => {
        const existingPlayer = rosteredPlayers.find(p => p.player.player_id === rosteredPlayer.player_id);
        return {
          ...transformRosteredPlayer(rosteredPlayer),
          id: rosteredPlayer.id,
          schedule: existingPlayer?.schedule || null, // Preserve schedule data
        };
      });
      setRosteredPlayers(updatedRosteredPlayers);
      setMessage('Player moved successfully.');
      setMessageType('success');
      setSelectedPlayerIndex(null);
    } catch (error) {
      console.error('Error moving player:', error);
      setMessage('Failed to move player.');
      setMessageType('error');
      setSelectedPlayerIndex(null);
    }
  };

  // Handle moving a player to bench
  const handleMoveToBench = async () => {
    const sourcePlayer = modalPlayer;
    const sourceRosteredPlayer = rosteredPlayers.find(p => p.player.player_name === sourcePlayer.name && p.player.position === sourcePlayer.playingPosition);
    const benchSlot = rosterSlots.find(s => s.position === 'BENCH' && !s.player);

    if (!sourceRosteredPlayer || !benchSlot) {
      setMessage('No empty bench slot available.');
      setMessageType('error');
      setShowModal(false);
      return;
    }

    try {
      await axiosInstance.put(`/rostered_players/update/${sourceRosteredPlayer.id}`, {
        league_member_id: leagueMemberId,
        player_id: sourceRosteredPlayer.player.player_id,
        roster_position: 'BENCH',
        is_rostered: 1,
      });

      // Sync with backend
      const rosterResponse = await axiosInstance.get(`/rostered_players/getRosteredPlayersByLeagueMemberId/${leagueMemberId}`);
      const rosteredPlayersData = Array.isArray(rosterResponse.data) ? rosterResponse.data : [];
      const updatedRosteredPlayers = rosteredPlayersData.map(rosteredPlayer => {
        const existingPlayer = rosteredPlayers.find(p => p.player.player_id === rosteredPlayer.player_id);
        return {
          ...transformRosteredPlayer(rosteredPlayer),
          id: rosteredPlayer.id,
          schedule: existingPlayer?.schedule || null,
        };
      });
      setRosteredPlayers(updatedRosteredPlayers);
      setMessage('Player moved to bench.');
      setMessageType('success');
      setShowModal(false);
      setSelectedPlayerIndex(null);
    } catch (error) {
      console.error('Error moving player to bench:', error);
      setMessage('Failed to move player to bench.');
      setMessageType('error');
      setShowModal(false);
    }
  };

  // Handle dropping a player
  const handleDropPlayer = async () => {
    const sourcePlayer = modalPlayer;
    const sourceRosteredPlayer = rosteredPlayers.find(p => p.player.player_name === sourcePlayer.name && p.player.position === sourcePlayer.playingPosition);

    if (!sourceRosteredPlayer) {
      setMessage('Player not found.');
      setMessageType('error');
      setShowModal(false);
      return;
    }

    try {
      await axiosInstance.put(`/rostered_players/update/${sourceRosteredPlayer.id}`, {
        league_member_id: leagueMemberId,
        player_id: sourceRosteredPlayer.player.player_id,
        roster_position: sourceRosteredPlayer.roster_position,
        is_rostered: 0,
      });

      // Sync with backend
      const rosterResponse = await axiosInstance.get(`/rostered_players/getRosteredPlayersByLeagueMemberId/${leagueMemberId}`);
      const rosteredPlayersData = Array.isArray(rosterResponse.data) ? rosterResponse.data : [];
      const updatedRosteredPlayers = rosteredPlayersData.map(rosteredPlayer => {
        const existingPlayer = rosteredPlayers.find(p => p.player.player_id === rosteredPlayer.player_id);
        return {
          ...transformRosteredPlayer(rosteredPlayer),
          id: rosteredPlayer.id,
          schedule: existingPlayer?.schedule || null,
        };
      });
      setRosteredPlayers(updatedRosteredPlayers);
      setMessage('Player dropped successfully.');
      setMessageType('success');
      setShowModal(false);
      setSelectedPlayerIndex(null);
    } catch (error) {
      console.error('Error dropping player:', error);
      setMessage('Failed to drop player.');
      setMessageType('error');
      setShowModal(false);
    }
  };

  // Handle clicking a player or slot
  const handlePlayerClick = async (index) => {
    const rosterEntry = rosterSlots[index];

    if (selectedPlayerIndex === null) {
      // Select a player
      if (rosterEntry.player) {
        setSelectedPlayerIndex(index);
        setModalPlayer(rosterEntry.player);
      }
      return;
    }

    if (selectedPlayerIndex === index) {
      // Open modal for the same player
      if (rosterEntry.player) {
        setModalMode('playerInfo');
        setShowModal(true);
      } else {
        setSelectedPlayerIndex(null);
        setModalPlayer(null);
      }
      return;
    }

    // Attempt to move or swap players
    await handleMovePlayer(selectedPlayerIndex, index);
  };

  const initiateMoveToBench = () => {
    setModalMode('confirmBench');
  };

  const initiateDropPlayer = () => {
    setModalMode('confirmDrop');
  };

  const handleCancel = () => {
    setShowModal(false);
    setModalMode('playerInfo');
    setSelectedPlayerIndex(null);
  };

  if (isLoading) {
    return <div className="fantasy-roster-container">Loading...</div>;
  }

  if (!rosterSlots.length && messageType !== 'error') {
    return (
      <div className="fantasy-roster-container">
        <h3 className="roster-title">My Team</h3>
        <div className="message info">No roster data available.</div>
      </div>
    );
  }

  return (
    <div className="fantasy-roster-container">
      <h3 className="roster-title">My Team</h3>
      {message && (
        <div
          className={`message ${messageType} animate__animated ${
            isMessageFading ? 'animate__fadeOut' : 'animate__fadeIn'
          }`}
        >
          {message}
        </div>
      )}
      <div className="table-responsive">
        <table className="roster-table">
          <thead>
            <tr>
              <th>Slot</th>
              <th>Player</th>
            </tr>
          </thead>
          <tbody>
            {rosterSlots.map((rosterEntry, index) => {
              let highlight = false;
              // Only highlight if slot is empty, move is valid, and not the currently selected row
              if (
                selectedPlayerIndex !== null &&
                rosteredPlayers[selectedPlayerIndex] &&
                !rosterEntry.player &&
                isValidMove(rosteredPlayers[selectedPlayerIndex], rosterEntry.position) &&
                selectedPlayerIndex !== index
              ) {
                highlight = true;
              }
              return (
                <tr
                  key={rosterEntry.sPosition}
                  className={`roster-row${selectedPlayerIndex === index ? ' selected-player' : ''}`}
                  {...(rosterEntry.position !== 'BENCH' ? { 'data-position': rosterEntry.sPosition } : {})}
                >
                  <td className="slot-cell">{rosterEntry.position}</td>
                  <td className={`player-cell${highlight ? ' valid-target' : ''}`}>
                    {rosterEntry.player ? (
                      <PlayerCard
                        player={rosterEntry.player}
                        index={index}
                        onClick={handlePlayerClick}
                        isSelected={selectedPlayerIndex === index}
                      />
                    ) : (
                      <div className="empty-slot" onClick={() => handlePlayerClick(index)}>
                        Empty
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            {modalMode === 'playerInfo' && (
              <>
                <h3 className="modal-title">Player Information</h3>
                <p><strong>Name:</strong> {modalPlayer.name}</p>
                <p><strong>Position:</strong> {modalPlayer.playingPosition}</p>
                <p><strong>Team:</strong> {modalPlayer.team}</p>
                {modalPlayer.schedule && (
                  <div>
                    <p><strong>Game:</strong> {modalPlayer.schedule.day}, {modalPlayer.schedule.date} at {modalPlayer.schedule.est_time}</p>
                    <p><strong>Location:</strong> {modalPlayer.schedule.location}</p>
                  </div>
                )}
                <div className="modal-buttons">
                  <button className="close-modal-btn" onClick={handleCancel}>
                    Close
                  </button>
                  <button className="move-bench-btn" onClick={initiateMoveToBench}>
                    Move to Bench
                  </button>
                  <button className="drop-player-btn" onClick={initiateDropPlayer}>
                    Drop Player
                  </button>
                </div>
              </>
            )}
            {modalMode === 'confirmDrop' && (
              <>
                <h3 className="modal-title">Confirm Drop Player</h3>
                <p>Are you sure you want to drop {modalPlayer.name}?</p>
                <div className="modal-buttons">
                  <button className="confirm-btn" onClick={handleDropPlayer}>
                    Confirm
                  </button>
                  <button className="cancel-btn" onClick={handleCancel}>
                    Cancel
                  </button>
                </div>
              </>
            )}
            {modalMode === 'confirmBench' && (
              <>
                <h3 className="modal-title">Confirm Move to Bench</h3>
                <p>Are you sure you want to move {modalPlayer.name} to the bench?</p>
                <div className="modal-buttons">
                  <button className="confirm-btn" onClick={handleMoveToBench}>
                    Confirm
                  </button>
                  <button className="cancel-btn" onClick={handleCancel}>
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RosterTableComponent;