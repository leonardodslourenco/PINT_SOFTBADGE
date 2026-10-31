import { Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

export default function ProtectedRoute({ children }) {
  const { token } = useAppContext();
  const forcePasswordChange = localStorage.getItem('softbadge_force_password_change') === 'true';

  if (!token || forcePasswordChange) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
