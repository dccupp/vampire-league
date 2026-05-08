import { ChangeEvent } from 'react';

interface ScoringRulesStepProps {
  formData: Record<string, string>;
  handleInputChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  setError: (msg: string) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
}

interface FieldDef {
  name: string;
  label: string;
  step: number;
}

const ScoringRulesStep = ({
  formData,
  handleInputChange,
  setError,
  onNext,
  onBack,
  isLoading,
}: ScoringRulesStepProps) => {
  const validateStep = (): boolean => {
    const scoringFields = [
      'passing_yards', 'passing_touchdowns', 'interceptions_thrown', 'two_point_pass',
      'passing_300_399', 'passing_400_plus', 'rushing_yards', 'rushing_touchdowns',
      'two_point_rush', 'rushing_100_199', 'rushing_200_plus', 'receiving_yards',
      'receptions', 'receiving_touchdowns', 'two_point_reception', 'receiving_100_199',
      'receiving_200_plus', 'kickoff_return_touchdown', 'punt_return_touchdown',
      'fumble_recovered_touchdown', 'fumbles_lost', 'interception_return_touchdown',
      'fumble_return_touchdown', 'blocked_return_touchdown', 'two_point_return',
      'one_point_safety',
    ];
    for (const field of scoringFields) {
      if (formData[field] === '' || isNaN(parseFloat(formData[field]))) {
        setError('All scoring fields must be valid numbers');
        return false;
      }
    }
    return true;
  };

  const handleNextClick = () => {
    if (validateStep()) {
      setError('');
      onNext();
    }
  };

  const fields: FieldDef[] = [
    { name: 'passing_yards', label: 'Passing Yards (per yard)', step: 0.01 },
    { name: 'passing_touchdowns', label: 'Passing Touchdowns', step: 1 },
    { name: 'interceptions_thrown', label: 'Interceptions Thrown', step: 1 },
    { name: 'two_point_pass', label: '2-Point Pass', step: 1 },
    { name: 'passing_300_399', label: 'Passing 300-399 Yards', step: 1 },
    { name: 'passing_400_plus', label: 'Passing 400+ Yards', step: 1 },
    { name: 'rushing_yards', label: 'Rushing Yards (per yard)', step: 0.01 },
    { name: 'rushing_touchdowns', label: 'Rushing Touchdowns', step: 1 },
    { name: 'two_point_rush', label: '2-Point Rush', step: 1 },
    { name: 'rushing_100_199', label: 'Rushing 100-199 Yards', step: 1 },
    { name: 'rushing_200_plus', label: 'Rushing 200+ Yards', step: 1 },
    { name: 'receiving_yards', label: 'Receiving Yards (per yard)', step: 0.01 },
    { name: 'receptions', label: 'Receptions', step: 1 },
    { name: 'receiving_touchdowns', label: 'Receiving Touchdowns', step: 1 },
    { name: 'two_point_reception', label: '2-Point Reception', step: 1 },
    { name: 'receiving_100_199', label: 'Receiving 100-199 Yards', step: 1 },
    { name: 'receiving_200_plus', label: 'Receiving 200+ Yards', step: 1 },
    { name: 'kickoff_return_touchdown', label: 'Kickoff Return Touchdown', step: 1 },
    { name: 'punt_return_touchdown', label: 'Punt Return Touchdown', step: 1 },
    { name: 'fumble_recovered_touchdown', label: 'Fumble Recovered Touchdown', step: 1 },
    { name: 'fumbles_lost', label: 'Fumbles Lost', step: 1 },
    { name: 'interception_return_touchdown', label: 'Interception Return Touchdown', step: 1 },
    { name: 'fumble_return_touchdown', label: 'Fumble Return Touchdown', step: 1 },
    { name: 'blocked_return_touchdown', label: 'Blocked Return Touchdown', step: 1 },
    { name: 'two_point_return', label: '2-Point Return', step: 1 },
    { name: 'one_point_safety', label: '1-Point Safety', step: 1 },
  ];

  return (
    <div>
      <h3 className="clf-title">Step 4: Scoring Rules</h3>
      {fields.map(({ name, label, step }) => (
        <div key={name} className="clf-form-group">
          <label htmlFor={name} className="clf-label">
            {label}
          </label>
          <input
            id={name}
            type="number"
            name={name}
            value={formData[name]}
            onChange={handleInputChange}
            step={step}
            className="clf-input"
            placeholder={`Enter ${label.toLowerCase()}`}
            disabled={isLoading}
            aria-describedby={`${name}-error`}
          />
        </div>
      ))}
      <div className="clf-btn-row">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="clf-btn-secondary"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNextClick}
          disabled={isLoading}
          className="clf-btn-primary"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ScoringRulesStep;
