import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import axiosInstance from '../../api';
import { getCurrentFantasyWeek, getGamesByWeekAndYear } from '../../api/seasonService';
import { CurrentUser, CurrentLeague, LeagueMember, RosterRules, RosteredPlayer, RosterSlot, NFLGame } from '../../types';
import { useUser } from '../../context/UserContext';
import { useLeague } from '../../context/LeagueContext';
import './RosterComponent.css';
import PlayerCard from '../PlayerCard/PlayerCard';

const RosterComponent = () => {
  const { currentUser } = useUser();
  const { currentLeague } = useLeague();
  const [leagueMember, setLeagueMember] = useState<LeagueMember | null>(null);
  const [rosterRules, setRosterRules] = useState<RosterRules | null>(null);
  const [rosteredPlayers, setRosteredPlayers] = useState<RosteredPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leagueMemberId, setLeagueMemberId] = useState<number | null>(null);
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState<number | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isMessageFading, setIsMessageFading] = useState(false);

  useEffect(() => {
    if (message && (messageType === 'success' || messageType === 'error')) {
      setIsMessageFading(false);
      const fadeTimer = setTimeout(() => setIsMessageFading(true), 2500);
      const clearTimer = setTimeout(() => {
        setMessage('');
        setMessageType('');
        setIsMessageFading(false);
      }, 3000);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(clearTimer);
      };
    }
  }, [message, messageType]);

  useEffect(() => {
    const fetchRosterData = async () => {
      if (!currentUser?.id || !currentLeague?.league_id) {
        setError('Missing user or league information.');
        setIsLoading(false);
        return;
      }

      try {
        // Step 1: Fetch the current user's league member record
        const memberResponse = await axiosInstance.get<LeagueMember>(
          `/league_members/getLeagueMemberByLeagueAndUserId/${currentLeague.league_id}/${currentUser.id}`
        );
        const member = memberResponse.data;
        setLeagueMember(member);
        setLeagueMemberId(member.id);

        // Step 2: With member in hand, fetch roster rules, rostered players,
        // and current fantasy week all at once — none depend on each other
        const rosterTypeId = member.is_vamp ? 2 : 1;
        const [rulesResponse, rosterResponse, weekResponse] = await Promise.all([
          axiosInstance.get(`/roster_rules/getRosterRulesByLeagueId/${currentLeague.league_id}/${rosterTypeId}`),
          axiosInstance.get(`/rostered_players/getRosteredPlayersByLeagueMemberId/${member.id}`),
          getCurrentFantasyWeek(),
        ]);

        setRosterRules(rulesResponse.data);

        const { year, week } = weekResponse.data;

        // Step 3: Fetch NFL schedule now that we have year and week
        const scheduleResponse = await getGamesByWeekAndYear(year, week);
        const games: NFLGame[] = scheduleResponse.data || [];

        // Step 4: Map schedule data onto each rostered player
        const players: RosteredPlayer[] = Array.isArray(rosterResponse.data) ? rosterResponse.data : [];
        const playersWithSchedule = players.map(player => {
          const game = games.find(g => g.team === player.team);
          return {
            ...player,
            schedule: game ? {
              date: game.date,
              day: game.day,
              est_time: game.est_time || 'TBD',
              location: game.location || 'Unknown',
            } : null,
          };
        });

        setRosteredPlayers(playersWithSchedule);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.message || err.message || 'Failed to load roster data.');
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to load roster data.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchRosterData();
  }, [currentUser?.id, currentLeague?.league_id]);


  const rosterSlots = useMemo(() => {

    if (!rosterRules) return [];

    const positionCounts = [
      { position: 'QB',    count: rosterRules.quarterback_count             || 0 },
      { position: 'RB',    count: rosterRules.running_back_count            || 0 },
      { position: 'WR',    count: rosterRules.wide_receiver_count           || 0 },
      { position: 'TE',    count: rosterRules.tight_end_count               || 0 },
      { position: 'WRT',   count: rosterRules.wide_receiver_tight_end_count || 0 },
      { position: 'FLEX',  count: rosterRules.flex_count                    || 0 },
      { position: 'BENCH', count: rosterRules.bench_count                   || 0 },
      { position: 'IR',    count: rosterRules.ir_count                      || 0 },
    ];
    const slots: RosterSlot[] = [];

    positionCounts.forEach(({ position, count }) => {
      for (let i = 0; i < count; i++) {
        slots.push({ position, sPosition: `${position}${i + 1}`, player: null });
      }
    });
    // if rosteredPlayers is empty... return slots in it's current form
    if (rosteredPlayers.length === 0) return slots;

    const normalized = rosteredPlayers.map(p => ({
      ...p,
      roster_position: p.roster_position ? p.roster_position.toUpperCase() : 'BENCH',
    }));

    const unassigned = [...normalized];

    slots.forEach(slot => {
      const idx = unassigned.findIndex(p => p.roster_position === slot.sPosition);
      if (idx !== -1) {
        const p = unassigned[idx];
        slot.player = p;
        unassigned.splice(idx, 1);
      }
    });

    const irSlots = slots.filter(s => s.position === 'IR');
    const nonIrSlots = slots.filter(s => s.position !== 'IR');

    unassigned.forEach(p => {
      nonIrSlots.push({
        position: 'BENCH',
        sPosition: `BENCH${nonIrSlots.filter(s => s.position === 'BENCH').length + 1}`,
        player: p,
      });
    });

    const benchCount = rosterRules.bench_count || 0;
    const nonBenchNonIr = nonIrSlots.filter(s => s.position !== 'BENCH');
    const filledBench   = nonIrSlots.filter(s => s.position === 'BENCH' && s.player);
    const emptyBenchCount = Math.max(0, benchCount - filledBench.length);
    const emptyBench    = nonIrSlots.filter(s => s.position === 'BENCH' && !s.player).slice(0, emptyBenchCount);

    return [...nonBenchNonIr, ...filledBench, ...emptyBench, ...irSlots];
  }, [rosterRules, rosteredPlayers]);


  const handlePlayerClick = (index: number | string) => {
    const numIndex = typeof index === 'string' ? parseInt(index, 10) : index;
    const slot = rosterSlots[numIndex];

    if (selectedPlayerIndex === null) {
      if (slot.player) {
        setSelectedPlayerIndex(numIndex);
        setMessage(`Move ${slot.player.player_name} where?`);
        setMessageType('question');
      }
      return;
    }

    if (selectedPlayerIndex === numIndex) {
      setIsActionModalOpen(true);
      setMessage('');
      setMessageType('');
      return;
    }

    // if these two parameter values do not equal each other... handleMovePlayer is called
    handleMovePlayer(selectedPlayerIndex, numIndex);
  };


  const closeModal = () => {
    setIsActionModalOpen(false);
    setSelectedPlayerIndex(null);
  };

  const handleDropPlayer = async () => {
    if (selectedPlayerIndex === null || !leagueMemberId) return;
    const player = rosterSlots[selectedPlayerIndex]?.player;
    const rosteredPlayer = rosteredPlayers.find(p => p.player_id === player?.player_id);
    if (!player || !rosteredPlayer) return;

    try {
      await axiosInstance.put(`/rostered_players/update/${rosteredPlayer.id}`, {
        league_member_id: leagueMemberId,
        player_id: rosteredPlayer.player_id,
        roster_position: rosteredPlayer.roster_position,
        is_rostered: 0,
      });
      const rosterResponse = await axiosInstance.get(`/rostered_players/getRosteredPlayersByLeagueMemberId/${leagueMemberId}`);
      const fresh: RosteredPlayer[] = Array.isArray(rosterResponse.data) ? rosterResponse.data : [];
      setRosteredPlayers(fresh.map(p => ({
        ...p,
        roster_position: p.roster_position ? p.roster_position.toUpperCase() : 'BENCH1',
        schedule: rosteredPlayers.find(existing => existing.player_id === p.player_id)?.schedule || null,
      })));

      setMessage(`${player.player_name} has been dropped.`);
      setMessageType('success');
    } catch (err) {
      setMessage(axios.isAxiosError(err) ? err.response?.data?.message || 'Failed to drop player.' : 'Failed to drop player.');
      setMessageType('error');
    } finally {
      closeModal();
    }
  };

  const handleMoveToBench = async () => {
    if (selectedPlayerIndex === null || !leagueMemberId) return;
    const player = rosterSlots[selectedPlayerIndex]?.player;
    const rosteredPlayer = rosteredPlayers.find(p => p.player_id === player?.player_id);
    if (!player || !rosteredPlayer) return;

    const openBench = rosterSlots.find(s => s.position === 'BENCH' && !s.player);
    const benchPosition = openBench ? openBench.sPosition : 'BENCH';

    try {
      await axiosInstance.put(`/rostered_players/update/${rosteredPlayer.id}`, {
        league_member_id: leagueMemberId,
        player_id: rosteredPlayer.player_id,
        roster_position: benchPosition,
        is_rostered: 1,
      });
      const rosterResponse = await axiosInstance.get(`/rostered_players/getRosteredPlayersByLeagueMemberId/${leagueMemberId}`);
      const fresh: RosteredPlayer[] = Array.isArray(rosterResponse.data) ? rosterResponse.data : [];
      setRosteredPlayers(fresh.map(p => ({
        ...p,
        roster_position: p.roster_position ? p.roster_position.toUpperCase() : 'BENCH1',
        schedule: rosteredPlayers.find(existing => existing.player_id === p.player_id)?.schedule || null,
      })));
      setMessage(`${player.player_name} moved to bench.`);
      setMessageType('success');
    } catch (err) {
      setMessage(axios.isAxiosError(err) ? err.response?.data?.message || 'Failed to move player.' : 'Failed to move player.');
      setMessageType('error');
    } finally {
      closeModal();
    }
  };

  const isValidMove = (player: RosteredPlayer | null, targetPosition: string): boolean => {
    if (!player) return false;
    switch (targetPosition) {
      case 'QB':    return player.position === 'QB';
      case 'RB':    return player.position === 'RB';
      case 'WR':    return player.position === 'WR';
      case 'TE':    return player.position === 'TE';
      case 'WRT':   return ['WR', 'TE'].includes(player.position);
      case 'FLEX':  return ['RB', 'WR', 'TE'].includes(player.position);
      case 'BENCH': return true;
      case 'IR':    return player.is_injured === true;
      default:      return false;
    }
  };

  const handleMovePlayer = async (sourceIndex: number, targetIndex: number) => {
    const sourceSlot = rosterSlots[sourceIndex];
    const targetSlot = rosterSlots[targetIndex];
    const sourcePlayer = sourceSlot.player;
    const targetPlayer = targetSlot.player;

    const sourceRosteredPlayer = rosteredPlayers.find(p => p.player_id === sourcePlayer?.player_id);
    const targetRosteredPlayer = targetPlayer
      ? rosteredPlayers.find(p => p.player_id === targetPlayer.player_id)
      : null;

    if (!sourcePlayer || !sourceRosteredPlayer || !leagueMemberId) {
      setMessage('Invalid player or league data.');
      setMessageType('error');
      setSelectedPlayerIndex(null);
      return;
    }

    if (!isValidMove(sourcePlayer, targetSlot.position)) {
      setMessage(`${sourcePlayer.player_name} cannot play ${targetSlot.position}.`);
      setMessageType('error');
      setSelectedPlayerIndex(null);
      return;
    }

    try {
      if (targetPlayer && targetRosteredPlayer && isValidMove(targetPlayer, sourceSlot.position)) {
        // Both players can occupy each other's slots — swap them
        await Promise.all([
          axiosInstance.put(`/rostered_players/update/${sourceRosteredPlayer.id}`, {
            league_member_id: leagueMemberId,
            player_id: sourceRosteredPlayer.player_id,
            roster_position: targetSlot.sPosition,
            is_rostered: 1,
          }),
          axiosInstance.put(`/rostered_players/update/${targetRosteredPlayer.id}`, {
            league_member_id: leagueMemberId,
            player_id: targetRosteredPlayer.player_id,
            roster_position: sourceSlot.sPosition,
            is_rostered: 1,
          }),
        ]);
      } else if (targetPlayer && targetRosteredPlayer && !isValidMove(targetPlayer, sourceSlot.position)) {
        // Target player can't go back to source slot — bump them to the first open BENCH slot
        const openBench = rosterSlots.find(s => s.position === 'BENCH' && !s.player && s.sPosition !== targetSlot.sPosition);
        const bumpPosition = openBench ? openBench.sPosition : 'BENCH1';
        await Promise.all([
          axiosInstance.put(`/rostered_players/update/${sourceRosteredPlayer.id}`, {
            league_member_id: leagueMemberId,
            player_id: sourceRosteredPlayer.player_id,
            roster_position: targetSlot.sPosition,
            is_rostered: 1,
          }),
          axiosInstance.put(`/rostered_players/update/${targetRosteredPlayer.id}`, {
            league_member_id: leagueMemberId,
            player_id: targetRosteredPlayer.player_id,
            roster_position: bumpPosition,
            is_rostered: 1,
          }),
        ]);
      } else {
        // Target slot is empty — just move the source player
        await axiosInstance.put(`/rostered_players/update/${sourceRosteredPlayer.id}`, {
          league_member_id: leagueMemberId,
          player_id: sourceRosteredPlayer.player_id,
          roster_position: targetSlot.sPosition,
          is_rostered: 1,
        });
      }

      // Re-fetch rostered players and preserve existing schedule data
      const rosterResponse = await axiosInstance.get(`/rostered_players/getRosteredPlayersByLeagueMemberId/${leagueMemberId}`);
      const fresh: RosteredPlayer[] = Array.isArray(rosterResponse.data) ? rosterResponse.data : [];
      const updated = fresh.map(p => ({
        ...p,
        roster_position: p.roster_position ? p.roster_position.toUpperCase() : 'BENCH1',
        schedule: rosteredPlayers.find(existing => existing.player_id === p.player_id)?.schedule || null,
      }));
      setRosteredPlayers(updated);
      setMessage('Player moved successfully.');
      setMessageType('success');
      setSelectedPlayerIndex(null);
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message || 'Failed to move player.' : 'Failed to move player.';
      setMessage(msg);
      setMessageType('error');
      setSelectedPlayerIndex(null);
    }
  };

  if (isLoading) return <div className="roster-container">Loading...</div>;
  if (error) return <div className="roster-container">{error}</div>;

  return (
    <div className="roster-container">
      <h2 className="roster-title">{leagueMember?.team_name || 'My Roster'}</h2>
      {message && (
        <div className={`message ${messageType}${isMessageFading ? ' fade-out' : ''}`}>{message}</div>
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
            {rosterSlots.map((slot, index) => {
              const isSelected = selectedPlayerIndex === index;
              const selectedPlayer = selectedPlayerIndex !== null ? rosterSlots[selectedPlayerIndex]?.player : null;
              const isValidTarget =
                selectedPlayerIndex !== null &&
                selectedPlayerIndex !== index &&
                isValidMove(selectedPlayer, slot.position);
              return (
                <tr
                  key={slot.sPosition}
                  className={`roster-row${isSelected ? ' selected-player' : ''}`}
                >
                  <td className="slot-cell">{slot.position}</td>
                  <td className={`player-cell${isValidTarget ? ' valid-target' : ''}`}>
                    {slot.player ? (
                      <PlayerCard
                        player={slot.player}
                        index={index}
                        onClick={handlePlayerClick}
                        isSelected={isSelected}
                      />
                    ) : (
                      <div className="empty-slot" onClick={() => handlePlayerClick(index)}>Empty</div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {isActionModalOpen && selectedPlayerIndex !== null && rosterSlots[selectedPlayerIndex]?.player && (
        <div className="modal-overlay">
          <div className="roster-action-modal animate__animated animate__fadeInUp">
            <div className="roster-action-modal-header">
              <h2 className="roster-action-modal-title">
                {rosterSlots[selectedPlayerIndex].player!.player_name}
              </h2>
              <button className="roster-action-close-btn" onClick={closeModal}>×</button>
            </div>
            <div className="roster-action-modal-content">
              <p className="roster-action-modal-subtitle">
                {rosterSlots[selectedPlayerIndex].player!.position} · {rosterSlots[selectedPlayerIndex].player!.team}
              </p>
              <div className="roster-action-buttons">
                <button className="drop-player-btn" onClick={handleDropPlayer}>Drop Player</button>
                {rosterSlots[selectedPlayerIndex].position !== 'BENCH' && (
                  <button className="move-bench-btn" onClick={handleMoveToBench}>Move to Bench</button>
                )}
                <button className="close-modal-btn" onClick={closeModal}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RosterComponent;