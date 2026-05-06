interface RosterRulesStepProps {
  formData: Record<string, string>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  setError: (msg: string) => void;
  prefix: 'regular' | 'vampire';
  title: string;
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
}

interface FieldDef {
  name: string;
  label: string;
  min: number;
  step: number;
}

const RosterRulesStep = ({
  formData,
  handleInputChange,
  setError,
  prefix,
  title,
  onNext,
  onBack,
  isLoading,
}: RosterRulesStepProps) => {
  const validateRosterRules = (): boolean => {
    const activeCounts = [
      parseInt(formData[`${prefix}_quarterback_count`]) || 0,
      parseInt(formData[`${prefix}_running_back_count`]) || 0,
      parseInt(formData[`${prefix}_wide_receiver_count`]) || 0,
      parseInt(formData[`${prefix}_tight_end_count`]) || 0,
      parseInt(formData[`${prefix}_wide_receiver_tight_end_count`]) || 0,
      parseInt(formData[`${prefix}_flex_count`]) || 0,
      parseInt(formData[`${prefix}_bench_count`]) || 0,
    ];
    const maxCounts = [
      parseInt(formData[`${prefix}_max_qb_count`]) || 0,
      parseInt(formData[`${prefix}_max_rb_count`]) || 0,
      parseInt(formData[`${prefix}_max_wr_count`]) || 0,
      parseInt(formData[`${prefix}_max_te_count`]) || 0,
    ];
    const irCount = parseInt(formData[`${prefix}_ir_count`]) || 0;
    const beginningFaab = parseInt(formData[`${prefix}_beginning_faab`]) || 0;
    const totalActive = activeCounts.reduce((sum, count) => sum + count, 0);
    const maxRosterSize = parseInt(formData[`${prefix}_max_roster_size`]) || 0;

    if (maxRosterSize < 1) {
      setError('Max roster size must be at least 1');
      return false;
    }
    if (totalActive > maxRosterSize) {
      setError('Total active position counts and bench must not exceed max roster size');
      return false;
    }
    if (
      activeCounts.some(count => count < 0) ||
      maxCounts.some(count => count < 0) ||
      irCount < 0 ||
      beginningFaab < 0
    ) {
      setError('Position counts and beginning FAAB budget cannot be negative');
      return false;
    }
    if (
      parseInt(formData[`${prefix}_quarterback_count`]) >
      parseInt(formData[`${prefix}_max_qb_count`])
    ) {
      setError('Quarterback count cannot exceed max QB count');
      return false;
    }
    if (
      parseInt(formData[`${prefix}_running_back_count`]) >
      parseInt(formData[`${prefix}_max_rb_count`])
    ) {
      setError('Running back count cannot exceed max RB count');
      return false;
    }
    if (
      parseInt(formData[`${prefix}_wide_receiver_count`]) >
      parseInt(formData[`${prefix}_max_wr_count`])
    ) {
      setError('Wide receiver count cannot exceed max WR count');
      return false;
    }
    if (
      parseInt(formData[`${prefix}_tight_end_count`]) >
      parseInt(formData[`${prefix}_max_te_count`])
    ) {
      setError('Tight end count cannot exceed max TE count');
      return false;
    }
    return true;
  };

  const handleNextClick = () => {
    if (validateRosterRules()) {
      setError('');
      onNext();
    }
  };

  const fields: FieldDef[] = [
    { name: `${prefix}_quarterback_count`, label: 'Quarterback Count (Active)', min: 0, step: 1 },
    { name: `${prefix}_max_qb_count`, label: 'Max Quarterback Count', min: 0, step: 1 },
    { name: `${prefix}_running_back_count`, label: 'Running Back Count (Active)', min: 0, step: 1 },
    { name: `${prefix}_max_rb_count`, label: 'Max Running Back Count', min: 0, step: 1 },
    { name: `${prefix}_wide_receiver_count`, label: 'Wide Receiver Count (Active)', min: 0, step: 1 },
    { name: `${prefix}_max_wr_count`, label: 'Max Wide Receiver Count', min: 0, step: 1 },
    { name: `${prefix}_tight_end_count`, label: 'Tight End Count (Active)', min: 0, step: 1 },
    { name: `${prefix}_max_te_count`, label: 'Max Tight End Count', min: 0, step: 1 },
    { name: `${prefix}_wide_receiver_tight_end_count`, label: 'WR/TE Count (Active)', min: 0, step: 1 },
    { name: `${prefix}_flex_count`, label: 'Flex Count (Active)', min: 0, step: 1 },
    { name: `${prefix}_bench_count`, label: 'Bench Count', min: 0, step: 1 },
    { name: `${prefix}_ir_count`, label: 'Injured Reserve Count', min: 0, step: 1 },
    { name: `${prefix}_max_roster_size`, label: 'Max Roster Size', min: 1, step: 1 },
    { name: `${prefix}_beginning_faab`, label: 'Beginning FAAB Budget', min: 0, step: 1 },
  ];

  return (
    <div className="form-group">
      <h3 className="text-center mb-4">{title}</h3>
      <div className="form-group mb-3">
        <label className="form-label">Roster Type</label>
        <input
          type="text"
          value={prefix === 'regular' ? 'Regular' : 'Vampire'}
          readOnly
          className="form-control"
          disabled
        />
      </div>
      {fields.map(({ name, label, min, step }) => (
        <div key={name} className="form-group mb-3">
          <label htmlFor={name} className="form-label">
            {label}
          </label>
          <input
            id={name}
            type="number"
            name={name}
            value={formData[name]}
            onChange={handleInputChange}
            step={step}
            min={min}
            className="form-control"
            placeholder={`Enter ${label.toLowerCase()}`}
            disabled={isLoading}
            aria-describedby={`${name}-error`}
          />
        </div>
      ))}
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
          onClick={handleNextClick}
          disabled={isLoading}
          className="btn btn-success w-45"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default RosterRulesStep;