import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Container, Card, Table } from 'react-bootstrap';
import axios from 'axios';
import './Dashboard.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const Dashboard = ({ teamRoster, rosterStructure, currentUser, teamInfo, currentLeague }) => {
  const [teamData, setTeamData] = useState({
    team_name: 'Team Name Here',
    remaining_faab_budget: '$$',
  });
  const [error, setError] = useState('');
  const isLeagueActive = currentLeague?.is_active;

  // Fetch team data from league_members
  useEffect(() => {
    const fetchTeamData = async () => {
      if (currentUser?.id && currentLeague?.league_id) {
        try {
          const response = await axios.get(`http://localhost:3000/league_members/getLeagueMembersByLeagueId/${currentLeague.league_id}`);
          const member = response.data.find(m => m.user_id === currentUser.id);
          if (member) {
            setTeamData({
              team_name: member.team_name || 'Team Name Here',
              remaining_faab_budget: member.remaining_faab_budget !== null ? member.remaining_faab_budget : '0',
            });
          } else {
            setError('You are not a member of this league.');
          }
        } catch (error) {
          console.error('Error fetching team data:', error.response || error);
          setError(`Failed to load team information: ${error.response?.data?.message || error.message}`);
        }
      } else {
        setError('Missing user or league information.');
      }
    };
    fetchTeamData();
  }, [currentUser, currentLeague]);

  return (
    <div className="dashboard-container animate__animated animate__fadeIn">
      <Container>
        {error && (
          <div className="alert alert-danger text-center" role="alert">
            {error}
          </div>
        )}
        <Card className="mb-4 team-info-card">
          <Card.Body>
            <Card.Title className="dashboard-title text-center mb-3">{teamData.team_name}</Card.Title>
            <Card.Subtitle className="dashboard-subtitle text-center mb-3">{teamInfo?.record || 'Team Record Here'}</Card.Subtitle>
            <div className="dashboard-team-info text-center">
              <NavLink to="/edit-team-info" className="dashboard-link me-3">Edit Team Info</NavLink>
              <span className="team-info-divider">|</span>
              <span className="team-owner ms-3 me-3">Team Owner: {currentUser?.first_name} {currentUser?.last_name || 'Team Owner Name'}</span>
              <span className="team-info-divider">|</span>
              <NavLink to="/budget" className="dashboard-link ms-3">Free Agent Budget (${teamData.remaining_faab_budget})</NavLink>
            </div>
          </Card.Body>
        </Card>
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