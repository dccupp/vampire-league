import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import Login from './Components/Login/Login';
import Registration from './Components/Registration/Registration';
import Dashboard from './Components/Dashboard/Dashboard';
import RosterTableComponent from './Components/RosterTableComponent/RosterTableComponent';
import WaiversComponent from './Components/WaiversComponent/WaiversComponent';
import ActiveWaiverClaimsComponent from './Components/ActiveWaiverClaimsComponent/ActiveWaiverClaimsComponent';
import CreateLeagueForm from './Components/CreateLeague/CreateLeagueForm';
import PrivateRoute from './Components/PrivateRoute/PrivateRoute';
import LandingComponent from './Components/LandingComponent/LandingComponent';
import Navbar from './Components/Navbar/Navbar';
import ScoringRulesDisplayComponent from './Components/LeagueComponents/ScoringRulesDisplayComponent/ScoringRulesDisplayComponent';
import RosterRulesDisplayComponent from './Components/LeagueComponents/RosterRulesDisplayComponent/RosterRulesDisplayComponent';
import AddMemberToLeagueComponent from './Components/LMToolsComponents/AddMemberToLeagueComponent/AddMemberToLeagueComponent';
import AddPlayerToTeamComponent from './Components/LMToolsComponents/AddPlayerToTeamComponent/AddPlayerToTeamComponent';
import EditTeamInfoComponent from './Components/LeagueComponents/EditTeamInfoComponent/EditTeamInfoComponent';
import axiosInstance from './api';

const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const errorHandler = (error) => {
      console.error('Error in App:', error);
      setHasError(true);
    };
    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  if (hasError) {
    return (
      <div className="error-message">
        Something went wrong. Please refresh the page or contact support.
      </div>
    );
  }
  return children;
};

