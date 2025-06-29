import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './Components/Login/Login';
import Registration from './Components/Registration/Registration';
import Dashboard from './Components/Dashboard/Dashboard';
import RosterTableComponent from './Components/RosterTableComponent/RosterTableComponent';
import AddPlayerFromWaiversComponent from './Components/AddPlayerFromWaiversComponent/AddPlayerFromWaiversComponent';
import CreateLeagueFormComponent from './Components/CreateLeagueFormComponent/CreateLeagueFormComponent';
import PrivateRoute from './Components/PrivateRoute/PrivateRoute';
import LandingComponent from './Components/LandingComponent/LandingComponent';
import Navbar from './Components/Navbar/Navbar';
import ScoringRulesDisplayComponent from './Components/LeagueComponents/ScoringRulesDisplayComponent/ScoringRulesDisplayComponent';
import RosterRulesDisplayComponent from './Components/LeagueComponents/RosterRulesDisplayComponent/RosterRulesDisplayComponent';
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
  const [currentLeague, setCurrentLeague] = useState(null);
  const [userTeamRoster, setUserTeamRoster] = useState(null);
  const [teamInfo, setTeamInfo] = useState(null);

  // Initialize currentUser and currentLeague from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedLeague = localStorage.getItem('league');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('App: Error parsing user from localStorage:', error);
        localStorage.removeItem('user');
      }
    }
    if (storedLeague) {
      try {
        setCurrentLeague(JSON.parse(storedLeague));
      } catch (error) {
        console.error('App: Error parsing league from localStorage:', error);
        localStorage.removeItem('league');
      }
    }
  }, []);

  // Fetch user team roster and team info when currentUser and currentLeague change
  useEffect(() => {
    if (currentUser && currentLeague) {
      const fetchTeamData = async () => {
        try {
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
    } else {
      setUserTeamRoster(null);
      setTeamInfo(null);
    }
  }, [currentUser, currentLeague]);

  // Handle roster submission
  const handleRosterSubmit = (rosterArray) => {
    console.log('Submitted Roster:', rosterArray);
    setUserTeamRoster([...rosterArray]);
  };

  return (
    <div className="app-wrapper">
      <Router>
        <Navbar currentUser={currentUser} setCurrentUser={setCurrentUser} currentLeague={currentLeague} setCurrentLeague={setCurrentLeague} />
        <Routes>
          <Route path="/login" element={<Login currentUser={currentUser} setCurrentUser={setCurrentUser} />} />
          <Route path="/register" element={<Registration />} />
          <Route
            path="/landing"
            element={
              <PrivateRoute>
                {currentUser ? (
                  <LandingComponent currentUser={currentUser} setCurrentLeague={setCurrentLeague} />
                ) : (
                  <Navigate to="/login" />
                )}
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                {currentUser && currentLeague ? (
                  <Dashboard
                    teamRoster={userTeamRoster}
                    rosterStructure={rosterStructure}
                    currentUser={currentUser}
                    teamInfo={teamInfo}
                    currentLeague={currentLeague}
                  />
                ) : (
                  <Navigate to="/landing" />
                )}
              </PrivateRoute>
            }
          />
          <Route
            path="/roster"
            element={
              <PrivateRoute>
                {currentUser && currentLeague ? (
                  <RosterTableComponent
                    teamRoster={userTeamRoster}
                    rosterStructure={rosterStructure}
                    teamInfo={teamInfo}
                    onRosterSubmit={handleRosterSubmit}
                  />
                ) : (
                  <Navigate to="/landing" />
                )}
              </PrivateRoute>
            }
          />
          <Route
            path="/waivers"
            element={
              <PrivateRoute>
                {currentUser && currentLeague ? (
                  <AddPlayerFromWaiversComponent
                    currentUser={currentUser}
                  />
                ) : (
                  <Navigate to="/landing" />
                )}
              </PrivateRoute>
            }
          />
          <Route
            path="/scoring-rules"
            element={
              <PrivateRoute>
                {currentUser && currentLeague ? (
                  <ScoringRulesDisplayComponent
                    currentUser={currentUser}
                    currentLeague={currentLeague}
                  />
                ) : (
                  <Navigate to="/landing" />
                )}
              </PrivateRoute>
            }
          />
          <Route
            path="/roster-rules"
            element={
              <PrivateRoute>
                {currentUser && currentLeague ? (
                  <RosterRulesDisplayComponent
                    currentUser={currentUser}
                    currentLeague={currentLeague}
                  />
                ) : (
                  <Navigate to="/landing" />
                )}
              </PrivateRoute>
            }
          />  
          <Route
            path="/create-league"
            element={
              <PrivateRoute>
                {currentUser ? (
                  <CreateLeagueFormComponent
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
      </Router>
    </div>
  );
}

export default App;