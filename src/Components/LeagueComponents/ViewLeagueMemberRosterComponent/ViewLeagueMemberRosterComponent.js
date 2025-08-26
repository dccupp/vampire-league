import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axiosInstance from '../../../api';
import { getCurrentFantasyWeek, getGamesByWeekAndYear } from '../../../api/seasonService';
import PlayerCard from '../../PlayerCard/PlayerCard';
import './ViewLeagueMemberRosterComponent.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const ViewLeagueMemberRosterComponent = ({ currentUser, currentLeague }) => {
  const [rosterSlots, setRosterSlots] = useState([]);
  const [rosteredPlayers, setRosteredPlayers] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isMessageFading, setIsMessageFading] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  // const [rosterRules, setRosterRules] = useState(null);

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
  // setRosterRules(rulesResponse.data); // removed unused setter

        // Fetch rostered players for the current user
        const playersResponse = await axiosInstance.get(`/rostered_players/getRosteredPlayersByLeagueMemberId/${member.id}`);
        let players = Array.isArray(playersResponse.data) ? playersResponse.data : [];

        // Fetch current fantasy week and NFL schedule
        let games = [];
        try {
          const weekResponse = await getCurrentFantasyWeek();
          if (weekResponse.status === 'success') {
            const { year, week } = weekResponse.data;
            const scheduleResponse = await getGamesByWeekAndYear(year, week);
            if (scheduleResponse.status === 'success') {
              games = scheduleResponse.data || [];
            }
          }
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
        // Construct slots after both rules and players are set
        const slots = constructRosterSlots(rulesResponse.data, players);
        setRosterSlots(slots);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching roster data:', error.response || error);
        setMessage('Failed to load roster data: ' + (error.response?.data?.message || error.message));
        setMessageType('error');
        setIsLoading(false);
      }
    };
    fetchData();
  }, [currentUser, currentLeague]);

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
          const rulesResponse = await axiosInstance.get(`/roster_rules/getRosterRulesByLeagueId/${currentLeague.league_id}/${rosterTypeId}`);
          if (!rulesResponse.data || Object.keys(rulesResponse.data).length === 0) {
            setMessage('No roster rules found for this league.');
            setMessageType('error');
            return;
          }
          // setRosterRules(rulesResponse.data); // removed unused setter

          // Fetch rostered players for the selected member
          const response = await axiosInstance.get(`/rostered_players/getRosteredPlayersByLeagueMemberId/${selectedMemberId}`);
          let players = Array.isArray(response.data) ? response.data : [];

          // Fetch current fantasy week and NFL schedule
          let games = [];
          try {
            const weekResponse = await getCurrentFantasyWeek();
            if (weekResponse.status === 'success') {
              const { year, week } = weekResponse.data;
              const scheduleResponse = await getGamesByWeekAndYear(year, week);
              if (scheduleResponse.status === 'success') {
                games = scheduleResponse.data || [];
              }
            }
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
          const slots = constructRosterSlots(rulesResponse.data, players);
          setRosterSlots(slots);
        } catch (error) {
          console.error('Error fetching rostered players:', error.response || error);
          setMessage('Failed to load rostered players: ' + (error.response?.data?.message || error.message));
          setMessageType('error');
        }
      }
    };
    fetchRosteredPlayers();
  }, [selectedMemberId, members, currentLeague.league_id]);

  const handleMemberChange = (event) => {
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

  // --- Unified slot construction logic (mirroring RosterTableComponent) ---
  const constructRosterSlots = (rules, players) => {
    if (!rules || !Array.isArray(players)) return [];

    // Normalize player data
    const normalizedPlayers = players.map(p => ({
      ...p,
      player_id: p.player_id,
      player_name: p.player_name || 'Unknown Player',
      position: p.position ? p.position.toUpperCase() : 'Unknown',
      team: p.team || 'Unknown',
      is_injured: p.is_injured || false,
      roster_position: p.roster_position ? p.roster_position.toUpperCase() : 'BENCH',
    }));

    // Define all possible slot types and their counts
    const positionCounts = [
      { position: 'QB', count: rules.quarterback_count || 0 },
      { position: 'RB', count: rules.running_back_count || 0 },
      { position: 'WR', count: rules.wide_receiver_count || 0 },
      { position: 'TE', count: rules.tight_end_count || 0 },
      { position: 'WRT', count: rules.wide_receiver_tight_end_count || 0 },
      { position: 'FLEX', count: rules.flex_count || 0 },
      { position: 'BENCH', count: rules.bench_count || 0 },
      { position: 'IR', count: rules.ir_count || 0 },
    ];

    // Create all possible slots
    let slots = [];
    positionCounts.forEach(({ position, count }) => {
      for (let i = 0; i < count; i++) {
        const sPosition = `${position}${i + 1}`;
        slots.push({ position, sPosition, player: null });
      }
    });

    // Assign players to slots based on roster_position matching sPosition
    const assignedPlayers = [...normalizedPlayers];
    slots.forEach(slot => {
      const player = assignedPlayers.find(p => p.roster_position === slot.sPosition || (slot.position === 'BENCH' && p.roster_position === 'BENCH'));
      if (player) {
        slot.player = {
          id: player.player_id,
          name: player.player_name,
          playingPosition: player.position,
          team: player.team,
          is_injured: player.is_injured,
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
          id: player.player_id,
          name: player.player_name,
          playingPosition: player.position,
          team: player.team,
          is_injured: player.is_injured,
        },
      });
    });

    // Limit empty BENCH rows to bench_count
    const benchCount = rules.bench_count || 0;
    let benchSlots = nonIrSlots.filter(s => s.position === 'BENCH');
    let nonBenchNonIrSlots = nonIrSlots.filter(s => s.position !== 'BENCH' && s.position !== 'IR');
    const filledBenchSlots = benchSlots.filter(s => s.player);
    const emptyBenchSlots = benchSlots.filter(s => !s.player);
    const limitedEmptyBenchSlots = emptyBenchSlots.slice(0, benchCount);
    // Final slots: non-BENCH/non-IR + filled BENCH + limited empty BENCH + IR
    return [
      ...nonBenchNonIrSlots,
      ...filledBenchSlots,
      ...limitedEmptyBenchSlots,
      ...irSlots
    ];
  };

  if (isLoading) {
    return <div className="roster-view-container">Loading roster...</div>;
  }

  return (
    <div className="roster-view-container animate__animated animate__fadeIn">
      <h2 className="roster-title">{currentLeague?.name ? `${currentLeague.name} Roster` : 'Team Roster'}</h2>
      <div className="roster-controls">
        <button className="arrow-button" onClick={handlePrevMember} title="Previous Member">
          <svg className="arrow-icon" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" fill="none" stroke="#2ecc71" strokeWidth="2"/>
          </svg>
        </button>
        <select
          className="member-select"
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
        <button className="arrow-button" onClick={handleNextMember} title="Next Member">
          <svg className="arrow-icon" viewBox="0 0 24 24">
            <path d="M9 18l6-6-6-6" fill="none" stroke="#2ecc71" strokeWidth="2"/>
          </svg>
        </button>
      </div>
      {message && (
        <div className={`message ${messageType} animate__animated ${isMessageFading ? 'animate__fadeOut' : 'animate__fadeIn'}`}>
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
            {rosterSlots.map((rosterEntry, index) => (
              <tr
                key={rosterEntry.sPosition}
                className="roster-row"
                {...(rosterEntry.position !== 'BENCH' ? { 'data-position': rosterEntry.sPosition } : {})}
              >
                <td className="slot-cell">{rosterEntry.position}</td>
                <td className="player-cell">
                  {rosterEntry.player ? (
                    <PlayerCard
                      player={{ ...rosterEntry.player, schedule: (rosteredPlayers.find(p => p.player_id === rosterEntry.player.id)?.schedule || null) }}
                      index={index}
                      onClick={() => {}}
                      isSelected={false}
                    />
                  ) : (
                    <div className="empty-slot">
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

ViewLeagueMemberRosterComponent.propTypes = {
  currentUser: PropTypes.object,
  currentLeague: PropTypes.shape({
    league_id: PropTypes.number,
    name: PropTypes.string
  }),
};

export default ViewLeagueMemberRosterComponent;