import React, { useState, useEffect, useMemo } from 'react';
import axiosInstance from '../../../api';
import { isAxiosError } from 'axios';
import { getCurrentFantasyWeek, getGamesByWeekAndYear } from '../../../api/seasonService';
import { RosterSlot, RosteredPlayer, LeagueMember, NFLGame, RosterRules } from '../../../types';
import PlayerCard from '../../PlayerCard/PlayerCard';

import { useUser } from '../../../context/UserContext';
import { useLeague } from '../../../context/LeagueContext';

import './ViewLeagueMemberRosterComponent.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const ViewLeagueMemberRosterComponent = () => {
  const { currentUser } = useUser();
  const { currentLeague } = useLeague();
  const [rosterRules, setRosterRules] = useState<RosterRules | null>(null);
  const [rosteredPlayers, setRosteredPlayers] = useState<RosteredPlayer[]>([]);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<string>('');
  const [isMessageFading, setIsMessageFading] = useState<boolean>(false);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [members, setMembers] = useState<LeagueMember[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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

  // Fetch all necessary data
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?.id || !currentLeague?.league_id) {
        setMessage('Invalid user or league data.');
        setMessageType('error');
        setIsLoading(false);
        return;
      }

      try {
        // Fetch current user's league member ID
        const memberResponse = await axiosInstance.get(`/league_members/getLeagueMembersByUserId/${currentUser.id}`);
        const member = Array.isArray(memberResponse.data)
          ? memberResponse.data.find(m => m.league_id === currentLeague.league_id)
          : null;
        if (!member) {
          setMessage('User is not a member of this league.');
          setMessageType('error');
          setIsLoading(false);
          return;
        }
        setSelectedMemberId(member.id);

        // Fetch all league members
        const membersResponse = await axiosInstance.get(`/league_members/getLeagueMembersByLeagueId/${currentLeague.league_id}`);
        if (!Array.isArray(membersResponse.data) || membersResponse.data.length === 0) {
          setMessage('No league members found.');
          setMessageType('error');
          setIsLoading(false);
          return;
        }
        setMembers(membersResponse.data);

        // Determine roster type for this member (e.g., is_vamp)
        const rosterTypeId = member.is_vamp ? 2 : 1;

        // Fetch roster rules for this member's type
        const rulesResponse = await axiosInstance.get(`/roster_rules/getRosterRulesByLeagueId/${currentLeague.league_id}/${rosterTypeId}`);
        if (!rulesResponse.data || Object.keys(rulesResponse.data).length === 0) {
          setMessage('No roster rules found for this league.');
          setMessageType('error');
          setIsLoading(false);
          return;
        }

        // Fetch rostered players for the current user
        const playersResponse = await axiosInstance.get(`/rostered_players/getRosteredPlayersByLeagueMemberId/${member.id}`);
        let players = Array.isArray(playersResponse.data) ? playersResponse.data : [];

        // Fetch current fantasy week and NFL schedule
        let games: NFLGame[] = [];
        try {
          const weekResponse = await getCurrentFantasyWeek();
          const { year, week } = weekResponse.data;
          const scheduleResponse = await getGamesByWeekAndYear(year, week);
          games = scheduleResponse.data || [];
        } catch (e) {
          // If schedule fetch fails, just skip schedule info
        }

        // Attach schedule info to each player
        players = players.map(player => {
          const team = player.team || player.nfl_team || '';
          const game = games.find(g => g.team === team);
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

        setRosteredPlayers(players);
        if (players.length === 0) {
          setMessage('No players rostered yet.');
          setMessageType('info');
        }
        setRosterRules(rulesResponse.data);
        setIsLoading(false);
      } catch (error) {
        const msg = isAxiosError(error) ? error.response?.data?.message || error.message : 'Unknown error';
        console.error('Error fetching roster data:', msg);
        setMessage('Failed to load roster data: ' + msg);
        setMessageType('error');
        setIsLoading(false);
      }
    };
    fetchData();
  }, [currentUser?.id, currentLeague?.league_id]);

  // Fetch rostered players when selected member changes
  useEffect(() => {
    const fetchRosteredPlayers = async () => {
      if (selectedMemberId && members.length > 0) {
        try {
          // Find the selected member
          const member = members.find(m => m.id === selectedMemberId);
          if (!member) return;
          const rosterTypeId = member.is_vamp ? 2 : 1;

          // Fetch roster rules for this member
          const rulesResponse = await axiosInstance.get(`/roster_rules/getRosterRulesByLeagueId/${currentLeague?.league_id}/${rosterTypeId}`);
          if (!rulesResponse.data || Object.keys(rulesResponse.data).length === 0) {
            setMessage('No roster rules found for this league.');
            setMessageType('error');
            return;
          }
          // Fetch rostered players for the selected member
          const response = await axiosInstance.get(`/rostered_players/getRosteredPlayersByLeagueMemberId/${selectedMemberId}`);
          let players = Array.isArray(response.data) ? response.data : [];

          // Fetch current fantasy week and NFL schedule
          let games: NFLGame[] = [];
          try {
            const weekResponse = await getCurrentFantasyWeek();
            const { year, week } = weekResponse.data;
            const scheduleResponse = await getGamesByWeekAndYear(year, week);
            games = scheduleResponse.data || [];
          } catch (e) {}

          // Attach schedule info to each player
          players = players.map(player => {
            const team = player.team || player.nfl_team || '';
            const game = games.find(g => g.team === team);
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

          setRosteredPlayers(players);
          if (players.length === 0) {
            setMessage('No players rostered yet.');
            setMessageType('info');
          } else {
            setMessage('');
          }
          setRosterRules(rulesResponse.data);
        } catch (error) {
          const msg = isAxiosError(error) ? error.response?.data?.message || error.message : "Failed to load rostered players";
          console.error('Error fetching rostered players:', msg);
          setMessage('Failed to load rostered players: ' + msg);
          setMessageType('error');
        }
      }
    };
    fetchRosteredPlayers();
  }, [selectedMemberId, members, currentLeague?.league_id]);

  const handleMemberChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const memberId = parseInt(event.target.value, 10);
    setSelectedMemberId(memberId);
  };

  const handlePrevMember = () => {
    const currentIndex = members.findIndex(m => m.id === selectedMemberId);
    const prevIndex = (currentIndex - 1 + members.length) % members.length;
    setSelectedMemberId(members[prevIndex].id);
  };

  const handleNextMember = () => {
    const currentIndex = members.findIndex(m => m.id === selectedMemberId);
    const nextIndex = (currentIndex + 1) % members.length;
    setSelectedMemberId(members[nextIndex].id);
  };

  const rosterSlots = useMemo((): RosterSlot[] => {
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

    if (rosteredPlayers.length === 0) return slots;

    const normalized = rosteredPlayers.map(p => ({
      ...p,
      roster_position: p.roster_position ? p.roster_position.toUpperCase() : 'BENCH',
    }));

    const unassigned = [...normalized];
    slots.forEach(slot => {
      const idx = unassigned.findIndex(p => p.roster_position === slot.sPosition);
      if (idx !== -1) {
        slot.player = unassigned[idx];
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

  if (isLoading) {
    return <div className="roster-view-container">Loading roster...</div>;
  }

  interface Organization {
    name: string;
    location: string;
  }

  interface Team extends Organization {
    sport: string;
    players: string[];
    coach?: string;
  }

  function getTeamSummary (team: Team): string {
    const string = team.coach
      ? `${team.name} (${team.sport}) - Location: ${team.location}, PA - Players: ${team.players.length} - Coach: ${team.coach}`
      : `${team.name} (${team.sport}) - Location: ${team.location}, PA - Players: ${team.players.length} - No coach assigned`
    ;
    return string;
  }

  return (
    <div className="roster-view-container animate__animated animate__fadeIn">
      <h2 className="vlmr-roster-title">{currentLeague?.name ? `${currentLeague.name} Roster` : 'Team Roster'}</h2>
      <div className="vlmr-roster-controls">
        <button className="vlmr-arrow-button" onClick={handlePrevMember} title="Previous Member">
          <svg className="vlmr-arrow-icon" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
        <select
          className="vlmr-member-select"
          value={selectedMemberId || ''}
          onChange={handleMemberChange}
        >
          {members.length > 0 ? (
            members.map(member => (
              <option key={member.id} value={member.id}>
                {member.team_name || 'Unknown'}
              </option>
            ))
          ) : (
            <option value="">No members available</option>
          )}
        </select>
        <button className="vlmr-arrow-button" onClick={handleNextMember} title="Next Member">
          <svg className="vlmr-arrow-icon" viewBox="0 0 24 24">
            <path d="M9 18l6-6-6-6" fill="none" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
      </div>
      {message && (
        <div className={`vlmr-message ${messageType} animate__animated ${isMessageFading ? 'animate__fadeOut' : 'animate__fadeIn'}`}>
          {message}
        </div>
      )}
      <div className="vlmr-table-responsive">
        <table className="vlmr-roster-table">
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
                className="vlmr-roster-row"
                {...(rosterEntry.position !== 'BENCH' ? { 'data-position': rosterEntry.sPosition } : {})}
              >
                <td className="vlmr-slot-cell">{rosterEntry.position}</td>
                <td className="vlmr-player-cell">
                  {rosterEntry.player ? (
                    <PlayerCard
                      player={rosterEntry.player}
                      index={index}
                      onClick={() => {}}
                      isSelected={false}
                    />
                  ) : (
                    <div className="vlmr-empty-slot">
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

export default ViewLeagueMemberRosterComponent;