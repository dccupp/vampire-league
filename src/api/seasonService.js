import axiosInstance from '../api';

export const getCurrentFantasyWeek = async () => {
  try {
    // Get current date and time in EST
    const now = new Date();
    const estDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const year = estDate.getFullYear();
    
    // Format date to match database format (YYYY-MM-DD HH:MM:SS)
    const formattedDate = estDate.toISOString().slice(0, 19).replace('T', ' ');

    // Fetch all fantasy weeks for the current year
    const response = await axiosInstance.get(`/fantasy_weeks/getFantasyWeeksByYear/${year}`);
    
    if (response.data.status === 'error') {
      throw new Error(response.data.message || 'Failed to fetch fantasy weeks');
    }

    const weeks = response.data;
    
    // Find the week where the current date falls between begin_datetime and end_datetime
    let currentWeek = weeks.find(week => {
      const begin = new Date(week.begin_datetime);
      const end = new Date(week.end_datetime);
      const current = new Date(formattedDate);
      return current >= begin && current <= end;
    });

    // If no week is found and the current date is before all begin_datetime values, use week 1
    if (!currentWeek) {
      const isBeforeAllWeeks = weeks.every(week => {
        const begin = new Date(week.begin_datetime);
        const current = new Date(formattedDate);
        return current < begin;
      });

      if (isBeforeAllWeeks) {
        currentWeek = weeks.find(week => week.week === 1);
        if (!currentWeek) {
          throw new Error('No week 1 found for the current year');
        }
      } else {
        throw new Error('No fantasy week found for the current date');
      }
    }

    return {
      status: 'success',
      data: currentWeek
    };

  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'An unexpected error occurred');
  }
};

export const getTeamCurrentWeekMatchup = async (team) => {
  try {
    // Validate team parameter
    if (!team || typeof team !== 'string') {
      throw new Error('Team parameter is required and must be a string');
    }

    // Get the current fantasy week
    const weekResponse = await getCurrentFantasyWeek();
    if (weekResponse.status !== 'success') {
      throw new Error(weekResponse.message || 'Failed to fetch current fantasy week');
    }

    const { year, week } = weekResponse.data;

    // Fetch the NFL schedule for the year, week, and team
    const scheduleResponse = await axiosInstance.get(`/nfl_schedules/getNFLScheduleByYearWeekAndTeam/${year}/${week}/${team}`);
    
    if (scheduleResponse.data.status === 'error') {
      throw new Error(scheduleResponse.data.message || 'Failed to fetch NFL schedule');
    }

    return {
      status: 'success',
      data: scheduleResponse.data
    };

  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'An unexpected error occurred');
  }
};

export const getGamesByWeekAndYear = async () => {
  try {
    // Get the current fantasy week
    const weekResponse = await getCurrentFantasyWeek();
    if (weekResponse.status !== 'success') {
      throw new Error(weekResponse.message || 'Failed to fetch current fantasy week');
    }

    const { year, week } = weekResponse.data;

    // Fetch all NFL schedules for the current year and week
    const scheduleResponse = await axiosInstance.get(`/nfl_schedules/getNFLSchedulesByYearAndWeek/${year}/${week}`);
    
    if (scheduleResponse.data.status === 'error') {
      throw new Error(scheduleResponse.data.message || 'Failed to fetch NFL schedules');
    }

    return {
      status: 'success',
      data: scheduleResponse.data
    };

  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'An unexpected error occurred');
  }
};