import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import './Navbar.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const NavBar = ({ currentUser, setCurrentUser, currentLeague, setCurrentLeague, isCommissioner }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = !!currentUser;
  const hasSelectedLeague = !!currentLeague;
  const isLeagueActive = currentLeague?.is_active;

  const handleLogout = () => {
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
              <>
                <Nav.Link
                  as={NavLink}
                  to="/dashboard"
                  className={({ isActive }) => (isActive ? 'nav-link-custom active' : 'nav-link-custom')}
                >
                  Dashboard
                </Nav.Link>
                {isLeagueActive && (
                  <>
                    <Nav.Link
                      as={NavLink}
                      to="/roster"
                      className={({ isActive }) => (isActive ? 'nav-link-custom active' : 'nav-link-custom')}
                    >
                      Roster
                    </Nav.Link>
                    <Nav.Link
                      as={NavLink}
                      to="/matchups"
                      className={({ isActive }) => (isActive ? 'nav-link-custom active' : 'nav-link-custom')}
                    >
                      Matchups
                    </Nav.Link>
                                        <Nav.Link
                      as={NavLink}
                      to="/league-member-schedule"
                      className={({ isActive }) => (isActive ? 'nav-link-custom active' : 'nav-link-custom')}
                    >
                      Schedule
                    </Nav.Link>
                    <NavDropdown
                      title="Waivers"
                      id="waivers-dropdown"
                      className="nav-link-custom"
                    >
                      <NavDropdown.Item
                        as={NavLink}
                        to="/waivers"
                        className={({ isActive }) => (isActive ? 'dropdown-item active' : 'dropdown-item')}
                      >
                        Waivers
                      </NavDropdown.Item>
                      <NavDropdown.Item
                        as={NavLink}
                        to="/active-waiver-claims"
                        className={({ isActive }) => (isActive ? 'dropdown-item active' : 'dropdown-item')}
                      >
                        Active Waiver Claims
                      </NavDropdown.Item>
                      {/* <NavDropdown.Item
                        as={NavLink}
                        to="/manage-waiver-priority"
                        className={({ isActive }) => (isActive ? 'dropdown-item active' : 'dropdown-item')}
                      >
                        Waiver Priority
                      </NavDropdown.Item> */}
                    </NavDropdown>
                    {/* <Nav.Link
                      as={NavLink}
                      to="/edit-team-info"
                      className={({ isActive }) => (isActive ? 'nav-link-custom active' : 'nav-link-custom')}
                    >
                      Edit Team Info
                    </Nav.Link> */}
                    <NavDropdown
                      title="League Info"
                      id="league-info-dropdown"
                      className="nav-link-custom"
                    >
                      <NavDropdown.Item
                        as={NavLink}
                        to="/league-member-roster"
                        className={({ isActive }) => (isActive ? 'dropdown-item active' : 'dropdown-item')}
                      >
                        View League Rosters
                      </NavDropdown.Item>
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
                      <NavDropdown.Item
                        as={NavLink}
                        to="/waiver-rules"
                        className={({ isActive }) => (isActive ? 'dropdown-item active' : 'dropdown-item')}
                      >
                        Waiver Rules
                      </NavDropdown.Item>
                    </NavDropdown>
                  </>
                )}
                {isCommissioner && (
                  <NavDropdown
                    title="LM Tools"
                    id="lm-tools-dropdown"
                    className="nav-link-custom"
                  >
                    <NavDropdown.Item
                      as={NavLink}
                      to="/add-member-to-league"
                      className={({ isActive }) => (isActive ? 'dropdown-item active' : 'dropdown-item')}
                    >
                      Add Member to League
                    </NavDropdown.Item>
                    <NavDropdown.Item
                      as={NavLink}
                      to="/add-player-to-team"
                      className={({ isActive }) => (isActive ? 'dropdown-item active' : 'dropdown-item')}
                    >
                      Add Player to Team
                    </NavDropdown.Item>
                    <NavDropdown.Item
                      as={NavLink}
                      to="/activate-league"
                      className={({ isActive }) => (isActive ? 'dropdown-item active' : 'dropdown-item')}
                    >
                      Activate League
                    </NavDropdown.Item>
                  </NavDropdown>
                )}
              </>
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