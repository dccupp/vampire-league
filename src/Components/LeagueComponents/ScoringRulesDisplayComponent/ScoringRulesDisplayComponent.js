import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axiosInstance from '../../../api'; // Use centralized axiosInstance
import './ScoringRulesDisplayComponent.css';

const ScoringRulesDisplayComponent = ({ currentUser, currentLeague }) => {
  const [scoringRules, setScoringRules] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchScoringRules = async () => {
      if (!currentLeague?.league_id) {
        setError('No league selected.');
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching scoring rules for league:', currentLeague.league_id);
        const response = await axiosInstance.get(`/scoring_rules/getScoringRulesByLeagueId/${currentLeague.league_id}`);
        console.log('Scoring rules response:', response.data);
        setScoringRules(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching scoring rules:', err.response || err);
        setError(`Failed to fetch scoring rules: ${err.response?.data?.message || err.message}`);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    fetchScoringRules();
  }, [currentLeague]);

  if (loading) {
    return <div className="scoring-rules-container">Loading scoring rules...</div>;
  }

  if (error || !scoringRules) {
    return <div className="scoring-rules-container">{error || 'No scoring rules available.'}</div>;
  }

  const ruleCategories = [
    {
      title: 'Passing',
      rules: [
        { label: 'Passing Yards (per yard)', value: scoringRules.passing_yards },
        { label: 'Passing Touchdowns', value: scoringRules.passing_touchdowns },
        { label: 'Interceptions Thrown', value: scoringRules.interceptions_thrown },
        { label: 'Two-Point Pass', value: scoringRules.two_point_pass },
        { label: '300-399 Passing Yards', value: scoringRules.passing_300_399 },
        { label: '400+ Passing Yards', value: scoringRules.passing_400_plus },
      ],
    },
    {
      title: 'Rushing',
      rules: [
        { label: 'Rushing Yards (per yard)', value: scoringRules.rushing_yards },
        { label: 'Rushing Touchdowns', value: scoringRules.rushing_touchdowns },
        { label: 'Two-Point Rush', value: scoringRules.two_point_rush },
        { label: '100-199 Rushing Yards', value: scoringRules.rushing_100_199 },
        { label: '200+ Rushing Yards', value: scoringRules.rushing_200_plus },
      ],
    },
    {
      title: 'Receiving',
      rules: [
        { label: 'Receiving Yards (per yard)', value: scoringRules.receiving_yards },
        { label: 'Receptions', value: scoringRules.receptions },
        { label: 'Receiving Touchdowns', value: scoringRules.receiving_touchdowns },
        { label: 'Two-Point Reception', value: scoringRules.two_point_reception },
        { label: '100-199 Receiving Yards', value: scoringRules.receiving_100_199 },
        { label: '200+ Receiving Yards', value: scoringRules.receiving_200_plus },
      ],
    },
    {
      title: 'Special Teams & Defense',
      rules: [
        { label: 'Kickoff Return Touchdown', value: scoringRules.kickoff_return_touchdown },
        { label: 'Punt Return Touchdown', value: scoringRules.punt_return_touchdown },
        { label: 'Fumble Recovered Touchdown', value: scoringRules.fumble_recovered_touchdown },
        { label: 'Fumbles Lost', value: scoringRules.fumbles_lost },
        { label: 'Interception Return Touchdown', value: scoringRules.interception_return_touchdown },
        { label: 'Fumble Return Touchdown', value: scoringRules.fumble_return_touchdown },
        { label: 'Blocked Return Touchdown', value: scoringRules.blocked_return_touchdown },
        { label: 'Two-Point Return', value: scoringRules.two_point_return },
        { label: 'One-Point Safety', value: scoringRules.one_point_safety },
      ],
    },
  ];

  return (
    <div className="scoring-rules-container animate__animated animate__fadeIn">
      <h2 className="scoring-rules-title">Scoring Rules</h2>
      <div className="scoring-rules-categories">
        {ruleCategories.map((category, index) => (
          <div key={index} className="scoring-rules-category">
            <h3 className="scoring-rules-category-title">{category.title}</h3>
            <table className="scoring-rules-table">
              <thead>
                <tr>
                  <th>Rule</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {category.rules.map((rule, idx) => (
                  <tr key={idx} className="scoring-rules-row">
                    <td className="scoring-rules-info">{rule.label}</td>
                    <td className="scoring-rules-info">{rule.value}</td>
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

ScoringRulesDisplayComponent.propTypes = {
  currentUser: PropTypes.object,
  currentLeague: PropTypes.shape({
    league_id: PropTypes.number,
  }),
};

export default ScoringRulesDisplayComponent;