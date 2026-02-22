import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Calendar,
  LogOut,
  GraduationCap as Logo,
  BookOpen,
  UserCheck,
  DoorOpen,
  Shield,
  ClipboardCheck,
  Newspaper
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const menuItems = [
    { icon: LayoutDashboard, label: 'แดชบอร์ด', href: '/dashboard' },
    { icon: Newspaper, label: 'ข่าวประกาศ', href: '/dashboard/news' },
    { icon: Users, label: 'ข้อมูลนักศึกษา', href: '/dashboard/students' },
    { icon: ClipboardCheck, label: 'เช็คชื่อ', href: '/dashboard/attendance' },
    { icon: GraduationCap, label: 'จัดการเกรด', href: '/dashboard/grades' },
    { icon: Calendar, label: 'ตารางเรียน', href: '/dashboard/schedule' },
    { icon: BookOpen, label: 'จัดการวิชา', href: '/dashboard/subjects' },
    { icon: UserCheck, label: 'จัดการครู', href: '/dashboard/teachers' },
    { icon: DoorOpen, label: 'จัดการห้องเรียน', href: '/dashboard/rooms' },
    { icon: Shield, label: 'จัดการสิทธิ์', href: '/dashboard/user-roles' },
  ];

  const handleLogout = async () => {
    await signOut();
    toast.success('ออกจากระบบสำเร็จ');
    navigate('/');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <aside className="w-56 bg-primary min-h-screen flex flex-col fixed left-0 top-0">
      {/* Logo Section */}
      <div className="p-5 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-foreground/20 rounded-lg flex items-center justify-center">
          <Logo className="text-primary-foreground" size={24} />
        </div>
        <span className="font-bold text-lg text-primary-foreground">P-BAC Admin</span>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive(item.href)
                  ? 'bg-primary-foreground/20 text-primary-foreground font-medium'
                  : 'text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground'
                  }`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground transition-all w-full"
        >
          <LogOut size={20} />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
