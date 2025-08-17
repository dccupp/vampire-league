import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api';
import './PlayerStatsCard.css';

const PlayerStatsCard = ({ player, index, onClick, isSelected, season = '2024' }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!player || !player.player_id) {
        setLoading(false);
        return;
      }

      try {
        const response = await axiosInstance.get(`/yearly_stats/getYearlyStatsByPlayerId/${player.player_id}`);
        const playerStats = response.data.find(stat => stat.season === (season || new Date().getFullYear()));
        setStats(playerStats || {});
        setLoading(false);
      } catch (err) {
        setError('Failed to load player stats');
        setLoading(false);
      }
    };

    fetchStats();
  }, [player, season]);

  if (!player) return null;
  if (loading) return <div className="player-stats-card">Loading...</div>;
  if (error) return <div className="player-stats-card error">{error}</div>;

  const renderStats = () => {
    const position = player.position?.toUpperCase();
    const statFields = {
      QB: [
        { key: 'passing_yards', label: 'Pass Yds' },
        { key: 'passing_tds', label: 'Pass TD' },
        { key: 'interceptions', label: 'INT' },
        { key: 'rushing_yards', label: 'Rush Yds' },
        { key: 'rushing_tds', label: 'Rush TD' }
      ],
      WR: [
        { key: 'receptions', label: 'Rec' },
        { key: 'receiving_yards', label: 'Rec Yds' },
        { key: 'receiving_tds', label: 'Rec TD' },
        { key: 'rushing_yards', label: 'Rush Yds' },
        { key: 'rushing_tds', label: 'Rush TD' }
      ],
      TE: [
        { key: 'receptions', label: 'Rec' },
        { key: 'receiving_yards', label: 'Rec Yds' },
        { key: 'receiving_tds', label: 'Rec TD' },
        { key: 'rushing_yards', label: 'Rush Yds' },
        { key: 'rushing_tds', label: 'Rush TD' }
      ],
      RB: [
        { key: 'rushing_yards', label: 'Rush Yds' },
        { key: 'rushing_tds', label: 'Rush TD' },
        { key: 'receptions', label: 'Rec' },
        { key: 'receiving_yards', label: 'Rec Yds' },
        { key: 'receiving_tds', label: 'Rec TD' }
      ]
    };

    const fields = statFields[position] || [];
    return fields.map((field, idx) => (
      <span key={idx} className="stat-item">
        {field.label}: {stats[field.key] || 0}
      </span>
    ));
  };

  return (
    <div className={`player-stats-card ${isSelected ? 'selected' : ''}`} onClick={() => onClick(index)}>
      <div className="player-info">
        <span className="player-details">
          {player.player_name} - {player.position} - {player.team}
        </span>
      </div>
      <div className="player-stats">
        {renderStats()}
      </div>
    </div>
  );
};

export default PlayerStatsCard;