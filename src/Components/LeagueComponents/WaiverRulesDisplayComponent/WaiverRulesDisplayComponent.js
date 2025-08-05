import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axiosInstance from '../../../api';
import './WaiverRulesDisplayComponent.css';

const WaiverRulesDisplayComponent = ({ currentUser, currentLeague }) => {
  const [waiverRules, setWaiverRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWaiverRules = async () => {
      if (!currentLeague?.league_id) {
        setError('No league selected.');
        setLoading(false);
        return;
      }

      try {
        const response = await axiosInstance.get(`/waiver_rules/getWaiverRulesByLeagueId/${currentLeague.league_id}`);
        setWaiverRules(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching waiver rules:', err.response || err);
        setError(`Failed to fetch waiver rules: ${err.response?.data?.message || err.message}`);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    fetchWaiverRules();
  }, [currentLeague]);

  if (loading) {
    return <div className="waiver-rules-container">Loading waiver rules...</div>;
  }

  if (error) {
    return <div className="waiver-rules-container">{error}</div>;
  }

  if (!waiverRules || waiverRules.length === 0) {
    return <div className="waiver-rules-container">No waiver rules available.</div>;
  }

  // Use the first waiver rule if multiple exist
  const selectedWaiverRule = waiverRules[0];

  const ruleCategories = [
    {
      title: 'Waiver Settings',
      rules: [
        { label: 'Waivers Length (days)', value: selectedWaiverRule.waivers_length ?? 'Not set' },
        { label: 'Waiver Processing Day', value: selectedWaiverRule.waiver_day ?? 'Not set' },
      ],
    },
  ];

  return (
    <div className="waiver-rules-container animate__animated animate__fadeIn">
      <h2 className="waiver-rules-title">Waiver Rules</h2>
      <div className="waiver-rules-categories">
        {ruleCategories.map((category, index) => (
          <div key={index} className="waiver-rules-category">
            <h3 className="waiver-rules-category-title">{category.title}</h3>
            <table className="waiver-rules-table">
              <thead>
                <tr>
                  <th>Rule</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {category.rules.map((rule, idx) => (
                  <tr key={idx} className="waiver-rules-row">
                    <td className="waiver-rules-info">{rule.label}</td>
                    <td className="waiver-rules-info">{rule.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
};

WaiverRulesDisplayComponent.propTypes = {
  currentUser: PropTypes.object,
  currentLeague: PropTypes.shape({
    league_id: PropTypes.number,
  }),
};

export default WaiverRulesDisplayComponent;