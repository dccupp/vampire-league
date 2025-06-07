import React from 'react';
import PlayerCard from '../PlayerCard/PlayerCard';
import './OfferTradeComponent.css';

// Mock data for demonstration; replace with actual roster data
const user1Roster = [
  { id: 1, name: 'Patrick Mahomes', position: 'QB', team: 'KC' },
  { id: 2, name: 'Christian McCaffrey', position: 'RB', team: 'SF' },
  { id: 3, name: 'Tyreek Hill', position: 'WR', team: 'MIA' },
];

const user2Roster = [
  { id: 4, name: 'Josh Allen', position: 'QB', team: 'BUF' },
  { id: 5, name: 'Derrick Henry', position: 'RB', team: 'BAL' },
  { id: 6, name: 'Ja\'Marr Chase', position: 'WR', team: 'CIN' },
];

const OfferTradeComponent = () => {
  return (
    <div className="offer-trade-container">
      <h1 className="offer-trade-title">Offer a Trade</h1>
      <div className="roster-section">
        {/* User 1 Roster Table */}
        <div className="roster-table-container">
          <h2 className="roster-table-title">Your Roster</h2>
          <table className="roster-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Position</th>
                <th>Team</th>
              </tr>
            </thead>
            <tbody>
              {user1Roster.map((player) => (
                <tr key={player.id} className="roster-row">
                  <td className="player-cell">
                    <PlayerCard player={player} />
                  </td>
                  <td className="player-cell">{player.position}</td>
                  <td className="player-cell">{player.team}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* User 2 Roster Table */}
        <div className="roster-table-container">
          <h2 className="roster-table-title">Their Roster</h2>
          <table className="roster-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Position</th>
                <th>Team</th>
              </tr>
            </thead>
            <tbody>
              {user2Roster.map((player) => (
                <tr key={player.id} className="roster-row">
                  <td className="player-cell">
                    <PlayerCard player={player} />
                  </td>
                  <td className="player-cell">{player.position}</td>
                  <td className="player-cell">{player.team}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OfferTradeComponent;