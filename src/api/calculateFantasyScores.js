import axiosInstance from '../api';

export const calculateFantasyWeekScores = async (playerIds, week, season, leagueId, includeYearlyStats = false) => {

  try {
    // Validate inputs
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

    // Step 1: Fetch scoring rules
    const scoringRulesResponse = await axiosInstance.get(`/scoring_rules/getScoringRulesByLeagueId/${leagueId}`);
    if (scoringRulesResponse.data.status === 'error') {
      throw new Error(scoringRulesResponse.data.message || 'Failed to fetch scoring rules');
    }
    const scoringRules = scoringRulesResponse.data;

    // Step 2: Fetch weekly stats
    const weeklyStatsResponse = await axiosInstance.post('/weekly_stats/getWeeklyStatsByPlayerIdsSeasonAndWeek', {
      player_ids: playerIds,
      season,
      week,
    });
    const weeklyStats = Array.isArray(weeklyStatsResponse.data) ? weeklyStatsResponse.data : [];

    // Step 3: Fetch yearly stats (if requested)
    let yearlyStats = [];
    if (includeYearlyStats) {
      const yearlyStatsPromises = playerIds.map(playerId =>
        axiosInstance.get(`/yearly_stats/getYearlyStatsByPlayerId/${playerId}`)
          .then(response => response.data)
          .catch(error => {
            console.error(`Error fetching yearly stats for player ${playerId}:`, error.response?.data?.message || error.message);
            return [];
          })
      );
      const yearlyStatsResponses = await Promise.all(yearlyStatsPromises);
      yearlyStats = yearlyStatsResponses.flat().filter(stat => stat.season === season);
    }

    // Step 4: Calculate fantasy scores
    const playerScores = playerIds.map(playerId => {
      const weeklyStat = weeklyStats.find(stat => stat.player_id === playerId);
      let score = 0;

      if (weeklyStat) {
        score += (weeklyStat.passing_yards || 0) * (scoringRules.passing_yards || 0);
        score += (weeklyStat.passing_tds || 0) * (scoringRules.passing_touchdowns || 0);
        score += (weeklyStat.interceptions || 0) * (scoringRules.interceptions_thrown || 0);
        score += (weeklyStat.two_point_passes || 0) * (scoringRules.two_point_pass || 0);
        if (weeklyStat.passing_yards >= 400) score += scoringRules.passing_400_plus || 0;
        else if (weeklyStat.passing_yards >= 300) score += scoringRules.passing_300_399 || 0;
        score += (weeklyStat.rushing_yards || 0) * (scoringRules.rushing_yards || 0);
        score += (weeklyStat.rushing_tds || 0) * (scoringRules.rushing_touchdowns || 0);
        score += (weeklyStat.two_point_rushes || 0) * (scoringRules.two_point_rush || 0);
        if (weeklyStat.rushing_yards >= 200) score += scoringRules.rushing_200_plus || 0;
        else if (weeklyStat.rushing_yards >= 100) score += scoringRules.rushing_100_199 || 0;
        score += (weeklyStat.receptions || 0) * (scoringRules.receptions || 0);
        score += (weeklyStat.receiving_yards || 0) * (scoringRules.receiving_yards || 0);
        score += (weeklyStat.receiving_tds || 0) * (scoringRules.receiving_touchdowns || 0);
        score += (weeklyStat.two_point_receptions || 0) * (scoringRules.two_point_reception || 0);
        if (weeklyStat.receiving_yards >= 200) score += scoringRules.receiving_200_plus || 0;
        else if (weeklyStat.receiving_yards >= 100) score += scoringRules.receiving_100_199 || 0;
        score += (weeklyStat.special_teams_tds || 0) * (scoringRules.kickoff_return_touchdown || 0);
      }

      return {
        player_id: playerId,
        fantasyScore: score.toFixed(2),
        weeklyStats: weeklyStat || null,
        yearlyStats: includeYearlyStats ? yearlyStats.find(stat => stat.player_id === playerId) || null : null,
      };
    });

    return {
      status: 'success',
      data: playerScores,
    };
  } catch (error) {
    console.error('Error calculating fantasy scores:', error.response?.data?.message || error.message);
    return {
      status: 'error',
      message: error.response?.data?.message || error.message || 'An unexpected error occurred',
      data: [],
    };
  }
};

