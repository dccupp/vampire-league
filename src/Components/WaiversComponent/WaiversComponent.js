import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axiosInstance from '../../api';
import axios from 'axios';
import { calculateFantasySeasonScores } from '../../api/calculateFantasyScores';
import PlayerStatsCard from '../PlayerStatsCard/PlayerStatsCard';
import WaiverClaimFormComponent from '../WaiverClaimFormComponent/WaiverClaimFormComponent';
import DirectAddPlayerComponent from '../DirectAddPlayerComponent/DirectAddPlayerComponent';
import './WaiversComponent.css';

const WaiversComponent = ({ currentUser, currentLeague }) => {
  const [userRoster, setUserRoster] = useState([]);
  const [freeAgents, setFreeAgents] = useState([]);
  const [nameFilter, setNameFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('All');
  const [positionFilter, setPositionFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedLeagueMember, setSelectedLeagueMember] = useState(null);
  const [allYearlyStats, setAllYearlyStats] = useState([]);
  const [seasonScores, setSeasonScores] = useState([]);
  const [waiverRules, setWaiverRules] = useState(null);
  const [fantasyWeeks, setFantasyWeeks] = useState([]);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [isAfterWaiverDay, setIsAfterWaiverDay] = useState(false);
  const itemsPerPage = 20;
  const pageWindow = 5;

  const nflTeams = useMemo(() => [
    'All', 'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE',
    'DAL', 'DEN', 'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC', 'LAC',
    'LAR', 'LV', 'MIA', 'MIN', 'NE', 'NO', 'NYG', 'NYJ', 'PHI',
    'PIT', 'SEA', 'SF', 'TB', 'TEN', 'WAS'
  ], []);

  const fetchData = useCallback(async () => {
    if (!currentUser?.id || !currentLeague?.league_id) {
      setError('Missing user or league information');
      return;
    }

    // Get current date and time
    const now = new Date();
    const formattedNow = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    setCurrentDateTime(now);

    // Fetch waiver rules for this league
    try {
      const waiverRulesResponse = await axios.get(
        `/waiver_rules/getWaiverRulesByLeagueId/${currentLeague.league_id}`
      );
      // If the response is an array, use the first record
      const waiverRulesArray = Array.isArray(waiverRulesResponse.data) ? waiverRulesResponse.data : [];
      const firstWaiverRule = waiverRulesArray[0] || {};
      const waiverDay = firstWaiverRule.waiver_day;
      setWaiverRules({ waiver_day: waiverDay });
    } catch (error) {
      console.error('Error fetching waiver rules:', error);
      setWaiverRules(null);
    }

    // Fetch all fantasy weeks
    let fantasyWeeksData = [];
    try {
      const fantasyWeeksResponse = await axios.get(`/fantasy_weeks/getFantasyWeeks`);
      fantasyWeeksData = fantasyWeeksResponse.data;
      setFantasyWeeks(fantasyWeeksData);

      // Determine current fantasy week
      if (Array.isArray(fantasyWeeksData)) {
        const currentYear = now.getFullYear();
        const weeksForYear = fantasyWeeksData.filter(week =>
          new Date(week.begin_datetime).getFullYear() === currentYear
        );
        const sortedWeeks = [...weeksForYear].sort(
          (a, b) => new Date(a.begin_datetime) - new Date(b.begin_datetime)
        );
        const earliestWeek = sortedWeeks[0];

        let currentWeek = fantasyWeeksData.find(week => {
          const begin = new Date(week.begin_datetime);
          const end = new Date(week.end_datetime);
          return now >= begin && now <= end;
        });

        // If before the first week, use week one
        if (!currentWeek && earliestWeek && now < new Date(earliestWeek.begin_datetime)) {
          currentWeek = earliestWeek;
        } else {
          if (!currentWeek) {
            console.warn('No matching fantasy week found for current datetime:', formattedNow);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching fantasy weeks:', error);
      setFantasyWeeks([]);
    }

    try {
      const [playersRes, membersRes, leagueRosteredRes] = await Promise.all([
        axiosInstance.get('/players/getPlayers'),
        axiosInstance.get(`/league_members/getLeagueMembersByLeagueId/${currentLeague.league_id}`),
        axiosInstance.get(`/rostered_players/getRosteredPlayersByLeagueId/${currentLeague.league_id}`)
      ]);

      const allPlayers = Array.isArray(playersRes.data) ? playersRes.data : [];
      const leagueMembers = Array.isArray(membersRes.data) ? membersRes.data : [];
      if (!leagueMembers.length) {
        setError('No league members found');
        return;
      }

      const userMember = leagueMembers.find(member => member.user_id === currentUser.id);
      if (!userMember) {
        setError('User is not a member of this league');
        return;
      }

      setSelectedLeagueMember(userMember);

      const rosterRes = await axiosInstance.get(`/rostered_players/getRosteredPlayersByLeagueMemberId/${userMember.id}`);
      const rosteredPlayers = Array.isArray(rosterRes.data)
        ? rosterRes.data
            .filter(r => r.is_rostered === 1)
            .map(p => ({
              ...p,
              name: p.player_name,
              playingPosition: p.position,
              league_member: userMember
            }))
        : [];
      setUserRoster(rosteredPlayers);

      const rosteredIds = new Set(
        (Array.isArray(leagueRosteredRes.data) ? leagueRosteredRes.data : [])
          .filter(r => r.is_rostered === 1)
          .map(r => r.player_id)
      );


      // Use id from players table, but do not add player_id property (keep id as the unique key)
      const validFreeAgents = allPlayers
        .filter(p => p.id && !rosteredIds.has(p.id))
        .map(p => ({
          ...p,
          name: p.player_name || 'Unknown Player',
          playingPosition: p.position || 'Unknown'
        }));

      // Log for debugging duplicate player_ids
      const playerIds = validFreeAgents.map(p => p.id);
      const uniquePlayerIds = new Set(playerIds);
      if (playerIds.length !== uniquePlayerIds.size) {
        console.warn('Duplicate player IDs detected:', playerIds.filter((id, index) => playerIds.indexOf(id) !== index));
      }

      setFreeAgents(validFreeAgents);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load waiver data');
    }
  }, [currentUser?.id, currentLeague?.league_id]);


  // Fetch all yearly stats for 2024 once
  useEffect(() => {
    const fetchAllYearlyStats = async () => {
      try {
        const res = await axiosInstance.get('/yearly_stats/getYearlyStatsBySeason/2024');
        setAllYearlyStats(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        setAllYearlyStats([]);
        console.error('Failed to fetch all yearly stats:', error);
      }
    };
    fetchAllYearlyStats();
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredFreeAgents = useMemo(() => {
    // Log the raw freeAgents and filter values for debugging
    const filtered = freeAgents.filter(player => {
      // Defensive: handle missing/null/undefined properties
      const playerName = (player.name || player.player_name || '').toString().toLowerCase();
      const playerTeam = (player.team || player.nfl_team || '').toString().toUpperCase();
      const playerPosition = (player.playingPosition || player.position || '').toString();

      const matchesName = playerName.includes(nameFilter.toLowerCase());
      const matchesTeam = teamFilter !== 'All' ? playerTeam === teamFilter.toUpperCase() : true;
      const matchesPosition = positionFilter !== 'All' ? playerPosition === positionFilter : true;
      return matchesName && matchesTeam && matchesPosition;
    });

    return filtered;
  }, [freeAgents, nameFilter, teamFilter, positionFilter]);

  // Automatically calculate and log season fantasy scores for filtered free agents
  useEffect(() => {
    if (filteredFreeAgents.length > 0 && currentLeague?.league_id) {
      const playerIds = filteredFreeAgents.map(player => player.id);
      const season = 2024; // Hardcoded for now
      const leagueId = currentLeague.league_id;
      calculateFantasySeasonScores(playerIds, season, leagueId).then(result => {
        if (result.status === 'success') {
          setSeasonScores(result.data);
        } else {
          setSeasonScores([]);
        }
      });
    } else {
      setSeasonScores([]);
    }
  }, [filteredFreeAgents, currentLeague?.league_id]);

  // Helper to get stats for a player by id
  const getStatsForPlayer = (id) => {
    const stats = allYearlyStats.find(stat => stat.player_id === id);
    return stats || {
      passing_yards: 0,
      passing_tds: 0,
      interceptions: 0,
      two_point_passes: 0,
      rushing_yards: 0,
      rushing_tds: 0,
      two_point_rushes: 0,
      receptions: 0,
      receiving_yards: 0,
      receiving_tds: 0,
      two_point_receptions: 0,
      special_teams_tds: 0
    };
  };

  const totalPages = Math.ceil(filteredFreeAgents.length / itemsPerPage);

  // Merge stats and fantasy score into each player for current page, using id as the unique key
  const currentFreeAgents = filteredFreeAgents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(player => {
    const stats = getStatsForPlayer(player.id);
    const scoreObj = seasonScores.find(s => s.player_id === player.id);
    return {
      ...player,
      stats,
      fantasyScore: scoreObj ? scoreObj.fantasyScore : null
    };
  });

  const pageNumbers = useMemo(() => {
    const pages = [];
    const startPage = Math.max(1, currentPage - Math.floor(pageWindow / 2));
    const endPage = Math.min(totalPages, startPage + pageWindow - 1);

    if (startPage > 1) pages.push(1);
    if (startPage > 2) pages.push('...');

    for (let i = startPage; i <= endPage; i++) pages.push(i);

    if (endPage < totalPages - 1) pages.push('...');
    if (endPage < totalPages) pages.push(totalPages);

    return pages;
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (
      waiverRules &&
      waiverRules.waiver_day &&
      Array.isArray(fantasyWeeks) &&
      fantasyWeeks.length > 0 &&
      currentDateTime
    ) {
      const now = currentDateTime;
      const formattedNow = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      // Find the current week
      const currentYear = now.getFullYear();
      const weeksForYear = fantasyWeeks.filter(week =>
        new Date(week.begin_datetime).getFullYear() === currentYear
      );
      const sortedWeeks = [...weeksForYear].sort(
        (a, b) => new Date(a.begin_datetime) - new Date(b.begin_datetime)
      );
      const earliestWeek = sortedWeeks[0];

      let currentWeek = fantasyWeeks.find(week => {
        const begin = new Date(week.begin_datetime);
        const end = new Date(week.end_datetime);
        return now >= begin && now <= end;
      });

      if (!currentWeek && earliestWeek && now < new Date(earliestWeek.begin_datetime)) {
        currentWeek = earliestWeek;
      } else {
        if (!currentWeek) {
          console.warn('No matching fantasy week found for current datetime:', formattedNow);
        }
      }

      // Waiver day logic
      if (currentWeek && waiverRules.waiver_day) {
        const waiverDay = waiverRules.waiver_day;
        const begin = new Date(currentWeek.begin_datetime);
        const end = new Date(currentWeek.end_datetime);
        let waiverDate = null;
        let iter = new Date(begin);
        while (iter <= end) {
          const dayName = iter.toLocaleString('en-US', { weekday: 'long' });
          if (dayName === waiverDay) {
            waiverDate = new Date(iter);
            break;
          }
          iter.setDate(iter.getDate() + 1);
        }
        if (waiverDate) {
          if (now < waiverDate) {
            setIsAfterWaiverDay(false);
          } else {
            setIsAfterWaiverDay(true);
          }
        } else {
          setIsAfterWaiverDay(false);
          console.warn(`Waiver day (${waiverDay}) not found in current fantasy week range.`);
        }
      }
    }
  }, [waiverRules, fantasyWeeks, currentDateTime]);

  return (
    <div className="waivers-container">
      <h2 className="waivers-title">Add Players from Waivers</h2>
      {error && <div className="error-message">{error}</div>}
      <div className="waivers-tables-container">
        <div className="table-wrapper free-agents-table-wrapper">
          <h3 className="table-title">Free Agents</h3>
          <div className="filters-container">
            <label className="filter-label">
              Name:
              <input
                type="text"
                className="filter-input"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
              />
            </label>
            <label className="filter-label">
              Team:
              <select
                className="filter-select"
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
              >
                {nflTeams.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </label>
            <label className="filter-label">
              Position:
              <select
                className="filter-select"
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="QB">QB</option>
                <option value="RB">RB</option>
                <option value="WR">WR</option>
                <option value="TE">TE</option>
                <option value="DEF">DEF</option>
                <option value="K">K</option>
              </select>
            </label>
          </div>
          <table className="waivers-table">
            <thead>
              <tr>
                <th>Player</th>
              </tr>
            </thead>
            <tbody>
              {currentFreeAgents.length > 0 ? (
                currentFreeAgents.map((player, index) => (
                  <tr key={player.id} className="waivers-row">
                    <td className="player-cell">
                      <PlayerStatsCard
                        player={player}
                        stats={player.stats}
                        fantasyScore={player.fantasyScore}
                        index={index}
                        onClick={() => {
                          setSelectedPlayer(player);
                          setSelectedLeagueMember(userRoster.length ? userRoster[0].league_member : null);
                        }}
                        isSelected={selectedPlayer?.id === player.id}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr key="no-free-agents">
                  <td className="empty-message">No free agents available</td>
                </tr>
              )}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="pagination-container">
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                First
              </button>
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              {pageNumbers.map((page, idx) => (
                <button
                  key={idx}
                  className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                  onClick={() => typeof page === 'number' && setCurrentPage(page)}
                  disabled={typeof page !== 'number'}
                >
                  {page}
                </button>
              ))}
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                Last
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Show WaiverClaimFormComponent if before waiver day */}
      {selectedPlayer && selectedLeagueMember && !isAfterWaiverDay && (
        <WaiverClaimFormComponent
          player={selectedPlayer}
          league_member={selectedLeagueMember}
          userRoster={userRoster}
          onClose={() => {
            setSelectedPlayer(null);
            setSelectedLeagueMember(null);
          }}
          onClaimSuccess={() => {
            setSelectedPlayer(null);
            setSelectedLeagueMember(null);
            fetchData();
          }}
        />
      )}
      {/* Show DirectAddPlayerComponent if after waiver day */}
      {selectedPlayer && selectedLeagueMember && isAfterWaiverDay && (
        <DirectAddPlayerComponent
          player={selectedPlayer}
          league_member={selectedLeagueMember}
          userRoster={userRoster}
          onClose={() => {
            setSelectedPlayer(null);
            setSelectedLeagueMember(null);
          }}
          onClaimSuccess={() => {
            setSelectedPlayer(null);
            setSelectedLeagueMember(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
};

export default WaiversComponent;