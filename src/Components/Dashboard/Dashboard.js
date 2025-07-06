import React from 'react';
import { NavLink } from 'react-router-dom';
import { Container, Card, Table } from 'react-bootstrap';
import './Dashboard.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const Dashboard = ({ teamRoster, rosterStructure, currentUser, teamInfo, currentLeague }) => {
  const isLeagueActive = currentLeague?.is_active;

  return (
    <div className="dashboard-container animate__animated animate__fadeIn">
      <Container>
        <h3 className="dashboard-title text-center mb-2">{teamInfo?.name || 'Team Name Here'}</h3>
        <p className="dashboard-subtitle text-center mb-2">{teamInfo?.record || 'Team Record Here'}</p>
        <p className="dashboard-team-info text-center mb-3">
          <NavLink to="/team-info" className="dashboard-link">Team Info</NavLink> | {currentUser?.name || 'Team Owner Name'} |{' '}
          <NavLink to="/budget" className="dashboard-link">Free Agent Budget (${teamInfo?.budget || '$$'})</NavLink>
        </p>
        <div className="dashboard-content">
          {isLeagueActive ? (
            <Card className="mb-4">
              <Card.Body>
                <Card.Title>Active League Overview</Card.Title>
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Player</th>
                      <th>Position</th>
                      <th>Points (Season)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>John Doe</td>
                      <td>QB</td>
                      <td>150</td>
                    </tr>
                    <tr>
                      <td>Jane Smith</td>
                      <td>RB</td>
                      <td>120</td>
                    </tr>
                    <tr>
                      <td>Mike Johnson</td>
                      <td>WR</td>
                      <td>100</td>
                    </tr>
                  </tbody>
                </Table>
                <Card.Text>
                  League Status: Active<br />
                  Next Match: Week 5 vs. Team Awesome<br />
                  Current Standing: 3rd
                </Card.Text>
              </Card.Body>
            </Card>
          ) : (
            <Card className="mb-4">
              <Card.Body>
                <Card.Title>League Not Active</Card.Title>
                <Card.Text>
                  This league is not yet active. Once it becomes active, you will have full access to all league features, including roster management, waivers, and scoring details.
                </Card.Text>
              </Card.Body>
            </Card>
          )}
        </div>
      </Container>
    </div>
  );
};

export default Dashboard;