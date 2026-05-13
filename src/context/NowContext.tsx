import { createContext, useContext, ReactNode } from 'react';
import { CurrentLeague } from '../types';
import { DEMO_LEAGUE_NAME, DEMO_NOW_MS } from '../constants/demoConstants';

const NowContext = createContext<number>(Date.now());

interface NowProviderProps {
  currentLeague: CurrentLeague | null;
  children: ReactNode;
}

export function NowProvider({ currentLeague, children }: NowProviderProps) {
  const now = currentLeague?.name === DEMO_LEAGUE_NAME ? DEMO_NOW_MS : Date.now();
  return <NowContext.Provider value={now}>{children}</NowContext.Provider>;
}

export function useNow(): number {
  return useContext(NowContext);
}