import { useState, useEffect, useMemo } from 'react';
import { isAxiosError } from 'axios';
import axiosInstance from '../../api';
import { CurrentUser, CurrentLeague, LeagueMember, LeagueLog } from '../../types';
import { useNow } from '../../context/NowContext';
import './ActivityFeedPage.css';

interface ActivityFeedPageProps {
  currentUser: CurrentUser;
  currentLeague: CurrentLeague;
}

type TimeRange = '7days' | '30days' | 'season';
type LogType = 'all' | LeagueLog['type'];

const TYPE_LABELS: Record<LeagueLog['type'], string> = {
  add_player: 'Added',
  drop_player: 'Dropped',
  vampire_transaction: 'Vampire',
};

const TIME_RANGE_MS: Record<Exclude<TimeRange, 'season'>, number> = {
  '7days':  7  * 24 * 60 * 60 * 1000,
  '30days': 30 * 24 * 60 * 60 * 1000,
};


function timeAgo(dateStr: string, nowMs: number): string {
  const diff = nowMs - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const ActivityFeedPage = ({ currentLeague }: ActivityFeedPageProps) => {
  const [logs, setLogs] = useState<LeagueLog[]>([]);
  const [members, setMembers] = useState<LeagueMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const nowMs = useNow();

  const [timeRange, setTimeRange] = useState<TimeRange>('7days');
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<LogType>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [logsRes, membersRes] = await Promise.all([
          axiosInstance.get(`/logs/getLogsByLeagueId/${currentLeague.league_id}`),
          axiosInstance.get(`/league_members/getLeagueMembersByLeagueId/${currentLeague.league_id}`),
        ]);
        setLogs(logsRes.data);
        setMembers(Array.isArray(membersRes.data) ? membersRes.data : []);
      } catch (err) {
        const msg = isAxiosError(err)
          ? err.response?.data?.message || err.message
          : 'Failed to load activity.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentLeague.league_id]);

  const filtered = useMemo(() => {
    const cutoff = timeRange !== 'season'
      ? nowMs - TIME_RANGE_MS[timeRange]
      : null;

    return logs.filter(log => {
      if (cutoff && new Date(log.created_at).getTime() < cutoff) return false;
      if (selectedMember !== 'all' && String(log.league_member_id) !== selectedMember) return false;
      if (selectedType !== 'all' && log.type !== selectedType) return false;
      return true;
    });
  }, [logs, timeRange, selectedMember, selectedType, nowMs]);

  return (
    <div className="afp-container animate__animated animate__fadeIn">
      <h2 className="afp-title">League Activity</h2>

      <div className="afp-controls">
        <select
          className="afp-select"
          value={timeRange}
          onChange={e => setTimeRange(e.target.value as TimeRange)}
        >
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="season">All Season</option>
        </select>

        <select
          className="afp-select"
          value={selectedMember}
          onChange={e => setSelectedMember(e.target.value)}
        >
          <option value="all">All Members</option>
          {members.map(m => (
            <option key={m.id} value={String(m.id)}>{m.team_name}</option>
          ))}
        </select>

        <select
          className="afp-select"
          value={selectedType}
          onChange={e => setSelectedType(e.target.value as LogType)}
        >
          <option value="all">All Types</option>
          <option value="add_player">Added</option>
          <option value="drop_player">Dropped</option>
          <option value="vampire_transaction">Vampire</option>
        </select>
      </div>

      {loading && <div className="afp-state">Loading activity...</div>}
      {error  && <div className="afp-state afp-state--error">{error}</div>}

      {!loading && !error && (
        filtered.length === 0 ? (
          <div className="afp-state">No activity matches the selected filters.</div>
        ) : (
          <ul className="afp-list">
            {filtered.map(log => (
              <li key={log.id} className="afp-item">
                <span className={`afp-badge afp-badge--${log.type}`}>
                  {TYPE_LABELS[log.type]}
                </span>
                <span className="afp-team">{log.team_name}</span>
                <span className="afp-message">{log.message}</span>
                <span className="afp-time">{timeAgo(log.created_at, nowMs)}</span>
              </li>
            ))}
          </ul>
        )
      )}

      {!loading && !error && filtered.length > 0 && (
        <p className="afp-count">{filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}</p>
      )}
    </div>
  );
};

export default ActivityFeedPage;