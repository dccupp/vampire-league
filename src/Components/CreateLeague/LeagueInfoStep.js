import React from 'react';

const LeagueInfoStep = ({ formData, handleInputChange, setError, onNext, isLoading }) => {
  const validateStep = () => {
    if (!formData.leagueName) {
      setError('Please fill in the league name');
      return false;
    }
    return true;
  };

  const handleNextClick = () => {
    if (validateStep()) {
      setError('');
      onNext();
    }
  };

  return (
    <div className="form-group">
      <h3 className="text-center mb-4">Step 1: League Information</h3>
      <div className="form-group mb-3">
        <label htmlFor="leagueName" className="form-label">
          League Name
        </label>
        <input
          id="leagueName"
          type="text"
          name="leagueName"
          value={formData.leagueName}
          onChange={handleInputChange}
          className="form-control"
          placeholder="Enter league name"
          disabled={isLoading}
          aria-describedby="leagueName-error"
        />
      </div>
      <button
        type="button"
        onClick={handleNextClick}
        disabled={isLoading}
        className="btn btn-success w-100"
      >
        Next
      </button>
    </div>
  );
};

export default LeagueInfoStep;