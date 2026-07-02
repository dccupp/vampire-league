import { useState, useEffect, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './Components/Login/Login';
import Registration from './Components/Registration/Registration';
import Dashboard from './Components/Dashboard/Dashboard';
import RosterComponent from './Components/RosterComponent/RosterComponent';
import MatchupComponent from './Components/MatchupComponent/MatchupComponent';
import WaiversComponent from './Components/WaiversComponent/WaiversComponent';
import ActiveWaiverClaimsComponent from './Components/ActiveWaiverClaimsComponent/ActiveWaiverClaimsComponent';
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
import ActivityFeedPage from './Components/ActivityFeedPage/ActivityFeedPage';
import { NowProvider } from './context/NowContext';
import { LeagueProvider } from './context/LeagueContext';
import { UserProvider } from './context/UserContext';

interface ErrorBoundaryProps {
  children: ReactNode;
}

const ErrorBoundary = ({ children }: ErrorBoundaryProps) => {
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    const errorHandler = (_event: ErrorEvent) => {
      setHasError(true);
    };
    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  if (hasError) {
    return <h1>Something went wrong. Please refresh the page.</h1>;
  }
  return <>{children}</>;
};

const AppContent = () => {
  
  return (
    <div className="app-content">
      <Navbar/>
      <div className="page-content">
      <Routes>
        <Route path="/login" element={ <Login /> } />
        <Route path="/register" element={<Registration />} />
        <Route
          path="/landing"
          element={
            <PrivateRoute>
              <LandingComponent />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute requireLeague>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/roster"
          element={
            <PrivateRoute requireLeague>
              <RosterComponent />
            </PrivateRoute>
          }
        />
        <Route
          path="/matchups"
          element={
            <PrivateRoute requireLeague>
              <MatchupComponent />
            </PrivateRoute>
          }
        />
        <Route
          path="/waivers"
          element={
            <PrivateRoute requireLeague>
              <WaiversComponent />
            </PrivateRoute>
          }
        />
        <Route
          path="/active-waiver-claims"
          element={
            <PrivateRoute requireLeague>
              <ActiveWaiverClaimsComponent />
            </PrivateRoute>
          }
        />
        <Route
          path="/edit-team-info"
          element={
            <PrivateRoute requireLeague>
              <EditTeamInfoComponent />
            </PrivateRoute>
          }
        />
        <Route
          path="/league-member-schedule"
          element={
            <PrivateRoute requireLeague>
              <LeagueMemberScheduleComponent />
            </PrivateRoute>
          }
        />
        <Route
          path="/league-member-roster"
          element={
            <PrivateRoute requireLeague>
              <ViewLeagueMemberRosterComponent />
            </PrivateRoute>
          }
        />
        <Route
          path="/scoring-rules"
          element={
            <PrivateRoute requireLeague>
              <ScoringRulesDisplayComponent />
            </PrivateRoute>
          }
        />
        <Route
          path="/roster-rules"
          element={
            <PrivateRoute requireLeague>
              <RosterRulesDisplayComponent />
            </PrivateRoute>
          }
        />
        <Route
          path="/waiver-rules"
          element={
            <PrivateRoute requireLeague>
              <WaiverRulesDisplayComponent />
            </PrivateRoute>
          }
        />
        <Route
          path="/create-league"
          element={
            <PrivateRoute>
              <CreateLeagueForm />
            </PrivateRoute>
          }
        />
        <Route
          path="/add-member-to-league"
          element={
            <PrivateRoute requireLeague requireCommissioner>
                <AddMemberToLeagueComponent />
            </PrivateRoute>
          }
        />
        <Route
          path="/add-player-to-team"
          element={
            <PrivateRoute requireLeague requireCommissioner>
              <AddPlayerToTeamComponent />
            </PrivateRoute>
          }
        />
        <Route
          path="/activate-league"
          element={
            <PrivateRoute requireLeague>
              <ActivateLeagueComponent />
            </PrivateRoute>
          }
        />
        <Route
          path="/activity"
          element={
            <PrivateRoute requireLeague>
              <ActivityFeedPage />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="app-wrapper">
      <Router>
        <UserProvider>
          <LeagueProvider>
            <NowProvider>
              <ErrorBoundary>
                <AppContent />
              </ErrorBoundary>
            </NowProvider>
          </LeagueProvider>
        </UserProvider>
      </Router>
    </div>
  );
}

export default App;