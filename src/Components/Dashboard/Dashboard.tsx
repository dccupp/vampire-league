import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { isAxiosError } from 'axios';
import axiosInstance from '../../api';
import { getCurrentFantasyWeek } from '../../api/seasonService';
import { CurrentUser, CurrentLeague, LeagueMember, Schedule } from '../../types';
import RecentActivityComponent from '../LeagueComponents/RecentActivityComponent/RecentActivityComponent';
import './Dashboard.css';

interface DashboardProps {
  currentUser: CurrentUser;
  currentLeague: CurrentLeague;
}

interface TeamData {
  team_name: string;
  remaining_faab_budget: number | string;
}

interface CurrentMatchup {
  week: number;
  opponentName: string;
  myScore: number | null;
  opponentScore: number | null;
}

const Dashboard = ({ currentUser, currentLeague }: DashboardProps) => {
  const [teamData, setTeamData] = useState<TeamData>({ team_name: '', remaining_faab_budget: '0' });
  const [record, setRecord] = useState({ wins: 0, losses: 0 });
  const [currentMatchup, setCurrentMatchup] = useState<CurrentMatchup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isLeagueActive = currentLeague?.is_active;

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?.id || !currentLeague?.league_id) {
        setError('Missing user or league information.');
        setLoading(false);
        return;
      }
      try {
        const [membersRes, schedulesRes, weekResult] = await Promise.all([
          axiosInstance.get(`/league_members/getLeagueMembersByLeagueId/${currentLeague.league_id}`),
          axiosInstance.get(`/schedules/getSchedulesByLeagueId/${currentLeague.league_id}`),
          getCurrentFantasyWeek().catch(() => null),
        ]);

        const members: LeagueMember[] = membersRes.data;
        const member = members.find((m: LeagueMember) => m.user_id === currentUser.id);

        if (!member) {
          setError('You are not a member of this league.');
          return;
        }

        setTeamData({
          team_name: member.team_name || 'My Team',
          remaining_faab_budget: member.remaining_faab_budget ?? '0',
        });

        const schedules: Schedule[] = Array.isArray(schedulesRes.data) ? schedulesRes.data : [];

        const completedMatches = schedules.filter(
          s => s.winner !== null && (s.home_league_member === member.id || s.away_league_member === member.id)
        );
        setRecord({
          wins: completedMatches.filter(s => s.winner === member.id).length,
          losses: completedMatches.filter(s => s.winner !== member.id).length,
        });

        const currentWeekNum = weekResult?.data?.week;
        if (currentWeekNum) {
          const weekMatchup = schedules.find(
            s => s.week === currentWeekNum &&
              (s.home_league_member === member.id || s.away_league_member === member.id)
          );
          if (weekMatchup) {
            const isHome = weekMatchup.home_league_member === member.id;
            const opponentId = isHome ? weekMatchup.away_league_member : weekMatchup.home_league_member;
            const opponent = members.find((m: LeagueMember) => m.id === opponentId);
            setCurrentMatchup({
              week: currentWeekNum,
              opponentName: opponent?.team_name || 'Unknown',
              myScore: isHome ? weekMatchup.home_score : weekMatchup.away_score,
              opponentScore: isHome ? weekMatchup.away_score : weekMatchup.home_score,
            });
          }
        }
      } catch (err: unknown) {
        const msg = isAxiosError(err)
          ? err.response?.data?.message || err.message
          : err instanceof Error ? err.message : 'Unknown error';
        setError(`Failed to load dashboard: ${msg}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser?.id, currentLeague?.league_id]);

  if (loading) {
    return (
      <div className="db-container">
        <div className="db-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="db-container animate__animated animate__fadeIn">
      {error && <div className="db-error">{error}</div>}

      <div className="db-header-card">
        <div className="db-header-top">
          <div className="db-header-left">
            <h1 className="db-team-name">{teamData.team_name}</h1>
            <span className="db-record">{record.wins}–{record.losses}</span>
          </div>
          <div className="db-header-right">
            <span className="db-faab">${teamData.remaining_faab_budget} <span className="db-faab-label">FAAB</span></span>
            <NavLink to="/edit-team-info" className="db-edit-link">Edit Team Info</NavLink>
          </div>
        </div>
        <div className="db-header-owner">
          {currentUser?.first_name} {currentUser?.last_name}
        </div>
      </div>

      {isLeagueActive ? (
        <div className="db-grid">
          <div className="db-matchup-card">
            <h2 className="db-section-title">
              {currentMatchup ? `Week ${currentMatchup.week} Matchup` : 'This Week\'s Matchup'}
            </h2>
            {currentMatchup ? (
              <>
                <div className="db-matchup-row">
                  <span className="db-matchup-team-name">{teamData.team_name}</span>
                  <span className="db-matchup-score db-matchup-score--mine">
                    {currentMatchup.myScore != null ? currentMatchup.myScore.toFixed(2) : '—'}
                  </span>
                </div>
                <div className="db-matchup-vs">vs</div>
                <div className="db-matchup-row">
                  <span className="db-matchup-team-name db-matchup-team-name--opp">{currentMatchup.opponentName}</span>
                  <span className="db-matchup-score">
                    {currentMatchup.opponentScore != null ? currentMatchup.opponentScore.toFixed(2) : '—'}
                  </span>
                </div>
                <NavLink to="/matchup" className="db-matchup-link">View Full Matchup →</NavLink>
              </>
            ) : (
              <p className="db-no-matchup">No matchup scheduled this week.</p>
            )}
          </div>

          <RecentActivityComponent leagueId={currentLeague.league_id} compact />
        </div>
      ) : (
        <div className="db-inactive-card">
          <h2 className="db-section-title">League Not Active</h2>
          <p className="db-inactive-text">
            This league is not yet active. Once it becomes active, you will have full access
            to all league features including roster management, waivers, and scoring.
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
