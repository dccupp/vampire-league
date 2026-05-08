import { useState, useEffect } from 'react';
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
    return <div className="wrd-container">Loading waiver rules...</div>;
  }

  if (error || !waiverRule) {
    return (
      <div className="wrd-container">
        <div className="wrd-error-message">{error || 'No waiver rules available.'}</div>
      </div>
    );
  }

  return (
    <div className="wrd-container animate__animated animate__fadeIn">
      <h2 className="wrd-title">Waiver Rules</h2>
      <div className="wrd-categories">
        <div className="wrd-category">
          <h3 className="wrd-category-title">Waiver Settings</h3>
          <div className="wrd-table-wrapper">
            <table className="wrd-table">
              <thead>
                <tr>
                  <th>Rule</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr className="wrd-row">
                  <td className="wrd-label">Waivers Length (days)</td>
                  <td className="wrd-value">{waiverRule.waivers_length ?? 'Not set'}</td>
                </tr>
                <tr className="wrd-row">
                  <td className="wrd-label">Waiver Processing Day</td>
                  <td className="wrd-value">{waiverRule.waiver_day ?? 'Not set'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaiverRulesDisplayComponent;
