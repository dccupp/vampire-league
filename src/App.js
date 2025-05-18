import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Login from './Components/Login/Login';
import Registration from './Components/Registration/Registration';
import Dashboard from './Components/Dashboard/Dashboard';
import RosterTableComponent from './Components/RosterTableComponent/RosterTableComponent';
import PrivateRoute from './Components/PrivateRoute/PrivateRoute';
import Layout from './Components/Layout/Layout';

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
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/roster"
              element={
                <PrivateRoute>
                  <RosterTableComponent />
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