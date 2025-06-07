import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Login from './Components/Login/Login';
import Registration from './Components/Registration/Registration';
import Dashboard from './Components/Dashboard/Dashboard';
import OfferTradeComponent from './Components/OffterTradeComponent/OfferTradeComponent';  
import RosterTableComponent from './Components/RosterTableComponent/RosterTableComponent';
import PrivateRoute from './Components/PrivateRoute/PrivateRoute';
import Layout from './Components/Layout/Layout';

const rosterStructure = [
  { position: 'QB', count: 1 },
  { position: 'RB', count: 2 },
  { position: 'WR', count: 3 },
  { position: 'TE', count: 1 },
  { position: 'FLEX', count: 1 },
  { position: 'DEF', count: 1 },
  { position: 'K', count: 1 },
  { position: 'BENCH', count: 6 },
];

const initialUserTeam = [
  { name: 'Patrick Mahomes', playingPosition: 'QB', slot: 'QB1', team: 'Chiefs' },
  { name: 'Christian McCaffrey', playingPosition: 'RB', slot: 'RB1', team: '49ers' },
  { name: 'Saquon Barkley', playingPosition: 'RB', slot: 'RB2', team: 'Eagles' },
  { name: 'Tyreek Hill', playingPosition: 'WR', slot: 'WR1', team: 'Dolphins' },
  { name: 'Justin Jefferson', playingPosition: 'WR', slot: 'WR2', team: 'Vikings' },
  { name: 'CeeDee Lamb', playingPosition: 'WR', slot: 'BENCH7', team: 'Cowboys' },
  { name: 'Travis Kelce', playingPosition: 'TE', slot: 'TE1', team: 'Chiefs' },
  { name: 'Davante Adams', playingPosition: 'WR', slot: 'FLEX1', team: 'Raiders' },
  { name: 'Buffalo Bills', playingPosition: 'DEF', slot: 'DEF1', team: 'Bills' },
  { name: 'Justin Tucker', playingPosition: 'K', slot: 'K1', team: 'Ravens' },
  { name: 'Josh Allen', playingPosition: 'QB', slot: 'BENCH1', team: 'Bills' },
  { name: 'Derrick Henry', playingPosition: 'RB', slot: 'BENCH2', team: 'Ravens' },
  { name: 'A.J. Brown', playingPosition: 'WR', slot: 'BENCH3', team: 'Eagles' },
  { name: 'Sam LaPorta', playingPosition: 'TE', slot: 'BENCH4', team: 'Lions' },
  { name: 'Pittsburgh Steelers', playingPosition: 'DEF', slot: 'BENCH5', team: 'Steelers' },
  { name: 'Jake Elliott', playingPosition: 'K', slot: 'BENCH6', team: 'Eagles' },
];

const maxRosterSize = rosterStructure.reduce((total, { count }) => total + count, 0);
const minBenchCount = rosterStructure.find(r => r.position === 'BENCH')?.count || 6;

console.log('Max Roster Size:', maxRosterSize);
console.log('Min Bench Count:', minBenchCount);

function App() {
  return (
    <div className="app-wrapper">
      <Router>
        <Layout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Registration />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Dashboard
                    initialRoster={initialUserTeam}
                    rosterStructure={rosterStructure}
                  />
                </PrivateRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard
                    initialRoster={initialUserTeam}
                    rosterStructure={rosterStructure}
                  />
                </PrivateRoute>
              }
            />
            <Route
              path="/roster"
              element={
                <PrivateRoute>
                  <RosterTableComponent
                    initialRoster={initialUserTeam}
                    rosterStructure={rosterStructure}
                  />
                </PrivateRoute>
              }
            />
            <Route
              path="/trade"
              element={
                <PrivateRoute>
                  <OfferTradeComponent
                    user1Roster={initialUserTeam}
                  />
                </PrivateRoute>
              }
            />
          </Routes>
        </Layout>
      </Router>
    </div>
  );
}

export default App;