export const calculateFantasySeasonScores = async (playerIds, season, leagueId) => {

  try {
    // Validate inputs
    if (!Array.isArray(playerIds) || playerIds.length === 0) {
      throw new Error('Player IDs must be a non-empty array');
    }
    if (!Number.isInteger(season) || season < 2000) {
      throw new Error('Season must be a valid year');
    }
    if (!Number.isInteger(leagueId) || leagueId < 1) {
      throw new Error('League ID must be a positive integer');
    }

    // Step 1: Fetch scoring rules
    const scoringRulesResponse = await axiosInstance.get(`/scoring_rules/getScoringRulesByLeagueId/${leagueId}`);
    if (scoringRulesResponse.data.status === 'error') {
      throw new Error(scoringRulesResponse.data.message || 'Failed to fetch scoring rules');
    }
    const scoringRules = scoringRulesResponse.data;

    // Step 2: Fetch all yearly stats for the season in one call
    const yearlyStatsResponse = await axiosInstance.get(`/yearly_stats/getYearlyStatsBySeason/${season}`);
    const allYearlyStats = Array.isArray(yearlyStatsResponse.data) ? yearlyStatsResponse.data : [];

    // Step 3: Calculate fantasy scores for the season
    const defaultStats = {
      passing_yards: 0,
      passing_tds: 0,
      interceptions: 0,
      two_point_passes: 0,
      rushing_yards: 0,
      rushing_tds: 0,
      two_point_rushes: 0,
      receptions: 0,
      receiving_yards: 0,
      receiving_tds: 0,
      two_point_receptions: 0,
      special_teams_tds: 0
    };

    const playerScores = playerIds.map(playerId => {
      const yearlyStat = allYearlyStats.find(stat => stat.player_id === playerId) || defaultStats;
      let score = 0;

      score += (yearlyStat.passing_yards || 0) * (scoringRules.passing_yards || 0);
      score += (yearlyStat.passing_tds || 0) * (scoringRules.passing_touchdowns || 0);
      score += (yearlyStat.interceptions || 0) * (scoringRules.interceptions_thrown || 0);
      score += (yearlyStat.two_point_passes || 0) * (scoringRules.two_point_pass || 0);
      if (yearlyStat.passing_yards >= 4000) score += scoringRules.passing_4000_plus || 0;
      else if (yearlyStat.passing_yards >= 3000) score += scoringRules.passing_3000_3999 || 0;
      score += (yearlyStat.rushing_yards || 0) * (scoringRules.rushing_yards || 0);
      score += (yearlyStat.rushing_tds || 0) * (scoringRules.rushing_touchdowns || 0);
      score += (yearlyStat.two_point_rushes || 0) * (scoringRules.two_point_rush || 0);
      if (yearlyStat.rushing_yards >= 2000) score += scoringRules.rushing_2000_plus || 0;
      else if (yearlyStat.rushing_yards >= 1000) score += scoringRules.rushing_1000_1999 || 0;
      score += (yearlyStat.receptions || 0) * (scoringRules.receptions || 0);
      score += (yearlyStat.receiving_yards || 0) * (scoringRules.receiving_yards || 0);
      score += (yearlyStat.receiving_tds || 0) * (scoringRules.receiving_touchdowns || 0);
      score += (yearlyStat.two_point_receptions || 0) * (scoringRules.two_point_reception || 0);
      if (yearlyStat.receiving_yards >= 2000) score += scoringRules.receiving_2000_plus || 0;
      else if (yearlyStat.receiving_yards >= 1000) score += scoringRules.receiving_1000_1999 || 0;
      score += (yearlyStat.special_teams_tds || 0) * (scoringRules.kickoff_return_touchdown || 0);

      return {
        player_id: playerId,
        fantasyScore: score.toFixed(2),
        yearlyStats: yearlyStat,
      };
    });

    return {
      status: 'success',
      data: playerScores,
    };
  } catch (error) {
    console.error('Error calculating fantasy season scores:', error.response?.data?.message || error.message);
    return {
      status: 'error',
      message: error.response?.data?.message || error.message || 'An unexpected error occurred',
      data: [],
    };
  }
};