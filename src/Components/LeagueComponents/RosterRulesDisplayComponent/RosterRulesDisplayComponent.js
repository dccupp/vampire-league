import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axiosInstance from '../../../api'; // Use centralized axiosInstance
import './RosterRulesDisplayComponent.css';

const RosterRulesDisplayComponent = ({ currentUser, currentLeague }) => {
  const [rosterRules, setRosterRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRosterRules = async () => {
      if (!currentLeague?.league_id) {
        setError('No league selected.');
        setLoading(false);
        return;
      }

      try {
        const regularResponse = await axiosInstance.get(`/roster_rules/getRosterRulesByLeagueId/${currentLeague.league_id}/1`);
        const vampireResponse = await axiosInstance.get(`/roster_rules/getRosterRulesByLeagueId/${currentLeague.league_id}/2`);

        const rules = [];
        if (regularResponse.data && Object.keys(regularResponse.data).length > 0) {
          rules.push(regularResponse.data);
        }
        if (vampireResponse.data && Object.keys(vampireResponse.data).length > 0) {
          rules.push(vampireResponse.data);
        }

        if (rules.length === 0) {
          setError('No roster rules found for this league.');
        } else {
          setRosterRules(rules);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching roster rules:', err.response || err);
        setError(`Failed to fetch roster rules: ${err.response?.data?.message || err.message}`);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    fetchRosterRules();
  }, [currentLeague]);

  if (loading) {
    return <div className="roster-rules-container">Loading roster rules...</div>;
  }

  if (error) {
    return <div className="roster-rules-container error-message">{error}</div>;
  }

  if (rosterRules.length === 0) {
    return <div className="roster-rules-container error-message">No roster rules available.</div>;
  }

  const regularRules = rosterRules.find((rule) => rule.roster_type_id === 1);
  const vampireRules = rosterRules.find((rule) => rule.roster_type_id === 2);

  const renderRosterSection = (rules, title) => {
    if (!rules) return null;

    const rosterFields = [
      { label: 'Quarterbacks', value: rules.quarterback_count },
      { label: 'Running Backs', value: rules.running_back_count },
      { label: 'Wide Receivers', value: rules.wide_receiver_count },
      { label: 'Tight Ends', value: rules.tight_end_count },
      { label: 'WR/TE Count', value: rules.wide_receiver_tight_end_count },
      { label: 'Flex', value: rules.flex_count },
      { label: 'Bench', value: rules.bench_count },
      { label: 'Injured Reserve', value: rules.ir_count },
      { label: 'Max Roster Size', value: rules.max_roster_size },
      { label: 'Max Quarterbacks', value: rules.max_qb_count },
      { label: 'Max Running Backs', value: rules.max_rb_count },
      { label: 'Max Wide Receivers', value: rules.max_wr_count },
      { label: 'Max Tight Ends', value: rules.max_te_count },
      { label: 'Beginning FAAB Budget', value: rules.beginning_faab }
    ];

    return (
      <div className="roster-rules-category">
        <h3 className="roster-rules-category-title">{title}</h3>
        <table className="roster-rules-table">
          <thead>
            <tr>
              <th>Position</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            {rosterFields.map((field, idx) => (
              <tr key={idx} className="roster-rules-row">
                <td className="roster-rules-info">{field.label}</td>
                <td className="roster-rules-info">{field.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="roster-rules-container animate__animated animate__fadeIn">
      <h2 className="roster-rules-title">Roster Rules</h2>
      <div className="roster-rules-categories">
        {renderRosterSection(regularRules, 'Regular Player Rules')}
        {renderRosterSection(vampireRules, 'Vampire Player Rules')}
      </div>
    </div>
  );
};

RosterRulesDisplayComponent.propTypes = {
  currentUser: PropTypes.object,
  currentLeague: PropTypes.shape({
    league_id: PropTypes.number,
  }),
};

export default RosterRulesDisplayComponent;