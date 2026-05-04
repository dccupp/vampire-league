import axiosInstance from '../api';
import { isAxiosError } from 'axios';
import { ScoringRules } from '../types';

export const calculateFantasyWeekScores = async (
  playerIds: string[],
  week: number,
  season: number,
  leagueId: number,
  includeYearlyStats = false,
  existingScoringRules: ScoringRules | null = null
) => {
  try {
    if (!Array.isArray(playerIds) || playerIds.length === 0) {
      throw new Error('Player IDs must be a non-empty array');
    }
    if (!Number.isInteger(week) || week < 1) {
      throw new Error('Week must be a positive integer');
    }
    if (!Number.isInteger(season) || season < 2000) {
      throw new Error('Season must be a valid year');
    }
    if (!Number.isInteger(leagueId) || leagueId < 1) {
      throw new Error('League ID must be a positive integer');
    }

    let scoringRules: ScoringRules | null = existingScoringRules;
    if (!scoringRules) {
      const scoringRulesResponse = await axiosInstance.get(`/scoring_rules/getScoringRulesByLeagueId/${leagueId}`);
      if (scoringRulesResponse.data.status === 'error') {
        throw new Error(scoringRulesResponse.data.message || 'Failed to fetch scoring rules');
      }
      scoringRules = scoringRulesResponse.data;
    }

    const weeklyStatsResponse = await axiosInstance.post('/weekly_stats/getWeeklyStatsByPlayerIdsSeasonAndWeek', {
      player_ids: playerIds,
      season,
      week,
    });
    const weeklyStats = Array.isArray(weeklyStatsResponse.data) ? weeklyStatsResponse.data : [];

    let yearlyStats: any[] = [];
    if (includeYearlyStats) {
      const yearlyStatsPromises = playerIds.map(playerId =>
        axiosInstance.get(`/yearly_stats/getYearlyStatsByPlayerId/${playerId}`)
          .then(response => response.data)
          .catch(() => [])
      );
      const yearlyStatsResponses = await Promise.all(yearlyStatsPromises);
      yearlyStats = yearlyStatsResponses.flat().filter((stat: any) => stat.season === season);
    }

    const rules = scoringRules!;
    const playerScores = playerIds.map(playerId => {
      const weeklyStat = weeklyStats.find((stat: any) => stat.player_id === playerId);
      let score = 0;

      if (weeklyStat) {
        score += (weeklyStat.passing_yards || 0) * (rules.passing_yards || 0);
        score += (weeklyStat.passing_tds || 0) * (rules.passing_touchdowns || 0);
        score += (weeklyStat.interceptions || 0) * (rules.interceptions_thrown || 0);
        score += (weeklyStat.two_point_passes || 0) * (rules.two_point_pass || 0);
        if (weeklyStat.passing_yards >= 400) score += rules.passing_400_plus || 0;
        else if (weeklyStat.passing_yards >= 300) score += rules.passing_300_399 || 0;
        score += (weeklyStat.rushing_yards || 0) * (rules.rushing_yards || 0);
        score += (weeklyStat.rushing_tds || 0) * (rules.rushing_touchdowns || 0);
        score += (weeklyStat.two_point_rushes || 0) * (rules.two_point_rush || 0);
        if (weeklyStat.rushing_yards >= 200) score += rules.rushing_200_plus || 0;
        else if (weeklyStat.rushing_yards >= 100) score += rules.rushing_100_199 || 0;
        score += (weeklyStat.receptions || 0) * (rules.receptions || 0);
        score += (weeklyStat.receiving_yards || 0) * (rules.receiving_yards || 0);
        score += (weeklyStat.receiving_tds || 0) * (rules.receiving_touchdowns || 0);
        score += (weeklyStat.two_point_receptions || 0) * (rules.two_point_reception || 0);
        if (weeklyStat.receiving_yards >= 200) score += rules.receiving_200_plus || 0;
        else if (weeklyStat.receiving_yards >= 100) score += rules.receiving_100_199 || 0;
        score += (weeklyStat.special_teams_tds || 0) * (rules.kickoff_return_touchdown || 0);
      }

      return {
        player_id: playerId,
        fantasyScore: score.toFixed(2),
        weeklyStats: weeklyStat || null,
        yearlyStats: includeYearlyStats ? yearlyStats.find((stat: any) => stat.player_id === playerId) || null : null,
      };
    });

    return { status: 'success', data: playerScores };
  } catch (error) {
    const msg = isAxiosError(error)
      ? error.response?.data?.message || error.message
      : error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error('Error calculating fantasy scores:', msg);
    return { status: 'error', message: msg, data: [] };
  }
};

