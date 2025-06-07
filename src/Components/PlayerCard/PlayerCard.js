import React from 'react';
import './PlayerCard.css';

const PlayerCard = ({ player, index, onClick }) => {
  if (!player) return null;

  return (
    <div className="player-card" onClick={() => onClick(index)}>
      <div className="player-info">
        <span className="player-name">{player.name}</span>
        <span className="player-details">
          {player.playingPosition} - {player.team}
        </span>
      </div>
    </div>
  );
};

export default PlayerCard;