function AppContent() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentLeague, setCurrentLeague] = useState(null);
  const [isCommissioner, setIsCommissioner] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log('AppContent initialized with:', { currentUser, currentLeague });
  }, [currentUser, currentLeague]);

  const getCachedMembership = async (userId) => {
    const cached = membershipCache.current[userId];
    const now = Date.now();
    if (cached && now - cached.timestamp < 30000) {
      return cached.data;
    }
    try {
      const response = await axiosInstance.get(`/league_members/getLeagueMembersByUserId/${userId}`);
      const data = Array.isArray(response.data) ? response.data : response.data.data || [];
      membershipCache.current[userId] = { data, timestamp: now };
      return data;
    } catch (error) {
      console.error('Error fetching membership data:', error);
      throw error;
    }
  };

  const getCachedLeague = async (leagueId) => {
    const cached = leagueCache.current[leagueId];
    const now = Date.now();
    if (cached && now - cached.timestamp < 30000) {
      return cached.data;
    }
    try {
      const response = await axiosInstance.get(`/leagues/getLeagueById/${leagueId}`);
      const data = response.data.data || response.data;
      leagueCache.current[leagueId] = { data, timestamp: now };
      return data;
    } catch (error) {
      console.error('Error fetching league data:', error);
      throw error;
    }
  };

  const membershipCache = React.useRef({});
  const leagueCache = React.useRef({});

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedLeague = localStorage.getItem('league');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        localStorage.removeItem('user');
        navigate('/login');
      }
    }
    if (storedLeague) {
      try {
        const parsedLeague = JSON.parse(storedLeague);
        setCurrentLeague(parsedLeague);
      } catch (error) {
        console.error('Error parsing league from localStorage:', error);
        localStorage.removeItem('league');
      }
    }
  }, [navigate]);

  useEffect(() => {
    if (currentUser?.id) {
      const fetchUser = async () => {
        try {
          const response = await axiosInstance.get(`/users/getUserById/${currentUser.id}`);
          const updatedUser = {
            id: response.data.id,
            username: response.data.username,
            email_address: response.data.email_address,
            first_name: response.data.first_name,
            last_name: response.data.last_name
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setCurrentUser(updatedUser);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      };
      fetchUser();
      const interval = setInterval(fetchUser, 300000);
      return () => clearInterval(interval);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentLeague?.league_id && currentUser?.id && !leagueCache.current[currentLeague.league_id]?.fresh) {
      const fetchLeagueData = async () => {
        try {
          const [leagueResponse, membershipResponse] = await Promise.all([
            getCachedLeague(currentLeague.league_id),
            getCachedMembership(currentUser.id)
          ]);
          const membership = Array.isArray(membershipResponse) ? 
            membershipResponse.find(m => m.league_id === currentLeague.league_id) : 
            null;
          const updatedLeague = {
            league_id: leagueResponse.league_id,
            name: leagueResponse.name,
            role: membership?.role || 'player',
            is_active: leagueResponse.is_active || 0
          };
          localStorage.setItem('league', JSON.stringify(updatedLeague));
          setCurrentLeague(updatedLeague);
          leagueCache.current[currentLeague.league_id].fresh = true;
          setErrorMessage('');
        } catch (error) {
          console.error('Error fetching league data:', error);
          setErrorMessage('Failed to load league data. Please select a league again.');
          navigate('/landing');
        }
      };
      fetchLeagueData();
    }
  }, [currentLeague?.league_id, currentUser?.id, navigate]);

  useEffect(() => {
    if (currentUser?.id && currentLeague?.league_id) {
      const checkCommissionerStatus = async () => {
        try {
          const membership = await getCachedMembership(currentUser.id);
          const membershipRecord = Array.isArray(membership) ? 
            membership.find(m => m.league_id === currentLeague.league_id) : 
            null;
          const isCommish = membershipRecord && membershipRecord.role === 'commish';
          setIsCommissioner(isCommish);
        } catch (error) {
          console.error('Error checking commissioner status:', error);
          setIsCommissioner(false);
        }
      };
      checkCommissionerStatus();
      const interval = setInterval(checkCommissionerStatus, 60000);
      return () => clearInterval(interval);
    } else {
      setIsCommissioner(false);
    }
  }, [currentUser?.id, currentLeague?.league_id]);

  useEffect(() => {
    if (location.pathname === '/register' && currentUser) {
      localStorage.removeItem('user');
      localStorage.removeItem('league');
      setCurrentUser(null);
      setCurrentLeague(null);
      setIsCommissioner(false);
      membershipCache.current = {};
      leagueCache.current = {};
    }
  }, [location.pathname, currentUser]);

  return (
    <ErrorBoundary>
      <div>
        {errorMessage && (
          <div className="alert alert-danger" role="alert">
            {errorMessage}
          </div>
        )}
        <Navbar
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          currentLeague={currentLeague}
          setCurrentLeague={setCurrentLeague}
          isCommissioner={isCommissioner}
        />
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
                  <LandingComponent
                    currentUser={currentUser}
                    setCurrentLeague={setCurrentLeague}
                    setIsCommissioner={setIsCommissioner}
                    getCachedMembership={getCachedMembership}
                    getCachedLeague={getCachedLeague}
                  />
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
                    currentUser={currentUser}
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
            path="/waivers"
            element={
              <PrivateRoute>
                {currentUser && currentLeague && currentLeague.is_active ? (
                  <WaiversComponent
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
            path="/view-waivers"
            element={
              <PrivateRoute>
                {currentUser && currentLeague && currentLeague.is_active ? (
                  <ActiveWaiverClaimsComponent
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
            path="/scoring-rules"
            element={
              <PrivateRoute>
                {currentUser && currentLeague ? (
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
                {currentUser && currentLeague ? (
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
          <Route
            path="/add-player-to-team"
            element={
              <PrivateRoute>
                {currentUser && currentLeague && isCommissioner ? (
                  <AddPlayerToTeamComponent
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
            path="/edit-team-info"
            element={
              <PrivateRoute>
                {currentUser && currentLeague ? (
                  <EditTeamInfoComponent
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
      </div>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <div className="app-wrapper">
      <Router>
        <AppContent />
      </Router>
    </div>
  );
}

export default App;