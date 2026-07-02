import { ReactNode } from 'react';
import { useUser } from '../../context/UserContext';
import { useLeague } from '../../context/LeagueContext';
import { Navigate } from 'react-router-dom';

interface PrivateRouteProps {
  children: ReactNode;
  requireLeague?: boolean;
  requireCommissioner?: boolean;
}

const PrivateRoute = ({ 
  children, 
  requireLeague = false,
  requireCommissioner = false 
}: PrivateRouteProps) => {
  const { currentUser } = useUser();
  const { currentLeague, isCommissioner } = useLeague();

  if (!currentUser) return <Navigate to="/login" />;
  if (requireLeague && !currentLeague) return <Navigate to="/landing" />;
  if (requireCommissioner && !isCommissioner) return <Navigate to="/landing" />;

  return <>{children}</>;
};
export default PrivateRoute;