export const calculateFantasySeasonScores = async (
  playerIds: string[],
  season: number,
  leagueId: number
) => {
  try {
    if (!Array.isArray(playerIds) || playerIds.length === 0) {
      throw new Error('Player IDs must be a non-empty array');
    }
    if (!Number.isInteger(season) || season < 2000) {
      throw new Error('Season must be a valid year');
    }
    if (!Number.isInteger(leagueId) || leagueId < 1) {
      throw new Error('League ID must be a positive integer');
    }

    const scoringRulesResponse = await axiosInstance.get(`/scoring_rules/getScoringRulesByLeagueId/${leagueId}`);
    if (scoringRulesResponse.data.status === 'error') {
      throw new Error(scoringRulesResponse.data.message || 'Failed to fetch scoring rules');
    }
    const rules: ScoringRules = scoringRulesResponse.data;

    const yearlyStatsResponse = await axiosInstance.get(`/yearly_stats/getYearlyStatsBySeason/${season}`);
    const allYearlyStats: any[] = Array.isArray(yearlyStatsResponse.data) ? yearlyStatsResponse.data : [];

    const defaultStats = {
      passing_yards: 0, passing_tds: 0, interceptions: 0, two_point_passes: 0,
      rushing_yards: 0, rushing_tds: 0, two_point_rushes: 0,
      receptions: 0, receiving_yards: 0, receiving_tds: 0, two_point_receptions: 0,
      special_teams_tds: 0,
    };

    const playerScores = playerIds.map(playerId => {
      const yearlyStat = allYearlyStats.find((stat: any) => stat.player_id === playerId) || defaultStats;
      let score = 0;

      score += (yearlyStat.passing_yards || 0) * (rules.passing_yards || 0);
      score += (yearlyStat.passing_tds || 0) * (rules.passing_touchdowns || 0);
      score += (yearlyStat.interceptions || 0) * (rules.interceptions_thrown || 0);
      score += (yearlyStat.two_point_passes || 0) * (rules.two_point_pass || 0);
      score += (yearlyStat.rushing_yards || 0) * (rules.rushing_yards || 0);
      score += (yearlyStat.rushing_tds || 0) * (rules.rushing_touchdowns || 0);
      score += (yearlyStat.two_point_rushes || 0) * (rules.two_point_rush || 0);
      score += (yearlyStat.receptions || 0) * (rules.receptions || 0);
      score += (yearlyStat.receiving_yards || 0) * (rules.receiving_yards || 0);
      score += (yearlyStat.receiving_tds || 0) * (rules.receiving_touchdowns || 0);
      score += (yearlyStat.two_point_receptions || 0) * (rules.two_point_reception || 0);
      score += (yearlyStat.special_teams_tds || 0) * (rules.kickoff_return_touchdown || 0);

      return {
        player_id: playerId,
        fantasyScore: score.toFixed(2),
        yearlyStats: yearlyStat,
      };
    });

    return { status: 'success', data: playerScores };
  } catch (error) {
    const msg = isAxiosError(error)
      ? error.response?.data?.message || error.message
      : error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error('Error calculating fantasy season scores:', msg);
    return { status: 'error', message: msg, data: [] };
  }
};