import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './Components/Login/Login';
import Registration from './Components/Registration/Registration';
import Dashboard from './Components/Dashboard/Dashboard';
import RosterTableComponent from './Components/RosterTableComponent/RosterTableComponent';
import MatchupComponent from './Components/MatchupComponent/MatchupComponent';
import WaiversComponent from './Components/WaiversComponent/WaiversComponent';
import ActiveWaiverClaimsComponent from './Components/ActiveWaiverClaimsComponent/ActiveWaiverClaimsComponent';
import WaiverClaimPriorityFormComponent from './Components/WaiverClaimPriorityFormComponent/WaiverClaimPriorityFormComponent';
import CreateLeagueForm from './Components/CreateLeague/CreateLeagueForm';
import PrivateRoute from './Components/PrivateRoute/PrivateRoute';
import LandingComponent from './Components/LandingComponent/LandingComponent';
import Navbar from './Components/Navbar/Navbar';
import ScoringRulesDisplayComponent from './Components/LeagueComponents/ScoringRulesDisplayComponent/ScoringRulesDisplayComponent';
import RosterRulesDisplayComponent from './Components/LeagueComponents/RosterRulesDisplayComponent/RosterRulesDisplayComponent';
import WaiverRulesDisplayComponent from './Components/LeagueComponents/WaiverRulesDisplayComponent/WaiverRulesDisplayComponent';
import EditTeamInfoComponent from './Components/LeagueComponents/EditTeamInfoComponent/EditTeamInfoComponent';
import LeagueMemberScheduleComponent from './Components/LeagueComponents/LeagueMemberScheduleComponent/LeagueMemberScheduleComponent';
import AddMemberToLeagueComponent from './Components/LMToolsComponents/AddMemberToLeagueComponent/AddMemberToLeagueComponent';
import AddPlayerToTeamComponent from './Components/LMToolsComponents/AddPlayerToTeamComponent/AddPlayerToTeamComponent';
import ViewLeagueMemberRosterComponent from './Components/LeagueComponents/ViewLeagueMemberRosterComponent/ViewLeagueMemberRosterComponent';
import ActivateLeagueComponent from './Components/LMToolsComponents/ActivateLeagueComponent/ActivateLeagueComponent';
import axiosInstance from './api';

const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const errorHandler = (error) => {
      setHasError(true);
    };
    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  if (hasError) {
    return <h1>Something went wrong. Please refresh the page.</h1>;
  }
  return children;
};

const AppContent = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentLeague, setCurrentLeague] = useState(null);
  const [isCommissioner, setIsCommissioner] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('user');
    const league = localStorage.getItem('league');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
    if (league) {
      setCurrentLeague(JSON.parse(league));
    }
  }, []);

  const getCachedMembership = async (userId) => {
    try {
      const response = await axiosInstance.get(`/league_members/getLeagueMembersByUserId/${userId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const getCachedLeague = async (leagueId) => {
    try {
      const response = await axiosInstance.get(`/leagues/getLeagueById/${leagueId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    const checkCommissionerStatus = async () => {
      if (currentUser?.id && currentLeague?.league_id) {
        try {
          const response = await axiosInstance.get(`/league_members/getLeagueMembersByUserId/${currentUser.id}`);
          const membership = response.data.find(m => m.league_id === currentLeague.league_id);
          setIsCommissioner(membership?.role === 'commish');
        } catch (error) {
          setIsCommissioner(false);
        }
      } else {
        setIsCommissioner(false);
      }
    };
    checkCommissionerStatus();
  }, [currentUser, currentLeague]);

  return (
    <ErrorBoundary>
      <div className="app-content">
        <Navbar
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          currentLeague={currentLeague}
          setCurrentLeague={setCurrentLeague}
          isCommissioner={isCommissioner}
        />
        <Routes>
          <Route path="/login" element={<Login setCurrentUser={setCurrentUser} />} />
          <Route path="/register" element={<Registration setCurrentUser={setCurrentUser} />} />
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
                {currentUser && currentLeague ? (
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
                {currentUser && currentLeague ? (
                  <RosterTableComponent
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
            path="/matchups"
            element={
              <PrivateRoute>
                {currentUser && currentLeague ? (
                  <MatchupComponent
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
            path="/waivers"
            element={
              <PrivateRoute>
                {currentUser && currentLeague ? (
                  <WaiversComponent
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
            path="/active-waiver-claims"
            element={
              <PrivateRoute>
                {currentUser && currentLeague ? (
                  <ActiveWaiverClaimsComponent
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
            path="/waiver-priority"
            element={
              <PrivateRoute>
                {currentUser && currentLeague ? (
                  <WaiverClaimPriorityFormComponent
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
            path="/edit-team-info"
            element={
              <PrivateRoute>
                {currentUser && currentLeague ? (
                  <EditTeamInfoComponent
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
            path="/league-member-schedule"
            element={
              <PrivateRoute>
                {currentUser && currentLeague ? (
                  <LeagueMemberScheduleComponent
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
            path="/league-member-roster"
            element={
              <PrivateRoute>
                {currentUser && currentLeague ? (
                  <ViewLeagueMemberRosterComponent
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
            path="/scoring-rules"
            element={
              <PrivateRoute>
                {currentUser && currentLeague ? (
                  <ScoringRulesDisplayComponent
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
            path="/roster-rules"
            element={
              <PrivateRoute>
                {currentUser && currentLeague ? (
                  <RosterRulesDisplayComponent
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
            path="/waiver-rules"
            element={
              <PrivateRoute>
                {currentUser && currentLeague ? (
                  <WaiverRulesDisplayComponent
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
                  <Navigate to="/login" />
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
                  <Navigate to="/login" />
                )}
              </PrivateRoute>
            }
          />
          <Route
            path="/activate-league"
            element={
              <PrivateRoute>
                {currentUser && currentLeague ? (
                  <ActivateLeagueComponent
                    currentUser={currentUser}
                    currentLeague={currentLeague}
                  />
                ) : (
                  <Navigate to="/login" />
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