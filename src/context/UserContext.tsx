import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { CurrentUser } from '../types';

interface UserContextType {
  currentUser: CurrentUser | null;
  setCurrentUser: (user: CurrentUser | null) => void;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) setCurrentUser(JSON.parse(user));
  }, []);

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within a UserProvider');
  return ctx;
}