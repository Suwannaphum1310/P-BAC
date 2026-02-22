import { Navigate, Link } from 'react-router-dom';
import { useAuth, AppRole } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AppRole;
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, role, loading, roleLoading } = useAuth();

  // Wait for BOTH auth loading AND role loading to complete
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

  // Check if user has the required role
  if (requiredRole && role !== requiredRole) {
    const roleLabels: Record<string, string> = {
      admin: 'ผู้ดูแลระบบ (Admin)',
      teacher: 'อาจารย์',
      student: 'นักศึกษา',
    };

    const roleDashboards: Record<string, string> = {
      admin: '/dashboard',
      teacher: '/teacher',
      student: '/student',
    };

    const currentRoleLabel = role ? roleLabels[role] || role : 'ไม่ทราบ';
    const correctDashboard = role ? roleDashboards[role] : '/';

    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-user-shield text-2xl text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">ไม่สามารถเข้าถึงหน้านี้ได้</h1>
          <p className="text-muted-foreground mb-4">
            คุณกำลังล็อกอินด้วยบัญชี <span className="font-semibold text-primary">{currentRoleLabel}</span>
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            หน้านี้สำหรับ <span className="font-medium">{roleLabels[requiredRole] || requiredRole}</span> เท่านั้น
          </p>
          <div className="flex flex-col gap-3">
            <Link
              to={correctDashboard}
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium hover:bg-primary/90 transition-colors"
            >
              <i className="fa-solid fa-home" />
              ไปหน้าหลักของคุณ
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <i className="fa-solid fa-arrow-left" />
              กลับหน้าแรก
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;

