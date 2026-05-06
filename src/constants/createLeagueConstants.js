import * as yup from 'yup';

export const defaultFormValues = {
  leagueName: '',
  regular_quarterback_count: 1,
  regular_running_back_count: 2,
  regular_wide_receiver_count: 2,
  regular_tight_end_count: 1,
  regular_wide_receiver_tight_end_count: 0,
  regular_flex_count: 1,
  regular_bench_count: 6,
  regular_ir_count: 2,
  regular_max_roster_size: 13,
  regular_max_qb_count: 4,
  regular_max_rb_count: 8,
  regular_max_wr_count: 8,
  regular_max_te_count: 4,
  regular_beginning_faab: 100,
  vampire_quarterback_count: 1,
  vampire_running_back_count: 2,
  vampire_wide_receiver_count: 2,
  vampire_tight_end_count: 1,
  vampire_wide_receiver_tight_end_count: 0,
  vampire_flex_count: 1,
  vampire_bench_count: 6,
  vampire_ir_count: 2,
  vampire_max_roster_size: 13,
  vampire_max_qb_count: 4,
  vampire_max_rb_count: 8,
  vampire_max_wr_count: 8,
  vampire_max_te_count: 4,
  vampire_beginning_faab: 100,
  passing_yards: 0.04,
  passing_touchdowns: 4,
  interceptions_thrown: -2,
  two_point_pass: 1,
  passing_300_399: 5,
  passing_400_plus: 10,
  rushing_yards: 0.1,
  rushing_touchdowns: 6,
  two_point_rush: 2,
  rushing_100_199: 5,
  rushing_200_plus: 10,
  receiving_yards: 0.1,
  receptions: 1,
  receiving_touchdowns: 6,
  two_point_reception: 2,
  receiving_100_199: 5,
  receiving_200_plus: 10,
  kickoff_return_touchdown: 6,
  punt_return_touchdown: 6,
  fumble_recovered_touchdown: 6,
  fumbles_lost: -2,
  interception_return_touchdown: 6,
  fumble_return_touchdown: 6,
  blocked_return_touchdown: 6,
  two_point_return: 2,
  one_point_safety: 2,
};

const rosterRulesSchema = (prefix) =>
  yup.object({
    [`${prefix}_quarterback_count`]: yup
      .number()
      .min(0, 'Cannot be negative')
      .integer()
      .required('Required')
      .typeError('Must be a number'),
    [`${prefix}_max_qb_count`]: yup
      .number()
      .min(yup.ref(`${prefix}_quarterback_count`), 'Must be at least quarterback count')
      .integer()
      .required('Required')
      .typeError('Must be a number'),
    [`${prefix}_running_back_count`]: yup
      .number()
      .min(0, 'Cannot be negative')
      .integer()
      .required('Required')
      .typeError('Must be a number'),
    [`${prefix}_max_rb_count`]: yup
      .number()
      .min(yup.ref(`${prefix}_running_back_count`), 'Must be at least running back count')
      .integer()
      .required('Required')
      .typeError('Must be a number'),
    [`${prefix}_wide_receiver_count`]: yup
      .number()
      .min(0, 'Cannot be negative')
      .integer()
      .required('Required')
      .typeError('Must be a number'),
    [`${prefix}_max_wr_count`]: yup
      .number()
      .min(yup.ref(`${prefix}_wide_receiver_count`), 'Must be at least wide receiver count')
      .integer()
      .required('Required')
      .typeError('Must be a number'),
    [`${prefix}_tight_end_count`]: yup
      .number()
      .min(0, 'Cannot be negative')
      .integer()
      .required('Required')
      .typeError('Must be a number'),
    [`${prefix}_max_te_count`]: yup
      .number()
      .min(yup.ref(`${prefix}_tight_end_count`), 'Must be at least tight end count')
      .integer()
      .required('Required')
      .typeError('Must be a number'),
    [`${prefix}_wide_receiver_tight_end_count`]: yup
      .number()
      .min(0, 'Cannot be negative')
      .integer()
      .required('Required')
      .typeError('Must be a number'),
    [`${prefix}_flex_count`]: yup
      .number()
      .min(0, 'Cannot be negative')
      .integer()
      .required('Required')
      .typeError('Must be a number'),
    [`${prefix}_bench_count`]: yup
      .number()
      .min(0, 'Cannot be negative')
      .integer()
      .required('Required')
      .typeError('Must be a number'),
    [`${prefix}_ir_count`]: yup
      .number()
      .min(0, 'Cannot be negative')
      .integer()
      .required('Required')
      .typeError('Must be a number'),
    [`${prefix}_max_roster_size`]: yup
      .number()
      .min(1, 'Must be at least 1')
      .integer()
      .test(
        'max-roster-size',
        'Total active positions and bench must not exceed max roster size',
        function (value) {
          const activeCounts = [
            this.parent[`${prefix}_quarterback_count`],
            this.parent[`${prefix}_running_back_count`],
            this.parent[`${prefix}_wide_receiver_count`],
            this.parent[`${prefix}_tight_end_count`],
            this.parent[`${prefix}_wide_receiver_tight_end_count`],
            this.parent[`${prefix}_flex_count`],
            this.parent[`${prefix}_bench_count`],
          ].reduce((sum, count) => sum + (count || 0), 0);
          return activeCounts <= value;
        }
      )
      .required('Required')
      .typeError('Must be a number'),
    [`${prefix}_beginning_faab`]: yup
      .number()
      .min(0, 'Cannot be negative')
      .integer()
      .required('Required')
      .typeError('Must be a number'),
  });

