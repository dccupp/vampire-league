import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { useUser } from '../../context/UserContext';
import { useLeague } from '../../context/LeagueContext';
import './Navbar.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const NavBar = () => {
  const { currentUser, setCurrentUser } = useUser();
  const { currentLeague, setCurrentLeague, isCommissioner } = useLeague();
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

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'nav-link-custom active' : 'nav-link-custom';

  const dropdownItemClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'dropdown-item active' : 'dropdown-item';

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
                <Nav.Link as={NavLink} to="/dashboard" className={navLinkClass as any}>
                  Dashboard
                </Nav.Link>
                {isLeagueActive && (
                  <>
                    <Nav.Link as={NavLink} to="/roster" className={navLinkClass as any}>
                      Roster
                    </Nav.Link>
                    <Nav.Link as={NavLink} to="/matchups" className={navLinkClass as any}>
                      Matchups
                    </Nav.Link>
                    <Nav.Link as={NavLink} to="/league-member-schedule" className={navLinkClass as any}>
                      Schedule
                    </Nav.Link>
                    <NavDropdown title="Waivers" id="waivers-dropdown" className="nav-link-custom">
                      <NavDropdown.Item as={NavLink} to="/waivers" className={dropdownItemClass as any}>
                        Waivers
                      </NavDropdown.Item>
                      <NavDropdown.Item as={NavLink} to="/active-waiver-claims" className={dropdownItemClass as any}>
                        Active Waiver Claims
                      </NavDropdown.Item>
                    </NavDropdown>
                    <NavDropdown title="League Info" id="league-info-dropdown" className="nav-link-custom">
                      <NavDropdown.Item as={NavLink} to="/activity" className={dropdownItemClass as any}>
                        Recent Activity
                      </NavDropdown.Item>
                      <NavDropdown.Divider />
                      <NavDropdown.Item as={NavLink} to="/league-member-roster" className={dropdownItemClass as any}>
                        View League Rosters
                      </NavDropdown.Item>
                      <NavDropdown.Item as={NavLink} to="/scoring-rules" className={dropdownItemClass as any}>
                        Scoring Rules
                      </NavDropdown.Item>
                      <NavDropdown.Item as={NavLink} to="/roster-rules" className={dropdownItemClass as any}>
                        Roster Rules
                      </NavDropdown.Item>
                      <NavDropdown.Item as={NavLink} to="/waiver-rules" className={dropdownItemClass as any}>
                        Waiver Rules
                      </NavDropdown.Item>
                    </NavDropdown>
                  </>
                )}
                {isCommissioner && (
                  <NavDropdown title="LM Tools" id="lm-tools-dropdown" className="nav-link-custom">
                    <NavDropdown.Item as={NavLink} to="/add-member-to-league" className={dropdownItemClass as any}>
                      Add Member to League
                    </NavDropdown.Item>
                    <NavDropdown.Item as={NavLink} to="/add-player-to-team" className={dropdownItemClass as any}>
                      Add Player to Team
                    </NavDropdown.Item>
                    <NavDropdown.Item as={NavLink} to="/activate-league" className={dropdownItemClass as any}>
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