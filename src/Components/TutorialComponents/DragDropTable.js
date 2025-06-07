import React, { useCallback, useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Draggable Card Component
const Card = ({ id, text, row, col, allowedRow, type }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'ITEM',
    item: { id, row, col, allowedRow, type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className={`card p-2 ${isDragging ? 'opacity-50' : 'opacity-100'} ${type === 'Task' ? 'bg-primary' : 'bg-success'} text-white`}
      style={{ cursor: 'move' }}
    >
      {text} ({type})
    </div>
  );
};

// Droppable Cell Component
const Cell = ({ row, col, card, moveItem }) => {
  // Define which card types each column accepts
  const columnAllowedTypes = {
    0: ['Task'],
    1: ['Event'],
    2: ['Event'],
  };

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'ITEM',
    canDrop: (item) => {
      // Restriction 1: Card must match allowed row
      if (item.allowedRow !== row) return false;
      // Restriction 2: Card type must match column's allowed types
      return columnAllowedTypes[col].includes(item.type);
    },
    drop: (item) => moveItem(item.id, item.row, item.col, row, col),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <td
      ref={drop}
      className={`border p-3 ${isOver && canDrop ? 'bg-success bg-opacity-25' : 'bg-white'}`}
      style={{ width: '150px', height: '100px', verticalAlign: 'top' }}
    >
      {card && (
        <Card
          id={card.id}
          text={card.text}
          row={row}
          col={col}
          allowedRow={card.allowedRow}
          type={card.type}
        />
      )}
    </td>
  );
};

// Main Table Component
const DragDropTable = () => {
  const [tableData, setTableData] = useState([
    [
      { id: 1, text: 'Task A', allowedRow: 0, type: 'Task' },
      { id: 2, text: 'Event B', allowedRow: 0, type: 'Event' },
      null,
    ],
    [
      null,
      { id: 3, text: 'Event C', allowedRow: 1, type: 'Event' },
      { id: 4, text: 'Task D', allowedRow: 1, type: 'Task' },
    ],
  ]);

  const moveItem = useCallback((id, fromRow, fromCol, toRow, toCol) => {
    setTableData((prev) => {
      const newData = prev.map((row) => [...row]);
      const card = newData[fromRow][fromCol];
      const columnAllowedTypes = {
        0: ['Task'],
        1: ['Event'],
        2: ['Event'],
      };
      // Only move if restrictions are met
      if (
        card &&
        card.allowedRow === toRow &&
        columnAllowedTypes[toCol].includes(card.type)
      ) {
        newData[fromRow][fromCol] = newData[toRow][toCol];
        newData[toRow][toCol] = card;
      }
      return newData;
    });
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="container mt-4">
        <h1 className="mb-4">Drag and Drop Table</h1>
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Tasks</th>
              <th>Events</th>
              <th>Events</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((card, colIndex) => (
                  <Cell
                    key={`${rowIndex}-${colIndex}`}
                    row={rowIndex}
                    col={colIndex}
                    card={card}
                    moveItem={moveItem}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DndProvider>
  );
};

export default DragDropTable;