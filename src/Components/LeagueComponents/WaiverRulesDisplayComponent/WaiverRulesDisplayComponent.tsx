import React, { useState, useEffect } from 'react';
import { isAxiosError } from 'axios';
import axiosInstance from '../../../api';
import { CurrentLeague, WaiverRule } from '../../../types';
import './WaiverRulesDisplayComponent.css';

interface WaiverRulesDisplayComponentProps {
  currentLeague: CurrentLeague;
}

const WaiverRulesDisplayComponent = ({ currentLeague }: WaiverRulesDisplayComponentProps) => {
  const [waiverRule, setWaiverRule] = useState<WaiverRule | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWaiverRules = async () => {
      if (!currentLeague?.league_id) {
        setError('No league selected.');
        setLoading(false);
        return;
      }

      try {
        const response = await axiosInstance.get(`/waiver_rules/getWaiverRulesByLeagueId/${currentLeague.league_id}`);
        const rules: WaiverRule[] = Array.isArray(response.data) ? response.data : [];
        setWaiverRule(rules[0] ?? null);
        setError(null);
      } catch (err) {
        const msg = isAxiosError(err)
          ? err.response?.data?.message || err.message
          : 'Failed to fetch waiver rules.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchWaiverRules();
  }, [currentLeague?.league_id]);

  if (loading) {
    return <div className="waiver-rules-container">Loading waiver rules...</div>;
  }

  if (error) {
    return <div className="waiver-rules-container">{error}</div>;
  }

  if (!waiverRule) {
    return <div className="waiver-rules-container">No waiver rules available.</div>;
  }

  return (
    <div className="waiver-rules-container animate__animated animate__fadeIn">
      <h2 className="waiver-rules-title">Waiver Rules</h2>
      <div className="waiver-rules-categories">
        <div className="waiver-rules-category">
          <h3 className="waiver-rules-category-title">Waiver Settings</h3>
          <table className="waiver-rules-table">
            <thead>
              <tr>
                <th>Rule</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr className="waiver-rules-row">
                <td className="waiver-rules-info">Waivers Length (days)</td>
                <td className="waiver-rules-info">{waiverRule.waivers_length ?? 'Not set'}</td>
              </tr>
              <tr className="waiver-rules-row">
                <td className="waiver-rules-info">Waiver Processing Day</td>
                <td className="waiver-rules-info">{waiverRule.waiver_day ?? 'Not set'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WaiverRulesDisplayComponent;