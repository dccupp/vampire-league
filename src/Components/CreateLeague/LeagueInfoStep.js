import React from 'react';

const LeagueInfoStep = ({ formData, handleInputChange, setError, onNext, isLoading }) => {
  const validateStep = () => {
    if (!formData.leagueName || !formData.division1Name || !formData.division2Name) {
      setError('Please fill in all fields');
      return false;
    }
    if (formData.division1Name === formData.division2Name) {
      setError('Division names must be unique');
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
      <h3 className="text-center mb-4">Step 1: League and Divisions</h3>
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
      <div className="form-group mb-3">
        <label htmlFor="division1Name" className="form-label">
          Division 1 Name
        </label>
        <input
          id="division1Name"
          type="text"
          name="division1Name"
          value={formData.division1Name}
          onChange={handleInputChange}
          className="form-control"
          placeholder="Enter division 1 name"
          disabled={isLoading}
          aria-describedby="division1Name-error"
        />
      </div>
      <div className="form-group mb-3">
        <label htmlFor="division2Name" className="form-label">
          Division 2 Name
        </label>
        <input
          id="division2Name"
          type="text"
          name="division2Name"
          value={formData.division2Name}
          onChange={handleInputChange}
          className="form-control"
          placeholder="Enter division 2 name"
          disabled={isLoading}
          aria-describedby="division2Name-error"
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