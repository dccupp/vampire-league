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
    const constructRosterArray = () => {
      const rosterArray = [];

      // Add non-BENCH slots from rosterStructure
      if (rosterStructure && Array.isArray(rosterStructure)) {
        rosterStructure.forEach(({ position, count }) => {
          if (position !== 'BENCH' && typeof count === 'number' && count > 0) {
            for (let i = 1; i <= count; i++) {
              rosterArray.push({
                sPosition: `${position}${i}`,
                position,
                player: null,
              });
            }
          }
        });
      }

      // Add BENCH slots from initialUserTeam
      if (initialRoster && Array.isArray(initialRoster)) {
        const benchPlayers = initialRoster.filter(
          player => player && player.slot && player.slot.startsWith('BENCH')
        );
        const benchCount = Math.max(minBenchCount, benchPlayers.length);
        for (let i = 1; i <= benchCount; i++) {
          rosterArray.push({
            sPosition: `BENCH${i}`,
            position: 'BENCH',
            player: null,
          });
        }
      }

      // Populate player objects from initialUserTeam
      if (initialRoster && Array.isArray(initialRoster)) {
        initialRoster.forEach(teamPlayer => {
          if (teamPlayer && teamPlayer.slot) {
            const rosterEntry = rosterArray.find(
              entry => entry.sPosition === teamPlayer.slot
            );
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
      setUpdatedRosterArrayWithLogging(rosterArray, 'Initial construction');
    };

    constructRosterArray();
  }, [rosterStructure, initialRoster, minBenchCount]);

  // Wrapper for setUpdatedRosterArray with logging
  const setUpdatedRosterArrayWithLogging = (newArray, action) => {
    console.log(`Updated updatedRosterArray (${action}):`, newArray.map(e => ({
      sPosition: e.sPosition,
      player: e.player?.name || null
    })));
    // Validate no players are lost
    const playerNames = newArray.filter(e => e.player).map(e => e.player.name);
    console.log(`Players present after ${action}:`, [...new Set(playerNames)]);
    setUpdatedRosterArray(newArray);
  };

  // Get eligible slots for a player
  const getEligibleSlots = (playerIndex) => {
    if (playerIndex == null || !updatedRosterArray[playerIndex]?.player) return [];
    const player = updatedRosterArray[playerIndex].player;
    const eligible = [];
    updatedRosterArray.forEach((slot, index) => {
      const allowedPositions = slot.position === 'FLEX' ? ['RB', 'WR', 'TE'] :
                              slot.position === 'BENCH' ? ['QB', 'RB', 'WR', 'TE', 'DEF', 'K'] :
                              [slot.position];
      if (allowedPositions.includes(player.playingPosition)) {
        if (slot.position === 'BENCH' && slot.player && 
            slot.player.playingPosition !== player.playingPosition) {
          return;
        }
        eligible.push(index);
      }
    });
    console.log('Eligible slots for', player?.name || 'none', ':', eligible.map(i => ({
      sPosition: updatedRosterArray[i].sPosition,
      player: updatedRosterArray[i].player?.name || null
    })));
    return eligible;
  };

  // Clean up extra BENCH spots
  const cleanBenchSpots = (rosterArray) => {
    const benchEntries = rosterArray.filter(entry => entry.position === 'BENCH');
    const occupiedBenchCount = benchEntries.filter(entry => entry.player).length;
    console.log('Cleaning BENCH spots:', { 
      occupiedBenchCount, 
      minBenchCount, 
      benchEntries: benchEntries.map(e => ({ sPosition: e.sPosition, player: e.player?.name || null }))
    });
    if (occupiedBenchCount <= minBenchCount) {
      const occupiedBench = benchEntries.filter(entry => entry.player);
      const emptyBench = benchEntries.filter(entry => !entry.player).slice(0, minBenchCount - occupiedBenchCount);
      const filteredArray = rosterArray.filter(entry => 
        entry.position !== 'BENCH' || 
        occupiedBench.some(e => e.sPosition === entry.sPosition) ||
        emptyBench.some(e => e.sPosition === entry.sPosition)
      );
      console.log('Filtered BENCH spots:', filteredArray.filter(e => e.position === 'BENCH').map(e => ({
        sPosition: e.sPosition,
        player: e.player?.name || null
      })));
      return filteredArray;
    }
    return rosterArray;
  };

  // Remove duplicate sPosition with player: null
  const removeDuplicateNullBenchSlots = (rosterArray) => {
    const seenPositions = new Map();
    const filteredArray = [];
    const duplicatesToRemove = new Set();

    rosterArray.forEach((entry, index) => {
      if (seenPositions.has(entry.sPosition)) {
        const firstIndex = seenPositions.get(entry.sPosition);
        const firstEntry = rosterArray[firstIndex];
        if (!entry.player && firstEntry.player) {
          duplicatesToRemove.add(index);
        } else if (entry.player && !firstEntry.player) {
          duplicatesToRemove.add(firstIndex);
          seenPositions.set(entry.sPosition, index);
        } else if (!entry.player && !firstEntry.player) {
          duplicatesToRemove.add(index);
        }
      } else {
        seenPositions.set(entry.sPosition, index);
      }
    });

    rosterArray.forEach((entry, index) => {
      if (!duplicatesToRemove.has(index)) {
        filteredArray.push(entry);
      }
    });

    console.log('Removed duplicate null BENCH slots:', {
      original: rosterArray.map(e => ({ sPosition: e.sPosition, player: e.player?.name || null })),
      filtered: filteredArray.map(e => ({ sPosition: e.sPosition, player: e.player?.name || null }))
    });

    return filteredArray;
  };

  // Reindex BENCH slots to ensure sequential sPosition (BENCH1, BENCH2, ...)
  const reindexBenchSlots = (rosterArray) => {
    const nonBenchEntries = rosterArray.filter(entry => entry.position !== 'BENCH');
    const benchEntries = rosterArray.filter(entry => entry.position === 'BENCH');
    
    // Sort bench entries by current sPosition to maintain order
    benchEntries.sort((a, b) => {
      const aNum = parseInt(a.sPosition.replace('BENCH', '')) || 0;
      const bNum = parseInt(b.sPosition.replace('BENCH', '')) || 0;
      return aNum - bNum;
    });

    // Reindex bench slots
    const reindexedBench = benchEntries.map((entry, idx) => {
      const newSPosition = `BENCH${idx + 1}`;
      return {
        ...entry,
        sPosition: newSPosition,
        player: entry.player ? { ...entry.player, slot: newSPosition } : null
      };
    });

    const newArray = [...nonBenchEntries, ...reindexedBench];
    console.log('Reindexed BENCH slots:', {
      original: rosterArray.filter(e => e.position === 'BENCH').map(e => ({
        sPosition: e.sPosition,
        player: e.player?.name || null
      })),
      reindexed: newArray.filter(e => e.position === 'BENCH').map(e => ({
        sPosition: e.sPosition,
        player: e.player?.name || null
      }))
    });

    return newArray;
  };

  // Handle player click to select or move
  const handlePlayerClick = (index) => {
    if (selectedPlayerIndex == null) {
      if (updatedRosterArray[index]?.player) {
        console.log('Selected player:', updatedRosterArray[index].player.name, 'at index:', index);
        setSelectedPlayerIndex(index);
      }
    } else {
      const sourcePlayer = updatedRosterArray[selectedPlayerIndex].player;
      const targetPlayer = updatedRosterArray[index]?.player;
      const eligibleSlots = getEligibleSlots(selectedPlayerIndex);

      console.log('Move attempt:', {
        source: sourcePlayer.name,
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

      // Store players in temporary variables to ensure preservation
      const sourcePlayerCopy = { ...sourcePlayer };
      const targetPlayerCopy = targetPlayer ? { ...targetPlayer } : null;

      if (!targetPlayer) {
        // Move to empty slot
        newRosterArray[index] = {
          ...newRosterArray[index],
          player: { ...sourcePlayerCopy, slot: newRosterArray[index].sPosition },
        };
        newRosterArray[selectedPlayerIndex] = {
          ...newRosterArray[selectedPlayerIndex],
          player: null,
        };
      } else if (sourcePlayer.playingPosition === targetPlayer.playingPosition) {
        // Swap same playingPosition
        newRosterArray[index] = {
          ...newRosterArray[index],
          player: { ...sourcePlayerCopy, slot: newRosterArray[index].sPosition },
        };
        newRosterArray[selectedPlayerIndex] = {
          ...newRosterArray[selectedPlayerIndex],
          player: { ...targetPlayerCopy, slot: newRosterArray[selectedPlayerIndex].sPosition },
        };
      } else {
        // Different playingPosition: Target to BENCH, source to target
        let benchIndex = newRosterArray.findIndex(entry => entry.position === 'BENCH' && !entry.player);
        if (benchIndex === -1) {
          const benchCount = newRosterArray.filter(entry => entry.position === 'BENCH').length;
          const newBenchSlot = `BENCH${benchCount + 1}`;
          if (!newRosterArray.some(entry => entry.sPosition === newBenchSlot)) {
            benchIndex = newRosterArray.length;
            newRosterArray.push({
              sPosition: newBenchSlot,
              position: 'BENCH',
              player: null,
            });
          }
        }
        // Move target to BENCH
        newRosterArray[benchIndex] = {
          ...newRosterArray[benchIndex],
          player: { ...targetPlayerCopy, slot: newRosterArray[benchIndex].sPosition },
        };
        // Move source to target
        newRosterArray[index] = {
          ...newRosterArray[index],
          player: { ...sourcePlayerCopy, slot: newRosterArray[index].sPosition },
        };
        // Clear source slot
        newRosterArray[selectedPlayerIndex] = {
          ...newRosterArray[selectedPlayerIndex],
          player: null,
        };
      }

      // Apply cleaning, deduplication, and reindexing
      let cleanedRosterArray = cleanBenchSpots(newRosterArray);
      cleanedRosterArray = removeDuplicateNullBenchSlots(cleanedRosterArray);
      cleanedRosterArray = reindexBenchSlots(cleanedRosterArray);
      setUpdatedRosterArrayWithLogging(cleanedRosterArray, 'Player move');
      setSelectedPlayerIndex(null);
    }
  };

  // Render a message if rosterStructure or updatedRosterArray is invalid
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
              <RosterRow
                key={rosterEntry.sPosition}
                rosterEntry={rosterEntry}
                index={index}
                isEligible={eligibleSlots.includes(index)}
                handlePlayerClick={handlePlayerClick}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const RosterRow = ({ rosterEntry, index, isEligible, handlePlayerClick }) => {
  return (
    <tr className="roster-row">
      <td className="slot-cell">{rosterEntry.position}</td>
      <td className={`player-cell ${isEligible ? 'slot-eligible' : ''}`}>
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
  );
};

export default RosterTableComponent;