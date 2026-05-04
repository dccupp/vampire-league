import { useState, useEffect, useMemo, useCallback } from 'react';
import { isAxiosError } from 'axios';
import axiosInstance from '../../../api';
import PlayerCard from '../../PlayerCard/PlayerCard';
import { CurrentUser, CurrentLeague, RosterRules, LeagueMember } from '../../../types';
import './AddPlayerToTeamComponent.css';

interface AddPlayerToTeamComponentProps {
  currentUser: CurrentUser;
  currentLeague: CurrentLeague;
}

interface TransformedPlayer {
  player_id: number;
  name: string;
  playingPosition: string;
  team: string;
}

interface AptRosterSlot {
  position: string;
  sPosition: string;
  player: any | null;
}

const transformPlayer = (player: any): TransformedPlayer => ({
  player_id: player.id,
  name: player.player_name || player.name || 'Unknown',
  playingPosition: player.position || player.playingPosition || 'N/A',
  team: player.team || 'N/A',
});

const nflTeams = [
  'All', 'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE',
  'DAL', 'DEN', 'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC', 'LAC',
  'LAR', 'LV', 'MIA', 'MIN', 'NE', 'NO', 'NYG', 'NYJ', 'PHI',
  'PIT', 'SEA', 'SF', 'TB', 'TEN', 'WAS',
];