export const leagueFormSchema = yup.object({
  leagueName: yup
    .string()
    .required('League name is required')
    .trim(),
  ...rosterRulesSchema('regular'),
  ...rosterRulesSchema('vampire'),
  passing_yards: yup
    .number()
    .required('Required')
    .typeError('Must be a number'),
  passing_touchdowns: yup
    .number()
    .integer()
    .required('Required')
    .typeError('Must be a number'),
  interceptions_thrown: yup
    .number()
    .integer()
    .required('Required')
    .typeError('Must be a number'),
  two_point_pass: yup
    .number()
    .integer()
    .required('Required')
    .typeError('Must be a number'),
  passing_300_399: yup
    .number()
    .integer()
    .required('Required')
    .typeError('Must be a number'),
  passing_400_plus: yup
    .number()
    .integer()
    .required('Required')
    .typeError('Must be a number'),
  rushing_yards: yup
    .number()
    .required('Required')
    .typeError('Must be a number'),
  rushing_touchdowns: yup
    .number()
    .integer()
    .required('Required')
    .typeError('Must be a number'),
  two_point_rush: yup
    .number()
    .integer()
    .required('Required')
    .typeError('Must be a number'),
  rushing_100_199: yup
    .number()
    .integer()
    .required('Required')
    .typeError('Must be a number'),
  rushing_200_plus: yup
    .number()
    .integer()
    .required('Required')
    .typeError('Must be a number'),
  receiving_yards: yup
    .number()
    .required('Required')
    .typeError('Must be a number'),
  receptions: yup
    .number()
    .integer()
    .required('Required')
    .typeError('Must be a number'),
  receiving_touchdowns: yup
    .number()
    .integer()
    .required('Required')
    .typeError('Must be a number'),
  two_point_reception: yup
    .number()
    .integer()
    .required('Required')
    .typeError('Must be a number'),
  receiving_100_199: yup
    .number()
    .integer()
    .required('Required')
    .typeError('Must be a number'),
  receiving_200_plus: yup
    .number()
    .integer()
    .required('Required')
    .typeError('Must be a number'),
  kickoff_return_touchdown: yup
    .number()
    .integer()
    .required('Required')
    .typeError('Must be a number'),
  punt_return_touchdown: yup
    .number()
    .integer()
    .required('Required')
    .typeError('Must be a number'),
  fumble_recovered_touchdown: yup
    .number()
    .integer()
    .required('Required')
    .typeError('Must be a number'),
  fumbles_lost: yup
    .number()
    .integer()
    .required('Required')
    .typeError('Must be a number'),
  interception_return_touchdown: yup
    .number()
    .integer()
    .required('Required')
    .typeError('Must be a number'),
  fumble_return_touchdown: yup
    .number()
    .integer()
    .required('Required')
    .typeError('Must be a number'),
  blocked_return_touchdown: yup
    .number()
    .integer()
    .required('Required')
    .typeError('Must be a number'),
  two_point_return: yup
    .number()
    .integer()
    .required('Required')
    .typeError('Must be a number'),
  one_point_safety: yup
    .number()
    .integer()
    .required('Required')
    .typeError('Must be a number'),
});