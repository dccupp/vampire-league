import React, { useEffect, useState } from 'react';
import PlayerCard from '../PlayerCard/PlayerCard';
import './RosterTableComponent.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const RosterTableComponent = ({ initialRoster, rosterStructure }) => {
  const [updatedRosterArray, setUpdatedRosterArray] = useState([]);
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(null);
  const minBenchCount = rosterStructure?.find(r => r.position === 'BENCH')?.count || 6;

  // Construct updatedRosterArray
  useEffect(() => {
    const rosterArray = [];

    // Add non-BENCH slots
    if (rosterStructure && Array.isArray(rosterStructure)) {
      rosterStructure.forEach(({ position, count }) => {
        if (position !== 'BENCH' && typeof count === 'number' && count > 0) {
          for (let i = 1; i <= count; i++) {
            rosterArray.push({ sPosition: `${position}${i}`, position, player: null });
          }
        }
      });
    }

    // Add BENCH slots
    if (initialRoster && Array.isArray(initialRoster)) {
      const benchPlayers = initialRoster.filter(
        player => player && player.slot && player.slot.startsWith('BENCH')
      );
      const benchCount = Math.max(minBenchCount, benchPlayers.length);
      for (let i = 1; i <= benchCount; i++) {
        rosterArray.push({ sPosition: `BENCH${i}`, position: 'BENCH', player: null });
      }
    }

    // Populate players
    if (initialRoster && Array.isArray(initialRoster)) {
      initialRoster.forEach(teamPlayer => {
        if (teamPlayer && teamPlayer.slot) {
          const rosterEntry = rosterArray.find(entry => entry.sPosition === teamPlayer.slot);
          if (rosterEntry) {
            rosterEntry.player = { ...teamPlayer };
          }
        }
      });
    }

    console.log('Constructed updatedRosterArray:', rosterArray.map(e => ({
      sPosition: e.sPosition,
      player: e.player?.name || null
    })));
    setUpdatedRosterArray(rosterArray);
  }, [rosterStructure, initialRoster, minBenchCount]);

  // Get eligible slots for a player
  const getEligibleSlots = (playerIndex) => {
    if (playerIndex == null || !updatedRosterArray[playerIndex]?.player) return [];
    const { playingPosition } = updatedRosterArray[playerIndex].player;
    return updatedRosterArray.reduce((eligible, slot, index) => {
      const allowedPositions = slot.position === 'FLEX' ? ['RB', 'WR', 'TE'] :
                              slot.position === 'BENCH' ? ['QB', 'RB', 'WR', 'TE', 'DEF', 'K'] :
                              [slot.position];
      if (allowedPositions.includes(playingPosition)) {
        if (slot.position === 'BENCH' && slot.player && 
            slot.player.playingPosition !== playingPosition) {
          return eligible;
        }
        eligible.push(index);
      }
      return eligible;
    }, []);
  };

  // Normalize roster array (clean BENCH, deduplicate, reindex)
  const normalizeRosterArray = (rosterArray) => {
    // Deduplicate sPosition, keeping non-null players
    const seenPositions = new Map();
    const deduplicated = rosterArray.filter((entry, index) => {
      if (seenPositions.has(entry.sPosition)) {
        const firstIndex = seenPositions.get(entry.sPosition);
        const firstEntry = rosterArray[firstIndex];
        if (!entry.player && firstEntry.player) return false;
        if (entry.player && !firstEntry.player) {
          seenPositions.set(entry.sPosition, index);
          return false;
        }
        return false;
      }
      seenPositions.set(entry.sPosition, index);
      return true;
    });

    // Clean BENCH slots
    const benchEntries = deduplicated.filter(e => e.position === 'BENCH');
    const occupiedBenchCount = benchEntries.filter(e => e.player).length;
    let cleaned = deduplicated;
    if (occupiedBenchCount <= minBenchCount) {
      const occupiedBench = benchEntries.filter(e => e.player);
      const emptyBench = benchEntries.filter(e => !e.player).slice(0, minBenchCount - occupiedBenchCount);
      cleaned = deduplicated.filter(e => 
        e.position !== 'BENCH' || 
        occupiedBench.some(b => b.sPosition === e.sPosition) ||
        emptyBench.some(b => b.sPosition === e.sPosition)
      );
    }

    // Reindex BENCH slots
    const nonBench = cleaned.filter(e => e.position !== 'BENCH');
    const bench = cleaned.filter(e => e.position === 'BENCH').map((entry, idx) => {
      const newSPosition = `BENCH${idx + 1}`;
      return {
        ...entry,
        sPosition: newSPosition,
        player: entry.player ? { ...entry.player, slot: newSPosition } : null
      };
    });

    const normalizedArray = [...nonBench, ...bench];
    console.log('Normalized updatedRosterArray:', normalizedArray.map(e => ({
      sPosition: e.sPosition,
      player: e.player?.name || null
    })));
    return normalizedArray;
  };

  // Handle player click to select or move
  const handlePlayerClick = (index) => {
    if (selectedPlayerIndex == null) {
      if (updatedRosterArray[index]?.player) {
        setSelectedPlayerIndex(index);
      }
      return;
    }

    const sourcePlayer = updatedRosterArray[selectedPlayerIndex].player;
    const targetPlayer = updatedRosterArray[index]?.player;
    const eligibleSlots = getEligibleSlots(selectedPlayerIndex);

    console.log('Move attempt:', {
      source: sourcePlayer?.name,
      sourceIndex: selectedPlayerIndex,
      target: targetPlayer?.name || 'empty',
      targetIndex: index,
      eligibleSlots
    });

    if (!eligibleSlots.includes(index)) {
      setSelectedPlayerIndex(null);
      return;
    }

    const newRosterArray = [...updatedRosterArray];
    const sourcePlayerCopy = { ...sourcePlayer };
    const targetPlayerCopy = targetPlayer ? { ...targetPlayer } : null;

    if (!targetPlayer) {
      newRosterArray[index] = {
        ...newRosterArray[index],
        player: { ...sourcePlayerCopy, slot: newRosterArray[index].sPosition }
      };
      newRosterArray[selectedPlayerIndex] = {
        ...newRosterArray[selectedPlayerIndex],
        player: null
      };
    } else if (sourcePlayer.playingPosition === targetPlayer.playingPosition) {
      newRosterArray[index] = {
        ...newRosterArray[index],
        player: { ...sourcePlayerCopy, slot: newRosterArray[index].sPosition }
      };
      newRosterArray[selectedPlayerIndex] = {
        ...newRosterArray[selectedPlayerIndex],
        player: { ...targetPlayerCopy, slot: newRosterArray[selectedPlayerIndex].sPosition }
      };
    } else {
      let benchIndex = newRosterArray.findIndex(e => e.position === 'BENCH' && !e.player);
      if (benchIndex === -1) {
        const benchCount = newRosterArray.filter(e => e.position === 'BENCH').length;
        const newBenchSlot = `BENCH${benchCount + 1}`;
        benchIndex = newRosterArray.length;
        newRosterArray.push({
          sPosition: newBenchSlot,
          position: 'BENCH',
          player: null
        });
      }
      newRosterArray[benchIndex] = {
        ...newRosterArray[benchIndex],
        player: { ...targetPlayerCopy, slot: newRosterArray[benchIndex].sPosition }
      };
      newRosterArray[index] = {
        ...newRosterArray[index],
        player: { ...sourcePlayerCopy, slot: newRosterArray[index].sPosition }
      };
      newRosterArray[selectedPlayerIndex] = {
        ...newRosterArray[selectedPlayerIndex],
        player: null
      };
    }

    setUpdatedRosterArray(normalizeRosterArray(newRosterArray));
    setSelectedPlayerIndex(null);
  };

  if (!rosterStructure || !Array.isArray(rosterStructure) || !updatedRosterArray.length) {
    return <div className="error-message">Error: Invalid roster structure.</div>;
  }

  const eligibleSlots = getEligibleSlots(selectedPlayerIndex);

  return (
    <div className="fantasy-roster-container animate__animated animate__fadeIn">
      <h2 className="roster-title">Team Roster</h2>
      <div className="table-responsive">
        <table className="roster-table">
          <thead>
            <tr>
              <th>Slot</th>
              <th>Player</th>
            </tr>
          </thead>
          <tbody>
            {updatedRosterArray.map((rosterEntry, index) => (
              <tr key={rosterEntry.sPosition} className="roster-row">
                <td className="slot-cell">{rosterEntry.position}</td>
                <td className={`player-cell ${eligibleSlots.includes(index) ? 'slot-eligible' : ''}`}>
                  {rosterEntry.player ? (
                    <PlayerCard
                      player={rosterEntry.player}
                      index={index}
                      onClick={handlePlayerClick}
                    />
                  ) : (
                    <div
                      className="empty-slot"
                      onClick={() => handlePlayerClick(index)}
                    >
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

export default RosterTableComponent;