const AddPlayerToTeamComponent = ({ currentUser, currentLeague }: AddPlayerToTeamComponentProps) => {
  const [nameFilter, setNameFilter] = useState<string>('');
  const [teamFilter, setTeamFilter] = useState<string>('All');
  const [positionFilter, setPositionFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedPlayer, setSelectedPlayer] = useState<TransformedPlayer | null>(null);
  const [players, setPlayers] = useState<TransformedPlayer[]>([]);
  const [leagueMembers, setLeagueMembers] = useState<LeagueMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [rosterRules, setRosterRules] = useState<RosterRules | null>(null);
  const [rosterSlots, setRosterSlots] = useState<AptRosterSlot[]>([]);
  const [rosteredPlayers, setRosteredPlayers] = useState<any[]>([]);
  const [leagueRosteredPlayerIds, setLeagueRosteredPlayerIds] = useState<number[]>([]);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<string>('');
  const [isMessageExiting, setIsMessageExiting] = useState<boolean>(false);
  const [isLoadingRoster, setIsLoadingRoster] = useState<boolean>(false);
  const itemsPerPage = 20;

  const showMessage = useCallback((msg: string, type: string) => {
    setMessage(msg);
    setMessageType(type);
    setIsMessageExiting(false);
    setTimeout(() => {
      setIsMessageExiting(true);
      setTimeout(() => setMessage(''), 500);
    }, 5000);
  }, []);

  const fetchData = useCallback(async () => {
    if (!currentLeague?.league_id) {
      showMessage('Missing league information', 'error');
      return;
    }

    try {
      const [playersRes, membersRes, leagueRosteredRes] = await Promise.all([
        axiosInstance.get('/players/getPlayers'),
        axiosInstance.get(`/league_members/getLeagueMembersByLeagueId/${currentLeague.league_id}`),
        axiosInstance.get(`/rostered_players/getRosteredPlayersByLeagueId/${currentLeague.league_id}`),
      ]);

      setPlayers(Array.isArray(playersRes.data) ? playersRes.data.map(transformPlayer) : []);
      setLeagueMembers(Array.isArray(membersRes.data) ? membersRes.data : []);
      setLeagueRosteredPlayerIds(
        Array.isArray(leagueRosteredRes.data)
          ? leagueRosteredRes.data.filter((p: any) => p.is_rostered === 1).map((p: any) => p.player_id)
          : []
      );
    } catch (error) {
      const msg = isAxiosError(error) ? error.response?.data?.message || error.message : 'Failed to load data.';
      showMessage(msg, 'error');
    }
  }, [currentLeague?.league_id, showMessage]);

  const fetchMemberData = useCallback(async () => {
    if (!selectedMember || !currentLeague?.league_id) {
      setRosterRules(null);
      setRosterSlots([]);
      setRosteredPlayers([]);
      setIsLoadingRoster(false);
      return;
    }

    setIsLoadingRoster(true);
    try {
      const selectedMemberData = leagueMembers.find(member => member.id === parseInt(selectedMember));
      const rosterTypeId = selectedMemberData?.is_vamp ? 2 : 1;

      const [rosterRulesRes, rosteredPlayersRes] = await Promise.all([
        axiosInstance.get(`/roster_rules/getRosterRulesByLeagueId/${currentLeague.league_id}/${rosterTypeId}`),
        axiosInstance.get(`/rostered_players/getRosteredPlayersByLeagueMemberId/${selectedMember}`),
      ]);

      setRosterRules(rosterRulesRes.data);

      const slots: AptRosterSlot[] = [];
      const positionCounts = [
        { position: 'QB',    count: rosterRulesRes.data.quarterback_count             || 0 },
        { position: 'RB',    count: rosterRulesRes.data.running_back_count            || 0 },
        { position: 'WR',    count: rosterRulesRes.data.wide_receiver_count           || 0 },
        { position: 'TE',    count: rosterRulesRes.data.tight_end_count               || 0 },
        { position: 'WRT',   count: rosterRulesRes.data.wide_receiver_tight_end_count || 0 },
        { position: 'FLEX',  count: rosterRulesRes.data.flex_count                    || 0 },
        { position: 'BENCH', count: rosterRulesRes.data.bench_count                   || 0 },
        { position: 'IR',    count: rosterRulesRes.data.ir_count                      || 0 },
      ];

      positionCounts.forEach(({ position, count }) => {
        for (let i = 0; i < count; i++) {
          slots.push({ position, sPosition: `${position}${i + 1}`, player: null });
        }
      });

      const rosteredPlayersData: any[] = Array.isArray(rosteredPlayersRes.data) ? rosteredPlayersRes.data : [];
      const assignedPlayers = [...rosteredPlayersData];

      slots.forEach(slot => {
        const player = assignedPlayers.find(
          p => p.roster_position === slot.sPosition || (slot.position === 'BENCH' && p.roster_position === 'BENCH')
        );
        if (player) {
          const playerDetails = players.find(plyr => plyr.player_id === player.player_id);
          slot.player = {
            ...player,
            name: playerDetails?.name || 'Unknown',
            playingPosition: playerDetails?.playingPosition || 'N/A',
            team: playerDetails?.team || 'N/A',
          };
          assignedPlayers.splice(assignedPlayers.indexOf(player), 1);
        }
      });

      const irSlots = slots.filter(s => s.position === 'IR');
      const nonIrSlots = slots.filter(s => s.position !== 'IR');

      assignedPlayers.forEach(player => {
        const playerDetails = players.find(plyr => plyr.player_id === player.player_id);
        nonIrSlots.push({
          position: 'BENCH',
          sPosition: `BENCH${nonIrSlots.filter(s => s.position === 'BENCH').length + 1}`,
          player: {
            ...player,
            name: playerDetails?.name || 'Unknown',
            playingPosition: playerDetails?.playingPosition || 'N/A',
            team: playerDetails?.team || 'N/A',
          },
        });
      });

      const benchCount: number = rosterRulesRes.data.bench_count || 0;
      const nonBenchNonIr = nonIrSlots.filter(s => s.position !== 'BENCH');
      const filledBench   = nonIrSlots.filter(s => s.position === 'BENCH' && s.player);
      const emptyBench    = nonIrSlots.filter(s => s.position === 'BENCH' && !s.player).slice(0, benchCount);
      const finalSlots    = [...nonBenchNonIr, ...filledBench, ...emptyBench, ...irSlots];

      setRosterSlots(finalSlots);
      setRosteredPlayers(finalSlots.filter(s => s.player).map(s => s.player));
    } catch (error) {
      const msg = isAxiosError(error) ? error.response?.data?.message || error.message : 'Failed to load roster data.';
      showMessage(msg, 'error');
    } finally {
      setIsLoadingRoster(false);
    }
  }, [selectedMember, currentLeague?.league_id, leagueMembers, players, showMessage]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchMemberData(); }, [fetchMemberData]);

  const filteredPlayers = useMemo(() => {
    return players.filter(player =>
      !leagueRosteredPlayerIds.includes(player.player_id) &&
      (nameFilter ? player.name.toLowerCase().includes(nameFilter.toLowerCase()) : true) &&
      (teamFilter !== 'All' ? player.team === teamFilter : true) &&
      (positionFilter !== 'All' ? player.playingPosition === positionFilter : true)
    );
  }, [players, nameFilter, teamFilter, positionFilter, leagueRosteredPlayerIds]);

  const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage);
  const currentPlayers = filteredPlayers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const findAvailableSlot = useCallback((playerPosition: string): string | null => {
    if (!rosterRules || !rosterSlots.length) return null;

    const positionCounts = rosteredPlayers.reduce<Record<string, number>>((counts, player) => {
      counts[player.playingPosition] = (counts[player.playingPosition] || 0) + 1;
      return counts;
    }, {});

    const maxCounts: Record<string, number> = { QB: 4, RB: 8, WR: 8, TE: 4 };

    if ((positionCounts[playerPosition] || 0) >= (maxCounts[playerPosition] ?? Infinity)) {
      return null;
    }

    const validPositions = [playerPosition];
    if (['RB', 'WR', 'TE'].includes(playerPosition)) {
      validPositions.push('FLEX', 'WR/TE');
    }
    validPositions.push('BENCH');

    return rosterSlots.find(slot =>
      validPositions.includes(slot.position) &&
      !rosteredPlayers.some(player => player.roster_position === slot.sPosition)
    )?.sPosition ?? null;
  }, [rosterRules, rosterSlots, rosteredPlayers]);

  const populatedSlots = useMemo((): AptRosterSlot[] => {
    if (!rosterSlots.length) return [];
    const benchPlayers = rosteredPlayers.filter(p => p.roster_position === 'BENCH');
    let benchIndex = 0;

    return rosterSlots.map(slot => {
      if (slot.position === 'BENCH') {
        return { ...slot, player: benchPlayers[benchIndex++] ?? null };
      }
      return {
        ...slot,
        player: rosteredPlayers.find(p => p.roster_position === slot.sPosition) ?? null,
      };
    });
  }, [rosterSlots, rosteredPlayers]);

  const handlePlayerSelect = (player: TransformedPlayer) => {
    setSelectedPlayer(player);
  };

  const handleMemberSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMember(e.target.value);
    setSelectedPlayer(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPlayer || !selectedMember) {
      showMessage('Please select a player and a league member.', 'error');
      return;
    }

    const rosterPosition = findAvailableSlot(selectedPlayer.playingPosition);
    if (!rosterPosition) {
      showMessage('No available roster slots for this player.', 'error');
      return;
    }

    try {
      const response = await axiosInstance.post('/rostered_players/create', {
        league_member_id: selectedMember,
        player_id: selectedPlayer.player_id,
        roster_position: rosterPosition,
        is_rostered: 1,
      });

      if (response.data.status === 'success') {
        showMessage(`Successfully added ${selectedPlayer.name} to roster.`, 'success');
        setSelectedPlayer(null);

        const rosteredPlayersRes = await axiosInstance.get(`/rostered_players/getRosteredPlayersByLeagueMemberId/${selectedMember}`);
        const enriched: any[] = Array.isArray(rosteredPlayersRes.data)
          ? rosteredPlayersRes.data
              .filter((rp: any) => rp.roster_position !== 'IR')
              .map((rp: any) => {
                const playerDetails = players.find(p => p.player_id === rp.player_id);
                return {
                  ...rp,
                  name: playerDetails?.name || 'Unknown',
                  playingPosition: playerDetails?.playingPosition || 'N/A',
                  team: playerDetails?.team || 'N/A',
                };
              })
          : [];
        setRosteredPlayers(enriched);
        setLeagueRosteredPlayerIds(prev => [...prev, selectedPlayer.player_id]);
      } else {
        showMessage(response.data.message || 'Failed to add player.', 'error');
      }
    } catch (error) {
      const msg = isAxiosError(error) ? error.response?.data?.message || error.message : 'Failed to add player.';
      showMessage(msg, 'error');
    }
  };

  return (
    <div className="apt-container">
      <h2 className="apt-section-title">Add Player to Team</h2>
      {message && (
        <div className={`apt-message apt-message-${messageType} ${isMessageExiting ? 'apt-message-exiting' : ''}`}>
          {message}
        </div>
      )}
      <div className="apt-content">
        <div className="apt-search-section">
          <form onSubmit={handleSubmit} className="apt-search-form">
            <div className="apt-form-group">
              <label className="apt-filter-label">
                Name:
                <input
                  type="text"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  placeholder="Search by name"
                  className="apt-filter-input"
                />
              </label>
            </div>
            <div className="apt-form-group">
              <label className="apt-filter-label">
                Team:
                <select
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                  className="apt-filter-select"
                >
                  {nflTeams.map(team => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="apt-form-group">
              <label className="apt-filter-label">
                Position:
                <select
                  value={positionFilter}
                  onChange={(e) => setPositionFilter(e.target.value)}
                  className="apt-filter-select"
                >
                  <option value="All">All</option>
                  <option value="QB">QB</option>
                  <option value="RB">RB</option>
                  <option value="WR">WR</option>
                  <option value="TE">TE</option>
                </select>
              </label>
            </div>
            <div className="apt-form-group">
              <label className="apt-filter-label">
                League Member:
                <select
                  value={selectedMember}
                  onChange={handleMemberSelect}
                  className="apt-filter-select"
                >
                  <option value="">Select a league member</option>
                  {leagueMembers.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.team_name || 'No Team Name'}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              type="submit"
              className="apt-btn-add"
              disabled={!selectedPlayer || !selectedMember}
            >
              Add Player
            </button>
          </form>
          <table className="apt-player-table">
            <thead>
              <tr>
                <th>Player</th>
              </tr>
            </thead>
            <tbody>
              {currentPlayers.length > 0 ? (
                currentPlayers.map((player, index) => (
                  <tr key={player.player_id} className="apt-player-row">
                    <td className="apt-player-cell">
                      <PlayerCard
                        player={player}
                        index={index}
                        onClick={() => handlePlayerSelect(player)}
                        isSelected={selectedPlayer?.player_id === player.player_id}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="apt-empty-message">No players available</td>
                </tr>
              )}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="apt-pagination">
              <button
                className="apt-pagination-btn"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                <svg className="apt-pagination-icon" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                </svg>
              </button>
              <span className="apt-pagination-current">{currentPage} / {totalPages}</span>
              <button
                className="apt-pagination-btn"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                <svg className="apt-pagination-icon" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
                </svg>
              </button>
            </div>
          )}
        </div>
        <div className="apt-roster-section">
          <h3 className="apt-section-title">Roster Preview</h3>
          {isLoadingRoster ? (
            <div className="apt-loading-message">Loading roster...</div>
          ) : rosterRules ? (
            <div className="apt-table-responsive">
              <table className="apt-roster-table">
                <thead>
                  <tr>
                    <th>Slot</th>
                    <th>Player</th>
                  </tr>
                </thead>
                <tbody>
                  {populatedSlots
                    .filter(slot => slot.position !== 'IR')
                    .map(slot => (
                      <tr
                        key={slot.sPosition}
                        className="apt-roster-row"
                        {...(slot.position !== 'BENCH' ? { 'data-position': slot.sPosition } : {})}
                      >
                        <td className="apt-slot-cell">{slot.position}</td>
                        <td className="apt-player-cell">
                          {slot.player ? (
                            <PlayerCard
                              player={slot.player}
                              index={slot.sPosition}
                              onClick={() => {}}
                              isSelected={false}
                            />
                          ) : (
                            'Empty'
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="apt-empty-message">Select a league member to view roster</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddPlayerToTeamComponent;