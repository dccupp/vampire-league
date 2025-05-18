import React from 'react';
import { NavLink } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import RosterTableComponent from '../RosterTableComponent/RosterTableComponent';
import './Dashboard.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const Dashboard = () => {
  return (
    <div className="dashboard-container animate__animated animate__fadeIn">
      <Container>
        <h3 className="dashboard-title text-center mb-2">Team Name Here</h3>
        <p className="dashboard-subtitle text-center mb-2">Team Record Here</p>
        <p className="dashboard-team-info text-center mb-3">
          <NavLink to="/team-info" className="dashboard-link">Team Info</NavLink> | Team Owner Name |{' '}
          <NavLink to="/budget" className="dashboard-link">Free Agent Budget ($$)</NavLink>
        </p>
        <div className="dashboard-content">
          <h3 className="dashboard-roster-title text-center mb-3">Fantasy Football Roster</h3>
          <RosterTableComponent />
        </div>
      </Container>
    </div>
  );
};

export default Dashboard;