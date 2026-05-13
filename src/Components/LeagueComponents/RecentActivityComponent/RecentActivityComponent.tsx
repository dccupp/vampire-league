import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { isAxiosError } from 'axios';
import axiosInstance from '../../../api';
import { LeagueLog } from '../../../types';
import { useNow } from '../../../context/NowContext';
import './RecentActivityComponent.css';

interface RecentActivityProps {
  leagueId: number;
  compact?: boolean;
}

const DAYS_WINDOW = 7;

const TYPE_LABELS: Record<LeagueLog['type'], string> = {
  add_player: 'Added',
  drop_player: 'Dropped',
  vampire_transaction: 'Vampire',
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

const RecentActivityComponent = ({ leagueId, compact = false }: RecentActivityProps) => {
  const nowMs = useNow();
  const [logs, setLogs] = useState<LeagueLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await axiosInstance.get(`/logs/getLogsByLeagueId/${leagueId}`);
        const cutoff = nowMs - DAYS_WINDOW * 24 * 60 * 60 * 1000;
        const recent: LeagueLog[] = response.data.filter(
          (log: LeagueLog) => new Date(log.created_at).getTime() >= cutoff
        );
        setLogs(recent);
      } catch (err) {
        const msg = isAxiosError(err)
          ? err.response?.data?.message || err.message
          : 'Failed to load activity.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [leagueId, nowMs]);

  if (loading) {
    return <div className="rac-container rac-state">Loading activity...</div>;
  }

  if (error) {
    return <div className="rac-container rac-state rac-error">{error}</div>;
  }

  return (
    <div className={`rac-container${compact ? ' rac-container--compact' : ''}`}>
      <div className="rac-header">
        <h3 className="rac-title">Recent Activity</h3>
        {compact && (
          <NavLink to="/activity" className="rac-view-all">View All</NavLink>
        )}
      </div>

      {logs.length === 0 ? (
        <p className="rac-empty">No activity in the past {DAYS_WINDOW} days.</p>
      ) : (
        <ul className={`rac-list${compact ? ' rac-list--scroll' : ''}`}>
          {logs.map(log => (
            <li key={log.id} className="rac-item">
              <span className={`rac-badge rac-badge--${log.type}`}>
                {TYPE_LABELS[log.type]}
              </span>
              <span className="rac-team">{log.team_name}</span>
              <span className="rac-message">{log.message}</span>
              <span className="rac-time">{timeAgo(log.created_at, nowMs)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RecentActivityComponent;