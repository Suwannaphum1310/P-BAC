import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Users, ClipboardCheck, BookOpen, Clock, Sparkles, ArrowRight } from 'lucide-react';
import TeacherLayout from '@/components/TeacherLayout';
import { Link } from 'react-router-dom';

interface ScheduleEntry {
  id: string;
  day_of_week: string;
  period_start: number;
  period_span: number;
  subject_name: string | null;
  room_name: string | null;
  department_id: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

const TeacherDashboard = () => {
  const { profile } = useAuth();
  const [todaySchedule, setTodaySchedule] = useState<ScheduleEntry[]>([]);
  const [totalClasses, setTotalClasses] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

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
  }, [profile]);

  const fetchData = async () => {
    if (!profile) return;

    try {
      // Fetch departments for reference
      const { data: depts } = await supabase
        .from('departments')
        .select('*');
      setDepartments(depts || []);

      // Fetch schedule entries for this teacher
      const { data: schedule } = await supabase
        .from('schedule_entries')
        .select('*')
        .eq('teacher_name', profile.full_name);

      if (schedule) {
        setTotalClasses(schedule.length);

        // Get today's schedule
        const today = dayMapping[new Date().getDay()];
        const todayClasses = schedule.filter(s => s.day_of_week === today);
        setTodaySchedule(todayClasses.sort((a, b) => a.period_start - b.period_start));

        // Get unique departments
        const deptIds = [...new Set(schedule.map(s => s.department_id))];

        // Count students in those departments
        if (deptIds.length > 0) {
          const { count } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .in('department_id', deptIds);

          setTotalStudents(count || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDepartmentName = (deptId: string) => {
    const dept = departments.find(d => d.id === deptId);
    return dept?.name || '-';
  };

  // Find current or next class
  const getCurrentOrNextClass = () => {
    const now = currentTime;
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

    for (const entry of todaySchedule) {
      const period = periodTimes[entry.period_start];
      if (!period) continue;

      if (currentTimeStr >= period.start && currentTimeStr < period.end) {
        return { entry, status: 'current', remaining: getMinutesUntil(period.end) };
      }
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

  const stats = [
    { icon: Calendar, label: 'คาบสอนวันนี้', value: todaySchedule.length.toString(), gradient: 'from-blue-500 to-blue-600' },
    { icon: BookOpen, label: 'คาบสอนทั้งหมด', value: totalClasses.toString(), gradient: 'from-emerald-500 to-emerald-600' },
    { icon: Users, label: 'นักศึกษาที่สอน', value: totalStudents.toString(), gradient: 'from-purple-500 to-purple-600' },
    { icon: ClipboardCheck, label: 'แผนกที่สอน', value: new Set(todaySchedule.map(s => s.department_id)).size.toString(), gradient: 'from-orange-500 to-orange-600' },
  ];

  if (loading) {
    return (
      <TeacherLayout title="แดชบอร์ดอาจารย์">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout title="แดชบอร์ดอาจารย์">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-2xl p-6 md:p-8 mb-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={20} className="text-yellow-300" />
              <span className="text-primary-foreground/80 text-sm">สวัสดีตอน{currentTime.getHours() < 12 ? 'เช้า' : currentTime.getHours() < 17 ? 'บ่าย' : 'เย็น'}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-1">
              {profile?.full_name || 'อาจารย์'}
            </h2>
            <p className="text-primary-foreground/70">
              ยินดีต้อนรับเข้าสู่ระบบจัดการการเรียนการสอน
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Real-time Clock */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-primary-foreground/80" />
                <span className="text-2xl font-mono font-bold">
                  {currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-primary-foreground/70 mt-1">
                {dayMapping[currentTime.getDay()]}ที่ {currentTime.getDate()} {currentTime.toLocaleDateString('th-TH', { month: 'short', year: 'numeric' })}
              </p>
            </div>

            <Link
              to="/teacher/attendance"
              className="hidden md:flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 transition-all"
            >
              <span>บันทึกเข้าเรียน</span>
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
                  <p className="text-sm text-primary-foreground/70">
                    {currentOrNext.status === 'current' ? '🎯 กำลังสอน' : '⏰ คาบถัดไป'}
                  </p>
                  <p className="font-semibold text-lg">{currentOrNext.entry.subject_name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-primary-foreground/70">
                  {currentOrNext.status === 'current' ? 'เหลืออีก' : 'เริ่มในอีก'}
                </p>
                <p className="font-bold text-xl">{currentOrNext.remaining} นาที</p>
              </div>
              <div className="bg-white/10 rounded-lg px-3 py-2">
                <p className="text-xs text-primary-foreground/70">ห้องเรียน</p>
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

      {/* Today's Schedule */}
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar size={20} className="text-primary" />
            ตารางสอนวันนี้
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
                      ? 'bg-primary/10 border-2 border-primary shadow-md'
                      : isNext
                        ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-400'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[60px]">
                      <span className={`text-sm font-medium ${isCurrent ? 'text-primary' : isNext ? 'text-amber-700 dark:text-amber-400' : ''}`}>
                        คาบ {entry.period_start}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {period ? `${period.start}-${period.end}` : '-'}
                      </p>
                    </div>
                    <div>
                      <p className={`font-medium ${isCurrent ? 'text-primary' : isNext ? 'text-amber-700 dark:text-amber-400' : ''}`}>
                        {entry.subject_name || '-'}
                      </p>
                      <p className="text-sm text-muted-foreground">{getDepartmentName(entry.department_id)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCurrent && (
                      <span className="text-xs bg-primary text-white px-2 py-1 rounded-full animate-pulse">
                        กำลังสอน
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
            <p className="text-muted-foreground">ไม่มีคาบสอนวันนี้</p>
            <p className="text-sm text-muted-foreground/70 mt-1">พักผ่อนให้เต็มที่นะครับ 😊</p>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
};

export default TeacherDashboard;
