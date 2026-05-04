import { useState, useEffect } from 'react';
import { isAxiosError } from 'axios';
import axiosInstance from '../../../api';
import { CurrentLeague, RosterRules } from '../../../types';
import './RosterRulesDisplayComponent.css';

interface RosterRulesDisplayComponentProps {
  currentLeague: CurrentLeague;
}

const RosterRulesDisplayComponent = ({ currentLeague }: RosterRulesDisplayComponentProps) => {
  const [rosterRules, setRosterRules] = useState<RosterRules[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRosterRules = async () => {
      if (!currentLeague?.league_id) {
        setError('No league selected.');
        setLoading(false);
        return;
      }

      try {
        const [regularResponse, vampireResponse] = await Promise.all([
          axiosInstance.get(`/roster_rules/getRosterRulesByLeagueId/${currentLeague.league_id}/1`),
          axiosInstance.get(`/roster_rules/getRosterRulesByLeagueId/${currentLeague.league_id}/2`),
        ]);

        const rules: RosterRules[] = [];
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
        const msg = isAxiosError(err)
          ? err.response?.data?.message || err.message
          : 'Failed to fetch roster rules.';
        console.error('Error fetching roster rules:', err);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchRosterRules();
  }, [currentLeague?.league_id]);

  const renderRosterSection = (rules: RosterRules, title: string) => {
    const rosterFields = [
      { label: 'Quarterbacks',         value: rules.quarterback_count },
      { label: 'Running Backs',        value: rules.running_back_count },
      { label: 'Wide Receivers',       value: rules.wide_receiver_count },
      { label: 'Tight Ends',           value: rules.tight_end_count },
      { label: 'WR/TE Count',          value: rules.wide_receiver_tight_end_count },
      { label: 'Flex',                 value: rules.flex_count },
      { label: 'Bench',                value: rules.bench_count },
      { label: 'Injured Reserve',      value: rules.ir_count },
      { label: 'Max Roster Size',      value: rules.max_roster_size },
      { label: 'Max Quarterbacks',     value: rules.max_qb_count },
      { label: 'Max Running Backs',    value: rules.max_rb_count },
      { label: 'Max Wide Receivers',   value: rules.max_wr_count },
      { label: 'Max Tight Ends',       value: rules.max_te_count },
      { label: 'Beginning FAAB Budget', value: rules.beginning_faab },
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
            {rosterFields.map((field) => (
              <tr key={field.label} className="roster-rules-row">
                <td className="roster-rules-info">{field.label}</td>
                <td className="roster-rules-info">{field.value ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) {
    return <div className="roster-rules-container">Loading roster rules...</div>;
  }

  if (error) {
    return <div className="roster-rules-container error-message">{error}</div>;
  }

  if (rosterRules.length === 0) {
    return <div className="roster-rules-container error-message">No roster rules available.</div>;
  }

  const regularRules = rosterRules.find(rule => rule.roster_type_id === 1);
  const vampireRules = rosterRules.find(rule => rule.roster_type_id === 2);

  return (
    <div className="roster-rules-container animate__animated animate__fadeIn">
      <h2 className="roster-rules-title">Roster Rules</h2>
      <div className="roster-rules-categories">
        {regularRules && renderRosterSection(regularRules, 'Regular Player Roster Rules')}
        {vampireRules && renderRosterSection(vampireRules, 'Vampire Player Roster Rules')}
      </div>
    </div>
  );
};

export default RosterRulesDisplayComponent;