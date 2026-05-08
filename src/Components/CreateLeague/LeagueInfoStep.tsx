import { ChangeEvent } from 'react';

interface LeagueInfoStepProps {
  formData: Record<string, string>;
  handleInputChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  setError: (msg: string) => void;
  onNext: () => void;
  isLoading: boolean;
}

const LeagueInfoStep = ({
  formData,
  handleInputChange,
  setError,
  onNext,
  isLoading,
}: LeagueInfoStepProps) => {
  const validateStep = (): boolean => {
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
    <div>
      <h3 className="clf-title">Step 1: League Information</h3>
      <div className="clf-form-group">
        <label htmlFor="leagueName" className="clf-label">
          League Name
        </label>
        <input
          id="leagueName"
          type="text"
          name="leagueName"
          value={formData.leagueName}
          onChange={handleInputChange}
          className="clf-input"
          placeholder="Enter league name"
          disabled={isLoading}
          aria-describedby="leagueName-error"
        />
      </div>
      <button
        type="button"
        onClick={handleNextClick}
        disabled={isLoading}
        className="clf-btn-primary"
      >
        Next
      </button>
    </div>
  );
};

export default LeagueInfoStep;
