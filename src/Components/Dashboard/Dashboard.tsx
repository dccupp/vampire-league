import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Container, Card, Table } from 'react-bootstrap';
import { isAxiosError } from 'axios';
import axiosInstance from '../../api';
import { CurrentUser, CurrentLeague, LeagueMember, RosteredPlayer } from '../../types';
import './Dashboard.css';
import 'bootstrap/dist/css/bootstrap.min.css';

interface DashboardProps {
  currentUser: CurrentUser;
  currentLeague: CurrentLeague;
}

interface TeamData {
  team_name: string;
  remaining_faab_budget: number | string;
}

const Dashboard = ({ currentUser, currentLeague }: DashboardProps) => {
  const [teamData, setTeamData] = useState<TeamData>({
    team_name: 'Team Name Here',
    remaining_faab_budget: '0',
  });
  const [rosteredPlayers, setRosteredPlayers] = useState<RosteredPlayer[]>([]);
  const [error, setError] = useState<string>('');
  const isLeagueActive = currentLeague?.is_active;

  useEffect(() => {
    const fetchTeamData = async () => {
      if (!currentUser?.id || !currentLeague?.league_id) {
        setError('Missing user or league information.');
        return;
      }
      try {
        const memberResponse = await axiosInstance.get(
          `/league_members/getLeagueMembersByLeagueId/${currentLeague.league_id}`
        );
        const member: LeagueMember | undefined = memberResponse.data.find(
          (m: LeagueMember) => m.user_id === currentUser.id
        );
        if (member) {
          setTeamData({
            team_name: member.team_name || 'Team Name Here',
            remaining_faab_budget:
              member.remaining_faab_budget !== null ? member.remaining_faab_budget : '0',
          });
          const rosterResponse = await axiosInstance.get(
            `/rostered_players/getRosteredPlayersByLeagueMemberId/${member.id}`
          );
          setRosteredPlayers(rosterResponse.data);
        } else {
          setError('You are not a member of this league.');
        }
      } catch (err: unknown) {
        const msg = isAxiosError(err)
          ? err.response?.data?.message || err.message
          : err instanceof Error ? err.message : 'Unknown error';
        console.error('Error fetching team data:', err);
        setError(`Failed to load team information: ${msg}`);
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
            <Card.Subtitle className="dashboard-subtitle text-center mb-3">Team Record: N/A</Card.Subtitle>
            <div className="dashboard-team-info text-center">
              <NavLink to="/edit-team-info" className="dashboard-link me-3">Edit Team Info</NavLink>
              <span className="team-info-divider">|</span>
              <span className="team-owner ms-3 me-3">
                Team Owner: {currentUser?.first_name} {currentUser?.last_name || 'Team Owner Name'}
              </span>
              <span className="team-info-divider">|</span>
              <span className="dashboard-link ms-3">
                Free Agent Budget (${teamData.remaining_faab_budget})
              </span>
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
                    {rosteredPlayers.length > 0 ? (
                      rosteredPlayers.map(player => (
                        <tr key={player.player_id}>
                          <td>{player.player_name}</td>
                          <td>{player.position}</td>
                          <td>{player.season_points ?? 'N/A'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3}>No players rostered yet.</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
                <Card.Text>
                  League Status: Active<br />
                  Next Match: N/A<br />
                  Current Standing: N/A
                </Card.Text>
              </Card.Body>
            </Card>
          ) : (
            <Card className="mb-4">
              <Card.Body>
                <Card.Title>League Not Active</Card.Title>
                <Card.Text>
                  This league is not yet active. Once it becomes active, you will have full access
                  to all league features, including roster management, waivers, and scoring details.
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