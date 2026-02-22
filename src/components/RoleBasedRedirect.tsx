import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const RoleBasedRedirect = () => {
  const { user, role, loading, roleLoading } = useAuth();

  // Wait for both auth loading AND role loading to complete
  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  console.log('[RoleBasedRedirect] User role:', role);

  // Redirect based on role
  switch (role) {
    case 'admin':
      return <Navigate to="/dashboard" replace />;
    case 'teacher':
      return <Navigate to="/teacher" replace />;
    case 'student':
      return <Navigate to="/student" replace />;
    default:
      // If no role assigned, go to dashboard (will show access denied if needed)
      return <Navigate to="/dashboard" replace />;
  }
};

export default RoleBasedRedirect;

