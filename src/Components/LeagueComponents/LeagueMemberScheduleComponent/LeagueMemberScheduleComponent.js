import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axiosInstance from '../../../api';
import './LeagueMemberScheduleComponent.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const LeagueMemberScheduleComponent = ({ currentUser, currentLeague }) => {
  const [schedule, setSchedule] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?.id || !currentLeague?.league_id) {
        setError('User or league data is missing.');
        setLoading(false);
        return;
      }

      try {
        // Fetch league member for the current user
        const memberResponse = await axiosInstance.get(`/league_members/getLeagueMembersByUserId/${currentUser.id}`);
  const leagueMember = memberResponse.data.find(member => member.league_id === currentLeague.league_id);
        if (!leagueMember) {
          setError('You are not a member of this league.');
          setLoading(false);
          return;
        }

        // Set default selected member to current user
        setSelectedMemberId(leagueMember.id);

        // Fetch all league members
        const membersResponse = await axiosInstance.get(`/league_members/getLeagueMembersByLeagueId/${currentLeague.league_id}`);
        setMembers(membersResponse.data);

        // Fetch schedule records
        const scheduleResponse = await axiosInstance.get(`/schedules/getSchedulesByLeagueId/${currentLeague.league_id}`);
        const schedules = scheduleResponse.data;

        // Build schedule for 14 weeks for the selected member
        const updateSchedule = (memberId) => {
          const fullSchedule = [];
          for (let week = 1; week <= 14; week++) {
            if (week <= 9) {
              const weekMatches = schedules.filter(s => s.week === week && (s.home_league_member === memberId || s.away_league_member === memberId));
              if (weekMatches.length > 0) {
                const match = weekMatches[0];
                const homeMember = membersResponse.data.find(m => m.id === match.home_league_member);
                const awayMember = membersResponse.data.find(m => m.id === match.away_league_member);
                const homeScore = match.home_score !== null ? match.home_score.toFixed(2) : '--';
                const awayScore = match.away_score !== null ? match.away_score.toFixed(2) : '--';
                fullSchedule.push({
                  week,
                  awayScore,
                  awayTeam: awayMember?.team_name || 'Unknown',
                  homeTeam: homeMember?.team_name || 'Unknown',
                  homeScore
                });
              } else {
                fullSchedule.push({ week, match: 'No match scheduled' });
              }
            } else {
              fullSchedule.push({ week, match: 'TBD' });
            }
          }
          setSchedule(fullSchedule);
        };

        updateSchedule(leagueMember.id);
        setError(null);
      } catch (err) {
        console.error('Error fetching schedule:', err.response || err);
        setError(`Failed to fetch schedule: ${err.response?.data?.message || err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, currentLeague]);

  const handleMemberChange = (event) => {
    const memberId = parseInt(event.target.value, 10);
    setSelectedMemberId(memberId);
    updateSchedule(memberId);
  };

  const handlePrevMember = () => {
    const currentIndex = members.findIndex(m => m.id === selectedMemberId);
    const prevIndex = (currentIndex - 1 + members.length) % members.length;
    const prevMemberId = members[prevIndex].id;
    setSelectedMemberId(prevMemberId);
    updateSchedule(prevMemberId);
  };

  const handleNextMember = () => {
    const currentIndex = members.findIndex(m => m.id === selectedMemberId);
    const nextIndex = (currentIndex + 1) % members.length;
    const nextMemberId = members[nextIndex].id;
    setSelectedMemberId(nextMemberId);
    updateSchedule(nextMemberId);
  };

  const updateSchedule = (memberId) => {
    axiosInstance.get(`/schedules/getSchedulesByLeagueId/${currentLeague.league_id}`).then(scheduleResponse => {
      const schedules = scheduleResponse.data;
      const fullSchedule = [];
      for (let week = 1; week <= 14; week++) {
        if (week <= 9) {
          const weekMatches = schedules.filter(s => s.week === week && (s.home_league_member === memberId || s.away_league_member === memberId));
          if (weekMatches.length > 0) {
            const match = weekMatches[0];
            const homeMember = members.find(m => m.id === match.home_league_member);
            const awayMember = members.find(m => m.id === match.away_league_member);
            const homeScore = match.home_score !== null ? match.home_score.toFixed(2) : '--';
            const awayScore = match.away_score !== null ? match.away_score.toFixed(2) : '--';
            fullSchedule.push({
              week,
              awayScore,
              awayTeam: awayMember?.team_name || 'Unknown',
              homeTeam: homeMember?.team_name || 'Unknown',
              homeScore
            });
          } else {
            fullSchedule.push({ week, match: 'No match scheduled' });
          }
        } else {
          fullSchedule.push({ week, match: 'TBD' });
        }
      }
      setSchedule(fullSchedule);
    }).catch(err => {
      console.error('Error updating schedule:', err.response || err);
      setError(`Failed to update schedule: ${err.response?.data?.message || err.message}`);
    });
  };

  if (loading) {
    return <div className="schedule-container">Loading schedule...</div>;
  }

  if (error) {
    return <div className="schedule-container">{error}</div>;
  }

  return (
    <div className="schedule-container animate__animated animate__fadeIn">
      <h2 className="schedule-title">League Schedule</h2>
      <div className="schedule-controls">
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
          {members.map(member => (
            <option key={member.id} value={member.id}>
              {member.team_name || 'Unknown'}
            </option>
          ))}
        </select>
        <button className="arrow-button" onClick={handleNextMember} title="Next Member">
          <svg className="arrow-icon" viewBox="0 0 24 24">
            <path d="M9 18l6-6-6-6" fill="none" stroke="#2ecc71" strokeWidth="2"/>
          </svg>
        </button>
      </div>
      <div className="schedule-table-container">
        <table className="schedule-table">
          <thead>
            <tr>
              <th className="week-column">Week</th>
              <th className="matchup-column">Matchup</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((entry, index) => (
              <tr key={index} className="schedule-row">
                <td className="schedule-info week-info">Week {entry.week}</td>
                <td className="schedule-info matchup-info">
                  {entry.match ? (
                    entry.match
                  ) : (
                    <div className="matchup-details">
                      <span className="score">{entry.awayScore}</span>
                      <span className="team-name">{entry.awayTeam}</span>
                      <span className="at-symbol">@</span>
                      <span className="team-name">{entry.homeTeam}</span>
                      <span className="score">{entry.homeScore}</span>
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

LeagueMemberScheduleComponent.propTypes = {
  currentUser: PropTypes.object,
  currentLeague: PropTypes.shape({
    league_id: PropTypes.number,
  }),
};

export default LeagueMemberScheduleComponent;