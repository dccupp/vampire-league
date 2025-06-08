import React, { useState } from 'react';
import PlayerCard from '../PlayerCard/PlayerCard';
import './OfferTradeComponent.css';
import { leagueTeams, leagueTeamsInfo } from '../../TestData/testdata';

// Select two teams for the trade offer (team_id 1 for logged-in user, team_id 2 for other user)
const user1TeamInfo = leagueTeamsInfo.find(team => team.team_id === 1);
const user2TeamInfo = leagueTeamsInfo.find(team => team.team_id === 2);

// Get rosters from leagueTeams (index corresponds to team_id - 1)
const user1Roster = leagueTeams[0]; // team_id 1 (logged-in user)
const user2Roster = leagueTeams[1]; // team_id 2 (other user)

const OfferTradeComponent = () => {
  // State to track selected players for each roster and modal visibility
  const [selectedUser1Players, setSelectedUser1Players] = useState([]);
  const [selectedUser2Players, setSelectedUser2Players] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Handle player selection/deselection for user1 roster
  const handleUser1PlayerClick = (player) => {
    setSelectedUser1Players((prev) => {
      let newState;
      if (prev.some((p) => p.name === player.name)) {
        // Deselect player if already selected
        newState = prev.filter((p) => p.name !== player.name);
      } else if (prev.length < 3) {
        // Add player if under limit
        newState = [...prev, player];
      } else {
        newState = prev; // Ignore if at limit
      }
      console.log('selectedUser1Players:', newState);
      console.log('selectedUser2Players:', selectedUser2Players);
      return newState;
    });
  };

  // Handle player selection/deselection for user2 roster
  const handleUser2PlayerClick = (player) => {
    setSelectedUser2Players((prev) => {
      let newState;
      if (prev.some((p) => p.name === player.name)) {
        // Deselect player if already selected
        newState = prev.filter((p) => p.name !== player.name);
      } else if (prev.length < 3) {
        // Add player if under limit
        newState = [...prev, player];
      } else {
        newState = prev; // Ignore if at limit
      }
      console.log('selectedUser1Players:', selectedUser1Players);
      console.log('selectedUser2Players:', newState);
      return newState;
    });
  };

  // Handle player removal from trade summary for user1
  const handleRemoveUser1Player = (playerName) => {
    setSelectedUser1Players((prev) => {
      const newState = prev.filter((p) => p.name !== playerName);
      console.log('selectedUser1Players:', newState);
      console.log('selectedUser2Players:', selectedUser2Players);
      return newState;
    });
  };

  // Handle player removal from trade summary for user2
  const handleRemoveUser2Player = (playerName) => {
    setSelectedUser2Players((prev) => {
      const newState = prev.filter((p) => p.name !== playerName);
      console.log('selectedUser1Players:', selectedUser1Players);
      console.log('selectedUser2Players:', newState);
      return newState;
    });
  };

  // Check if trade is valid (at least one player from each roster, max three per roster)
  const isTradeValid = selectedUser1Players.length > 0 && selectedUser2Players.length > 0 && selectedUser1Players.length <= 3 && selectedUser2Players.length <= 3;

  // Handle trade submission (open modal if valid)
  const handleSubmitTrade = () => {
    if (isTradeValid) {
      setIsModalOpen(true);
    }
  };

  // Handle trade confirmation (create trade data package and reset state)
  const handleModalYes = () => {
    const tradeDataPackage = {
      team1Players: selectedUser1Players.map(player => ({
        name: player.name,
        playingPosition: player.playingPosition,
        slot: player.slot,
        team: player.team,
        teamId: user1TeamInfo.team_id,
      })),
      team2Players: selectedUser2Players.map(player => ({
        name: player.name,
        playingPosition: player.playingPosition,
        slot: player.slot,
        team: player.team,
        teamId: user2TeamInfo.team_id,
      })),
    };

    console.log('Trade Data Package:', tradeDataPackage);

    // Reset selections and close modal
    setSelectedUser1Players([]);
    setSelectedUser2Players([]);
    setIsModalOpen(false);
  };

  // Handle modal cancellation
  const handleModalNo = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="offer-trade-container">
      <h1 className="offer-trade-title">Offer a Trade</h1>
      <div className="roster-section">
        {/* User 1 Roster Table */}
        <div className="roster-table-container">
          <h2 className="roster-table-title">{user1TeamInfo.team_name}'s Roster</h2>
          <table className="roster-table">
            <thead>
              <tr>
                <th>Player</th>
              </tr>
            </thead>
            <tbody>
              {user1Roster.map((player, index) => (
                <tr key={index} className="roster-row">
                  <td
                    className={`player-cell ${
                      selectedUser1Players.some((p) => p.name === player.name)
                        ? 'player-cell-selected'
                        : ''
                    }`}
                  >
                    <PlayerCard
                      player={player}
                      onClick={() => handleUser1PlayerClick(player)}
                      isSelected={selectedUser1Players.some((p) => p.name === player.name)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* User 2 Roster Table */}
        <div className="roster-table-container">
          <h2 className="roster-table-title">{user2TeamInfo.team_name}'s Roster</h2>
          <table className="roster-table">
            <thead>
              <tr>
                <th>Player</th>
              </tr>
            </thead>
            <tbody>
              {user2Roster.map((player, index) => (
                <tr key={index} className="roster-row">
                  <td
                    className={`player-cell ${
                      selectedUser2Players.some((p) => p.name === player.name)
                        ? 'player-cell-selected'
                        : ''
                    }`}
                  >
                    <PlayerCard
                      player={player}
                      onClick={() => handleUser2PlayerClick(player)}
                      isSelected={selectedUser2Players.some((p) => p.name === player.name)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trade Summary and Submit Button */}
      <div className="trade-summary-container">
        <h3 className="trade-summary-title">Trade Summary</h3>
        <div className="trade-details">
          <div className="trade-side">
            <h4>From {user1TeamInfo.team_name}</h4>
            <ul>
              {selectedUser1Players.length > 0 ? (
                selectedUser1Players.map((player, index) => (
                  <li key={index} className="trade-player-item">
                    {player.name} ({player.playingPosition})
                    <span
                      className="remove-player"
                      onClick={() => handleRemoveUser1Player(player.name)}
                    >
                      ✕
                    </span>
                  </li>
                ))
              ) : (
                <li>No players selected</li>
              )}
            </ul>
          </div>
          <div className="trade-side">
            <h4>From {user2TeamInfo.team_name}</h4>
            <ul>
              {selectedUser2Players.length > 0 ? (
                selectedUser2Players.map((player, index) => (
                  <li key={index} className="trade-player-item">
                    {player.name} ({player.playingPosition})
                    <span
                      className="remove-player"
                      onClick={() => handleRemoveUser2Player(player.name)}
                    >
                      ✕
                    </span>
                  </li>
                ))
              ) : (
                <li>No players selected</li>
              )}
            </ul>
          </div>
        </div>
        <button
          className={`submit-trade-button ${isTradeValid ? '' : 'disabled'}`}
          onClick={handleSubmitTrade}
          disabled={!isTradeValid}
        >
          Submit Trade
        </button>
      </div>

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Confirm Trade Offer</h3>
            <p className="modal-message">
              Send this offer to {user2TeamInfo.team_name}?
            </p>
            <div className="modal-trade-summary">
              <div className="modal-trade-side">
                <h4>From {user1TeamInfo.team_name}</h4>
                <ul>
                  {selectedUser1Players.map((player, index) => (
                    <li key={index}>
                      {player.name} ({player.playingPosition})
                    </li>
                  ))}
                </ul>
              </div>
              <div className="modal-trade-side">
                <h4>From {user2TeamInfo.team_name}</h4>
                <ul>
                  {selectedUser2Players.map((player, index) => (
                    <li key={index}>
                      {player.name} ({player.playingPosition})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="modal-buttons">
              <button className="modal-button modal-button-yes" onClick={handleModalYes}>
                Yes
              </button>
              <button className="modal-button modal-button-no" onClick={handleModalNo}>
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfferTradeComponent;