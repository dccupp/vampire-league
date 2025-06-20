import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container } from 'react-bootstrap';
import './Navbar.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const NavBar = ({ currentUser, setCurrentUser }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('user'));
  const navigate = useNavigate();

  useEffect(() => {
    // Sync isLoggedIn with currentUser from App.js
    setIsLoggedIn(!!currentUser);
  }, [currentUser]);

  const handleLogout = () => {
    console.log('NavBar: Logging out');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setCurrentUser(null);
    navigate('/login');
  };

  return (
    <Navbar expand="lg" className="navbar-custom animate__animated animate__fadeIn" variant="dark">
      <Container>
        <NavLink className="navbar-brand-custom" to={isLoggedIn ? "/dashboard" : "/login"}>
          Vampire Football
        </NavLink>
        <Navbar.Toggle aria-controls="navbarNav" />
        <Navbar.Collapse id="navbarNav">
          <Nav className="ms-auto">
            {isLoggedIn ? (
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
                <Nav.Link
                  as={NavLink}
                  to="/trade"
                  className={({ isActive }) => (isActive ? 'nav-link-custom active' : 'nav-link-custom')}
                >
                  Trade
                </Nav.Link>
                <Nav.Link
                  as={NavLink}
                  to="/waivers"
                  className={({ isActive }) => (isActive ? 'nav-link-custom active' : 'nav-link-custom')}
                >
                  Waivers
                </Nav.Link>
                <Nav.Link onClick={handleLogout} className="nav-link-custom">
                  Logout
                </Nav.Link>
              </>
            ) : (
              <Nav.Link
                as={NavLink}
                to="/login"
                className={({ isActive }) => (isActive ? 'nav-link-custom active' : 'nav-link-custom')}
              >
                Login
              </Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavBar;