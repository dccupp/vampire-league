import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axiosInstance from '../../api';
import PlayerCard from '../PlayerCard/PlayerCard';
import './MatchupComponent.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const MatchupComponent = ({ currentUser, currentLeague }) => {
  const [schedules, setSchedules] = useState([]);
  const [leagueMembers, setLeagueMembers] = useState([]);
  const [rosterRules, setRosterRules] = useState(null);
  const [homeRosterSlots, setHomeRosterSlots] = useState([]);
  const [awayRosterSlots, setAwayRosterSlots] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedMatchup, setSelectedMatchup] = useState('');
  const [weeks, setWeeks] = useState([]);
  const [matchups, setMatchups] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isMessageFading, setIsMessageFading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  // Fetch rosters when matchup changes
  useEffect(() => {
    const fetchRosters = async () => {
      if (selectedMatchup && rosterRules) {
        const matchup = matchups.find(m => m.id === parseInt(selectedMatchup, 10));
        if (!matchup) return;

        try {
          // Fetch home roster
          const homeResponse = await axiosInstance.get(`/rostered_players/getRosteredPlayersByLeagueMemberId/${matchup.home_league_member}`);
          const homePlayers = Array.isArray(homeResponse.data) ? homeResponse.data : [];
          const homeSlots = constructRosterSlots(rosterRules, homePlayers);

          setHomeRosterSlots(homeSlots);

          // Fetch away roster
          const awayResponse = await axiosInstance.get(`/rostered_players/getRosteredPlayersByLeagueMemberId/${matchup.away_league_member}`);
          const awayPlayers = Array.isArray(awayResponse.data) ? awayResponse.data : [];
          const awaySlots = constructRosterSlots(rosterRules, awayPlayers);

          setAwayRosterSlots(awaySlots);

          if (homePlayers.length === 0 && awayPlayers.length === 0) {
            setMessage('No players rostered for either team.');
            setMessageType('info');
          } else if (homePlayers.length === 0) {
            setMessage('No players rostered for home team.');
            setMessageType('info');
          } else if (awayPlayers.length === 0) {
            setMessage('No players rostered for away team.');
            setMessageType('info');
          } else {
            setMessage('');
          }
        } catch (error) {
          setMessage('Failed to load rosters: ' + (error.response?.data?.message || error.message));
          setMessageType('error');
        }
      }
    };
    fetchRosters();
  }, [selectedMatchup, rosterRules, matchups]);

  // Helper to get schedule info for a player
  const getPlayerScheduleInfo = (player) => {
    if (!player || !player.team || !selectedWeek || !Array.isArray(schedules)) return null;
    // Try to match by team abbreviation (case-insensitive)
    const schedule = schedules.find(s =>
      s.week === parseInt(selectedWeek, 10) &&
      (s.home_team_abbr?.toUpperCase() === player.team?.toUpperCase() ||
       s.away_team_abbr?.toUpperCase() === player.team?.toUpperCase())
    );
    if (!schedule) return null;
    // Determine opponent and location
    let opponent = '';
    let location = '';
    if (schedule.home_team_abbr?.toUpperCase() === player.team?.toUpperCase()) {
      opponent = schedule.away_team_abbr;
      location = 'Home';
    } else {
      opponent = schedule.home_team_abbr;
      location = 'Away';
    }
    return {
      est_time: schedule.est_time || '',
      day: schedule.day || '',
      date: schedule.date || '',
      location,
      opponent,
      scheduleId: schedule.id
    };
  };

  const constructRosterSlots = (rules, players) => {
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
      'FLEX2': 'FLEX'
    };

    // Normalize player data
    const normalizedPlayers = players.map(p => ({
      ...p,
      roster_position: p.roster_position
        ? positionMap[p.roster_position.trim().toUpperCase()] || p.roster_position.trim().toUpperCase()
        : 'BENCH',
      position: p.position ? p.position.trim().toUpperCase() : 'N/A'
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

    // Assign players to slots, enriching with schedule info
    normalizedPlayers.forEach(player => {
      const slot = slots.find(s => s.position === player.roster_position && !s.player);
      if (slot) {
        const scheduleInfo = getPlayerScheduleInfo(player);
        slot.player = {
          id: player.player_id || null,
          name: player.player_name || 'Unknown',
          playingPosition: player.position || 'N/A',
          team: player.team || 'N/A',
          // Add schedule info fields for PlayerCard
          est_time: scheduleInfo?.est_time || '',
          day: scheduleInfo?.day || '',
          date: scheduleInfo?.date || '',
          location: scheduleInfo?.location || '',
          opponent: scheduleInfo?.opponent || '',
          scheduleId: scheduleInfo?.scheduleId || null
        };
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
            <div className="team-score">--</div>
            <div className="table-responsive" id="home-roster-div">
              <table className="roster-table" id="home-roster-table">
                <thead>
                  <tr>
                    <th className="player-header">Player</th>
                    <th className="score-header">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {homeRosterSlots.map((rosterEntry, index) => (
                    <tr
                      key={rosterEntry.sPosition}
                      className="roster-row"
                      {...(rosterEntry.position !== 'BENCH' ? { 'data-position': rosterEntry.sPosition } : {})}
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
                      <td className="score-cell">--</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="roster-section">
            <h3 className="team-title">{getTeamName(matchups.find(m => m.id === parseInt(selectedMatchup, 10))?.away_league_member)} Score</h3>
            <div className="team-score"> -- </div>
            <div className="table-responsive" id="away-roster-div">
              <table className="roster-table" id="away-roster-table">
                <thead>
                  <tr>
                    <th className="score-header">Score</th>
                    <th className="player-header">Player</th>
                  </tr>
                </thead>
                <tbody>
                  {awayRosterSlots.map((rosterEntry, index) => (
                    <tr
                      key={rosterEntry.sPosition}
                      className="roster-row"
                      {...(rosterEntry.position !== 'BENCH' ? { 'data-position': rosterEntry.sPosition } : {})}
                    >
                      <td className="score-cell">--</td>
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
};

MatchupComponent.propTypes = {
  currentUser: PropTypes.object,
  currentLeague: PropTypes.shape({
    league_id: PropTypes.number,
    name: PropTypes.string
  }),
};

export default MatchupComponent;