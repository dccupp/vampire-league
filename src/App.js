import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './Components/Login/Login';
import Registration from './Components/Registration/Registration';
import Dashboard from './Components/Dashboard/Dashboard';
import RosterTableComponent from './Components/RosterTableComponent/RosterTableComponent';
import AddPlayerFromWaiversComponent from './Components/AddPlayerFromWaiversComponent/AddPlayerFromWaiversComponent';
import CreateLeagueForm from './Components/CreateLeague/CreateLeagueForm';
import PrivateRoute from './Components/PrivateRoute/PrivateRoute';
import LandingComponent from './Components/LandingComponent/LandingComponent';
import Navbar from './Components/Navbar/Navbar';
import ScoringRulesDisplayComponent from './Components/LeagueComponents/ScoringRulesDisplayComponent/ScoringRulesDisplayComponent';
import RosterRulesDisplayComponent from './Components/LeagueComponents/RosterRulesDisplayComponent/RosterRulesDisplayComponent';
import AddMemberToLeagueComponent from './Components/LMToolsComponents/AddMemberToLeagueComponent/AddMemberToLeagueComponent';
import axios from 'axios';

// Configure Axios instance to avoid global baseURL overrides
const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000'
});

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
  const [isCommissioner, setIsCommissioner] = useState(false);

  // Initialize currentUser and currentLeague from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedLeague = localStorage.getItem('league');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);
        console.log('App: Initialized currentUser from localStorage:', parsedUser);
      } catch (error) {
        console.error('App: Error parsing user from localStorage:', error);
        localStorage.removeItem('user');
      }
    }
    if (storedLeague) {
      try {
        const parsedLeague = JSON.parse(storedLeague);
        setCurrentLeague(parsedLeague);
        console.log('App: Initialized currentLeague from localStorage:', parsedLeague);
      } catch (error) {
        console.error('App: Error parsing league from localStorage:', error);
        localStorage.removeItem('league');
      }
    }
  }, []);

  // Refresh currentLeague data when it changes
  useEffect(() => {
    if (currentLeague?.league_id) {
      const fetchLeagueData = async () => {
        try {
          console.log(`App: Fetching league data for league_id: ${currentLeague.league_id} via /leagues/getLeagueById/${currentLeague.league_id}`);
          const response = await axiosInstance.get(`/leagues/getLeagueById/${currentLeague.league_id}`);
          console.log('App: Response from getLeagueById:', {
            status: response.status,
            data: response.data
          });
          const updatedLeague = {
            league_id: response.data.league_id,
            name: response.data.name,
            role: currentLeague.role, // Preserve role from league_members
            is_active: response.data.is_active || 0
          };
          localStorage.setItem('league', JSON.stringify(updatedLeague));
          setCurrentLeague(updatedLeague);
          console.log('App: Updated currentLeague:', updatedLeague);
        } catch (error) {
          console.error('App: Error fetching league data:', error);
          console.log('App: Detailed error info:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
          });
        }
      };
      fetchLeagueData();
    }
  }, [currentLeague?.league_id]);

  // Check commissioner status when currentUser and currentLeague change
  useEffect(() => {
    const checkCommissionerStatus = async () => {
      if (currentUser?.id && currentLeague?.league_id) {
        console.log(`App: Checking commissioner status for user ${currentUser.id} via /league_members/getLeagueMembersByUserId/${currentUser.id}`);
        try {
          const response = await axiosInstance.get(`/league_members/getLeagueMembersByUserId/${currentUser.id}`);
          console.log('App: Response from getLeagueMembersByUserId:', {
            status: response.status,
            data: response.data
          });
          const membership = response.data.find(m => m.league_id === currentLeague.league_id);
          const isCommish = membership && membership.role === 'commish';
          setIsCommissioner(isCommish);
          console.log(`App: Commissioner check result - isCommissioner: ${isCommish}, membership:`, membership);
        } catch (error) {
          console.error('App: Error checking commissioner status:', error);
          console.log('App: Detailed error info:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
          });
          setIsCommissioner(false);
          console.log('App: Commissioner check failed, setting isCommissioner to false');
        }
      } else {
        setIsCommissioner(false);
        console.log('App: Commissioner check skipped - prerequisites not met:', {
          userId: currentUser?.id,
          leagueId: currentLeague?.league_id
        });
      }
    };
    checkCommissionerStatus();
  }, [currentUser, currentLeague]);

  // Clear user and league data when navigating to /register
  useEffect(() => {
    if (window.location.pathname === '/register' && currentUser) {
      console.log('App: Clearing user and league data for /register route');
      localStorage.removeItem('user');
      localStorage.removeItem('league');
      setCurrentUser(null);
      setCurrentLeague(null);
      setIsCommissioner(false);
    }
  }, [window.location.pathname, currentUser]);

  // Handle roster submission
  const handleRosterSubmit = (rosterArray) => {
    console.log('App: Submitted Roster:', rosterArray);
    setUserTeamRoster([...rosterArray]);
  };

  // Debug navigation on route changes
  useEffect(() => {
    console.log('App: Route changed:', {
      pathname: window.location.pathname,
      currentUser: currentUser ? { id: currentUser.id, name: currentUser.name } : null,
      currentLeague: currentLeague ? { league_id: currentLeague.league_id, name: currentLeague.name, is_active: currentLeague.is_active } : null
    });
  }, [window.location.pathname, currentUser, currentLeague]);

  return (
    <div className="app-wrapper">
      <Router>
        <Navbar currentUser={currentUser} setCurrentUser={setCurrentUser} currentLeague={currentLeague} setCurrentLeague={setCurrentLeague} />
        <Routes>
          <Route path="/login" element={<Login currentUser={currentUser} setCurrentUser={setCurrentUser} />} />
          <Route
            path="/register"
            element={currentUser ? <Navigate to="/dashboard" /> : <Registration />}
          />
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
                {currentUser ? (
                  <Dashboard
                    teamRoster={userTeamRoster}
                    rosterStructure={rosterStructure}
                    currentUser={currentUser}
                    teamInfo={teamInfo}
                    currentLeague={currentLeague}
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
                {currentUser && currentLeague && currentLeague.is_active ? (
                  <RosterTableComponent
                    teamRoster={userTeamRoster}
                    rosterStructure={rosterStructure}
                    teamInfo={teamInfo}
                    onRosterSubmit={handleRosterSubmit}
                  />
                ) : (
                  <Navigate to="/dashboard" />
                )}
              </PrivateRoute>
            }
          />
          <Route
            path="/waivers"
            element={
              <PrivateRoute>
                {currentUser && currentLeague && currentLeague.is_active ? (
                  <AddPlayerFromWaiversComponent
                    currentUser={currentUser}
                  />
                ) : (
                  <Navigate to="/dashboard" />
                )}
              </PrivateRoute>
            }
          />
          <Route
            path="/scoring-rules"
            element={
              <PrivateRoute>
                {currentUser && currentLeague && currentLeague.is_active ? (
                  <ScoringRulesDisplayComponent
                    currentUser={currentUser}
                    currentLeague={currentLeague}
                  />
                ) : (
                  <Navigate to="/dashboard" />
                )}
              </PrivateRoute>
            }
          />
          <Route
            path="/roster-rules"
            element={
              <PrivateRoute>
                {currentUser && currentLeague && currentLeague.is_active ? (
                  <RosterRulesDisplayComponent
                    currentUser={currentUser}
                    currentLeague={currentLeague}
                  />
                ) : (
                  <Navigate to="/dashboard" />
                )}
              </PrivateRoute>
            }
          />
          <Route
            path="/create-league"
            element={
              <PrivateRoute>
                {currentUser ? (
                  <CreateLeagueForm 
                    currentUser={currentUser}
                  />
                ) : (
                  <Navigate to="/login" />
                )}
              </PrivateRoute>
            }
          />
          <Route
            path="/add-member-to-league"
            element={
              <PrivateRoute>
                {currentUser && currentLeague && isCommissioner ? (
                  <AddMemberToLeagueComponent
                    currentUser={currentUser}
                    currentLeague={currentLeague}
                  />
                ) : (
                  <Navigate to="/dashboard" />
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