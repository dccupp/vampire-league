import { useState, useEffect } from 'react';
import { isAxiosError } from 'axios';
import axiosInstance from '../../../api';
import { LeagueMember, Schedule } from '../../../types';

import { useUser } from '../../../context/UserContext';
import { useLeague } from '../../../context/LeagueContext';

import './LeagueMemberScheduleComponent.css';
import 'bootstrap/dist/css/bootstrap.min.css';

interface ScheduleEntry {
  week: number;
  match?: string;
  awayScore?: string;
  awayTeam?: string;
  homeTeam?: string;
  homeScore?: string;
}

const buildSchedule = (
  memberId: number,
  schedules: Schedule[],
  membersList: LeagueMember[]
): ScheduleEntry[] => {
  const result: ScheduleEntry[] = [];
  for (let week = 1; week <= 17; week++) {
    const match = schedules.find(
      s => s.week === week &&
        (s.home_league_member === memberId || s.away_league_member === memberId)
    );

    if (match) {
      const homeMember = membersList.find(m => m.id === match.home_league_member);
      const awayMember = membersList.find(m => m.id === match.away_league_member);
      const homeScore = match.home_score != null ? Number(match.home_score).toFixed(2) : '--';
      const awayScore = match.away_score != null ? Number(match.away_score).toFixed(2) : '--';
      result.push({
        week,
        awayScore,
        awayTeam: awayMember?.team_name || 'Unknown',
        homeTeam: homeMember?.team_name || 'Unknown',
        homeScore,
      });
    } else {
      result.push({ week, match: week === 15 ? 'BYE' : 'TBD' });
    }
  }
  return result;
};

const LeagueMemberScheduleComponent = () => {
  const { currentUser } = useUser();
  const { currentLeague } = useLeague();
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [members, setMembers] = useState<LeagueMember[]>([]);
  const [rawSchedules, setRawSchedules] = useState<Schedule[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?.id || !currentLeague?.league_id) {
        setError('User or league data is missing.');
        setLoading(false);
        return;
      }

      try {
        const [memberResponse, membersResponse, scheduleResponse] = await Promise.all([
          axiosInstance.get(`/league_members/getLeagueMembersByUserId/${currentUser.id}`),
          axiosInstance.get(`/league_members/getLeagueMembersByLeagueId/${currentLeague.league_id}`),
          axiosInstance.get(`/schedules/getSchedulesByLeagueId/${currentLeague.league_id}`),
        ]);

        const leagueMember: LeagueMember | undefined = memberResponse.data.find(
          (m: LeagueMember) => m.league_id === currentLeague.league_id
        );
        if (!leagueMember) {
          setError('You are not a member of this league.');
          setLoading(false);
          return;
        }

        const membersList: LeagueMember[] = Array.isArray(membersResponse.data) ? membersResponse.data : [];
        const schedules: Schedule[] = Array.isArray(scheduleResponse.data) ? scheduleResponse.data : [];

        setMembers(membersList);
        setRawSchedules(schedules);
        setSelectedMemberId(leagueMember.id);
        setSchedule(buildSchedule(leagueMember.id, schedules, membersList));
        setError(null);
      } catch (err) {
        const msg = isAxiosError(err)
          ? err.response?.data?.message || err.message
          : 'Failed to fetch schedule.';
        console.error('Error fetching schedule:', err);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser?.id, currentLeague?.league_id]);

  const selectMember = (memberId: number) => {
    setSelectedMemberId(memberId);
    setSchedule(buildSchedule(memberId, rawSchedules, members));
  };

  const handleMemberChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    selectMember(Number(e.target.value));
  };

  const handlePrevMember = () => {
    const currentIndex = members.findIndex(m => m.id === selectedMemberId);
    const prevIndex = (currentIndex - 1 + members.length) % members.length;
    selectMember(members[prevIndex].id);
  };

  const handleNextMember = () => {
    const currentIndex = members.findIndex(m => m.id === selectedMemberId);
    const nextIndex = (currentIndex + 1) % members.length;
    selectMember(members[nextIndex].id);
  };

  if (loading) {
    return <div className="lmsc-schedule-container">Loading schedule...</div>;
  }

  if (error) {
    return <div className="lmsc-schedule-container">{error}</div>;
  }

  return (
    <div className="lmsc-schedule-container animate__animated animate__fadeIn">
      <h2 className="lmsc-schedule-title">League Schedule</h2>
      <div className="lmsc-schedule-controls">
        <button className="lmsc-arrow-button" onClick={handlePrevMember} title="Previous Member">
          <svg className="lmsc-arrow-icon" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
        <select
          className="lmsc-member-select"
          value={selectedMemberId || ''}
          onChange={handleMemberChange}
        >
          {members.map(member => (
            <option key={member.id} value={member.id}>
              {member.team_name || 'Unknown'}
            </option>
          ))}
        </select>
        <button className="lmsc-arrow-button" onClick={handleNextMember} title="Next Member">
          <svg className="lmsc-arrow-icon" viewBox="0 0 24 24">
            <path d="M9 18l6-6-6-6" fill="none" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
      </div>
      <div className="lmsc-schedule-table-container">
        <table className="lmsc-schedule-table">
          <thead>
            <tr>
              <th className="lmsc-week-column">Week</th>
              <th className="lmsc-matchup-column">Matchup</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map(entry => (
              <tr key={entry.week} className="lmsc-schedule-row">
                <td className="lmsc-schedule-info lmsc-week-info">Week {entry.week}</td>
                <td className="lmsc-schedule-info lmsc-matchup-info">
                  {entry.match ? (
                    <span className="lmsc-bye-tbd">{entry.match}</span>
                  ) : (
                    <div className="lmsc-matchup-details">
                      <span className="lmsc-score">{entry.awayScore}</span>
                      <span className="lmsc-team-name">{entry.awayTeam}</span>
                      <span className="lmsc-at-symbol">@</span>
                      <span className="lmsc-team-name">{entry.homeTeam}</span>
                      <span className="lmsc-score">{entry.homeScore}</span>
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

export default LeagueMemberScheduleComponent;