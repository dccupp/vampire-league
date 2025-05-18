import React, { useState } from 'react';
import { Table, Container, Dropdown, Button } from 'react-bootstrap';
import './RosterTableComponent.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const rosterStructure = [  { position: 'QB', count: 1 },  { position: 'RB', count: 2 },  { position: 'WR', count: 3 },  { position: 'TE', count: 1 },  { position: 'FLEX', count: 1 },  { position: 'DEF', count: 1 },  { position: 'K', count: 1 },  { position: 'BENCH', count: 6 }];

const initialUserTeam = [  { name: 'Patrick Mahomes', playingPosition: 'QB', slot: 'QB1', team: 'Chiefs' },  { name: 'Christian McCaffrey', playingPosition: 'RB', slot: 'RB1', team: '49ers' },  { name: 'Saquon Barkley', playingPosition: 'RB', slot: 'RB2', team: 'Eagles' },  { name: 'Tyreek Hill', playingPosition: 'WR', slot: 'WR1', team: 'Dolphins' },  { name: 'Justin Jefferson', playingPosition: 'WR', slot: 'WR2', team: 'Vikings' },  { name: 'CeeDee Lamb', playingPosition: 'WR', slot: 'WR3', team: 'Cowboys' },  { name: 'Travis Kelce', playingPosition: 'TE', slot: 'TE1', team: 'Chiefs' },  { name: 'Davante Adams', playingPosition: 'WR', slot: 'FLEX1', team: 'Raiders' },  { name: 'Buffalo Bills', playingPosition: 'DEF', slot: 'DEF1', team: 'Bills' },  { name: 'Justin Tucker', playingPosition: 'K', slot: 'K1', team: 'Ravens' },  { name: 'Josh Allen', playingPosition: 'QB', slot: 'BENCH1', team: 'Bills' },  { name: 'Derrick Henry', playingPosition: 'RB', slot: 'BENCH2', team: 'Ravens' },  { name: 'A.J. Brown', playingPosition: 'WR', slot: 'BENCH3', team: 'Eagles' },  { name: 'Sam LaPorta', playingPosition: 'TE', slot: 'BENCH4', team: 'Lions' },  { name: 'Pittsburgh Steelers', playingPosition: 'DEF', slot: 'BENCH5', team: 'Steelers' },  { name: 'Jake Elliott', playingPosition: 'K', slot: 'BENCH6', team: 'Eagles' }];

