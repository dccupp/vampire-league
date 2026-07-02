import { createContext, useContext, ReactNode } from 'react';
import { useLeague } from './LeagueContext'; 
import { DEMO_LEAGUE_NAME, DEMO_NOW_MS } from '../constants/demoConstants';

const NowContext = createContext<number>(Date.now());

export function NowProvider({ children }: { children: ReactNode}) {
  const { currentLeague } = useLeague();
  const now = currentLeague?.name === DEMO_LEAGUE_NAME ? DEMO_NOW_MS : Date.now();
  return <NowContext.Provider value={now}>{children}</NowContext.Provider>;
}

export function useNow(): number {
  return useContext(NowContext);
}