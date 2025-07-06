import React from 'react';

const ProgressBar = ({ step, totalSteps }) => {
  const progress = (step / totalSteps) * 100;

  return (
    <div className="progress mb-4">
      <div
        className="progress-bar bg-success"
        role="progressbar"
        style={{ width: `${progress}%` }}
        aria-valuenow={progress}
        aria-valuemin="0"
        aria-valuemax="100"
      ></div>
    </div>
  );
};

export default ProgressBar;