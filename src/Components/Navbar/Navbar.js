import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import axios from 'axios';
import './Navbar.css';
import 'bootstrap/dist/css/bootstrap.min.css';

// Configure Axios instance to avoid global baseURL overrides
const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000'
});

const NavBar = ({ currentUser, setCurrentUser, currentLeague, setCurrentLeague }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = !!currentUser;
  const hasSelectedLeague = !!currentLeague;
  const isLeagueActive = currentLeague?.is_active;
  const [isCommissioner, setIsCommissioner] = useState(false);

  useEffect(() => {
    console.log('NavBar: Evaluating navigation conditions:', {
      isLoggedIn,
      hasSelectedLeague,
      isLeagueActive,
      currentLeague: {
        league_id: currentLeague?.league_id,
        name: currentLeague?.name,
        role: currentLeague?.role,
        is_active: currentLeague?.is_active
      },
      location: location.pathname
    });

    const checkCommissionerStatus = async () => {
      if (isLoggedIn && hasSelectedLeague && currentUser?.id && currentLeague?.league_id) {
        console.log(`NavBar: Checking commissioner status for user ${currentUser.id} via /league_members/getLeagueMembersByUserId/${currentUser.id}`);
        try {
          const response = await axiosInstance.get(`/league_members/getLeagueMembersByUserId/${currentUser.id}`);
          console.log('NavBar: Response from getLeagueMembersByUserId:', {
            status: response.status,
            data: response.data
          });
          const membership = response.data.find(m => m.league_id === currentLeague.league_id);
          const isCommish = membership && membership.role === 'commish';
          setIsCommissioner(isCommish);
          console.log(`NavBar: Commissioner check result - isCommissioner: ${isCommish}, membership:`, membership);
        } catch (error) {
          console.error('NavBar: Error checking commissioner status:', error);
          console.log('NavBar: Detailed error info:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
            requestUrl: error.config?.url,
            baseURL: error.config?.baseURL
          });
          setIsCommissioner(false);
          console.log('NavBar: Commissioner check failed, setting isCommissioner to false');
        }
      } else {
        setIsCommissioner(false);
        console.log('NavBar: Commissioner check skipped - prerequisites not met:', {
          isLoggedIn,
          hasSelectedLeague,
          userId: currentUser?.id,
          leagueId: currentLeague?.league_id
        });
      }
    };
    checkCommissionerStatus();
  }, [isLoggedIn, hasSelectedLeague, currentUser, currentLeague]);

  const handleLogout = () => {
    console.log('NavBar: Logging out');
    localStorage.removeItem('user');
    localStorage.removeItem('league');
    setCurrentUser(null);
    setCurrentLeague(null);
    navigate('/login');
  };

  return (
    <Navbar expand="lg" className="navbar-custom animate__animated animate__fadeIn" variant="dark">
      <Container>
        <NavLink className="navbar-brand-custom" to={isLoggedIn ? "/landing" : "/login"}>
          Vampire Football
        </NavLink>
        <Navbar.Toggle aria-controls="navbarNav" />
        <Navbar.Collapse id="navbarNav">
          <Nav className="ms-auto">
            {isLoggedIn && hasSelectedLeague && (
              <Nav.Link
                as={NavLink}
                to="/landing"
                className={({ isActive }) => (isActive ? 'nav-link-custom active' : 'nav-link-custom')}
              >
                Landing
              </Nav.Link>
            )}
            {isLoggedIn && hasSelectedLeague && isLeagueActive && (
              <>
                <Nav.Link
                  as={NavLink}
                  to="/dashboard"
                  className={({ isActive }) => (isActive ? 'nav-link-custom active' : 'nav-link-custom')}
                >
                  Dashboard
                </Nav.Link>
                <Nav.Link
                  as={NavLink}
                  to="/roster"
                  className={({ isActive }) => (isActive ? 'nav-link-custom active' : 'nav-link-custom')}
                >
                  Roster
                </Nav.Link>
                {/* <Nav.Link
                  as={NavLink}
                  to="/trade"
                  className={({ isActive }) => (isActive ? 'nav-link-custom active' : 'nav-link-custom')}
                >
                  Trade
                </Nav.Link> */}
                <Nav.Link
                  as={NavLink}
                  to="/waivers"
                  className={({ isActive }) => (isActive ? 'nav-link-custom active' : 'nav-link-custom')}
                >
                  Waivers
                </Nav.Link>
                <NavDropdown
                  title="League"
                  id="league-dropdown"
                  className="nav-link-custom"
                >
                  <NavDropdown.Item
                    as={NavLink}
                    to="/scoring-rules"
                    className={({ isActive }) => (isActive ? 'dropdown-item active' : 'dropdown-item')}
                  >
                    Scoring Rules
                  </NavDropdown.Item>
                  <NavDropdown.Item
                    as={NavLink}
                    to="/roster-rules"
                    className={({ isActive }) => (isActive ? 'dropdown-item active' : 'dropdown-item')}
                  >
                    Roster Rules
                  </NavDropdown.Item>
                </NavDropdown>
              </>
            )}
            {isLoggedIn && hasSelectedLeague && isCommissioner && (
              <NavDropdown
                title="LM Tools"
                id="lm-tools-dropdown"
                className="nav-link-custom"
              >
                <NavDropdown.Item
                  as={NavLink}
                  to="/lm-tools"
                  className={({ isActive }) => (isActive ? 'dropdown-item active' : 'dropdown-item')}
                >
                  LM Tools
                </NavDropdown.Item>
                <NavDropdown.Item
                  as={NavLink}
                  to="/add-team-roster"
                  className={({ isActive }) => (isActive ? 'dropdown-item active' : 'dropdown-item')}
                >
                  Add Team Roster
                </NavDropdown.Item>
                <NavDropdown.Item
                  as={NavLink}
                  to="/add-member-to-league"
                  className={({ isActive }) => (isActive ? 'dropdown-item active' : 'dropdown-item')}
                >
                  Add Member to League
                </NavDropdown.Item>
              </NavDropdown>
            )}
            {isLoggedIn && location.pathname !== '/register' && (
              <Nav.Link onClick={handleLogout} className="nav-link-custom">
                Logout
              </Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavBar;