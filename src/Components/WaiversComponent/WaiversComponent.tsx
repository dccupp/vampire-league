import { useState, useEffect, useMemo, useCallback } from 'react';
import { isAxiosError } from 'axios';
import axiosInstance from '../../api';
import { LeagueMember, Player } from '../../types';
import PlayerStatsCard from '../PlayerStatsCard/PlayerStatsCard';
import WaiverClaimFormComponent from '../WaiverClaimFormComponent/WaiverClaimFormComponent';
import DirectAddPlayerComponent from '../DirectAddPlayerComponent/DirectAddPlayerComponent';

import { useUser } from '../../context/UserContext';
import { useLeague } from '../../context/LeagueContext';

import './WaiversComponent.css';

const WaiversComponent = () => {
  const { currentUser } = useUser();
  const { currentLeague } = useLeague();
  const [userRoster, setUserRoster] = useState([] as any[]);
  const [freeAgents, setFreeAgents] = useState([] as any[]);
  const [nameFilter, setNameFilter] = useState<string>('');
  const [teamFilter, setTeamFilter] = useState<string>('All');
  const [positionFilter, setPositionFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedLeagueMember, setSelectedLeagueMember] = useState<LeagueMember | null>(null);
  const [isAfterWaiverDay, setIsAfterWaiverDay] = useState<boolean>(false);
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
      setIsLoading(false);
      return;
    }

    try {
      const season = process.env.REACT_APP_TEST_MODE === 'true'
        ? parseInt(process.env.REACT_APP_TEST_YEAR || '0')
        : new Date().getFullYear();

      const res = await axiosInstance.get(
        `/waivers/getWaiverPageData/${currentLeague.league_id}/${currentUser.id}`,
        { params: { season } }
      );

      const { league_member, user_roster, free_agents, is_after_waiver_day } = res.data;

      setSelectedLeagueMember(league_member);
      setUserRoster(
        (user_roster || []).map((p: any) => ({
          ...p,
          name: p.player_name,
          playingPosition: p.position,
          league_member,
        }))
      );
      setFreeAgents(free_agents || []);
      setIsAfterWaiverDay(is_after_waiver_day ?? false);

    } catch (err) {
      const msg = isAxiosError(err) ? err.response?.data?.message || 'Failed to load waiver data' : 'Failed to load waiver data';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id, currentLeague?.league_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset to page 1 whenever filters change so the user never lands on an empty page
  useEffect(() => {
    setCurrentPage(1);
  }, [nameFilter, teamFilter, positionFilter]);

  const filteredFreeAgents = useMemo(() => {
    return freeAgents.filter(player => {
      const playerName = (player.name || player.player_name || '').toString().toLowerCase();
      const playerTeam = (player.team || '').toString().toUpperCase();
      const playerPosition = (player.playingPosition || player.position || '').toString();
      const matchesName = (typeof nameFilter === 'string') ? playerName.includes(nameFilter.toLowerCase()) : null;
      const matchesTeam = teamFilter !== 'All' ? playerTeam === teamFilter : true;
      const matchesPosition = positionFilter !== 'All' ? playerPosition === positionFilter : true;
      return matchesName && matchesTeam && matchesPosition;
    });
  }, [freeAgents, nameFilter, teamFilter, positionFilter]);

  const sortedFreeAgents = useMemo(() => {
    return [...filteredFreeAgents].sort((a, b) => (b.fantasyScore || 0) - (a.fantasyScore || 0));
  }, [filteredFreeAgents]);

  const totalPages = Math.ceil(sortedFreeAgents.length / itemsPerPage);

  const currentFreeAgents = useMemo(() => {
    return sortedFreeAgents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [sortedFreeAgents, currentPage]);

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

  if (isLoading) return <div className="wc-waivers-container">Loading...</div>;

  return (
    <div className="wc-waivers-container">
      <h2 className="wc-waivers-title">Add Players from Waivers</h2>
      {error && <div className="wc-error-message">{error}</div>}
      <div className="wc-waivers-tables-container">
        <div className="wc-table-wrapper">
          <h3 className="wc-table-title">Free Agents</h3>
          <div className="wc-filters-container">
            <label className="wc-filter-label">
              Name:
              <input
                type="text"
                className="wc-filter-input"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
              />
            </label>
            <label className="wc-filter-label">
              Team:
              <select
                className="wc-filter-select"
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
              >
                {nflTeams.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </label>
            <label className="wc-filter-label">
              Position:
              <select
                className="wc-filter-select"
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
          <div className="wc-table-responsive">
            <table className="wc-waivers-table">
              <thead>
                <tr>
                  <th>Player</th>
                </tr>
              </thead>
              <tbody>
                {currentFreeAgents.length > 0 ? (
                  currentFreeAgents.map((player, index) => (
                    <tr key={player.id} className="wc-waivers-row">
                      <td className="wc-player-cell">
                        <PlayerStatsCard
                          player={player}
                          stats={player.stats}
                          fantasyScore={player.fantasyScore}
                          index={index}
                          onClick={() => {
                            setSelectedPlayer(player);
                            setSelectedLeagueMember(userRoster.length ? userRoster[0].league_member : null);
                          }}
                          isSelected={selectedPlayer?.id === player.id}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr key="no-free-agents">
                    <td><div className="wc-empty-message">No free agents available</div></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="wc-pagination-container">
              <button
                className="wc-pagination-btn"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                First
              </button>
              <button
                className="wc-pagination-btn"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              {pageNumbers.map((page, idx) => (
                <button
                  key={idx}
                  className={`wc-pagination-btn ${currentPage === page ? 'active' : ''}`}
                  onClick={() => typeof page === 'number' && setCurrentPage(page)}
                  disabled={typeof page !== 'number'}
                >
                  {page}
                </button>
              ))}
              <button
                className="wc-pagination-btn"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
              <button
                className="wc-pagination-btn"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                Last
              </button>
            </div>
          )}
        </div>
      </div>
      {selectedPlayer && selectedLeagueMember && !isAfterWaiverDay && (
        <WaiverClaimFormComponent
          player={selectedPlayer}
          league_member={selectedLeagueMember}
          userRoster={userRoster}
          claim={null}
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
      {selectedPlayer && selectedLeagueMember && isAfterWaiverDay && (
        <DirectAddPlayerComponent
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