import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axiosInstance from '../../api';
import { getCurrentFantasyWeek, getGamesByWeekAndYear } from '../../api/seasonService';
import { calculateFantasyScores } from '../../api/calculateFantasyScores';
import PlayerCard from '../PlayerCard/PlayerCard';
import './MatchupComponent.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const MatchupComponent = ({ currentUser, currentLeague }) => {
  const [schedules, setSchedules] = useState([]);
  const [leagueMembers, setLeagueMembers] = useState([]);
  const [rosterRules, setRosterRules] = useState(null);
  const [homeRosterSlots, setHomeRosterSlots] = useState([]);
  const [awayRosterSlots, setAwayRosterSlots] = useState([]);
  const [homeTeamScore, setHomeTeamScore] = useState(0);
  const [awayTeamScore, setAwayTeamScore] = useState(0);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedMatchup, setSelectedMatchup] = useState('');
  const [weeks, setWeeks] = useState([]);
  const [matchups, setMatchups] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isMessageFading, setIsMessageFading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Transform rostered player data for consistency
  const transformRosteredPlayer = (rosteredPlayer) => ({
    ...rosteredPlayer,
    player: {
      player_id: rosteredPlayer.player_id,
      player_name: rosteredPlayer.player_name || 'Unknown Player',
      position: rosteredPlayer.position || 'Unknown',
      team: rosteredPlayer.team || 'Unknown',
      is_injured: rosteredPlayer.is_injured || false,
    },
    roster_position: rosteredPlayer.roster_position ? rosteredPlayer.roster_position.toUpperCase() : 'BENCH',
  });

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

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      if (!currentLeague?.league_id) {
        setMessage('Invalid league data.');
        setMessageType('error');
        setIsLoading(false);
        return;
      }

      try {
        // Fetch league members
        const membersResponse = await axiosInstance.get(`/league_members/getLeagueMembersByLeagueId/${currentLeague.league_id}`);
        if (!Array.isArray(membersResponse.data) || membersResponse.data.length === 0) {
          setMessage('No league members found.');
          setMessageType('error');
          setIsLoading(false);
          return;
        }
        setLeagueMembers(membersResponse.data);

        // Fetch roster rules
        const rulesResponse = await axiosInstance.get(`/roster_rules/getRosterRulesByLeagueId/${currentLeague.league_id}/1`);
        if (!rulesResponse.data || Object.keys(rulesResponse.data).length === 0) {
          setMessage('No roster rules found for this league.');
          setMessageType('error');
          setIsLoading(false);
          return;
        }
        setRosterRules(rulesResponse.data);

        // Fetch schedules
        const schedulesResponse = await axiosInstance.get(`/schedules/getSchedulesByLeagueId/${currentLeague.league_id}`);
        if (!Array.isArray(schedulesResponse.data) || schedulesResponse.data.length === 0) {
          setMessage('No schedules found for this league.');
          setMessageType('error');
          setIsLoading(false);
          return;
        }
        setSchedules(schedulesResponse.data);

        // Derive weeks
        const uniqueWeeks = [...new Set(schedulesResponse.data.map(s => s.week))].sort((a, b) => a - b);
        setWeeks(uniqueWeeks);
        if (uniqueWeeks.length > 0) {
          setSelectedWeek(uniqueWeeks[0]);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching initial data:', error.response || error);
        setMessage('Failed to load data: ' + (error.response?.data?.message || error.message));
        setMessageType('error');
        setIsLoading(false);
      }
    };
    fetchData();
  }, [currentLeague]);

  // Update matchups when week changes
  useEffect(() => {
    if (selectedWeek && leagueMembers.length > 0) {
      const weekMatchups = schedules
        .filter(s => s.week === parseInt(selectedWeek, 10))
        .map(s => ({
          id: s.id,
          home_league_member: s.home_league_member,
          away_league_member: s.away_league_member,
          label: `${
            leagueMembers.find(m => m.id === s.home_league_member)?.team_name || 'Unknown'
          } vs ${
            leagueMembers.find(m => m.id === s.away_league_member)?.team_name || 'Unknown'
          }`
        }));
      setMatchups(weekMatchups);
      if (weekMatchups.length > 0) {
        setSelectedMatchup(weekMatchups[0].id);
      } else {
        setSelectedMatchup('');
        setHomeRosterSlots([]);
        setAwayRosterSlots([]);
        setMessage('No matchups found for this week.');
        setMessageType('info');
      }
    }
  }, [selectedWeek, schedules, leagueMembers]);

  // Fetch rosters and schedule data for both home and away teams when matchup changes
  useEffect(() => {
    const fetchRosters = async () => {
      if (selectedMatchup && rosterRules) {
        const matchup = matchups.find(m => m.id === parseInt(selectedMatchup, 10));
        if (!matchup) return;

        try {
          // Step 1: Fetch current fantasy week
          const weekResponse = await getCurrentFantasyWeek();
          if (weekResponse.status !== 'success') {
            throw new Error(weekResponse.message || 'Failed to fetch current fantasy week');
          }
          const { year, week } = weekResponse.data;

          // Step 2: Fetch NFL schedule for the current year and week
          const scheduleResponse = await getGamesByWeekAndYear(year, week);
          if (scheduleResponse.status !== 'success') {
            throw new Error(scheduleResponse.message || 'Failed to fetch NFL schedule');
          }
          const games = scheduleResponse.data || [];

          // Step 3: Fetch home roster
          const homeResponse = await axiosInstance.get(`/rostered_players/getRosteredPlayersByLeagueMemberId/${matchup.home_league_member}`);
          const homeRosteredPlayersData = Array.isArray(homeResponse.data) ? homeResponse.data : [];
          const homeCombinedRosteredPlayers = homeRosteredPlayersData.map(rosteredPlayer => ({
            ...transformRosteredPlayer(rosteredPlayer),
            id: rosteredPlayer.id,
          }));

          // Step 4: Construct package for calculateFantasyScores for home rostered players ---
          const fantasyScoresPayload = {
            playerIds: homeCombinedRosteredPlayers.map(p => p.player.player_id),
            week: week,
            // season: year,
            season: 2024,
            leagueId: currentLeague.league_id,
            includeYearlyStats: false
          };

          // Call calculateFantasyScores with the correct arguments
          const fantasyScoresResult = await calculateFantasyScores(
            fantasyScoresPayload.playerIds,
            fantasyScoresPayload.week,
            fantasyScoresPayload.season,
            fantasyScoresPayload.leagueId,
            fantasyScoresPayload.includeYearlyStats
          );

          // Step 5: Add schedule data to home rostered players
          const updatedHomeRosteredPlayers = homeCombinedRosteredPlayers.map(player => {
            const game = games.find(g => g.team === player.player.team);
            let schedule = null;
            if (game) {
              const dateObj = new Date(game.date);
              schedule = {
                date: game.date,
                day: dateObj.toLocaleString('en-US', { weekday: 'short' }),
                est_time: game.est_time || 'TBD',
                location: game.location || 'Unknown',
              };
            }
            const scoreObj = fantasyScoresResult.data.find(s => s.player_id === player.player.player_id);
            return {
              ...player,
              schedule, // already present
              fantasyScore: scoreObj ? scoreObj.fantasyScore : null,
              weeklyStats: scoreObj ? scoreObj.weeklyStats : null
            };
          });

          // Step 6: Fetch away roster
          const awayResponse = await axiosInstance.get(`/rostered_players/getRosteredPlayersByLeagueMemberId/${matchup.away_league_member}`);
          const awayRosteredPlayersData = Array.isArray(awayResponse.data) ? awayResponse.data : [];
          const awayCombinedRosteredPlayers = awayRosteredPlayersData.map(rosteredPlayer => ({
            ...transformRosteredPlayer(rosteredPlayer),
            id: rosteredPlayer.id,
          }));

          // Step 7: Construct package for calculateFantasyScores for away rostered players ---
          const awayFantasyScoresPayload = {
            playerIds: awayCombinedRosteredPlayers.map(p => p.player.player_id),
            week: week,
            // season: year,
            season: 2024,
            leagueId: currentLeague.league_id,
            includeYearlyStats: false
          };

          // Call calculateFantasyScores with the correct arguments
          const awayFantasyScoresResult = await calculateFantasyScores(
            awayFantasyScoresPayload.playerIds,
            awayFantasyScoresPayload.week,
            awayFantasyScoresPayload.season,
            awayFantasyScoresPayload.leagueId,
            awayFantasyScoresPayload.includeYearlyStats
          );

          // Step 8: Add schedule data to away rostered players
          const updatedAwayRosteredPlayers = awayCombinedRosteredPlayers.map(player => {
            const game = games.find(g => g.team === player.player.team);
            let schedule = null;
            if (game) {
              const dateObj = new Date(game.date);
              schedule = {
                date: game.date,
                day: dateObj.toLocaleString('en-US', { weekday: 'short' }),
                est_time: game.est_time || 'TBD',
                location: game.location || 'Unknown',
              };
            }
            const scoreObj = awayFantasyScoresResult.data.find(s => s.player_id === player.player.player_id);
            return {
              ...player,
              schedule, // already present
              fantasyScore: scoreObj ? scoreObj.fantasyScore : null,
              weeklyStats: scoreObj ? scoreObj.weeklyStats : null
            };
          });

          // Step 9: Construct roster slots for both teams
          const homeSlots = constructRosterSlots(rosterRules, updatedHomeRosteredPlayers);
          setHomeRosterSlots(homeSlots);
          const awaySlots = constructRosterSlots(rosterRules, updatedAwayRosteredPlayers);
          setAwayRosterSlots(awaySlots);

          // Step 10: Calculate team totals
          // Calculate home team total
          const homeTotal = homeSlots
            .filter(slot => slot.position !== 'BENCH' && slot.position !== 'IR' && slot.player && slot.player.fantasyScore != null)
            .reduce((sum, slot) => sum + parseFloat(slot.player.fantasyScore), 0);
          setHomeTeamScore(homeTotal);

          // Calculate away team total
          const awayTotal = awaySlots
            .filter(slot => slot.position !== 'BENCH' && slot.position !== 'IR' && slot.player && slot.player.fantasyScore != null)
            .reduce((sum, slot) => sum + parseFloat(slot.player.fantasyScore), 0);
          setAwayTeamScore(awayTotal);

          // Step 10: Set messages based on roster data
          if (homeRosteredPlayersData.length === 0 && awayRosteredPlayersData.length === 0) {
            setMessage('No players rostered for either team.');
            setMessageType('info');
          } else if (homeRosteredPlayersData.length === 0) {
            setMessage('No players rostered for home team.');
            setMessageType('info');
          } else if (awayRosteredPlayersData.length === 0) {
            setMessage('No players rostered for away team.');
            setMessageType('info');
          } else {
            setMessage('');
          }
        } catch (error) {
          console.error('Error fetching roster data:', {
            message: error.response?.data?.message || error.message,
            status: error.response?.status,
          });
          setMessage('Failed to load rosters.');
          setMessageType('error');
          setHomeRosterSlots([]);
          setAwayRosterSlots([]);
        }
      }
    };
    fetchRosters();
  }, [currentLeague.league_id, selectedMatchup, rosterRules, matchups]);

  const constructRosterSlots = (rules, rosteredPlayers) => {
    const slots = [];
    if (!rules || Object.keys(rules).length === 0) {
      console.warn('No valid roster rules provided.');
      return slots;
    }

    // Normalize position names
    const positionMap = {
      'QUARTERBACK': 'QB',
      'RUNNING_BACK': 'RB',
      'RUNNINGBACK': 'RB',
      'WIDE_RECEIVER': 'WR',
      'WIDERECEIVER': 'WR',
      'TIGHT_END': 'TE',
      'TIGHTEND': 'TE',
      'FLEX': 'FLEX',
      'BENCH': 'BENCH',
      'QB1': 'QB',
      'QB2': 'QB',
      'RB1': 'RB',
      'RB2': 'RB',
      'WR1': 'WR',
      'WR2': 'WR',
      'TE1': 'TE',
      'TE2': 'TE',
      'FLEX1': 'FLEX',
      'FLEX2': 'FLEX',
      'BENCH1': 'BENCH',
      'BENCH2': 'BENCH',
      'BENCH3': 'BENCH',
      'BENCH4': 'BENCH',
      'BENCH5': 'BENCH',
      'BENCH6': 'BENCH'
    };

    const normalizedRosteredPlayers = rosteredPlayers.map(player => ({
      ...player,
      roster_position: positionMap[player.roster_position] || player.roster_position
    }));

    // Define position counts
    const positions = [
      { key: 'quarterback_count', position: 'QB' },
      { key: 'running_back_count', position: 'RB' },
      { key: 'wide_receiver_count', position: 'WR' },
      { key: 'tight_end_count', position: 'TE' },
      { key: 'flex_count', position: 'FLEX' },
      { key: 'bench_count', position: 'BENCH' }
    ];

    // Create slots
    positions.forEach(({ key, position }) => {
      const count = rules[key] || 0;
      for (let i = 1; i <= count; i++) {
        slots.push({
          sPosition: `${position}${count > 1 || position === 'BENCH' ? i : ''}`,
          position,
          player: null
        });
      }
    });

    // Assign players to slots
    normalizedRosteredPlayers.forEach(player => {
      let slot;
      if (player.roster_position === 'BENCH') {
        // For BENCH players, find any available BENCH slot
        slot = slots.find(s => s.position === 'BENCH' && !s.player);
      } else {
        // For non-BENCH players, match exact position
        slot = slots.find(s => s.position === player.roster_position && !s.player);
      }
      if (slot) {
        slot.player = player;
      }
    });
    return slots;
  };

  const handleWeekChange = (event) => {
    setSelectedWeek(event.target.value);
    setSelectedMatchup('');
  };

  const handleMatchupChange = (event) => {
    setSelectedMatchup(event.target.value);
  };

  const getTeamName = (memberId) => {
    const member = leagueMembers.find(m => m.id === memberId);
    return member ? member.team_name || 'Unknown' : 'Unknown';
  };

  if (isLoading) {
    return <div className="matchup-container">Loading matchups...</div>;
  }

  return (
    <div className="matchup-container animate__animated animate__fadeIn">
      <h2 className="matchup-title">{currentLeague?.name ? `${currentLeague.name} Matchups` : 'Matchups'}</h2>
      <div className="matchup-controls">
        <select
          className="week-select"
          value={selectedWeek}
          onChange={handleWeekChange}
        >
          {weeks.length > 0 ? (
            weeks.map(week => (
              <option key={week} value={week}>
                Week {week}
              </option>
            ))
          ) : (
            <option value="">No weeks available</option>
          )}
        </select>
        <select
          className="matchup-select"
          value={selectedMatchup}
          onChange={handleMatchupChange}
        >
          {matchups.length > 0 ? (
            matchups.map(matchup => (
              <option key={matchup.id} value={matchup.id}>
                {matchup.label}
              </option>
            ))
          ) : (
            <option value="">No matchups available</option>
          )}
        </select>
      </div>
      {message && (
        <div className={`message ${messageType} animate__animated ${isMessageFading ? 'animate__fadeOut' : 'animate__fadeIn'}`}>
          {message}
        </div>
      )}
      {selectedMatchup && (
        <div className="rosters-container">
          <div className="roster-section">
            <h3 className="team-title">{getTeamName(matchups.find(m => m.id === parseInt(selectedMatchup, 10))?.home_league_member)} Score</h3>
            <div className="team-score">{homeTeamScore.toFixed(2)}</div>
            <div className="table-responsive" id="home-roster-div">
              <table className="roster-table" id="home-roster-table">
                <thead>
                  <tr>
                    <th className="player-header">Player</th>
                    <th className="score-header">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {homeRosterSlots
                    .filter(rosterEntry => rosterEntry.position !== 'BENCH' && rosterEntry.position !== 'IR' && rosterEntry.sPosition)
                    .map((rosterEntry, index) => (
                      <tr
                        key={rosterEntry.sPosition}
                        className="roster-row"
                        data-position={rosterEntry.sPosition}
                      >
                        <td className="player-cell">
                          {rosterEntry.player ? (
                            <PlayerCard
                              player={rosterEntry.player}
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
                        <td className="score-cell">
                          {rosterEntry.player && rosterEntry.player.fantasyScore != null
                            ? rosterEntry.player.fantasyScore
                            : '--'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="table-responsive" id="home-bench-div">
              <h4 className="bench-title">Bench</h4>
              <table className="roster-table" id="home-bench-table">
                <thead>
                  <tr>
                    <th className="player-header">Player</th>
                    <th className="score-header">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {homeRosterSlots
                    .filter(rosterEntry => rosterEntry.position === 'BENCH')
                    .map((rosterEntry, index) => (
                      <tr key={rosterEntry.sPosition} className="roster-row">
                        <td className="player-cell">
                          {rosterEntry.player ? (
                            <PlayerCard
                              player={rosterEntry.player}
                              index={index}
                              onClick={() => {}}
                              isSelected={false}
                            />
                          ) : (
                            <div className="empty-slot">Empty</div>
                          )}
                        </td>
                        <td className="score-cell">
                          {rosterEntry.player && rosterEntry.player.fantasyScore != null
                            ? rosterEntry.player.fantasyScore
                            : '--'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="roster-section">
            <h3 className="team-title">{getTeamName(matchups.find(m => m.id === parseInt(selectedMatchup, 10))?.away_league_member)} Score</h3>
            <div className="team-score">{awayTeamScore.toFixed(2)}</div>
            <div className="table-responsive" id="away-roster-div">
              <table className="roster-table" id="away-roster-table">
                <thead>
                  <tr>
                    <th className="score-header">Score</th>
                    <th className="player-header">Player</th>
                  </tr>
                </thead>
                <tbody>
                  {awayRosterSlots
                    .filter(rosterEntry => rosterEntry.position !== 'BENCH' && rosterEntry.position !== 'IR' && rosterEntry.sPosition)
                    .map((rosterEntry, index) => (
                      <tr key={rosterEntry.sPosition} className="roster-row" data-position={rosterEntry.sPosition}>
                        <td className="score-cell">
                          {rosterEntry.player && rosterEntry.player.fantasyScore != null
                            ? rosterEntry.player.fantasyScore
                            : '--'}
                        </td>
                        <td className="player-cell">
                          {rosterEntry.player ? (
                            <PlayerCard
                              player={rosterEntry.player}
                              index={index}
                              onClick={() => {}}
                              isSelected={false}
                            />
                          ) : (
                            <div className="empty-slot">Empty</div>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="table-responsive" id="away-bench-div">
              <h4 className="bench-title">Bench</h4>
              <table className="roster-table" id="away-bench-table">
                <thead>
                  <tr>
                    <th className="score-header">Score</th>
                    <th className="player-header">Player</th>
                  </tr>
                </thead>
                <tbody>
                  {awayRosterSlots
                    .filter(rosterEntry => rosterEntry.position === 'BENCH')
                    .map((rosterEntry, index) => (
                      <tr key={rosterEntry.sPosition} className="roster-row">
                        <td className="score-cell">
                          {rosterEntry.player && rosterEntry.player.fantasyScore != null
                            ? rosterEntry.player.fantasyScore
                            : '--'}
                        </td>
                        <td className="player-cell">
                          {rosterEntry.player ? (
                            <PlayerCard
                              player={rosterEntry.player}
                              index={index}
                              onClick={() => {}}
                              isSelected={false}
                            />
                          ) : (
                            <div className="empty-slot">Empty</div>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

MatchupComponent.propTypes = {
  currentUser: PropTypes.object,
  currentLeague: PropTypes.shape({
    league_id: PropTypes.number,
    name: PropTypes.string
  }),
};

export default MatchupComponent;