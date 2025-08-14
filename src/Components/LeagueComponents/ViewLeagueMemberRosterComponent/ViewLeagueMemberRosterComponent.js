import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axiosInstance from '../../../api';
import PlayerCard from '../../PlayerCard/PlayerCard';
import './ViewLeagueMemberRosterComponent.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const ViewLeagueMemberRosterComponent = ({ currentUser, currentLeague }) => {
  const [rosterSlots, setRosterSlots] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isMessageFading, setIsMessageFading] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rosterRules, setRosterRules] = useState(null);

  // Clear message after 3 seconds with fade-out
  useEffect(() => {
    if (message) {
      setIsMessageFading(false);
      const timer = setTimeout(() => {
        setIsMessageFading(true);
        setTimeout(() => {
          setMessage('');
          setMessageType('');
          setIsMessageFading(false);
        }, 500);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Fetch all necessary data
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?.id || !currentLeague?.league_id) {
        setMessage('Invalid user or league data.');
        setMessageType('error');
        setIsLoading(false);
        return;
      }

      try {
        // Fetch current user's league member ID
        const memberResponse = await axiosInstance.get(`/league_members/getLeagueMembersByUserId/${currentUser.id}`);
        const member = Array.isArray(memberResponse.data)
          ? memberResponse.data.find(m => m.league_id === currentLeague.league_id)
          : null;
        if (!member) {
          setMessage('User is not a member of this league.');
          setMessageType('error');
          setIsLoading(false);
          return;
        }
        setSelectedMemberId(member.id);

        // Fetch all league members
        const membersResponse = await axiosInstance.get(`/league_members/getLeagueMembersByLeagueId/${currentLeague.league_id}`);
        if (!Array.isArray(membersResponse.data) || membersResponse.data.length === 0) {
          setMessage('No league members found.');
          setMessageType('error');
          setIsLoading(false);
          return;
        }
        setMembers(membersResponse.data);

        // Fetch roster rules
        const rulesResponse = await axiosInstance.get(`/roster_rules/getRosterRulesByLeagueId/${currentLeague.league_id}/1`);
        if (!rulesResponse.data || Object.keys(rulesResponse.data).length === 0) {
          setMessage('No roster rules found for this league.');
          setMessageType('error');
          setIsLoading(false);
          return;
        }
        setRosterRules(rulesResponse.data);

        // Fetch rostered players for the current user
        const playersResponse = await axiosInstance.get(`/rostered_players/getRosteredPlayersByLeagueMemberId/${member.id}`);
        const players = Array.isArray(playersResponse.data) ? playersResponse.data : [];
        if (players.length === 0) {
          setMessage('No players rostered yet.');
          setMessageType('info');
        }
        const slots = constructRosterSlots(rulesResponse.data, players);
        setRosterSlots(slots);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching roster data:', error.response || error);
        setMessage('Failed to load roster data: ' + (error.response?.data?.message || error.message));
        setMessageType('error');
        setIsLoading(false);
      }
    };
    fetchData();
  }, [currentUser, currentLeague]);

  // Fetch rostered players when selected member changes
  useEffect(() => {
    const fetchRosteredPlayers = async () => {
      if (selectedMemberId && rosterRules) {
        try {
          const response = await axiosInstance.get(`/rostered_players/getRosteredPlayersByLeagueMemberId/${selectedMemberId}`);
          const players = Array.isArray(response.data) ? response.data : [];
          if (players.length === 0) {
            setMessage('No players rostered yet.');
            setMessageType('info');
          } else {
            setMessage('');
          }
          const slots = constructRosterSlots(rosterRules, players);
          setRosterSlots(slots);
        } catch (error) {
          console.error('Error fetching rostered players:', error.response || error);
          setMessage('Failed to load rostered players: ' + (error.response?.data?.message || error.message));
          setMessageType('error');
        }
      }
    };
    fetchRosteredPlayers();
  }, [selectedMemberId, rosterRules]);

  const handleMemberChange = (event) => {
    const memberId = parseInt(event.target.value, 10);
    setSelectedMemberId(memberId);
  };

  const handlePrevMember = () => {
    const currentIndex = members.findIndex(m => m.id === selectedMemberId);
    const prevIndex = (currentIndex - 1 + members.length) % members.length;
    setSelectedMemberId(members[prevIndex].id);
  };

  const handleNextMember = () => {
    const currentIndex = members.findIndex(m => m.id === selectedMemberId);
    const nextIndex = (currentIndex + 1) % members.length;
    setSelectedMemberId(members[nextIndex].id);
  };

  const constructRosterSlots = (rules, players) => {
    const slots = [];
    if (!rules || Object.keys(rules).length === 0) {
      console.warn('No valid roster rules provided.');
      return slots;
    }

    // Normalize position names
    const positionMap = {
      'QUARTERBACK': 'QB',
      'RUNNING_BACK': 'RB',
      'RUNNINGBACK': 'RB',
      'WIDE_RECEIVER': 'WR',
      'WIDERECEIVER': 'WR',
      'TIGHT_END': 'TE',
      'TIGHTEND': 'TE',
      'FLEX': 'FLEX',
      'BENCH': 'BENCH',
      'QB1': 'QB',
      'QB2': 'QB',
      'RB1': 'RB',
      'RB2': 'RB',
      'WR1': 'WR',
      'WR2': 'WR',
      'TE1': 'TE',
      'TE2': 'TE',
      'FLEX1': 'FLEX',
      'FLEX2': 'FLEX'
    };

    // Normalize player data
    const normalizedPlayers = players.map(p => ({
      ...p,
      roster_position: p.roster_position
        ? positionMap[p.roster_position.trim().toUpperCase()] || p.roster_position.trim().toUpperCase()
        : 'BENCH',
      position: p.position ? p.position.trim().toUpperCase() : 'N/A'
    }));

    // Define position counts
    const positions = [
      { key: 'quarterback_count', position: 'QB' },
      { key: 'running_back_count', position: 'RB' },
      { key: 'wide_receiver_count', position: 'WR' },
      { key: 'tight_end_count', position: 'TE' },
      { key: 'flex_count', position: 'FLEX' },
      { key: 'bench_count', position: 'BENCH' }
    ];

    // Create slots
    positions.forEach(({ key, position }) => {
      const count = rules[key] || 0;
      for (let i = 1; i <= count; i++) {
        slots.push({
          sPosition: `${position}${count > 1 || position === 'BENCH' ? i : ''}`, // For unique keys
          position, // For display in Slot column
          player: null
        });
      }
    });

    // Assign players to slots
    normalizedPlayers.forEach(player => {
      const slot = slots.find(s => s.position === player.roster_position && !s.player);
      if (slot) {
        slot.player = {
          id: player.player_id || null,
          name: player.player_name || 'Unknown',
          playingPosition: player.position || 'N/A',
          team: player.team || 'N/A'
        };
      }
    });

    return slots;
  };

  if (isLoading) {
    return <div className="roster-view-container">Loading roster...</div>;
  }

  return (
    <div className="roster-view-container animate__animated animate__fadeIn">
      <h2 className="roster-title">{currentLeague?.name ? `${currentLeague.name} Roster` : 'Team Roster'}</h2>
      <div className="roster-controls">
        <button className="arrow-button" onClick={handlePrevMember} title="Previous Member">
          <svg className="arrow-icon" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" fill="none" stroke="#2ecc71" strokeWidth="2"/>
          </svg>
        </button>
        <select
          className="member-select"
          value={selectedMemberId || ''}
          onChange={handleMemberChange}
        >
          {members.length > 0 ? (
            members.map(member => (
              <option key={member.id} value={member.id}>
                {member.team_name || 'Unknown'}
              </option>
            ))
          ) : (
            <option value="">No members available</option>
          )}
        </select>
        <button className="arrow-button" onClick={handleNextMember} title="Next Member">
          <svg className="arrow-icon" viewBox="0 0 24 24">
            <path d="M9 18l6-6-6-6" fill="none" stroke="#2ecc71" strokeWidth="2"/>
          </svg>
        </button>
      </div>
      {message && (
        <div className={`message ${messageType} animate__animated ${isMessageFading ? 'animate__fadeOut' : 'animate__fadeIn'}`}>
          {message}
        </div>
      )}
      <div className="table-responsive">
        <table className="roster-table">
          <thead>
            <tr>
              <th>Slot</th>
              <th>Player</th>
            </tr>
          </thead>
          <tbody>
            {rosterSlots.map((rosterEntry, index) => (
              <tr
                key={rosterEntry.sPosition}
                className="roster-row"
                {...(rosterEntry.position !== 'BENCH' ? { 'data-position': rosterEntry.sPosition } : {})}
              >
                <td className="slot-cell">{rosterEntry.position}</td>
                <td className="player-cell">
                  {rosterEntry.player ? (
                    <PlayerCard
                      player={rosterEntry.player}
                      index={index}
                      onClick={() => {}}
                      isSelected={false}
                    />
                  ) : (
                    <div className="empty-slot">
                      Empty
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

ViewLeagueMemberRosterComponent.propTypes = {
  currentUser: PropTypes.object,
  currentLeague: PropTypes.shape({
    league_id: PropTypes.number,
    name: PropTypes.string
  }),
};

export default ViewLeagueMemberRosterComponent;