import React, { useState, useEffect, useMemo } from 'react';
import { isAxiosError } from 'axios';
import axiosInstance from '../../api';
import { getCurrentFantasyWeek } from '../../api/seasonService';
import { CurrentUser, CurrentLeague, RosterSlot, Schedule, LeagueMember, RosterRules } from '../../types';
import PlayerCard from '../PlayerCard/PlayerCard';
import './MatchupComponent.css';
import 'bootstrap/dist/css/bootstrap.min.css';

interface MatchupComponentProps {
  currentUser: CurrentUser;
  currentLeague: CurrentLeague;
}

const MatchupComponent = ({ currentUser, currentLeague }: MatchupComponentProps) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [leagueMembers, setLeagueMembers] = useState<LeagueMember[]>([]);
  const [rosterRules, setRosterRules] = useState<Record<number, RosterRules> | null>(null);
  const [currentFantasyWeek, setCurrentFantasyWeek] = useState<{year: number; week: number} | null>(null);
  const [homeRosterSlots, setHomeRosterSlots] = useState<RosterSlot[]>([]);
  const [awayRosterSlots, setAwayRosterSlots] = useState<RosterSlot[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [selectedMatchup, setSelectedMatchup] = useState<string>('');
  const [weeks, setWeeks] = useState<number[]>([]);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<string>('');
  const [isMessageFading, setIsMessageFading] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Derived from roster slots — no separate state needed
  const homeTeamScore = useMemo(() =>
    homeRosterSlots
      .filter(slot => slot.position !== 'BENCH' && slot.position !== 'IR' && slot.player?.fantasyScore != null)
      .reduce((sum, slot) => sum + (slot.player!.fantasyScore as number), 0),
    [homeRosterSlots]
  );

  const awayTeamScore = useMemo(() =>
    awayRosterSlots
      .filter(slot => slot.position !== 'BENCH' && slot.position !== 'IR' && slot.player?.fantasyScore != null)
      .reduce((sum, slot) => sum + (slot.player!.fantasyScore as number), 0),
    [awayRosterSlots]
  );

  // Derive matchups from schedules — no state, no extra render cycle
  const matchups = useMemo(() => {
    if (!selectedWeek || schedules.length === 0 || leagueMembers.length === 0) return [];
    return schedules
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
  }, [selectedWeek, schedules, leagueMembers]);


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

  // Fetch static data on mount — members, roster rules, schedules, and current fantasy week
  useEffect(() => {
    const fetchData = async () => {
      if (!currentLeague?.league_id) {
        setMessage('Invalid league data.');
        setMessageType('error');
        setIsLoading(false);
        return;
      }

      try {
        const [
          membersRes,
          rulesType1Res,
          rulesType2Res,
          schedulesRes,
          currentWeekResult,
        ] = await Promise.all([
          axiosInstance.get(`/league_members/getLeagueMembersByLeagueId/${currentLeague.league_id}`),
          axiosInstance.get(`/roster_rules/getRosterRulesByLeagueId/${currentLeague.league_id}/1`),
          axiosInstance.get(`/roster_rules/getRosterRulesByLeagueId/${currentLeague.league_id}/2`),
          axiosInstance.get(`/schedules/getSchedulesByLeagueId/${currentLeague.league_id}`),
          (async () => {
            try {
              const weekRes = await getCurrentFantasyWeek();
              return weekRes.data ?? null;
            } catch {
              return null;
            }
          })(),
        ]);

        if (!Array.isArray(membersRes.data) || membersRes.data.length === 0) {
          setMessage('No league members found.');
          setMessageType('error');
          setIsLoading(false);
          return;
        }
        setLeagueMembers(membersRes.data);

        const rosterRulesMap: Record<number, RosterRules> = {};
        for (const member of membersRes.data) {
          rosterRulesMap[member.id] = member.is_vamp ? rulesType2Res.data : rulesType1Res.data;
        }
        setRosterRules(rosterRulesMap);

        if (!Array.isArray(schedulesRes.data) || schedulesRes.data.length === 0) {
          setMessage('No schedules found for this league.');
          setMessageType('error');
          setIsLoading(false);
          return;
        }
        setSchedules(schedulesRes.data);

        const uniqueWeeks = [...new Set(schedulesRes.data.map(s => s.week))].sort((a, b) => a - b);
        setWeeks(uniqueWeeks);
        if (uniqueWeeks.length > 0) {
          setSelectedWeek(uniqueWeeks[0]);
        }

        setCurrentFantasyWeek(currentWeekResult);

      } catch (error) {
        const msg = isAxiosError(error) ? error.response?.data?.message || error.message : 'Unknown error';
        setMessage('Failed to load data: ' + msg);
        setMessageType('error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [currentLeague.league_id]);

  // Auto-select first matchup whenever the derived matchups list changes
  useEffect(() => {
    if (matchups.length > 0) {
      setSelectedMatchup(String(matchups[0].id));
    } else {
      setSelectedMatchup('');
      setHomeRosterSlots([]);
      setAwayRosterSlots([]);
      if (selectedWeek) {
        setMessage('No matchups found for this week.');
        setMessageType('info');
      }
    }
  }, [matchups, selectedWeek]);

  // Fetch rosters and scores for the selected matchup in a single backend call
  useEffect(() => {
    const fetchRosters = async () => {
      if (!selectedMatchup || !rosterRules || !currentFantasyWeek) return;

      const matchup = matchups.find(m => m.id === parseInt(selectedMatchup, 10));
      if (!matchup) return;

      const { week, year } = currentFantasyWeek;

      try {
        const res = await axiosInstance.get(
          `/matchups/getMatchupPageData/${currentLeague.league_id}/${selectedMatchup}`,
          { params: { week, year } }
        );

        const { home_roster, away_roster } = res.data;

        const homeRules = rosterRules[matchup.home_league_member];
        const awayRules = rosterRules[matchup.away_league_member];
        setHomeRosterSlots(constructRosterSlots(homeRules, home_roster || []));
        setAwayRosterSlots(constructRosterSlots(awayRules, away_roster || []));

        if (!home_roster?.length && !away_roster?.length) {
          setMessage('No players rostered for either team.');
          setMessageType('info');
        } else if (!home_roster?.length) {
          setMessage('No players rostered for home team.');
          setMessageType('info');
        } else if (!away_roster?.length) {
          setMessage('No players rostered for away team.');
          setMessageType('info');
        } else {
          setMessage('');
        }
      } catch (error) {
        setMessage('Failed to load rosters.');
        setMessageType('error');
        setHomeRosterSlots([]);
        setAwayRosterSlots([]);
      }
    };
    fetchRosters();
  }, [selectedMatchup, rosterRules, currentFantasyWeek, matchups, currentLeague.league_id]);

  const constructRosterSlots = (rosterRules: RosterRules, rosteredPlayers: any[]): RosterSlot[] => {
    if (!rosterRules || rosteredPlayers.length === 0) return [];
    const slots: RosterSlot[] = [];
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

    positionCounts.forEach(({ position, count }) => {
      for (let i = 0; i < count; i++) {
        slots.push({ position, sPosition: `${position}${i + 1}`, player: null });
      }
    });

    const assignedPlayers = [...rosteredPlayers];
    slots.forEach(slot => {
      const player = assignedPlayers.find(
        p => p.roster_position === slot.sPosition || (slot.position === 'BENCH' && p.roster_position === 'BENCH')
      );
      if (player) {
        slot.player = player;
        assignedPlayers.splice(assignedPlayers.indexOf(player), 1);
      }
    });

    let irSlots = slots.filter(s => s.position === 'IR');
    let nonIrSlots = slots.filter(s => s.position !== 'IR');
    assignedPlayers.forEach(player => {
      nonIrSlots.push({
        position: 'BENCH',
        sPosition: `BENCH${nonIrSlots.filter(s => s.position === 'BENCH').length + 1}`,
        player,
      });
    });

    const benchCount = rosterRules.bench_count || 0;
    const benchSlots = nonIrSlots.filter(s => s.position === 'BENCH');
    const nonBenchNonIrSlots = nonIrSlots.filter(s => s.position !== 'BENCH' && s.position !== 'IR');
    const filledBenchSlots = benchSlots.filter(s => s.player);
    const emptyBenchSlots = benchSlots.filter(s => !s.player);
    return [
      ...nonBenchNonIrSlots,
      ...filledBenchSlots,
      ...emptyBenchSlots.slice(0, benchCount),
      ...irSlots,
    ];
  };

  const handleWeekChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedWeek(event.target.value);
    setSelectedMatchup('');
  };

  const handleMatchupChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMatchup(event.target.value);
  };

  const getTeamName = (memberId: number | undefined) => {
    if (memberId == null) return 'Unknown';
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
        <select className="week-select" value={selectedWeek} onChange={handleWeekChange}>
          {weeks.length > 0 ? (
            weeks.map(week => (
              <option key={week} value={week}>Week {week}</option>
            ))
          ) : (
            <option value="">No weeks available</option>
          )}
        </select>
        <select className="matchup-select" value={selectedMatchup} onChange={handleMatchupChange}>
          {matchups.length > 0 ? (
            matchups.map(matchup => (
              <option key={matchup.id} value={matchup.id}>{matchup.label}</option>
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
                      <tr key={rosterEntry.sPosition} className="roster-row" data-position={rosterEntry.sPosition}>
                        <td className="player-cell">
                          {rosterEntry.player ? (
                            <PlayerCard player={rosterEntry.player} index={index} onClick={() => {}} isSelected={false} />
                          ) : (
                            <div className="empty-slot">Empty</div>
                          )}
                        </td>
                        <td className="score-cell">
                          {rosterEntry.player?.fantasyScore != null ? rosterEntry.player.fantasyScore : '--'}
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
                            <PlayerCard player={rosterEntry.player} index={index} onClick={() => {}} isSelected={false} />
                          ) : (
                            <div className="empty-slot">Empty</div>
                          )}
                        </td>
                        <td className="score-cell">
                          {rosterEntry.player?.fantasyScore != null ? rosterEntry.player.fantasyScore : '--'}
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
                          {rosterEntry.player?.fantasyScore != null ? rosterEntry.player.fantasyScore : '--'}
                        </td>
                        <td className="player-cell">
                          {rosterEntry.player ? (
                            <PlayerCard player={rosterEntry.player} index={index} onClick={() => {}} isSelected={false} />
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
                          {rosterEntry.player?.fantasyScore != null ? rosterEntry.player.fantasyScore : '--'}
                        </td>
                        <td className="player-cell">
                          {rosterEntry.player ? (
                            <PlayerCard player={rosterEntry.player} index={index} onClick={() => {}} isSelected={false} />
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
};

export default MatchupComponent;