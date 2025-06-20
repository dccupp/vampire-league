import React, { useState } from 'react';
import { leagueTeams, freeAgents } from '../../TestData/testdata';
import PlayerCard from '../PlayerCard/PlayerCard';
import './AddPlayerFromWaiversComponent.css';

const AddPlayerFromWaiversComponent = () => {
  // User's roster (first team in leagueTeams)
  const userRoster = leagueTeams[0] || [];
  // Free agents (all players in freeAgents array)
  const availableFreeAgents = freeAgents || [];

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const totalPages = Math.ceil(availableFreeAgents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentFreeAgents = availableFreeAgents.slice(startIndex, startIndex + itemsPerPage);

  // Handle player selection (placeholder for future waiver logic)
  const handlePlayerClick = (index, source) => {
    console.log(`Clicked player at index ${index} from ${source}`);
    // Future: Implement logic to add/drop players
  };

  // Pagination controls
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="waivers-container">
      <h2 className="waivers-title">Add Players from Waivers</h2>
      <div className="waivers-tables-container">
        {/* Left Table: Your Roster */}
        <div className="table-wrapper roster-table-wrapper">
          <h3 className="table-title">Your Roster</h3>
          <table className="waivers-table">
            <thead>
              <tr>
                <th>Player</th>
              </tr>
            </thead>
            <tbody>
              {userRoster.length > 0 ? (
                userRoster.map((player, index) => (
                  <tr key={`roster-${index}`} className="waivers-row">
                    <td className="player-cell">
                      <PlayerCard
                        player={player}
                        index={index}
                        onClick={() => handlePlayerClick(index, 'roster')}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="empty-message">
                    No players on your roster
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Right Table: Free Agents */}
        <div className="table-wrapper free-agents-table-wrapper">
          <h3 className="table-title">Free Agents</h3>
          <table className="waivers-table">
            <thead>
              <tr>
                <th>Player</th>
              </tr>
            </thead>
            <tbody>
              {currentFreeAgents.length > 0 ? (
                currentFreeAgents.map((player, index) => (
                  <tr key={`free-agent-${index}`} className="waivers-row">
                    <td className="player-cell">
                      <PlayerCard
                        player={player}
                        index={startIndex + index}
                        onClick={() => handlePlayerClick(startIndex + index, 'free-agents')}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="empty-message">
                    No free agents available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={`page-${page}`}
                  className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ))}
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddPlayerFromWaiversComponent;