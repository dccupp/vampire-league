import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './Components/Login/Login';
import Registration from './Components/Registration/Registration';
import Dashboard from './Components/Dashboard/Dashboard';
import OfferTradeComponent from './Components/OfferTradeComponent/OfferTradeComponent';
import RosterTableComponent from './Components/RosterTableComponent/RosterTableComponent';
import AddPlayerFromWaiversComponent from './Components/AddPlayerFromWaiversComponent/AddPlayerFromWaiversComponent';
import PrivateRoute from './Components/PrivateRoute/PrivateRoute';
import Layout from './Components/Layout/Layout';
import axios from 'axios';

// Mock roster structure (replace with API call in production)
const rosterStructure = [
  { position: 'QB', count: 1 },
  { position: 'RB', count: 2 },
  { position: 'WR', count: 2 },
  { position: 'TE', count: 1 },
  { position: 'FLEX', count: 1 },
  { position: 'BENCH', count: 6 }
];

const maxRosterSize = rosterStructure.reduce((total, { count }) => total + count, 0);
const minBenchCount = rosterStructure.find(r => r.position === 'BENCH')?.count || 6;

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userTeamRoster, setUserTeamRoster] = useState(null);
  const [teamInfo, setTeamInfo] = useState(null);

  // Initialize currentUser from localStorage
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setCurrentUser(storedUser);
    }
  }, []);

  // Fetch user team roster and team info when currentUser changes
  useEffect(() => {
    if (currentUser) {
      const fetchTeamData = async () => {
        try {
          // Placeholder API call for team info and roster
          const teamResponse = await axios.get(`/teams/${currentUser.id}`);
          setTeamInfo(teamResponse.data);

          const rosterResponse = await axios.get(`/teams/roster/${currentUser.id}`);
          setUserTeamRoster(rosterResponse.data.roster);
          console.log('Fetched User Team Roster:', rosterResponse.data.roster);
        } catch (error) {
          console.error('Error fetching team data:', error);
        }
      };
      fetchTeamData();
    }
  }, [currentUser]);

  // Handle roster submission
  const handleRosterSubmit = (rosterArray) => {
    console.log('Submitted Roster:', rosterArray);
    setUserTeamRoster([...rosterArray]);
  };

  return (
    <div className="app-wrapper">
      <Router>
        <Layout currentUser={currentUser} setCurrentUser={setCurrentUser}>
          <Routes>
            <Route path="/login" element={<Login setCurrentUser={setCurrentUser} />} />
            <Route path="/register" element={<Registration />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  {currentUser ? (
                    <Dashboard
                      teamRoster={userTeamRoster}
                      rosterStructure={rosterStructure}
                      currentUser={currentUser}
                      teamInfo={teamInfo}
                    />
                  ) : (
                    <Navigate to="/login" />
                  )}
                </PrivateRoute>
              }
            />
            <Route
              path="/roster"
              element={
                <PrivateRoute>
                  {currentUser ? (
                    <RosterTableComponent
                      teamRoster={userTeamRoster}
                      rosterStructure={rosterStructure}
                      teamInfo={teamInfo}
                      onRosterSubmit={handleRosterSubmit}
                    />
                  ) : (
                    <Navigate to="/login" />
                  )}
                </PrivateRoute>
              }
            />
            <Route
              path="/trade"
              element={
                <PrivateRoute>
                  {currentUser ? (
                    <OfferTradeComponent
                      teamRoster={userTeamRoster}
                      leagueTeams={[]} // Replace with API call
                      leagueTeamsInfo={[]} // Replace with API call
                    />
                  ) : (
                    <Navigate to="/login" />
                  )}
                </PrivateRoute>
              }
            />
            <Route
              path="/waivers"
              element={
                <PrivateRoute>
                  {currentUser ? (
                    <AddPlayerFromWaiversComponent
                      currentUser={currentUser}
                    />
                  ) : (
                    <Navigate to="/login" />
                  )}
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </Layout>
      </Router>
    </div>
  );
}

export default App;