const RosterTableComponent = ({ editable = false }) => {
  const [userTeam, setUserTeam] = useState(initialUserTeam);

  // Generate slot identifiers (e.g., QB1, RB1, RB2, BENCH1, ...)
  const slots = rosterStructure.flatMap(s => 
    Array.from({ length: s.count }, (_, i) => ({
      slot: `${s.position}${i + 1}`,
      position: s.position
    }))
  );

  // Get valid slots for a player's playingPosition
  const getValidSlots = (playingPosition) => {
    const validSlots = slots.map(s => s.slot); // All slots, including BENCH1-6
    if (playingPosition === 'QB') return validSlots.filter(s => s === 'QB1' || s.startsWith('BENCH'));
    if (playingPosition === 'RB') return validSlots.filter(s => s.startsWith('RB') || s === 'FLEX1' || s.startsWith('BENCH'));
    if (playingPosition === 'WR') return validSlots.filter(s => s.startsWith('WR') || s === 'FLEX1' || s.startsWith('BENCH'));
    if (playingPosition === 'TE') return validSlots.filter(s => s === 'TE1' || s === 'FLEX1' || s.startsWith('BENCH'));
    if (playingPosition === 'DEF') return validSlots.filter(s => s === 'DEF1' || s.startsWith('BENCH'));
    if (playingPosition === 'K') return validSlots.filter(s => s === 'K1' || s.startsWith('BENCH'));
    return validSlots.filter(s => s.startsWith('BENCH')); // Default for empty slots
  };

  // Check if a slot is available or swappable
  const isSlotAvailable = (slot, excludePlayerName = null) => {
    const currentPlayer = userTeam.find(
      p => p.slot === slot && p.name !== excludePlayerName
    );
    return !currentPlayer;
  };

  // Handle moving a player to a new slot
  const handleMovePlayer = (playerName, newSlot) => {
    const player = userTeam.find(p => p.name === playerName);
    if (!player) return;

    const validSlots = getValidSlots(player.playingPosition);
    if (!validSlots.includes(newSlot)) {
      console.log(`Invalid move: ${player.name} (${player.playingPosition}) cannot move to ${newSlot}`);
      return;
    }

    // Check if the target slot is available or swappable
    const currentPlayerInSlot = userTeam.find(
      p => p.slot === newSlot && p.playingPosition === player.playingPosition
    );

    if (!isSlotAvailable(newSlot, player.name) && !currentPlayerInSlot) {
      console.log(`No available slot for ${newSlot}`);
      return;
    }

    const newUserTeam = [...userTeam];
    const playerIndex = newUserTeam.findIndex(p => p.name === playerName);

    // Move the player
    newUserTeam[playerIndex].slot = newSlot;

    // If swapping, move the current player in the slot to BENCH
    if (currentPlayerInSlot) {
      const currentPlayerIndex = newUserTeam.findIndex(p => p.name === currentPlayerInSlot.name);
      // Find an available BENCH slot
      const availableBenchSlot = slots.find(s => s.slot.startsWith('BENCH') && isSlotAvailable(s.slot));
      newUserTeam[currentPlayerIndex].slot = availableBenchSlot ? availableBenchSlot.slot : 'BENCH1';
    }

    setUserTeam(newUserTeam);
    console.log(`Moved ${player.name} to ${newSlot}`);
  };

  // Get player for a specific slot
  const getPlayerForSlot = (slot) => {
    return userTeam.find(p => p.slot === slot);
  };

  // Split slots into active and bench
  const activeSlots = slots.filter(s => !s.slot.startsWith('BENCH'));
  const benchSlots = slots.filter(s => s.slot.startsWith('BENCH'));

  return (
    <Container className="roster-table-container animate__animated animate__fadeIn">
      <h3 className="text-center mb-3">Active Roster</h3>
      <Table responsive striped bordered hover className="roster-table mb-4">
        <thead>
          <tr>
            <th>Roster Position</th>
            <th>Name</th>
            <th>Team</th>
            {editable && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {activeSlots.map(({ slot, position }, index) => {
            const player = getPlayerForSlot(slot);
            return (
              <tr key={index}>
                <td className="roster-position-cell">{slot}</td>
                <td>{player ? player.name : 'Empty'}</td>
                <td>{player ? player.team : '-'}</td>
                {editable && (
                  <td>
                    <Dropdown>
                      <Dropdown.Toggle variant="success" size="sm" className="edit-button">
                        Edit
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        {getValidSlots(player ? player.playingPosition : 'ANY').map(s => (
                          <Dropdown.Item
                            key={s}
                            onClick={() => handleMovePlayer(player ? player.name : null, s)}
                            disabled={
                              !player ||
                              (s !== 'BENCH' &&
                                !isSlotAvailable(s, player.name) &&
                                !userTeam.some(p => p.slot === s && p.playingPosition === player.playingPosition))
                            }
                          >
                            {s}
                          </Dropdown.Item>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown>
                  </td>
                )}
              </tr>
            );
          })}
          {activeSlots.length === 0 && (
            <tr>
              <td colSpan={editable ? 4 : 3}>No active roster slots</td>
            </tr>
          )}
        </tbody>
      </Table>

      <h3 className="text-center mb-3">Bench</h3>
      <Table responsive striped bordered hover className="roster-table">
        <thead>
          <tr>
            <th>Roster Position</th>
            <th>Name</th>
            <th>Team</th>
            {editable && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {benchSlots.map(({ slot, position }, index) => {
            const player = getPlayerForSlot(slot);
            return (
              <tr key={index}>
                <td className="roster-position-cell">{slot}</td>
                <td>{player ? player.name : 'Empty'}</td>
                <td>{player ? player.team : '-'}</td>
                {editable && (
                  <td>
                    <Dropdown>
                      <Dropdown.Toggle variant="success" size="sm" className="edit-button">
                        Edit
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        {getValidSlots(player ? player.playingPosition : 'ANY').map(s => (
                          <Dropdown.Item
                            key={s}
                            onClick={() => handleMovePlayer(player ? player.name : null, s)}
                            disabled={
                              !player ||
                              (s !== 'BENCH' &&
                                !isSlotAvailable(s, player.name) &&
                                !userTeam.some(p => p.slot === s && p.playingPosition === player.playingPosition))
                            }
                          >
                            {s}
                          </Dropdown.Item>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown>
                  </td>
                )}
              </tr>
            );
          })}
          {benchSlots.length === 0 && (
            <tr>
              <td colSpan={editable ? 4 : 3}>No bench slots</td>
            </tr>
          )}
        </tbody>
      </Table>
    </Container>
  );
};

export default RosterTableComponent;