import { isAxiosError } from 'axios';
import axiosInstance from '../api';

export const createLeague = async (
  formData: Record<string, string>,
  userId: number
): Promise<void> => {
  try {
    const userResponse = await axiosInstance.get(`/users/getUserById/${userId}`);
    if (!userResponse.data || !userResponse.data.first_name) {
      throw new Error(userResponse.data.message || 'Failed to fetch user data or first name.');
    }
    const firstName: string = userResponse.data.first_name;

    const leagueResponse = await axiosInstance.post('/leagues/create', {
      name: formData.leagueName,
      is_active: 0,
    });
    if (leagueResponse.data.status !== 'success') {
      throw new Error(leagueResponse.data.message || 'Failed to create league');
    }
    const leagueId: number = leagueResponse.data.league_id;

    const regularRosterResponse = await axiosInstance.post('/roster_rules/create', {
      league_id: leagueId,
      roster_type_id: 1,
      quarterback_count: parseInt(formData.regular_quarterback_count),
      running_back_count: parseInt(formData.regular_running_back_count),
      wide_receiver_count: parseInt(formData.regular_wide_receiver_count),
      tight_end_count: parseInt(formData.regular_tight_end_count),
      wide_receiver_tight_end_count: parseInt(formData.regular_wide_receiver_tight_end_count),
      flex_count: parseInt(formData.regular_flex_count),
      bench_count: parseInt(formData.regular_bench_count),
      ir_count: parseInt(formData.regular_ir_count),
      max_roster_size: parseInt(formData.regular_max_roster_size),
      max_qb_count: parseInt(formData.regular_max_qb_count),
      max_rb_count: parseInt(formData.regular_max_rb_count),
      max_wr_count: parseInt(formData.regular_max_wr_count),
      max_te_count: parseInt(formData.regular_max_te_count),
      beginning_faab: parseInt(formData.regular_beginning_faab),
    });
    if (regularRosterResponse.data.status !== 'success') {
      throw new Error(
        regularRosterResponse.data.message || 'Failed to create regular roster rules'
      );
    }

    const vampireRosterResponse = await axiosInstance.post('/roster_rules/create', {
      league_id: leagueId,
      roster_type_id: 2,
      quarterback_count: parseInt(formData.vampire_quarterback_count),
      running_back_count: parseInt(formData.vampire_running_back_count),
      wide_receiver_count: parseInt(formData.vampire_wide_receiver_count),
      tight_end_count: parseInt(formData.vampire_tight_end_count),
      wide_receiver_tight_end_count: parseInt(formData.vampire_wide_receiver_tight_end_count),
      flex_count: parseInt(formData.vampire_flex_count),
      bench_count: parseInt(formData.vampire_bench_count),
      ir_count: parseInt(formData.vampire_ir_count),
      max_roster_size: parseInt(formData.vampire_max_roster_size),
      max_qb_count: parseInt(formData.vampire_max_qb_count),
      max_rb_count: parseInt(formData.vampire_max_rb_count),
      max_wr_count: parseInt(formData.vampire_max_wr_count),
      max_te_count: parseInt(formData.vampire_max_te_count),
      beginning_faab: parseInt(formData.vampire_beginning_faab),
    });
    if (vampireRosterResponse.data.status !== 'success') {
      throw new Error(
        vampireRosterResponse.data.message || 'Failed to create vampire roster rules'
      );
    }

    const scoringResponse = await axiosInstance.post('/scoring_rules/create', {
      league_id: leagueId,
      passing_yards: parseFloat(formData.passing_yards),
      passing_touchdowns: parseInt(formData.passing_touchdowns),
      interceptions_thrown: parseInt(formData.interceptions_thrown),
      two_point_pass: parseInt(formData.two_point_pass),
      passing_300_399: parseInt(formData.passing_300_399),
      passing_400_plus: parseInt(formData.passing_400_plus),
      rushing_yards: parseFloat(formData.rushing_yards),
      rushing_touchdowns: parseInt(formData.rushing_touchdowns),
      two_point_rush: parseInt(formData.two_point_rush),
      rushing_100_199: parseInt(formData.rushing_100_199),
      rushing_200_plus: parseInt(formData.rushing_200_plus),
      receiving_yards: parseFloat(formData.receiving_yards),
      receptions: parseInt(formData.receptions),
      receiving_touchdowns: parseInt(formData.receiving_touchdowns),
      two_point_reception: parseInt(formData.two_point_reception),
      receiving_100_199: parseInt(formData.receiving_100_199),
      receiving_200_plus: parseInt(formData.receiving_200_plus),
      kickoff_return_touchdown: parseInt(formData.kickoff_return_touchdown),
      punt_return_touchdown: parseInt(formData.punt_return_touchdown),
      fumble_recovered_touchdown: parseInt(formData.fumble_recovered_touchdown),
      fumbles_lost: parseInt(formData.fumbles_lost),
      interception_return_touchdown: parseInt(formData.interception_return_touchdown),
      fumble_return_touchdown: parseInt(formData.fumble_return_touchdown),
      blocked_return_touchdown: parseInt(formData.blocked_return_touchdown),
      two_point_return: parseInt(formData.two_point_return),
      one_point_safety: parseInt(formData.one_point_safety),
    });
    if (scoringResponse.data.status !== 'success') {
      throw new Error(scoringResponse.data.message || 'Failed to create scoring rules');
    }

    const waiverRulesResponse = await axiosInstance.post('/waiver_rules/create', {
      league_id: leagueId,
      waivers_length: parseInt(formData.waivers_length),
      waiver_day: formData.waiver_day,
    });
    if (waiverRulesResponse.data.status !== 'success') {
      throw new Error(waiverRulesResponse.data.message || 'Failed to create waiver rules');
    }

    const leagueMemberResponse = await axiosInstance.post('/league_members/create', {
      league_id: leagueId,
      user_id: userId,
      role: 'commish',
      is_vamp: 0,
      team_name: `Team ${firstName}`,
      remaining_faab_budget: parseInt(formData.regular_beginning_faab),
    });
    if (leagueMemberResponse.data.status !== 'success') {
      throw new Error(leagueMemberResponse.data.message || 'Failed to add commissioner');
    }
  } catch (err: unknown) {
    if (isAxiosError(err)) {
      throw new Error(err.response?.data?.message || err.message || 'An unexpected error occurred');
    }
    throw new Error(
      err instanceof Error ? err.message : 'An unexpected error occurred'
    );
  }
};