// ─── Auth / Identity ──────────────────────────────────────────────────────────

export interface CurrentUser {
  id: number;
  username?: string;
  email_address?: string;
  first_name?: string;
  last_name?: string;
}

export interface CurrentLeague {
  league_id: number;
  name?: string;
  is_active?: boolean;
}

// ─── League ───────────────────────────────────────────────────────────────────

export interface League {
  league_id: number;
  name: string;
  is_active: boolean;
}

export interface LeagueMember {
  id: number;
  league_id: number;
  user_id: number;
  team_name: string;
  remaining_faab_budget: number;
  is_vamp: boolean;
  role: string;
  is_active: boolean;
  name?: string;
}

// ─── Roster Rules ─────────────────────────────────────────────────────────────

export interface RosterRules {
  roster_type_id?: number;
  quarterback_count: number;
  running_back_count: number;
  wide_receiver_count: number;
  tight_end_count: number;
  wide_receiver_tight_end_count: number;
  flex_count: number;
  bench_count: number;
  ir_count: number;
  max_roster_size: number;
  max_qb_count?: number;
  max_rb_count?: number;
  max_wr_count?: number;
  max_te_count?: number;
  beginning_faab: number;
}

// Roster Types

export interface RosterType {
  id: number;
  type: number;
}

// Scoring Rules
export interface ScoringRules {
  league_id: number;
  passing_yards: number;
  passing_touchdowns: number;
  interceptions_thrown: number;
  two_point_pass: number;
  passing_300_399: number;
  passing_400_plus: number;
  rushing_yards: number;
  rushing_touchdowns: number;
  two_point_rush: number;
  rushing_100_199: number;
  rushing_200_plus: number;
  receiving_yards: number;
  receptions: number;
  receiving_touchdowns: number;
  two_point_reception: number;
  receiving_100_199: number;
  receiving_200_plus: number;
  kickoff_return_touchdown: number;
  punt_return_touchdown: number;
  fumble_recovered_touchdown: number;
  fumbles_lost: number;
  interception_return_touchdown: number;
  fumble_return_touchdown: number;
  blocked_return_touchdown: number;
  two_point_return: number;
  one_point_return: number;
}

// Schedule

export interface Schedule {
  id: number;
  league_id: number;
  home_league_member: number;
  away_league_member: number;
  week: number;
  year: number;
  home_score: number | null;
  away_score: number | null;
  winner: number | null;
}

//Game Schedule Information

export interface GameSchedule {
  date: string;
  day: string;
  est_time: string;
  location: string;
}

// Raw NFL game as returned by the /nfl_schedules API endpoints
export interface NFLGame {
  id: number;
  year: number;
  team: string;
  week: number;
  date: string;
  day: string;
  local_time: string;
  est_time: string;
  location: string;
}

// Player as it comes from the /players table (free agent list, etc.)
export interface Player {
  id: number;
  player_id: string;
  player_name: string | null;
  position: string | null;
  team: string | null;
  external_player_id: string;
  schedule: GameSchedule | null;
}

// RosteredPlayer is the enriched API response from /rostered_players —
// the raw DB row joined with the players table.
export interface RosteredPlayer {
  id: number;
  league_member_id: number;
  player_id: string;
  is_rostered: boolean;
  roster_position: string | null;
  player_name: string;
  position: string;
  team: string;
  external_player_id: string;
  is_injured?: boolean;
  schedule: GameSchedule | null;
  fantasyScore?: number | null;
  weeklyStats?: any | null;
  season_points?: number;
}

// ─── Roster Slots (computed structure, not a direct API response) ─────────────

export interface RosterSlot {
  position: string;
  sPosition: string;
  player: RosteredPlayer | null;
}

// ─── Waiver Rules ─────────────────────────────────────────────────────────────

export interface WaiverRule {
  id: number;
  league_id: number;
  waivers_length: number | null;
  waiver_day: string | null;
}

// ─── Waiver Claims ────────────────────────────────────────────────────────────

export interface WaiverClaim {
  id: number;
  league_id: number;
  league_member_id: number;
  player_id: number;
  faab_claim_amount: number;
  rostered_player_to_drop: number | null;
  is_active: boolean;
  league_member_priority: number;
}

// Rostered Player Weekly Scores

export interface RosteredPlayerWeeklyScore {
  id: number;
  league_id: number;
  league_member_id: number;
  rostered_player_id: number;
  year: number;
  week: number;
  roster_position: number;
  fantasy_points: number;
}

// Weekly Stats

export interface WeeklyStat {
  id: number;
  player_id: number;
  season: number;
  week: number;
  passing_yards: number;
  passing_tds: number;
  interceptions: number;
  two_point_passes: number;
  rushing_yards: number;
  rushing_tds: number;
  two_point_rushes: number;
  receptions: number;
  receiving_yards: number;
  receiving_tds: number;
  two_point_receptions: number;
  special_teams_tds: number;
}

// Yearly Stats

export interface YearlyStat {
  id: number;
  player_id: number;
  season: number;
  passing_yards: number;
  passing_tds: number;
  interceptions: number;
  two_point_passes: number;
  rushing_yards: number;
  rushing_tds: number;
  two_point_rushes: number;
  receptions: number;
  receiving_yards: number;
  receiving_tds: number;
  two_point_receptions: number;
  special_teams_tds: number;
}