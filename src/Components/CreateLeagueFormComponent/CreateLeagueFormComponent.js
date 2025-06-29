import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './CreateLeagueFormComponent.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const CreateLeagueFormComponent = ({ currentUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const effectiveUser = currentUser || location.state?.currentUser; // Fallback to location.state.currentUser
  console.log('CreateLeagueFormComponent effectiveUser:', effectiveUser);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    leagueName: '',
    division1Name: '',
    division2Name: '',
    regular_roster_type_id: '1', // Hard-coded to Regular
    regular_quarterback_count: '1',
    regular_running_back_count: '2',
    regular_wide_receiver_count: '2',
    regular_tight_end_count: '1',
    regular_wide_receiver_tight_end_count: '0',
    regular_flex_count: '1',
    regular_bench_count: '6',
    regular_ir_count: '2',
    regular_max_roster_size: '13',
    regular_max_qb_count: '4',
    regular_max_rb_count: '8',
    regular_max_wr_count: '8',
    regular_max_te_count: '4',
    vampire_roster_type_id: '2', // Hard-coded to Vampire
    vampire_quarterback_count: '1',
    vampire_running_back_count: '2',
    vampire_wide_receiver_count: '2',
    vampire_tight_end_count: '1',
    vampire_wide_receiver_tight_end_count: '0',
    vampire_flex_count: '1',
    vampire_bench_count: '6',
    vampire_ir_count: '2',
    vampire_max_roster_size: '13',
    vampire_max_qb_count: '4',
    vampire_max_rb_count: '8',
    vampire_max_wr_count: '8',
    vampire_max_te_count: '4',
    passing_yards: '0.04',
    passing_touchdowns: '4',
    interceptions_thrown: '-2',
    two_point_pass: '1',
    passing_300_399: '5',
    passing_400_plus: '10',
    rushing_yards: '0.1',
    rushing_touchdowns: '6',
    two_point_rush: '2',
    rushing_100_199: '5',
    rushing_200_plus: '10',
    receiving_yards: '0.1',
    receptions: '1',
    receiving_touchdowns: '6',
    two_point_reception: '2',
    receiving_100_199: '5',
    receiving_200_plus: '10',
    kickoff_return_touchdown: '6',
    punt_return_touchdown: '6',
    fumble_recovered_touchdown: '6',
    fumbles_lost: '-2',
    interception_return_touchdown: '6',
    fumble_return_touchdown: '6',
    blocked_return_touchdown: '6',
    two_point_return: '2',
    one_point_safety: '2'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateRosterRules = (prefix) => {
    const activeCounts = [
      parseInt(formData[`${prefix}_quarterback_count`]) || 0,
      parseInt(formData[`${prefix}_running_back_count`]) || 0,
      parseInt(formData[`${prefix}_wide_receiver_count`]) || 0,
      parseInt(formData[`${prefix}_tight_end_count`]) || 0,
      parseInt(formData[`${prefix}_wide_receiver_tight_end_count`]) || 0,
      parseInt(formData[`${prefix}_flex_count`]) || 0,
      parseInt(formData[`${prefix}_bench_count`]) || 0
    ];
    const maxCounts = [
      parseInt(formData[`${prefix}_max_qb_count`]) || 0,
      parseInt(formData[`${prefix}_max_rb_count`]) || 0,
      parseInt(formData[`${prefix}_max_wr_count`]) || 0,
      parseInt(formData[`${prefix}_max_te_count`]) || 0
    ];
    const irCount = parseInt(formData[`${prefix}_ir_count`]) || 0;
    const totalActive = activeCounts.reduce((sum, count) => sum + count, 0);
    const maxRosterSize = parseInt(formData[`${prefix}_max_roster_size`]) || 0;
    if (maxRosterSize < 1) {
      setError('Max roster size must be at least 1');
      return false;
    }
    if (totalActive > maxRosterSize) {
      setError('Total active position counts and bench must not exceed max roster size');
      return false;
    }
    if (activeCounts.some(count => count < 0) || maxCounts.some(count => count < 0) || irCount < 0) {
      setError('Position counts cannot be negative');
      return false;
    }
    if (parseInt(formData[`${prefix}_quarterback_count`]) > parseInt(formData[`${prefix}_max_qb_count`])) {
      setError('Quarterback count cannot exceed max QB count');
      return false;
    }
    if (parseInt(formData[`${prefix}_running_back_count`]) > parseInt(formData[`${prefix}_max_rb_count`])) {
      setError('Running back count cannot exceed max RB count');
      return false;
    }
    if (parseInt(formData[`${prefix}_wide_receiver_count`]) > parseInt(formData[`${prefix}_max_wr_count`])) {
      setError('Wide receiver count cannot exceed max WR count');
      return false;
    }
    if (parseInt(formData[`${prefix}_tight_end_count`]) > parseInt(formData[`${prefix}_max_te_count`])) {
      setError('Tight end count cannot exceed max TE count');
      return false;
    }
    return true;
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.leagueName || !formData.division1Name || !formData.division2Name) {
        setError('Please fill in all fields');
        return false;
      }
      if (formData.division1Name === formData.division2Name) {
        setError('Division names must be unique');
        return false;
      }
    } else if (step === 2) {
      return validateRosterRules('regular');
    } else if (step === 3) {
      return validateRosterRules('vampire');
    } else if (step === 4) {
      const scoringFields = [
        'passing_yards', 'passing_touchdowns', 'interceptions_thrown', 'two_point_pass',
        'passing_300_399', 'passing_400_plus', 'rushing_yards', 'rushing_touchdowns',
        'two_point_rush', 'rushing_100_199', 'rushing_200_plus', 'receiving_yards',
        'receptions', 'receiving_touchdowns', 'two_point_reception', 'receiving_100_199',
        'receiving_200_plus', 'kickoff_return_touchdown', 'punt_return_touchdown',
        'fumble_recovered_touchdown', 'fumbles_lost', 'interception_return_touchdown',
        'fumble_return_touchdown', 'blocked_return_touchdown', 'two_point_return',
        'one_point_safety'
      ];
      for (const field of scoringFields) {
        if (formData[field] === '' || isNaN(parseFloat(formData[field]))) {
          setError('All scoring fields must be valid numbers');
          return false;
        }
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setError('');
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep()) {
      return;
    }
    if (!effectiveUser || !effectiveUser.id) {
      setError('User information is missing. Please log in.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      // Create league
      const leagueBody = {
        name: formData.leagueName,
        is_active: 0
      };
      console.log('POST /leagues/create request body:', leagueBody);
      const leagueResponse = await axios.post('http://localhost/vampire_project/vamp_api/leagues/create', leagueBody);
      console.log('POST /leagues/create response:', leagueResponse.data);
      if (leagueResponse.data.status !== 'success') {
        throw new Error(leagueResponse.data.message);
      }
      const leagueId = leagueResponse.data.league_id;

      // Create division 1
      const division1Body = {
        league_id: leagueId,
        name: formData.division1Name
      };
      console.log('POST /league_divisions/create (Division 1) request body:', division1Body);
      const division1Response = await axios.post('http://localhost/vampire_project/vamp_api/league_divisions/create', division1Body);
      console.log('POST /league_divisions/create (Division 1) response:', division1Response.data);
      if (division1Response.data.status !== 'success') {
        throw new Error('Failed to create division 1');
      }

      // Create division 2
      const division2Body = {
        league_id: leagueId,
        name: formData.division2Name
      };
      console.log('POST /league_divisions/create (Division 2) request body:', division2Body);
      const division2Response = await axios.post('http://localhost/vampire_project/vamp_api/league_divisions/create', division2Body);
      console.log('POST /league_divisions/create (Division 2) response:', division2Response.data);
      if (division2Response.data.status !== 'success') {
        throw new Error('Failed to create division 2');
      }

      // Create Regular roster rules
      const regularRosterBody = {
        league_id: leagueId,
        roster_type_id: parseInt(formData.regular_roster_type_id),
        quarterback_count: parseInt(formData.regular_quarterback_count),
        running_back_count: parseInt(formData.regular_running_back_count),
        wide_receiver_count: parseInt(formData.regular_wide_receiver_count),
        tight_end_count: parseInt(formData.regular_tight_end_count),
        wide_receiver_tight_end_count: parseInt(formData.regular_wide_receiver_tight_end_count),
        flex_count: parseInt(formData.regular_flex_count),
        bench_count: parseInt(formData.regular_bench_count),
        ir_count: parseInt(formData.regular_ir_count),
        max_roster_size: parseInt(formData.regular_max_roster_size),
        max_qb_count: parseInt(formData.regular_max_qb_count),
        max_rb_count: parseInt(formData.regular_max_rb_count),
        max_wr_count: parseInt(formData.regular_max_wr_count),
        max_te_count: parseInt(formData.regular_max_te_count)
      };
      console.log('POST /roster_rules/create (Regular) request body:', regularRosterBody);
      const regularRosterResponse = await axios.post('http://localhost/vampire_project/vamp_api/roster_rules/create', regularRosterBody);
      console.log('POST /roster_rules/create (Regular) response:', regularRosterResponse.data);
      if (regularRosterResponse.data.status !== 'success') {
        throw new Error(regularRosterResponse.data.message);
      }

      // Create Vampire roster rules
      const vampireRosterBody = {
        league_id: leagueId,
        roster_type_id: parseInt(formData.vampire_roster_type_id),
        quarterback_count: parseInt(formData.vampire_quarterback_count),
        running_back_count: parseInt(formData.vampire_running_back_count),
        wide_receiver_count: parseInt(formData.vampire_wide_receiver_count),
        tight_end_count: parseInt(formData.vampire_tight_end_count),
        wide_receiver_tight_end_count: parseInt(formData.vampire_wide_receiver_tight_end_count),
        flex_count: parseInt(formData.vampire_flex_count),
        bench_count: parseInt(formData.vampire_bench_count),
        ir_count: parseInt(formData.vampire_ir_count),
        max_roster_size: parseInt(formData.vampire_max_roster_size),
        max_qb_count: parseInt(formData.vampire_max_qb_count),
        max_rb_count: parseInt(formData.vampire_max_rb_count),
        max_wr_count: parseInt(formData.vampire_max_wr_count),
        max_te_count: parseInt(formData.vampire_max_te_count)
      };
      console.log('POST /roster_rules/create (Vampire) request body:', vampireRosterBody);
      const vampireRosterResponse = await axios.post('http://localhost/vampire_project/vamp_api/roster_rules/create', vampireRosterBody);
      console.log('POST /roster_rules/create (Vampire) response:', vampireRosterResponse.data);
      if (vampireRosterResponse.data.status !== 'success') {
        throw new Error(vampireRosterResponse.data.message);
      }

      // Create scoring rules
      const scoringBody = {
        league_id: leagueId,
        passing_yards: parseFloat(formData.passing_yards),
        passing_touchdowns: parseInt(formData.passing_touchdowns),
        interceptions_thrown: parseInt(formData.interceptions_thrown),
        two_point_pass: parseInt(formData.two_point_pass),
        passing_300_399: parseInt(formData.passing_300_399),
        passing_400_plus: parseInt(formData.passing_400_plus),
        rushing_yards: parseFloat(formData.rushing_yards),
        rushing_touchdowns: parseInt(formData.rushing_touchdowns),
        two_point_rush: parseInt(formData.two_point_rush),
        rushing_100_199: parseInt(formData.rushing_100_199),
        rushing_200_plus: parseInt(formData.rushing_200_plus),
        receiving_yards: parseFloat(formData.receiving_yards),
        receptions: parseInt(formData.receptions),
        receiving_touchdowns: parseInt(formData.receiving_touchdowns),
        two_point_reception: parseInt(formData.two_point_reception),
        receiving_100_199: parseInt(formData.receiving_100_199),
        receiving_200_plus: parseInt(formData.receiving_200_plus),
        kickoff_return_touchdown: parseInt(formData.kickoff_return_touchdown),
        punt_return_touchdown: parseInt(formData.punt_return_touchdown),
        fumble_recovered_touchdown: parseInt(formData.fumble_recovered_touchdown),
        fumbles_lost: parseInt(formData.fumbles_lost),
        interception_return_touchdown: parseInt(formData.interception_return_touchdown),
        fumble_return_touchdown: parseInt(formData.fumble_return_touchdown),
        blocked_return_touchdown: parseInt(formData.blocked_return_touchdown),
        two_point_return: parseInt(formData.two_point_return),
        one_point_safety: parseInt(formData.one_point_safety)
      };
      console.log('POST /scoring_rules/create request body:', scoringBody);
      const scoringResponse = await axios.post('http://localhost/vampire_project/vamp_api/scoring_rules/create', scoringBody);
      console.log('POST /scoring_rules/create response:', scoringResponse.data);
      if (scoringResponse.data.status !== 'success') {
        throw new Error(scoringResponse.data.message);
      }

      // Create league member (commissioner)
      const leagueMemberBody = {
        league_id: leagueId,
        user_id: effectiveUser.id,
        role: 'commish'
      };
      console.log('POST /league_members/create request body:', leagueMemberBody);
      const leagueMemberResponse = await axios.post('http://localhost/vampire_project/vamp_api/league_members/create', leagueMemberBody);
      console.log('POST /league_members/create response:', leagueMemberResponse.data);
      if (leagueMemberResponse.data.status !== 'success') {
        throw new Error(leagueMemberResponse.data.message);
      }

      navigate('/landing');
    } catch (err) {
      console.error('League creation failed:', err.message);
      setError(err.message || 'Failed to create league');
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="form-group">
            <h3 className="text-center mb-4">Create League - Step 1: League and Divisions</h3>
            <div className="form-group mb-3">
              <label className="form-label">League Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="League Name"
                name="leagueName"
                value={formData.leagueName}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Division 1 Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="Division 1 Name"
                name="division1Name"
                value={formData.division1Name}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Division 2 Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="Division 2 Name"
                name="division2Name"
                value={formData.division2Name}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
            {error && <p className="error-message mt-3">{error}</p>}
            <button
              type="button"
              className="btn btn-success w-100"
              onClick={handleNext}
              disabled={isLoading}
            >
              Next
            </button>
          </div>
        );
      case 2:
        return (
          <div className="form-group">
            <h3 className="text-center mb-4">Create League - Step 2: Regular Roster Rules</h3>
            <div className="form-group mb-3">
              <label className="form-label">Roster Type</label>
              <input
                type="text"
                className="form-control"
                value="Regular"
                readOnly
                disabled
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Quarterback Count (Active)</label>
              <input
                type="number"
                className="form-control"
                placeholder="Quarterback Count (Active)"
                name="regular_quarterback_count"
                value={formData.regular_quarterback_count}
                onChange={handleInputChange}
                min="0"
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Max Quarterback Count</label>
              <input
                type="number"
                className="form-control"
                placeholder="Max Quarterback Count"
                name="regular_max_qb_count"
                value={formData.regular_max_qb_count}
                onChange={handleInputChange}
                min="0"
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Running Back Count (Active)</label>
              <input
                type="number"
                className="form-control"
                placeholder="Running Back Count (Active)"
                name="regular_running_back_count"
                value={formData.regular_running_back_count}
                onChange={handleInputChange}
                min="0"
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Max Running Back Count</label>
              <input
                type="number"
                className="form-control"
                placeholder="Max Running Back Count"
                name="regular_max_rb_count"
                value={formData.regular_max_rb_count}
                onChange={handleInputChange}
                min="0"
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Wide Receiver Count (Active)</label>
              <input
                type="number"
                className="form-control"
                placeholder="Wide Receiver Count (Active)"
                name="regular_wide_receiver_count"
                value={formData.regular_wide_receiver_count}
                onChange={handleInputChange}
                min="0"
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Max Wide Receiver Count</label>
              <input
                type="number"
                className="form-control"
                placeholder="Max Wide Receiver Count"
                name="regular_max_wr_count"
                value={formData.regular_max_wr_count}
                onChange={handleInputChange}
                min="0"
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Tight End Count (Active)</label>
              <input
                type="number"
                className="form-control"
                placeholder="Tight End Count (Active)"
                name="regular_tight_end_count"
                value={formData.regular_tight_end_count}
                onChange={handleInputChange}
                min="0"
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Max Tight End Count</label>
              <input
                type="number"
                className="form-control"
                placeholder="Max Tight End Count"
                name="regular_max_te_count"
                value={formData.regular_max_te_count}
                onChange={handleInputChange}
                min="0"
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Wide Receiver/Tight End Count (Active)</label>
              <input
                type="number"
                className="form-control"
                placeholder="Wide Receiver/Tight End Count (Active)"
                name="regular_wide_receiver_tight_end_count"
                value={formData.regular_wide_receiver_tight_end_count}
                onChange={handleInputChange}
                min="0"
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Flex Count (Active)</label>
              <input
                type="number"
                className="form-control"
                placeholder="Flex Count (Active)"
                name="regular_flex_count"
                value={formData.regular_flex_count}
                onChange={handleInputChange}
                min="0"
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Bench Count</label>
              <input
                type="number"
                className="form-control"
                placeholder="Bench Count"
                name="regular_bench_count"
                value={formData.regular_bench_count}
                onChange={handleInputChange}
                min="0"
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Injured Reserve Count (Non-Active)</label>
              <input
                type="number"
                className="form-control"
                placeholder="Injured Reserve Count (Non-Active)"
                name="regular_ir_count"
                value={formData.regular_ir_count}
                onChange={handleInputChange}
                min="0"
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Max Roster Size (Active + Bench)</label>
              <input
                type="number"
                className="form-control"
                placeholder="Max Roster Size (Active + Bench)"
                name="regular_max_roster_size"
                value={formData.regular_max_roster_size}
                onChange={handleInputChange}
                min="1"
                required
                disabled={isLoading}
              />
            </div>
            {error && <p className="error-message mt-3">{error}</p>}
            <div className="d-flex justify-content-between">
              <button
                type="button"
                className="btn btn-secondary w-45"
                onClick={handleBack}
                disabled={isLoading}
              >
                Back
              </button>
              <button
                type="button"
                className="btn btn-success w-45"
                onClick={handleNext}
                disabled={isLoading}
              >
                Next
              </button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="form-group">
            <h3 className="text-center mb-4">Create League - Step 3: Vampire Roster Rules</h3>
            <div className="form-group mb-3">
              <label className="form-label">Roster Type</label>
              <input
                type="text"
                className="form-control"
                value="Vampire"
                readOnly
                disabled
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Quarterback Count (Active)</label>
              <input
                type="number"
                className="form-control"
                placeholder="Quarterback Count (Active)"
                name="vampire_quarterback_count"
                value={formData.vampire_quarterback_count}
                onChange={handleInputChange}
                min="0"
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Max Quarterback Count</label>
              <input
                type="number"
                className="form-control"
                placeholder="Max Quarterback Count"
                name="vampire_max_qb_count"
                value={formData.vampire_max_qb_count}
                onChange={handleInputChange}
                min="0"
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Running Back Count (Active)</label>
              <input
                type="number"
                className="form-control"
                placeholder="Running Back Count (Active)"
                name="vampire_running_back_count"
                value={formData.vampire_running_back_count}
                onChange={handleInputChange}
                min="0"
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Max Running Back Count</label>
              <input
                type="number"
                className="form-control"
                placeholder="Max Running Back Count"
                name="vampire_max_rb_count"
                value={formData.vampire_max_rb_count}
                onChange={handleInputChange}
                min="0"
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Wide Receiver Count (Active)</label>
              <input
                type="number"
                className="form-control"
                placeholder="Wide Receiver Count (Active)"
                name="vampire_wide_receiver_count"
                value={formData.vampire_wide_receiver_count}
                onChange={handleInputChange}
                min="0"
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Max Wide Receiver Count</label>
              <input
                type="number"
                className="form-control"
                placeholder="Max Wide Receiver Count"
                name="vampire_max_wr_count"
                value={formData.vampire_max_wr_count}
                onChange={handleInputChange}
                min="0"
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Tight End Count (Active)</label>
              <input
                type="number"
                className="form-control"
                placeholder="Tight End Count (Active)"
                name="vampire_tight_end_count"
                value={formData.vampire_tight_end_count}
                onChange={handleInputChange}
                min="0"
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Max Tight End Count</label>
              <input
                type="number"
                className="form-control"
                placeholder="Max Tight End Count"
                name="vampire_max_te_count"
                value={formData.vampire_max_te_count}
                onChange={handleInputChange}
                min="0"
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Wide Receiver/Tight End Count (Active)</label>
              <input
                type="number"
                className="form-control"
                placeholder="Wide Receiver/Tight End Count (Active)"
                name="vampire_wide_receiver_tight_end_count"
                value={formData.vampire_wide_receiver_tight_end_count}
                onChange={handleInputChange}
                min="0"
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Flex Count (Active)</label>
              <input
                type="number"
                className="form-control"
                placeholder="Flex Count (Active)"
                name="vampire_flex_count"
                value={formData.vampire_flex_count}
                onChange={handleInputChange}
                min="0"
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Bench Count</label>
              <input
                type="number"
                className="form-control"
                placeholder="Bench Count"
                name="vampire_bench_count"
                value={formData.vampire_bench_count}
                onChange={handleInputChange}
                min="0"
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Injured Reserve Count (Non-Active)</label>
              <input
                type="number"
                className="form-control"
                placeholder="Injured Reserve Count (Non-Active)"
                name="vampire_ir_count"
                value={formData.vampire_ir_count}
                onChange={handleInputChange}
                min="0"
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Max Roster Size (Active + Bench)</label>
              <input
                type="number"
                className="form-control"
                placeholder="Max Roster Size (Active + Bench)"
                name="vampire_max_roster_size"
                value={formData.vampire_max_roster_size}
                onChange={handleInputChange}
                min="1"
                required
                disabled={isLoading}
              />
            </div>
            {error && <p className="error-message mt-3">{error}</p>}
            <div className="d-flex justify-content-between">
              <button
                type="button"
                className="btn btn-secondary w-45"
                onClick={handleBack}
                disabled={isLoading}
              >
                Back
              </button>
              <button
                type="button"
                className="btn btn-success w-45"
                onClick={handleNext}
                disabled={isLoading}
              >
                Next
              </button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="form-group">
            <h3 className="text-center mb-4">Create League - Step 4: Scoring Rules</h3>
            <div className="form-group mb-3">
              <label className="form-label">Passing Yards (per yard)</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                placeholder="Passing Yards (per yard)"
                name="passing_yards"
                value={formData.passing_yards}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Passing Touchdowns</label>
              <input
                type="number"
                className="form-control"
                placeholder="Passing Touchdowns"
                name="passing_touchdowns"
                value={formData.passing_touchdowns}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Interceptions Thrown</label>
              <input
                type="number"
                className="form-control"
                placeholder="Interceptions Thrown"
                name="interceptions_thrown"
                value={formData.interceptions_thrown}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">2-Point Pass</label>
              <input
                type="number"
                className="form-control"
                placeholder="2-Point Pass"
                name="two_point_pass"
                value={formData.two_point_pass}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Passing 300-399 Yards</label>
              <input
                type="number"
                className="form-control"
                placeholder="Passing 300-399 Yards"
                name="passing_300_399"
                value={formData.passing_300_399}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Passing 400+ Yards</label>
              <input
                type="number"
                className="form-control"
                placeholder="Passing 400+ Yards"
                name="passing_400_plus"
                value={formData.passing_400_plus}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Rushing Yards (per yard)</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                placeholder="Rushing Yards (per yard)"
                name="rushing_yards"
                value={formData.rushing_yards}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Rushing Touchdowns</label>
              <input
                type="number"
                className="form-control"
                placeholder="Rushing Touchdowns"
                name="rushing_touchdowns"
                value={formData.rushing_touchdowns}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">2-Point Rush</label>
              <input
                type="number"
                className="form-control"
                placeholder="2-Point Rush"
                name="two_point_rush"
                value={formData.two_point_rush}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Rushing 100-199 Yards</label>
              <input
                type="number"
                className="form-control"
                placeholder="Rushing 100-199 Yards"
                name="rushing_100_199"
                value={formData.rushing_100_199}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Rushing 200+ Yards</label>
              <input
                type="number"
                className="form-control"
                placeholder="Rushing 200+ Yards"
                name="rushing_200_plus"
                value={formData.rushing_200_plus}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Receiving Yards (per yard)</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                placeholder="Receiving Yards (per yard)"
                name="receiving_yards"
                value={formData.receiving_yards}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Receptions</label>
              <input
                type="number"
                className="form-control"
                placeholder="Receptions"
                name="receptions"
                value={formData.receptions}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Receiving Touchdowns</label>
              <input
                type="number"
                className="form-control"
                placeholder="Receiving Touchdowns"
                name="receiving_touchdowns"
                value={formData.receiving_touchdowns}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">2-Point Reception</label>
              <input
                type="number"
                className="form-control"
                placeholder="2-Point Reception"
                name="two_point_reception"
                value={formData.two_point_reception}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Receiving 100-199 Yards</label>
              <input
                type="number"
                className="form-control"
                placeholder="Receiving 100-199 Yards"
                name="receiving_100_199"
                value={formData.receiving_100_199}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Receiving 200+ Yards</label>
              <input
                type="number"
                className="form-control"
                placeholder="Receiving 200+ Yards"
                name="receiving_200_plus"
                value={formData.receiving_200_plus}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Kickoff Return Touchdown</label>
              <input
                type="number"
                className="form-control"
                placeholder="Kickoff Return Touchdown"
                name="kickoff_return_touchdown"
                value={formData.kickoff_return_touchdown}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Punt Return Touchdown</label>
              <input
                type="number"
                className="form-control"
                placeholder="Punt Return Touchdown"
                name="punt_return_touchdown"
                value={formData.punt_return_touchdown}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Fumble Recovered Touchdown</label>
              <input
                type="number"
                className="form-control"
                placeholder="Fumble Recovered Touchdown"
                name="fumble_recovered_touchdown"
                value={formData.fumble_recovered_touchdown}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Fumbles Lost</label>
              <input
                type="number"
                className="form-control"
                placeholder="Fumbles Lost"
                name="fumbles_lost"
                value={formData.fumbles_lost}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Interception Return Touchdown</label>
              <input
                type="number"
                className="form-control"
                placeholder="Interception Return Touchdown"
                name="interception_return_touchdown"
                value={formData.interception_return_touchdown}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Fumble Return Touchdown</label>
              <input
                type="number"
                className="form-control"
                placeholder="Fumble Return Touchdown"
                name="fumble_return_touchdown"
                value={formData.fumble_return_touchdown}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Blocked Return Touchdown</label>
              <input
                type="number"
                className="form-control"
                placeholder="Blocked Return Touchdown"
                name="blocked_return_touchdown"
                value={formData.blocked_return_touchdown}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">2-Point Return</label>
              <input
                type="number"
                className="form-control"
                placeholder="2-Point Return"
                name="two_point_return"
                value={formData.two_point_return}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">1-Point Safety</label>
              <input
                type="number"
                className="form-control"
                placeholder="1-Point Safety"
                name="one_point_safety"
                value={formData.one_point_safety}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
            {error && <p className="error-message mt-3">{error}</p>}
            <div className="d-flex justify-content-between">
              <button
                type="button"
                className="btn btn-secondary w-45"
                onClick={handleBack}
                disabled={isLoading}
              >
                Back
              </button>
              <button
                type="button"
                className="btn btn-success w-45"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create League'}
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="create-league-container">
      <div className="create-league-form animate__animated animate__fadeIn">
        <div className="progress mb-4">
          <div
            className="progress-bar bg-success"
            role="progressbar"
            style={{ width: `${(step / 4) * 100}%` }}
            aria-valuenow={(step / 4) * 100}
            aria-valuemin="0"
            aria-valuemax="100"
          ></div>
        </div>
        {renderStep()}
      </div>
    </div>
  );
};

export default CreateLeagueFormComponent;