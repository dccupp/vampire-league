import React from 'react';
import './PlayerStatsCard.css';

const PlayerStatsCard = ({ player, stats, fantasyScore, index, onClick, isSelected }) => {
  if (!player) return null;

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
        {field.label}: {stats && stats[field.key] ? stats[field.key] : 0}
      </span>
    ));
  };

  return (
    <div className={`player-stats-card ${isSelected ? 'selected' : ''}`} onClick={() => onClick(index)}>
      <div className="card-content">
        <div className="player-info">
          <div className="player-details">
            {player.player_name} - {player.position} - {player.team}
          </div>
          <div className="player-stats">
            {renderStats()}
          </div>
        </div>
        {fantasyScore !== undefined && fantasyScore !== null && (
          <div className="fantasy-score-container">
            <span className="fantasy-score">{fantasyScore}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerStatsCard;