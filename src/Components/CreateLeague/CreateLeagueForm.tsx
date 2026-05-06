import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createLeague } from '../../api/leagueService';
import { CurrentUser } from '../../types';
import ProgressBar from './ProgressBar';
import LeagueInfoStep from './LeagueInfoStep';
import RosterRulesStep from './RosterRulesStep';
import ScoringRulesStep from './ScoringRulesStep';
import WaiverRulesStep from './WaiverRulesStep';
import './CreateLeagueFormComponent.css';

interface CreateLeagueFormProps {
  currentUser: CurrentUser;
}

const defaultFormValues: Record<string, string> = {
  leagueName: '',
  regular_quarterback_count: '1',
  regular_running_back_count: '2',
  regular_wide_receiver_count: '2',
  regular_tight_end_count: '1',
  regular_wide_receiver_tight_end_count: '0',
  regular_flex_count: '1',
  regular_bench_count: '6',
  regular_ir_count: '2',
  regular_max_roster_size: '13',
  regular_max_qb_count: '4',
  regular_max_rb_count: '8',
  regular_max_wr_count: '8',
  regular_max_te_count: '4',
  regular_beginning_faab: '100',
  vampire_quarterback_count: '1',
  vampire_running_back_count: '2',
  vampire_wide_receiver_count: '2',
  vampire_tight_end_count: '1',
  vampire_wide_receiver_tight_end_count: '0',
  vampire_flex_count: '1',
  vampire_bench_count: '6',
  vampire_ir_count: '2',
  vampire_max_roster_size: '13',
  vampire_max_qb_count: '4',
  vampire_max_rb_count: '8',
  vampire_max_wr_count: '8',
  vampire_max_te_count: '4',
  vampire_beginning_faab: '100',
  passing_yards: '0.04',
  passing_touchdowns: '4',
  interceptions_thrown: '-2',
  two_point_pass: '1',
  passing_300_399: '5',
  passing_400_plus: '10',
  rushing_yards: '0.1',
  rushing_touchdowns: '6',
  two_point_rush: '2',
  rushing_100_199: '5',
  rushing_200_plus: '10',
  receiving_yards: '0.1',
  receptions: '1',
  receiving_touchdowns: '6',
  two_point_reception: '2',
  receiving_100_199: '5',
  receiving_200_plus: '10',
  kickoff_return_touchdown: '6',
  punt_return_touchdown: '6',
  fumble_recovered_touchdown: '6',
  fumbles_lost: '-2',
  interception_return_touchdown: '6',
  fumble_return_touchdown: '6',
  blocked_return_touchdown: '6',
  two_point_return: '2',
  one_point_safety: '2',
  waivers_length: '2',
  waiver_day: 'Wednesday',
};

const CreateLeagueForm = ({ currentUser }: CreateLeagueFormProps) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<Record<string, string>>(defaultFormValues);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (formRef.current) {
      window.scrollTo({ top: formRef.current.offsetTop, behavior: 'smooth' });
    }
  }, [step]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleNext = useCallback(() => {
    setError('');
    setStep(prev => prev + 1);
  }, []);

  const handleBack = useCallback(() => {
    setError('');
    setStep(prev => prev - 1);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!currentUser?.id) {
      setError('User information is missing. Please log in.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await createLeague(formData, currentUser.id);
      navigate('/landing');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create league');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, navigate, formData]);

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <LeagueInfoStep
            formData={formData}
            handleInputChange={handleInputChange}
            setError={setError}
            onNext={handleNext}
            isLoading={isLoading}
          />
        );
      case 2:
        return (
          <RosterRulesStep
            formData={formData}
            handleInputChange={handleInputChange}
            setError={setError}
            prefix="regular"
            title="Regular Roster Rules"
            onNext={handleNext}
            onBack={handleBack}
            isLoading={isLoading}
          />
        );
      case 3:
        return (
          <RosterRulesStep
            formData={formData}
            handleInputChange={handleInputChange}
            setError={setError}
            prefix="vampire"
            title="Vampire Roster Rules"
            onNext={handleNext}
            onBack={handleBack}
            isLoading={isLoading}
          />
        );
      case 4:
        return (
          <ScoringRulesStep
            formData={formData}
            handleInputChange={handleInputChange}
            setError={setError}
            onNext={handleNext}
            onBack={handleBack}
            isLoading={isLoading}
          />
        );
      case 5:
        return (
          <WaiverRulesStep
            formData={formData}
            handleInputChange={handleInputChange}
            setError={setError}
            onSubmit={handleSubmit}
            onBack={handleBack}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="create-league-container">
      <div className="create-league-form" ref={formRef}>
        <ProgressBar step={step} totalSteps={5} />
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}
        {renderStep()}
      </div>
    </div>
  );
};

export default CreateLeagueForm;