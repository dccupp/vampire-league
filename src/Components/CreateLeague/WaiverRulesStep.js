import React from 'react';

const WaiverRulesStep = ({ formData, handleInputChange, setError, onSubmit, onBack, isLoading }) => {
  const validateStep = () => {
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
    <div className="form-group">
      <h3 className="text-center mb-4">Step 5: Waiver Rules</h3>
      <div className="form-group mb-3">
        <label htmlFor="waivers_length" className="form-label">
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
          className="form-control"
          placeholder="Enter waiver length"
          disabled={isLoading}
          aria-describedby="waivers_length-error"
        />
      </div>
      <div className="form-group mb-3">
        <label htmlFor="waiver_day" className="form-label">
          Waiver Day
        </label>
        <select
          id="waiver_day"
          name="waiver_day"
          value={formData.waiver_day}
          onChange={handleInputChange}
          className="form-control"
          disabled={isLoading}
          aria-describedby="waiver_day-error"
        >
          <option value="">Select a day</option>
          <option value="Wednesday">Wednesday</option>
          <option value="Thursday">Thursday</option>
        </select>
      </div>
      <div className="d-flex justify-content-between">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="btn btn-secondary w-45"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmitClick}
          disabled={isLoading}
          className="btn btn-success w-45"
        >
          {isLoading ? 'Creating...' : 'Create League'}
        </button>
      </div>
    </div>
  );
};

export default WaiverRulesStep;