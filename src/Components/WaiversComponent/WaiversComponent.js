import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axiosInstance from '../../api';
import PlayerCard from '../PlayerCard/PlayerCard';
import WaiverClaimFormComponent from '../WaiverClaimFormComponent/WaiverClaimFormComponent';
import './WaiversComponent.css';

const WaiversComponent = ({ currentUser, currentLeague }) => {
  const [userRoster, setUserRoster] = useState([]);
  const [freeAgents, setFreeAgents] = useState([]);
  const [nameFilter, setNameFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('All');
  const [positionFilter, setPositionFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedLeagueMember, setSelectedLeagueMember] = useState(null);
  const itemsPerPage = 20;
  const pageWindow = 5;

  const nflTeams = useMemo(() => [
    'All', 'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE',
    'DAL', 'DEN', 'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC', 'LAC',
    'LAR', 'LV', 'MIA', 'MIN', 'NE', 'NO', 'NYG', 'NYJ', 'PHI',
    'PIT', 'SEA', 'SF', 'TB', 'TEN', 'WAS'
  ], []);

  const fetchData = useCallback(async () => {
    if (!currentUser?.id || !currentLeague?.league_id) {
      setError('Missing user or league information');
      return;
    }

    try {
      const [playersRes, membersRes, leagueRosteredRes] = await Promise.all([
        axiosInstance.get('/players/getPlayers'),
        axiosInstance.get(`/league_members/getLeagueMembersByLeagueId/${currentLeague.league_id}`),
        axiosInstance.get(`/rostered_players/getRosteredPlayersByLeagueId/${currentLeague.league_id}`)
      ]);

      const allPlayers = Array.isArray(playersRes.data) ? playersRes.data : [];
      const leagueMembers = Array.isArray(membersRes.data) ? membersRes.data : [];
      if (!leagueMembers.length) {
        setError('No league members found');
        return;
      }

      const userMember = leagueMembers.find(member => member.user_id === currentUser.id);
      if (!userMember) {
        setError('User is not a member of this league');
        return;
      }

      setSelectedLeagueMember(userMember);

      const rosterRes = await axiosInstance.get(`/rostered_players/getRosteredPlayersByLeagueMemberId/${userMember.id}`);
      const rosteredPlayers = Array.isArray(rosterRes.data)
        ? rosterRes.data
            .filter(r => r.is_rostered === 1)
            .map(p => ({
              ...p,
              name: p.player_name,
              playingPosition: p.position,
              league_member: userMember
            }))
        : [];
      setUserRoster(rosteredPlayers);

      const rosteredIds = new Set(
        (Array.isArray(leagueRosteredRes.data) ? leagueRosteredRes.data : [])
          .filter(r => r.is_rostered === 1)
          .map(r => r.player_id)
      );

      setFreeAgents(
        allPlayers
          .filter(p => !rosteredIds.has(p.player_id))
          .map(p => ({
            ...p,
            name: p.player_name,
            playingPosition: p.position
          }))
      );
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load waiver data');
    }
  }, [currentUser?.id, currentLeague?.league_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredFreeAgents = useMemo(() => {
    return freeAgents.filter(player => {
      const matchesName = player.name.toLowerCase().includes(nameFilter.toLowerCase());
      const matchesTeam = teamFilter !== 'All' ? player.team.toUpperCase() === teamFilter.toUpperCase() : true;
      const matchesPosition = positionFilter !== 'All' ? player.playingPosition === positionFilter : true;
      return matchesName && matchesTeam && matchesPosition;
    });
  }, [freeAgents, nameFilter, teamFilter, positionFilter]);

  const totalPages = Math.ceil(filteredFreeAgents.length / itemsPerPage);
  const currentFreeAgents = filteredFreeAgents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const pageNumbers = useMemo(() => {
    const pages = [];
    const startPage = Math.max(1, currentPage - Math.floor(pageWindow / 2));
    const endPage = Math.min(totalPages, startPage + pageWindow - 1);

    if (startPage > 1) pages.push(1);
    if (startPage > 2) pages.push('...');

    for (let i = startPage; i <= endPage; i++) pages.push(i);

    if (endPage < totalPages - 1) pages.push('...');
    if (endPage < totalPages) pages.push(totalPages);

    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className="waivers-container">
      <h2 className="waivers-title">Add Players from Waivers</h2>
      {error && <div className="error-message">{error}</div>}
      <div className="waivers-tables-container">
        <div className="table-wrapper free-agents-table-wrapper">
          <h3 className="table-title">Free Agents</h3>
          <div className="filters-container">
            <label className="filter-label">
              Name:
              <input
                type="text"
                className="filter-input"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
              />
            </label>
            <label className="filter-label">
              Team:
              <select
                className="filter-select"
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
              >
                {nflTeams.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </label>
            <label className="filter-label">
              Position:
              <select
                className="filter-select"
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="QB">QB</option>
                <option value="RB">RB</option>
                <option value="WR">WR</option>
                <option value="TE">TE</option>
                <option value="DEF">DEF</option>
                <option value="K">K</option>
              </select>
            </label>
          </div>
          <table className="waivers-table">
            <thead>
              <tr>
                <th>Player</th>
              </tr>
            </thead>
            <tbody>
              {currentFreeAgents.length > 0 ? (
                currentFreeAgents.map((player, index) => (
                  <tr key={player.player_id} className="waivers-row">
                    <td className="player-cell">
                      <PlayerCard
                        player={player}
                        index={index}
                        onClick={() => {
                          setSelectedPlayer(player);
                          setSelectedLeagueMember(userRoster.length ? userRoster[0].league_member : null);
                        }}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="empty-message">No free agents available</td>
                </tr>
              )}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="pagination-container">
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                First
              </button>
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              {pageNumbers.map((page, idx) => (
                <button
                  key={idx}
                  className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                  onClick={() => typeof page === 'number' && setCurrentPage(page)}
                  disabled={typeof page !== 'number'}
                >
                  {page}
                </button>
              ))}
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                Last
              </button>
            </div>
          )}
        </div>
      </div>
      {selectedPlayer && selectedLeagueMember && (
        <WaiverClaimFormComponent
          player={selectedPlayer}
          league_member={selectedLeagueMember}
          userRoster={userRoster}
          onClose={() => {
            setSelectedPlayer(null);
            setSelectedLeagueMember(null);
          }}
          onClaimSuccess={() => {
            setSelectedPlayer(null);
            setSelectedLeagueMember(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
};

export default WaiversComponent;