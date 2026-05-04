import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import axiosInstance from '../../api';
import { getCurrentFantasyWeek, getGamesByWeekAndYear } from '../../api/seasonService';
import { CurrentUser, CurrentLeague, LeagueMember, RosterRules, RosteredPlayer, RosterSlot, NFLGame } from '../../types';
import './RosterComponent.css';
import PlayerCard from '../PlayerCard/PlayerCard';

interface RosterComponentProps {
  currentUser: CurrentUser;
  currentLeague: CurrentLeague;
}

const RosterComponent = ({ currentUser, currentLeague }: RosterComponentProps) => {
  const [leagueMember, setLeagueMember] = useState<LeagueMember | null>(null);
  const [rosterRules, setRosterRules] = useState<RosterRules | null>(null);
  const [rosteredPlayers, setRosteredPlayers] = useState<RosteredPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leagueMemberId, setLeagueMemberId] = useState<number | null>(null);
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState<number | null>(null);
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

  /*
   * fetchRosterData — the single useEffect responsible for all API calls this component needs.
   *
   * Dependency array: [currentUser?.id, currentLeague?.league_id]
   *   Runs once on mount. Only re-runs if the logged-in user or active league changes,
   *   which would mean we need a completely fresh set of data anyway.
   *
   * Why one useEffect instead of many?
   *   Chaining multiple useEffects (each setting state that triggers the next) causes
   *   extra render cycles and makes the data flow hard to follow. One effect that owns
   *   all fetching keeps the sequence explicit and predictable.
   *
   * Fetch sequence:
   *   Step 1 — await league member
   *     Must go first. We need is_vamp (determines roster rule type) and
   *     member.id (needed to fetch rostered players) before we can proceed.
   *
   *   Step 2 — Promise.all([roster rules, rostered players, fantasy week])
   *     These three calls don't depend on each other, so we fire them simultaneously.
   *     Promise.all waits for all three to finish before moving on.
   *
   *   Step 3 — await NFL schedule
   *     Must be sequential here — we need year and week from the fantasy week
   *     response in Step 2 before we can build the schedule request URL.
   *
   *   Step 4 — map schedule onto players (pure JS, no API call)
   *     Matches each rostered player to their team's game using Array.find,
   *     then attaches the game info as a schedule property on the player object.
   */
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

        console.log('=== RosterComponent: Data Loaded ===');
        console.log('League Member:', member);
        console.log('Roster Rules:', rulesResponse.data);
        console.log('Rostered Players with Schedule:', playersWithSchedule);
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


  // Derive roster slots from rosterRules and assign rosteredPlayers to their matching slots
  const rosterSlots = useMemo(() => {

    // We need rosterRules to be set in order to do anything in this hook... so if rosterRules is empty, return an empty array
    if (!rosterRules) return [];

    // create a positionCounts array that will be used for determining how the roster table should be structured.
    // The properties utilized from the rosterRules information determine how many slots for each position should 
    // be represented on the roster table
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

    // Define the slots array, which will be used to define the roster slots on the table themselves
    const slots: RosterSlot[] = [];

    // For each item in the positionCount array... if i is less than the count property of that item... 
    // create a roster slot item in the slots array

    // Define position as the position value of the positionCounts item, 
    // sPosition as the position value and the current value for i + 1,
    // player should be null as the slot is currently empty
    positionCounts.forEach(({ position, count }) => {
      for (let i = 0; i < count; i++) {
        slots.push({ position, sPosition: `${position}${i + 1}`, player: null });
      }
    });

    console.log("Slots:", slots);

    // if rosteredPlayers is empty... return slots in it's current form
    if (rosteredPlayers.length === 0) return slots;

    // Normalize roster_position to uppercase so matching is case-insensitive
    // Utilizing a spread operator for the current rosteredPlayers item...
    // except to make sure that the roster_position value is set to uppercase
    const normalized = rosteredPlayers.map(p => ({
      ...p,
      roster_position: p.roster_position ? p.roster_position.toUpperCase() : 'BENCH',
    }));

    console.log("Normalized Rostered Players:", normalized);

    // Assign each player to the slot whose sPosition matches their roster_position.
    // BENCH players (roster_position === 'BENCH') fill the next available BENCH slot.

    // create unassigned array that contains all of the normalized rostered player data
    const unassigned = [...normalized];

    // for each item in the slot array, find a record with the same roster_position values
    // from the unassigned array and assign it to idx
    // if the record was found, assign the found records value to the slot.player property
    // once this process has taken place, the unassigned record is removed from the array
    slots.forEach(slot => {
      const idx = unassigned.findIndex(p => p.roster_position === slot.sPosition);
      if (idx !== -1) {
        const p = unassigned[idx];
        slot.player = p;
        unassigned.splice(idx, 1);
      }
    });

    // Any players left over (overflow beyond bench_count) get extra BENCH rows 
    // sort the slots records into IR and NON IR lists
    const irSlots = slots.filter(s => s.position === 'IR');
    const nonIrSlots = slots.filter(s => s.position !== 'IR');

    // for each remaining record in the unassigned array that wasn't matched to a slot record
    // earlier... (these remaining records should be extra bench players)... and put them in the
    // nonIrSlots array
    unassigned.forEach(p => {
      nonIrSlots.push({
        position: 'BENCH',
        sPosition: `BENCH${nonIrSlots.filter(s => s.position === 'BENCH').length + 1}`,
        player: p,
      });
    });

    // Show enough empty BENCH rows to reach bench_count minimum, but never fewer filled rows
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
    console.log("Selected Slot:", slot);
    console.log("Selected Player Index:", selectedPlayerIndex);

    // if the selected player index is null, sets the selected player index to the 
    // index of the selected slot
    if (selectedPlayerIndex === null) {
      console.log("Selected Player Index is null");
      if (slot.player) {
        console.log("Slot Player:", slot.player); 
        console.log("Index:", index)
      } else {
        console.log("No Slot Player");
      }
      if (slot.player) {
        setSelectedPlayerIndex(numIndex);
        setMessage(`Move ${slot.player.player_name} where?`);
        setMessageType('question');
      }
      return;
    }

    // if the selected player index has the same value of selected slot index, set the
    // selected player index to null (the same slot was selected twice in a row)
    if (selectedPlayerIndex === numIndex) {
      console.log("selected player index equals index");
      setSelectedPlayerIndex(null);
      setMessage('');
      setMessageType('');
      return;
    }

    // if these two parameter values do not equal each other... handleMovePlayer is called
    handleMovePlayer(selectedPlayerIndex, numIndex);
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

    console.log("Source Slot:", sourceSlot);
    console.log("Source Player:", sourcePlayer);
    console.log("Target Slot:", targetSlot);
    console.log("Target Player:", targetPlayer);

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

    console.log("Can Source Player Valid Move?:", isValidMove(sourcePlayer, targetSlot.position));
    console.log("Can Target Player Valid Move?:", isValidMove(targetPlayer, sourceSlot.position));

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
    </div>
  );
};

export default RosterComponent;