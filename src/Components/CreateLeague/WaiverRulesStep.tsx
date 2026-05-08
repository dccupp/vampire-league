import { ChangeEvent } from 'react';

interface WaiverRulesStepProps {
  formData: Record<string, string>;
  handleInputChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  setError: (msg: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  isLoading: boolean;
}

const WaiverRulesStep = ({
  formData,
  handleInputChange,
  setError,
  onSubmit,
  onBack,
  isLoading,
}: WaiverRulesStepProps) => {
  const validateStep = (): boolean => {
    const waiversLength = parseInt(formData.waivers_length);
    if (isNaN(waiversLength) || waiversLength < 0) {
      setError('Waiver length must be a non-negative number');
      return false;
    }
    if (!formData.waiver_day || !['Wednesday', 'Thursday'].includes(formData.waiver_day)) {
      setError('Please select a valid waiver day (Wednesday or Thursday)');
      return false;
    }
    return true;
  };

  const handleSubmitClick = () => {
    if (validateStep()) {
      setError('');
      onSubmit();
    }
  };

  return (
    <div>
      <h3 className="clf-title">Step 5: Waiver Rules</h3>
      <div className="clf-form-group">
        <label htmlFor="waivers_length" className="clf-label">
          Waiver Length (days)
        </label>
        <input
          id="waivers_length"
          type="number"
          name="waivers_length"
          value={formData.waivers_length}
          onChange={handleInputChange}
          step="1"
          min="0"
          className="clf-input"
          placeholder="Enter waiver length"
          disabled={isLoading}
          aria-describedby="waivers_length-error"
        />
      </div>
      <div className="clf-form-group">
        <label htmlFor="waiver_day" className="clf-label">
          Waiver Day
        </label>
        <select
          id="waiver_day"
          name="waiver_day"
          value={formData.waiver_day}
          onChange={handleInputChange}
          className="clf-input"
          disabled={isLoading}
          aria-describedby="waiver_day-error"
        >
          <option value="">Select a day</option>
          <option value="Wednesday">Wednesday</option>
          <option value="Thursday">Thursday</option>
        </select>
      </div>
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
          onClick={handleSubmitClick}
          disabled={isLoading}
          className="clf-btn-primary"
        >
          {isLoading ? 'Creating...' : 'Create League'}
        </button>
      </div>
    </div>
  );
};

export default WaiverRulesStep;
