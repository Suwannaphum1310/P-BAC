import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  ClipboardCheck,
  LogOut,
  ChevronLeft,
  Menu,
  Camera,
  ChevronDown,
  Users,
  X
} from 'lucide-react';
import logo from '@/assets/logo.png';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';
import NotificationBell from '@/components/NotificationBell';

interface TeacherLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const TeacherLayout = ({ children, title }: TeacherLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { profile, signOut } = useAuth();

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar on route change for mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  const menuItems = [
    { icon: LayoutDashboard, label: 'แดชบอร์ด', href: '/teacher' },
    { icon: Calendar, label: 'ตารางสอน', href: '/teacher/schedule' },
    { icon: ClipboardCheck, label: 'บันทึกเข้าเรียน', href: '/teacher/attendance' },
    { icon: Users, label: 'รายชื่อนักศึกษา', href: '/teacher/students' },
  ];

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "ออกจากระบบสำเร็จ",
      description: "ขอบคุณที่ใช้บริการ",
    });
    navigate('/');
  };

  const isActive = (href: string) => location.pathname === href;

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[0].charAt(0) + parts[1].charAt(0);
    }
    return name.substring(0, 2).toUpperCase();
  };

  const displayName = profile?.full_name || 'อาจารย์';
  const initials = getInitials(displayName);

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
        className={`bg-emerald-700 text-primary-foreground transition-all duration-300 flex flex-col fixed h-full z-30
          ${isMobile
            ? `w-64 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
            : sidebarOpen ? 'w-64' : 'w-20'
          }`}
      >
        {/* Sidebar Header */}
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="P-BAC" className="h-10" />
            {(sidebarOpen || isMobile) && <span className="font-bold text-lg">อาจารย์</span>}
          </div>
          {isMobile && sidebarOpen && (
            <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-white/10 rounded">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Sidebar Menu */}
        <nav className="flex-1 px-3 py-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive(item.href)
                    ? 'bg-white/15 text-white'
                    : 'text-white/80 hover:bg-white/10 hover:translate-x-1'
                    }`}
                >
                  <item.icon size={20} />
                  {(sidebarOpen || isMobile) && <span>{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-white/10 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/10 transition-all w-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            {(sidebarOpen || isMobile) && <span>กลับสู่หน้าหลัก</span>}
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/10 transition-all w-full"
          >
            <LogOut size={20} />
            {(sidebarOpen || isMobile) && <span>ออกจากระบบ</span>}
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
            {title && <h1 className="text-lg md:text-xl font-semibold truncate">{title}</h1>}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />
            <Link
              to="/profile"
              className="flex items-center gap-2 bg-muted px-3 md:px-4 py-2 rounded-full hover:bg-muted/80 transition-colors cursor-pointer"
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {initials}
                </div>
              )}
              <span className="text-sm font-medium hidden sm:inline">{displayName}</span>
              <ChevronDown size={16} className="text-muted-foreground hidden sm:inline" />
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default TeacherLayout;

