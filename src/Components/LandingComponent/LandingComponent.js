import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Modal, Button } from 'react-bootstrap';
import './LandingComponent.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const LandingComponent = ({ currentUser, setCurrentLeague }) => {
  const [leagues, setLeagues] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Fetch user's league memberships
  useEffect(() => {
    if (currentUser?.id) {
      const fetchLeagues = async () => {
        try {
          console.log('Fetching leagues for user_id:', currentUser.id);
          const response = await axios.get(`http://localhost/vampire_project/vamp_api/league_members/getLeagueMembersByUserId/${currentUser.id}`);
          console.log('GET /league_members/getLeagueMembersByUserId response:', response.data);
          const memberships = Array.isArray(response.data) ? response.data : [];
          setLeagues(memberships.filter(m => m.role === 'player' || m.role === 'commish'));
          setInvitations(memberships.filter(m => m.role === 'invited'));
          setError(''); // Clear error on success
        } catch (err) {
          console.error('Error fetching league memberships:', {
            message: err.message,
            status: err.response?.status,
            data: err.response?.data
          });
          if (err.response?.status === 404) {
            setLeagues([]);
            setInvitations([]);
            setError(''); // No memberships is not an error
          } else {
            setError(err.response?.data?.message || 'Failed to load leagues. Please try again.');
          }
        }
      };
      fetchLeagues();
    } else {
      console.warn('No currentUser.id available');
      setError('User not logged in. Please log in to view leagues.');
      setLeagues([]);
    }
  }, [currentUser]);

  // Handle league selection
  const handleSelectLeague = (league) => {
    const selectedLeague = {
      league_id: league.league_id,
      name: league.name,
      role: league.role
    };
    localStorage.setItem('league', JSON.stringify(selectedLeague));
    setCurrentLeague(selectedLeague);
    navigate('/dashboard');
  };

  // Handle opening the modal
  const handleOpenModal = (league) => {
    setSelectedInvite(league);
    setShowModal(true);
  };

  // Handle closing the modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedInvite(null);
  };

  // Handle accepting or declining an invite
  const handleInviteAction = async (action) => {
    if (!selectedInvite) return;
    try {
      const role = action === 'accept' ? 'member' : 'declined';
      const response = await axios.put(`http://localhost/vampire_project/vamp_api/league_members/updateRole/${selectedInvite.league_id}/${currentUser.id}`, { role });
      console.log(`PUT /league_members/updateRole/${selectedInvite.league_id}/${currentUser.id} response:`, response.data);
      if (response.data.status === 'success') {
        // Update local state
        if (action === 'accept') {
          const updatedLeagues = [...leagues, { ...selectedInvite, role: 'member' }];
          setLeagues(updatedLeagues);
          setInvitations(invitations.filter(i => i.league_id !== selectedInvite.league_id));
        } else {
          setInvitations(invitations.filter(i => i.league_id !== selectedInvite.league_id));
        }
        handleCloseModal();
      } else {
        setError(response.data.message || 'Failed to process invitation');
      }
    } catch (err) {
      console.error(`Error processing ${action} invite:`, {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      });
      setError(err.response?.data?.message || `Failed to ${action} invitation`);
    }
  };

  return (
    <div className="landing-container">
      <div className="landing-content animate__animated animate__fadeIn">
        <h3 className="text-center mb-4">Welcome, {currentUser?.first_name || 'User'}!</h3>
        {error && <p className="text-danger text-center">{error}</p>}

        <div className="section mb-4">
          <h4>Your Leagues</h4>
          {leagues.length > 0 ? (
            <ul className="league-list">
              {leagues.map((league) => (
                <li key={league.league_id} className="league-item">
                  <span
                    className="league-link"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSelectLeague(league)}
                  >
                    {league.name} ({league.role === 'commish' ? 'Commissioner' : 'Member'})
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-data">You are not a member of any leagues yet.</p>
          )}
        </div>

        <div className="section mb-4">
          <h4>League Invitations</h4>
          {invitations.length > 0 ? (
            <ul className="league-list">
              {invitations.map((invitation) => (
                <li key={invitation.league_id} className="league-item">
                  <span
                    className="league-link"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleOpenModal(invitation)}
                  >
                    {invitation.name}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-data">No pending invitations.</p>
          )}
        </div>

        {currentUser?.email_address === 'dccupp@gmail.com' && (
          <div className="section">
            <h4>Create a New League</h4>
            <Link
              to="/create-league"
              state={{ currentUser }}
              className="btn btn-success w-100"
            >
              Create League
            </Link>
          </div>
        )}

        {/* Bootstrap Modal for Invite Actions */}
        <Modal show={showModal} onHide={handleCloseModal} centered>
          <Modal.Header closeButton>
            <Modal.Title>League Invitation</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedInvite ? (
              <p>Do you want to accept or decline the invitation to join <strong>{selectedInvite.name}</strong>?</p>
            ) : (
              <p>No invitation selected.</p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="success" onClick={() => handleInviteAction('accept')}>
              Accept
            </Button>
            <Button variant="danger" onClick={() => handleInviteAction('decline')}>
              Decline
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default LandingComponent;