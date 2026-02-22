import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Calendar,
  Menu,
  LogOut,
  ChevronLeft,
  Newspaper,
  ClipboardCheck,
  BookOpen,
  Building2,
  UserCog,
  FileText,
  Home
} from 'lucide-react';
import logo from '@/assets/logo.png';
import ThemeToggle from '@/components/ThemeToggle';
import NotificationBell from '@/components/NotificationBell';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

const DashboardLayout = ({ children, title }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuth();

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const menuItems = [
    { icon: LayoutDashboard, label: 'ภาพรวม', href: '/dashboard' },
    { icon: Newspaper, label: 'ข่าวประกาศ', href: '/dashboard/news' },
    { icon: Users, label: 'ข้อมูลนักศึกษา', href: '/dashboard/students' },
    { icon: GraduationCap, label: 'ผลการเรียน', href: '/dashboard/grades' },
    { icon: ClipboardCheck, label: 'การเข้าเรียน', href: '/dashboard/attendance' },
    { icon: Calendar, label: 'ตารางเรียน', href: '/dashboard/schedule' },
    { icon: BookOpen, label: 'รายวิชา', href: '/dashboard/subjects' },
    { icon: UserCog, label: 'อาจารย์', href: '/dashboard/teachers' },
    { icon: Building2, label: 'ห้องเรียน', href: '/dashboard/rooms' },
    { icon: FileText, label: 'ใบสมัคร', href: '/dashboard/applications' },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (href: string) => location.pathname === href;

  const displayName = profile?.full_name || 'Admin';
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex bg-muted">
      {/* Mobile Backdrop */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`bg-primary text-primary-foreground transition-all duration-300 flex flex-col fixed h-full z-30
          ${isMobile
            ? `w-64 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
            : sidebarOpen ? 'w-64' : 'w-20'
          }`}
      >
        {/* Sidebar Header */}
        <div className="p-5 flex items-center gap-3">
          <img src={logo} alt="P-BAC" className="h-10" />
          {(sidebarOpen || isMobile) && <span className="font-bold text-lg">P-BAC Admin</span>}
        </div>

        {/* Sidebar Menu */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  onClick={() => isMobile && setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${isActive(item.href)
                    ? 'bg-primary-foreground/15 text-primary-foreground'
                    : 'text-primary-foreground/80 hover:bg-primary-foreground/10 hover:translate-x-1'
                    }`}
                >
                  <item.icon size={20} />
                  {(sidebarOpen || isMobile) && <span className="text-sm">{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-primary-foreground/10 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-primary-foreground/80 hover:bg-primary-foreground/10 transition-all w-full"
          >
            <Home size={20} />
            {(sidebarOpen || isMobile) && <span className="text-sm">กลับหน้าหลัก</span>}
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-primary-foreground/80 hover:bg-primary-foreground/10 transition-all w-full"
          >
            <LogOut size={20} />
            {(sidebarOpen || isMobile) && <span className="text-sm">ออกจากระบบ</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300
        ${isMobile ? 'ml-0' : sidebarOpen ? 'ml-64' : 'ml-20'}`}
      >
        {/* Header */}
        <header className="bg-card shadow-sm h-16 flex items-center justify-between px-4 md:px-6 sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              {sidebarOpen && !isMobile ? <ChevronLeft size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="text-lg md:text-xl font-semibold truncate">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />
            <Link
              to="/profile"
              className="flex items-center gap-2 bg-muted px-3 py-2 rounded-full hover:bg-muted/80 transition-colors"
            >
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                {initials}
              </div>
              <span className="text-sm font-medium hidden sm:inline">{displayName}</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
