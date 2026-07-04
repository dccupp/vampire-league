import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { CurrentLeague, League, LeagueMember } from '../types';
import { useUser } from './UserContext';
import axiosInstance from '../api';

interface LeagueContextType {
  currentLeague: CurrentLeague | null;
  setCurrentLeague: (league: CurrentLeague | null) => void;
  leagueMembers: LeagueMember[] | null;
  setLeagueMembers: (leagueMembers: LeagueMember[] | null) => void;
  currentLeagueMember: LeagueMember | null;
  setCurrentLeagueMember: (leagueMember: LeagueMember | null) => void;
  isCommissioner: boolean;
  setIsCommissioner: (value: boolean) => void;
  getCachedMembership: (userId: number) => Promise<LeagueMember[]>;
  getCachedLeague: (leagueId: number) => Promise<League>;
}

const LeagueContext = createContext<LeagueContextType | null>(null);

export function LeagueProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useUser();
  const [currentLeague, setCurrentLeague] = useState<CurrentLeague | null>(null);
  const [leagueMembers, setLeagueMembers] = useState<LeagueMember[] | null>(null);
  const [currentLeagueMember, setCurrentLeagueMember] = useState<LeagueMember | null>(null);
  const [isCommissioner, setIsCommissioner] = useState<boolean>(false);

  useEffect(() => {
    const league = localStorage.getItem('league');
    if (league) setCurrentLeague(JSON.parse(league));
  }, []);

  useEffect(() => {
    const checkCommissionerStatus = async () => {
      if (currentUser?.id && currentLeague?.league_id) {
        try {
          // fetch members and commissioner status together
          const [membersResponse, currentLeagueMemberResponse] = await Promise.allSettled([
            axiosInstance.get(`/league_members/getLeagueMembersByLeagueId/${currentLeague.league_id}`),
            axiosInstance.get(`/league_members/getLeagueMemberByLeagueAndUserId/${currentLeague.league_id}/${currentUser.id}`)
          ]);

          // handle members
          if (membersResponse.status === 'fulfilled') {
            setLeagueMembers(membersResponse.value.data);
          }

          // handle current league member
          if (currentLeagueMemberResponse.status === 'fulfilled') {
            const member = currentLeagueMemberResponse.value.data;
            setCurrentLeagueMember(member);
            setIsCommissioner(member?.role === 'commish');
          } else {
            setIsCommissioner(false);
          }

        } catch {
          setCurrentLeagueMember(null);
          setIsCommissioner(false);
          setLeagueMembers([]);
        }
      } else {
        setCurrentLeagueMember(null);
        setIsCommissioner(false);
        setLeagueMembers([]);
      }
    };

    checkCommissionerStatus();
  }, [currentUser?.id, currentLeague?.league_id]);

  // retrieves league member records belonging to a single user
  const getCachedMembership = useCallback(async (userId: number): Promise<LeagueMember[]> => {
    const response = await axiosInstance.get(`/league_members/getLeagueMembersByUserId/${userId}`);
    return response.data;
  }, []);

  const getCachedLeague = useCallback(async (leagueId: number): Promise<League> => {
    const response = await axiosInstance.get(`/leagues/getLeagueById/${leagueId}`);
    return response.data;
  }, []);

  return (
    <LeagueContext.Provider value={{ currentLeague, setCurrentLeague, leagueMembers, setLeagueMembers, currentLeagueMember, setCurrentLeagueMember, isCommissioner, setIsCommissioner, getCachedMembership, getCachedLeague }}>
      {children}
    </LeagueContext.Provider>
  );
}

export const useLeague = () => {
  const ctx = useContext(LeagueContext);
  if (!ctx) throw new Error('useLeague must be used within a LeagueProvider');
  return ctx;
};