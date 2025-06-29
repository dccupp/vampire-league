import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import './Navbar.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const NavBar = ({ currentUser, setCurrentUser, currentLeague, setCurrentLeague }) => {
  const navigate = useNavigate();
  const isLoggedIn = !!currentUser;
  const hasSelectedLeague = !!currentLeague;

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
            {isLoggedIn && (
              <>
                {hasSelectedLeague && (
                  <>
                    <Nav.Link
                      as={NavLink}
                      to="/landing"
                      className={({ isActive }) => (isActive ? 'nav-link-custom active' : 'nav-link-custom')}
                    >
                      Landing
                    </Nav.Link>
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
                <Nav.Link onClick={handleLogout} className="nav-link-custom">
                  Logout
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavBar;