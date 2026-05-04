import React from 'react';
import './PlayerCard.css';

interface PlayerCardData {
  player_name?: string | null;
  name?: string | null;
  position?: string | null;
  playingPosition?: string | null;
  team?: string | null;
  schedule?: { est_time: string; day: string; date: string; location: string } | null;
}

interface PlayerCardProps {
  player: PlayerCardData;
  index: number | string;
  onClick: (index: number | string) => void;
  isSelected: boolean;
}

const PlayerCard = ({ player, index, onClick, isSelected }: PlayerCardProps) => {
  if (!player) return null;

  return (
    <div className={`player-card ${isSelected ? 'selected' : ''}`} onClick={() => onClick(index)}>
      <div className="player-info-redesign">
        {/* Row 1: Player Name (large) */}
        <div className="player-name-row">
          <span className="player-name-large">
            {player.player_name || player.name || 'Unknown'}
          </span>
        </div>
        {/* Row 2: Position and Team */}
        <div className="player-pos-team-row">
          <span className="player-position">
            {player.position || player.playingPosition || 'N/A'}
          </span>
          <span className="player-team">
            {player.team || 'Unknown'}
          </span>
        </div>
        {/* Row 3: Schedule Info */}
        <div className="player-schedule-row">
          {player.schedule ? (
            <>
              <span className="player-est-time">{player.schedule.est_time}</span>
              <span className="player-day">{player.schedule.day}</span>
              <span className="player-date">{player.schedule.date}</span>
              <span className="player-location">{player.schedule.location}</span>
            </>
          ) : (
            <span className="player-no-game">No game scheduled</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;