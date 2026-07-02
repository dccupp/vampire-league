import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { CurrentLeague, League, LeagueMember } from '../types';
import { useUser } from './UserContext';
import axiosInstance from '../api';

interface LeagueContextType {
  currentLeague: CurrentLeague | null;
  setCurrentLeague: (league: CurrentLeague | null) => void;
  isCommissioner: boolean;
  setIsCommissioner: (value: boolean) => void;
  getCachedMembership: (userId: number) => Promise<LeagueMember[]>;
  getCachedLeague: (leagueId: number) => Promise<League>;
}

const LeagueContext = createContext<LeagueContextType | null>(null);

export function LeagueProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useUser();
  const [currentLeague, setCurrentLeague] = useState<CurrentLeague | null>(null);
  const [isCommissioner, setIsCommissioner] = useState<boolean>(false);

  useEffect(() => {
    const league = localStorage.getItem('league');
    if (league) setCurrentLeague(JSON.parse(league));
  }, []);

  useEffect(() => {
    const checkCommissionerStatus = async () => {
      if (currentUser?.id && currentLeague?.league_id) {
        try {
          const response = await axiosInstance.get(`/league_members/getLeagueMembersByUserId/${currentUser.id}`);
          const membership: LeagueMember | undefined = (response.data as LeagueMember[]).find(
            m => m.league_id === currentLeague.league_id
          );
          setIsCommissioner(membership?.role === 'commish');
        } catch {
          setIsCommissioner(false);
        }
      } else {
        setIsCommissioner(false);
      }
    };
    checkCommissionerStatus();
  }, [currentUser?.id, currentLeague?.league_id]);

// retrieves league member records 
  const getCachedMembership = useCallback(async (userId: number): Promise<LeagueMember[]> => {
    const response = await axiosInstance.get(`/league_members/getLeagueMembersByUserId/${userId}`);
    return response.data;
  }, []);

  const getCachedLeague = useCallback(async (leagueId: number): Promise<League> => {
    const response = await axiosInstance.get(`/leagues/getLeagueById/${leagueId}`);
    return response.data;
  }, []);

  return (
    <LeagueContext.Provider value={{ currentLeague, setCurrentLeague, isCommissioner, setIsCommissioner, getCachedMembership, getCachedLeague }}>
      {children}
    </LeagueContext.Provider>
  );
}

export const useLeague = () => {
  const ctx = useContext(LeagueContext);
  if (!ctx) throw new Error('useLeague must be used within a LeagueProvider');
  return ctx;
};