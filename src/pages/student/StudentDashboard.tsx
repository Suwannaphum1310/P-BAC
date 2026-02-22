import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, BookOpen, TrendingUp, CheckCircle, Newspaper, Clock, Sparkles, ArrowRight } from 'lucide-react';
import StudentLayout from '@/components/StudentLayout';
import { Link } from 'react-router-dom';

interface ScheduleEntry {
  id: string;
  day_of_week: string;
  period_start: number;
  period_span: number;
  subject_name: string | null;
  room_name: string | null;
  teacher_name: string | null;
}

interface Student {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  department_id: string | null;
  year: number;
  gpa: number | null;
  status: string;
}

interface AttendanceRecord {
  id: string;
  status: string;
  check_in_time: string;
}

const StudentDashboard = () => {
  const { user, profile } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<ScheduleEntry[]>([]);
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, late: 0, absent: 0, total: 0 });
  const [latestNews, setLatestNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const dayMapping: { [key: number]: string } = {
    0: 'อาทิตย์',
    1: 'จันทร์',
    2: 'อังคาร',
    3: 'พุธ',
    4: 'พฤหัสบดี',
    5: 'ศุกร์',
    6: 'เสาร์',
  };

  const periodTimes: { [key: number]: { start: string; end: string } } = {
    1: { start: '08:30', end: '09:20' },
    2: { start: '09:20', end: '10:10' },
    3: { start: '10:20', end: '11:10' },
    4: { start: '11:10', end: '12:00' },
    5: { start: '13:00', end: '13:50' },
    6: { start: '13:50', end: '14:40' },
    7: { start: '14:50', end: '15:40' },
    8: { start: '15:40', end: '16:30' },
  };

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchData();
  }, [user, profile]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Try to find student by email
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();

      if (studentData) {
        setStudent(studentData);

        // Fetch schedule for student's department
        if (studentData.department_id) {
          const today = dayMapping[new Date().getDay()];
          const { data: schedule } = await supabase
            .from('schedule_entries')
            .select('*')
            .eq('department_id', studentData.department_id)
            .eq('day_of_week', today)
            .order('period_start');

          setTodaySchedule(schedule || []);
        }

        // Fetch attendance stats
        const { data: attendance } = await supabase
          .from('attendance')
          .select('status')
          .eq('student_id', studentData.id);

        if (attendance) {
          const stats = {
            present: attendance.filter(a => a.status === 'present').length,
            late: attendance.filter(a => a.status === 'late').length,
            absent: attendance.filter(a => a.status === 'absent').length,
            total: attendance.length,
          };
          setAttendanceStats(stats);
        }

        // Fetch latest news
        const { data: news } = await supabase
          .from('news')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(3);

        setLatestNews(news || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const attendancePercentage = attendanceStats.total > 0
    ? Math.round(((attendanceStats.present + attendanceStats.late) / attendanceStats.total) * 100)
    : 0;

  // Find current or next class
  const getCurrentOrNextClass = () => {
    const now = currentTime;
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

    for (const entry of todaySchedule) {
      const period = periodTimes[entry.period_start];
      if (!period) continue;

      // Check if currently in this class
      if (currentTimeStr >= period.start && currentTimeStr < period.end) {
        return { entry, status: 'current', remaining: getMinutesUntil(period.end) };
      }
      // Check if this is the next class
      if (currentTimeStr < period.start) {
        return { entry, status: 'next', remaining: getMinutesUntil(period.start) };
      }
    }
    return null;
  };

  const getMinutesUntil = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);
    const diff = Math.round((target.getTime() - currentTime.getTime()) / 60000);
    return Math.max(0, diff);
  };

  const currentOrNext = getCurrentOrNextClass();

  // Circular progress component
  const CircularProgress = ({ percentage, size = 120, strokeWidth = 10 }: { percentage: number; size?: number; strokeWidth?: number }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;
    const color = percentage >= 80 ? '#22c55e' : percentage >= 60 ? '#f59e0b' : '#ef4444';

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/30"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{percentage}%</span>
          <span className="text-xs text-muted-foreground">เข้าเรียน</span>
        </div>
      </div>
    );
  };

  const stats = [
    { icon: Calendar, label: 'คาบเรียนวันนี้', value: todaySchedule.length.toString(), gradient: 'from-blue-500 to-blue-600' },
    { icon: TrendingUp, label: 'เกรดเฉลี่ย', value: student?.gpa?.toFixed(2) || '-', gradient: 'from-emerald-500 to-emerald-600' },
    { icon: CheckCircle, label: 'อัตราเข้าเรียน', value: `${attendancePercentage}%`, gradient: 'from-purple-500 to-purple-600' },
    { icon: BookOpen, label: 'ชั้นปี', value: `ปี ${student?.year || '-'}`, gradient: 'from-orange-500 to-orange-600' },
  ];

  if (loading) {
    return (
      <StudentLayout title="แดชบอร์ดนักศึกษา">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="แดชบอร์ดนักศึกษา">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-2xl p-6 md:p-8 mb-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={20} className="text-yellow-300" />
              <span className="text-emerald-200 text-sm">สวัสดีตอน{currentTime.getHours() < 12 ? 'เช้า' : currentTime.getHours() < 17 ? 'บ่าย' : 'เย็น'}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-1">
              {student ? `${student.first_name} ${student.last_name}` : profile?.full_name || 'นักศึกษา'}
            </h2>
            <p className="text-emerald-100/80">
              {student ? `รหัสนักศึกษา: ${student.student_id}` : 'ยินดีต้อนรับเข้าสู่ระบบ'}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Real-time Clock */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-emerald-200" />
                <span className="text-2xl font-mono font-bold">
                  {currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-1">
                {dayMapping[currentTime.getDay()]}ที่ {currentTime.getDate()} {currentTime.toLocaleDateString('th-TH', { month: 'short', year: 'numeric' })}
              </p>
            </div>

            <Link
              to="/profile"
              className="hidden md:flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 transition-all"
            >
              <span>ดูโปรไฟล์</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Current/Next Class Banner */}
        {currentOrNext && (
          <div className="relative z-10 mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${currentOrNext.status === 'current' ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
                <div>
                  <p className="text-sm text-emerald-200">
                    {currentOrNext.status === 'current' ? '🎯 กำลังเรียน' : '⏰ คาบถัดไป'}
                  </p>
                  <p className="font-semibold text-lg">{currentOrNext.entry.subject_name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-emerald-200">
                  {currentOrNext.status === 'current' ? 'เหลืออีก' : 'เริ่มในอีก'}
                </p>
                <p className="font-bold text-xl">{currentOrNext.remaining} นาที</p>
              </div>
              <div className="bg-white/10 rounded-lg px-3 py-2">
                <p className="text-xs text-emerald-200">ห้องเรียน</p>
                <p className="font-medium">{currentOrNext.entry.room_name || '-'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="group bg-card rounded-xl p-5 shadow-sm border border-border/50 hover:shadow-lg hover:border-primary/30 hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className={`bg-gradient-to-br ${stat.gradient} w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                <stat.icon size={22} />
              </div>
              <div>
                <p className="text-muted-foreground text-xs md:text-sm">{stat.label}</p>
                <p className="text-xl md:text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gamification: Badges & Achievements */}
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            {/* Trophy SVG Icon */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-amber-500">
              <path d="M12 17V14M12 14C14.2091 14 16 12.2091 16 10V4H8V10C8 12.2091 9.79086 14 12 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M8 6H5C4.44772 6 4 6.44772 4 7V8C4 9.65685 5.34315 11 7 11H8" stroke="currentColor" strokeWidth="2" />
              <path d="M16 6H19C19.5523 6 20 6.44772 20 7V8C20 9.65685 18.6569 11 17 11H16" stroke="currentColor" strokeWidth="2" />
              <path d="M7 21H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M12 17V21" stroke="currentColor" strokeWidth="2" />
              <path d="M9 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            ความสำเร็จของคุณ
          </h3>
          {/* Streak Counter */}
          {attendanceStats.present > 0 && (
            <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full shadow-lg">
              {/* Fire SVG Icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 23C16.1421 23 19.5 19.6421 19.5 15.5C19.5 13.5 18.5 11.5 17 10C16.5 9.5 16 8.5 16 7.5C16 6.5 16.5 5 17 4C14 5 12 8 12 10C12 8 11 6 9 4C9 6 8 8.5 6.5 10C5 11.5 4.5 13.5 4.5 15.5C4.5 19.6421 7.85786 23 12 23Z" />
                <path d="M12 23C14.2091 23 16 21.2091 16 19C16 17.5 15 16 14 15C13.5 14.5 13 13.5 13 12.5C11 14 10 15.5 10 17C9 16 8.5 14.5 8 13C8 15 8 17 10 19C8.5 18.5 8 18.5 8 19C8 21.2091 9.79086 23 12 23Z" fill="rgba(255,255,255,0.5)" />
              </svg>
              <span className="font-bold">{Math.min(attendanceStats.present, 30)} วันติดต่อกัน</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Badge: Perfect Attendance */}
          <div className={`relative p-4 rounded-xl text-center transition-all ${attendancePercentage >= 100
            ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-lg scale-105'
            : 'bg-muted/50 opacity-60'
            }`}>
            <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center">
              {attendancePercentage >= 100 ? (
                // Gold Medal SVG
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="20" fill="url(#goldGradient)" stroke="#B8860B" strokeWidth="2" />
                  <circle cx="24" cy="24" r="15" fill="none" stroke="#FFF5" strokeWidth="2" />
                  <path d="M20 24L23 27L28 21" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <defs>
                    <linearGradient id="goldGradient" x1="4" y1="4" x2="44" y2="44">
                      <stop stopColor="#FFD700" />
                      <stop offset="0.5" stopColor="#FFA500" />
                      <stop offset="1" stopColor="#FFD700" />
                    </linearGradient>
                  </defs>
                </svg>
              ) : (
                // Locked SVG
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                  <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11" stroke="currentColor" strokeWidth="2" />
                  <circle cx="12" cy="16" r="1.5" fill="currentColor" />
                </svg>
              )}
            </div>
            <p className="font-bold text-sm">เข้าเรียนครบ 100%</p>
            <p className="text-xs opacity-80 mt-1">
              {attendancePercentage >= 100 ? 'ปลดล็อกแล้ว!' : `${attendancePercentage}% / 100%`}
            </p>
            {attendancePercentage >= 100 && (
              <div className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full shadow-lg flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 0L9.5 5.5L15 6L10.5 9.5L12 15L8 11.5L4 15L5.5 9.5L1 6L6.5 5.5L8 0Z" fill="#FFD700" />
                </svg>
              </div>
            )}
          </div>

          {/* Badge: GPA Star */}
          <div className={`relative p-4 rounded-xl text-center transition-all ${(student?.gpa || 0) >= 3.5
            ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg scale-105'
            : 'bg-muted/50 opacity-60'
            }`}>
            <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center">
              {(student?.gpa || 0) >= 3.5 ? (
                // Purple Crystal Star SVG
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <path d="M24 4L28 18L42 20L31 29L34 44L24 36L14 44L17 29L6 20L20 18L24 4Z" fill="url(#purpleGradient)" stroke="#6B21A8" strokeWidth="1" />
                  <path d="M24 10L26.5 19L35 20.5L28 26L30 35L24 30L18 35L20 26L13 20.5L21.5 19L24 10Z" fill="rgba(255,255,255,0.3)" />
                  <defs>
                    <linearGradient id="purpleGradient" x1="6" y1="4" x2="42" y2="44">
                      <stop stopColor="#A855F7" />
                      <stop offset="0.5" stopColor="#7C3AED" />
                      <stop offset="1" stopColor="#6366F1" />
                    </linearGradient>
                  </defs>
                </svg>
              ) : (
                // Locked SVG
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                  <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11" stroke="currentColor" strokeWidth="2" />
                  <circle cx="12" cy="16" r="1.5" fill="currentColor" />
                </svg>
              )}
            </div>
            <p className="font-bold text-sm">เกรดยอดเยี่ยม</p>
            <p className="text-xs opacity-80 mt-1">
              {(student?.gpa || 0) >= 3.5 ? 'GPA ≥ 3.50' : `GPA ${student?.gpa?.toFixed(2) || '-'} / 3.50`}
            </p>
            {(student?.gpa || 0) >= 3.5 && (
              <div className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full shadow-lg flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 0L9.5 5.5L15 6L10.5 9.5L12 15L8 11.5L4 15L5.5 9.5L1 6L6.5 5.5L8 0Z" fill="#A855F7" />
                </svg>
              </div>
            )}
          </div>

          {/* Badge: Punctuality */}
          <div className={`relative p-4 rounded-xl text-center transition-all ${attendanceStats.late === 0 && attendanceStats.total > 0
            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg scale-105'
            : 'bg-muted/50 opacity-60'
            }`}>
            <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center">
              {attendanceStats.late === 0 && attendanceStats.total > 0 ? (
                // Teal Clock SVG
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="20" fill="url(#tealGradient)" stroke="#0D9488" strokeWidth="2" />
                  <circle cx="24" cy="24" r="16" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                  <path d="M24 14V24L30 28" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="24" cy="24" r="2" fill="white" />
                  <defs>
                    <linearGradient id="tealGradient" x1="4" y1="4" x2="44" y2="44">
                      <stop stopColor="#10B981" />
                      <stop offset="1" stopColor="#0D9488" />
                    </linearGradient>
                  </defs>
                </svg>
              ) : (
                // Locked SVG
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                  <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11" stroke="currentColor" strokeWidth="2" />
                  <circle cx="12" cy="16" r="1.5" fill="currentColor" />
                </svg>
              )}
            </div>
            <p className="font-bold text-sm">ตรงต่อเวลา</p>
            <p className="text-xs opacity-80 mt-1">
              {attendanceStats.late === 0 && attendanceStats.total > 0 ? 'ไม่เคยมาสาย!' : `มาสาย ${attendanceStats.late} ครั้ง`}
            </p>
            {attendanceStats.late === 0 && attendanceStats.total > 0 && (
              <div className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full shadow-lg flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 0L9.5 5.5L15 6L10.5 9.5L12 15L8 11.5L4 15L5.5 9.5L1 6L6.5 5.5L8 0Z" fill="#10B981" />
                </svg>
              </div>
            )}
          </div>

          {/* Badge: First Steps */}
          <div className={`relative p-4 rounded-xl text-center transition-all ${student?.year === 1
            ? 'bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-lg scale-105'
            : 'bg-muted/50 opacity-60'
            }`}>
            <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center">
              {student?.year === 1 ? (
                // Pink Shooting Star SVG
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <path d="M30 8L33 18L43 20L35 26L37 36L30 30L23 36L25 26L17 20L27 18L30 8Z" fill="url(#pinkGradient)" stroke="#DB2777" strokeWidth="1" />
                  <path d="M8 40L18 30" stroke="url(#trailGradient)" strokeWidth="3" strokeLinecap="round" />
                  <path d="M12 44L20 36" stroke="url(#trailGradient)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                  <path d="M4 36L14 26" stroke="url(#trailGradient)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                  <defs>
                    <linearGradient id="pinkGradient" x1="17" y1="8" x2="43" y2="36">
                      <stop stopColor="#EC4899" />
                      <stop offset="1" stopColor="#F43F5E" />
                    </linearGradient>
                    <linearGradient id="trailGradient" x1="4" y1="26" x2="20" y2="44">
                      <stop stopColor="#FDE68A" />
                      <stop offset="1" stopColor="#F472B6" />
                    </linearGradient>
                  </defs>
                </svg>
              ) : (
                // Locked SVG
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                  <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11" stroke="currentColor" strokeWidth="2" />
                  <circle cx="12" cy="16" r="1.5" fill="currentColor" />
                </svg>
              )}
            </div>
            <p className="font-bold text-sm">ดาวรุ่ง</p>
            <p className="text-xs opacity-80 mt-1">
              {student?.year === 1 ? 'นักศึกษาปี 1' : 'สำหรับปี 1 เท่านั้น'}
            </p>
            {student?.year === 1 && (
              <div className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full shadow-lg flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 0L9.5 5.5L15 6L10.5 9.5L12 15L8 11.5L4 15L5.5 9.5L1 6L6.5 5.5L8 0Z" fill="#EC4899" />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar size={20} className="text-primary" />
              ตารางเรียนวันนี้
            </h3>
            <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
              {dayMapping[new Date().getDay()]}
            </span>
          </div>

          {todaySchedule.length > 0 ? (
            <div className="space-y-3">
              {todaySchedule.map((entry) => {
                const period = periodTimes[entry.period_start];
                const isCurrent = currentOrNext?.entry.id === entry.id && currentOrNext.status === 'current';
                const isNext = currentOrNext?.entry.id === entry.id && currentOrNext.status === 'next';

                return (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between p-4 rounded-lg transition-all ${isCurrent
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-500 shadow-md'
                      : isNext
                        ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-400'
                        : 'bg-muted hover:bg-muted/80'
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[60px]">
                        <span className={`text-sm font-medium ${isCurrent ? 'text-emerald-700 dark:text-emerald-400' : isNext ? 'text-amber-700 dark:text-amber-400' : ''}`}>
                          คาบ {entry.period_start}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {period ? `${period.start}-${period.end}` : '-'}
                        </p>
                      </div>
                      <div>
                        <p className={`font-medium ${isCurrent ? 'text-emerald-700 dark:text-emerald-400' : isNext ? 'text-amber-700 dark:text-amber-400' : ''}`}>
                          {entry.subject_name || '-'}
                        </p>
                        <p className="text-sm text-muted-foreground">{entry.teacher_name || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isCurrent && (
                        <span className="text-xs bg-emerald-500 text-white px-2 py-1 rounded-full animate-pulse">
                          กำลังเรียน
                        </span>
                      )}
                      {isNext && (
                        <span className="text-xs bg-amber-500 text-white px-2 py-1 rounded-full">
                          ถัดไป
                        </span>
                      )}
                      <span className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">
                        {entry.room_name || '-'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar size={48} className="mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">ไม่มีคาบเรียนวันนี้</p>
              <p className="text-sm text-muted-foreground/70 mt-1">พักผ่อนให้เต็มที่นะครับ 😊</p>
            </div>
          )}
        </div>

        {/* Attendance Summary with Circular Progress */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle size={20} className="text-primary" />
            สรุปการเข้าเรียน
          </h3>

          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Circular Progress */}
            <div className="flex-shrink-0">
              <CircularProgress percentage={attendancePercentage} />
            </div>

            {/* Stats Breakdown */}
            <div className="flex-1 space-y-3 w-full">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-green-700 dark:text-green-400">เข้าเรียน</span>
                </div>
                <span className="font-bold text-green-700 dark:text-green-400">{attendanceStats.present} ครั้ง</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-amber-700 dark:text-amber-400">มาสาย</span>
                </div>
                <span className="font-bold text-amber-700 dark:text-amber-400">{attendanceStats.late} ครั้ง</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-red-700 dark:text-red-400">ขาดเรียน</span>
                </div>
                <span className="font-bold text-red-700 dark:text-red-400">{attendanceStats.absent} ครั้ง</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mini Calendar & GPA Trend Row */}
      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        {/* Mini Calendar Widget */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-primary" />
            ปฏิทิน
          </h3>
          <div className="space-y-4">
            {/* Month Header */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <span className="font-bold text-lg">
                {calendarMonth.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((day, i) => (
                <div key={i} className={`text-xs font-medium py-2 ${i === 0 || i === 6 ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {(() => {
                const year = calendarMonth.getFullYear();
                const month = calendarMonth.getMonth();
                const firstDay = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const today = currentTime.getDate();
                const isCurrentMonth = calendarMonth.getMonth() === currentTime.getMonth() && calendarMonth.getFullYear() === currentTime.getFullYear();
                const days = [];

                // Empty cells before first day
                for (let i = 0; i < firstDay; i++) {
                  days.push(<div key={`empty-${i}`} className="h-8" />);
                }

                // Days of month
                for (let day = 1; day <= daysInMonth; day++) {
                  const isToday = day === today;
                  const isWeekend = (firstDay + day - 1) % 7 === 0 || (firstDay + day - 1) % 7 === 6;
                  days.push(
                    <button
                      key={day}
                      className={`h-8 w-8 mx-auto rounded-full flex items-center justify-center text-sm transition-all ${isCurrentMonth && day === today
                        ? 'bg-primary text-white font-bold shadow-lg'
                        : isWeekend
                          ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
                          : 'hover:bg-muted'
                        }`}
                    >
                      {day}
                    </button>
                  );
                }

                return days;
              })()}
            </div>

            {/* Quick Events */}
            <div className="pt-4 border-t border-border/50 space-y-2">
              <p className="text-xs text-muted-foreground font-medium">กิจกรรมที่กำลังจะมาถึง</p>
              <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-sm">สอบกลางภาค - 20 ม.ค.</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-amber-500/10 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-sm">ส่งรายงาน - 25 ม.ค.</span>
              </div>
            </div>
          </div>
        </div>

        {/* GPA Trend Chart */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-primary" />
            พัฒนาการ GPA
          </h3>
          <div className="space-y-4">
            {/* Current GPA Display */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl">
              <div>
                <p className="text-sm text-muted-foreground">GPA ปัจจุบัน</p>
                <p className="text-3xl font-bold text-primary">{student?.gpa?.toFixed(2) || '-'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">เป้าหมาย</p>
                <p className="text-2xl font-bold text-emerald-600">3.50</p>
              </div>
            </div>

            {/* Simple Bar Chart */}
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground font-medium">GPA รายภาค</p>

              {/* Semester Bars */}
              {[
                { semester: 'ภาค 1/67', gpa: 2.15, color: 'bg-blue-500' },
                { semester: 'ภาค 2/67', gpa: 2.36, color: 'bg-emerald-500' },
                { semester: 'ภาค 1/68', gpa: student?.gpa || 2.36, color: 'bg-primary' },
              ].map((item, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{item.semester}</span>
                    <span className="font-bold">{item.gpa.toFixed(2)}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-1000`}
                      style={{ width: `${(item.gpa / 4) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Trend Indicator */}
            <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-emerald-600">
                <path d="M10 16V4M10 4L5 9M10 4L15 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-sm text-emerald-700 dark:text-emerald-400">
                GPA เพิ่มขึ้น <span className="font-bold">+0.21</span> จากภาคก่อน
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Latest News */}
      {latestNews.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Newspaper size={20} className="text-primary" />
              ข่าวประกาศล่าสุด
            </h3>
            <Link to="/news" className="text-sm text-primary hover:underline flex items-center gap-1">
              ดูทั้งหมด <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {latestNews.map((news) => (
              <div
                key={news.id}
                className="group bg-card rounded-xl overflow-hidden shadow-sm border border-border/50 hover:shadow-lg hover:border-primary/30 transition-all duration-300 flex flex-col"
              >
                {news.image_url && (
                  <div className="h-40 overflow-hidden">
                    <img
                      src={news.image_url}
                      alt={news.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                <div className="p-4 flex-1 flex flex-col">
                  <span className="text-[10px] font-medium px-2 py-0.5 bg-primary/10 text-primary rounded-full mb-2 inline-block w-fit">
                    {news.category || 'ทั่วไป'}
                  </span>
                  <h4 className="font-bold text-sm mb-1 line-clamp-1 group-hover:text-primary transition-colors">{news.title}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">{news.content}</p>
                  <p className="text-[10px] text-muted-foreground mt-auto">
                    {new Date(news.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </StudentLayout>
  );
};

export default StudentDashboard;
