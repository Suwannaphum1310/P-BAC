import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Loader2, Clock, BookOpen, MapPin, User, Download } from 'lucide-react';
import StudentLayout from '@/components/StudentLayout';
import { exportScheduleToPDF } from '@/utils/exportPDF';

interface Student {
  id: string;
  department_id: string | null;
}

interface ScheduleEntry {
  id: string;
  day_of_week: string;
  period_start: number;
  period_span: number;
  subject_name: string | null;
  room_name: string | null;
  teacher_name: string | null;
}

const StudentSchedule = () => {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [departmentName, setDepartmentName] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(new Date());

  const days = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์'];
  const dayColors: { [key: string]: string } = {
    'จันทร์': 'from-yellow-400 to-amber-500',
    'อังคาร': 'from-pink-400 to-rose-500',
    'พุธ': 'from-emerald-400 to-green-500',
    'พฤหัสบดี': 'from-orange-400 to-amber-500',
    'ศุกร์': 'from-blue-400 to-indigo-500',
  };

  const timeSlots = [
    { period: 1, time: '08:10 - 08:40', label: 'คาบ 1' },
    { period: 2, time: '08:40 - 09:30', label: 'คาบ 2' },
    { period: 3, time: '09:30 - 10:20', label: 'คาบ 3' },
    { period: 4, time: '10:20 - 11:10', label: 'คาบ 4' },
    { period: 5, time: '11:10 - 12:00', label: 'คาบ 5' },
    { period: 'lunch', time: '12:00 - 12:50', label: 'พักกลางวัน' },
    { period: 6, time: '12:50 - 13:40', label: 'คาบ 6' },
    { period: 7, time: '13:40 - 14:30', label: 'คาบ 7' },
    { period: 8, time: '14:30 - 15:20', label: 'คาบ 8' },
  ];

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      const { data: studentData } = await supabase
        .from('students')
        .select('id, department_id')
        .eq('email', user.email)
        .maybeSingle();

      if (studentData?.department_id) {
        const { data: deptData } = await supabase
          .from('departments')
          .select('name')
          .eq('id', studentData.department_id)
          .single();

        if (deptData) {
          setDepartmentName(deptData.name);
        }

        const { data: scheduleData } = await supabase
          .from('schedule_entries')
          .select('*')
          .eq('department_id', studentData.department_id)
          .order('period_start');

        setSchedule(scheduleData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScheduleForDayAndPeriod = (day: string, period: number): ScheduleEntry | null => {
    return schedule.find(s => s.day_of_week === day && s.period_start === period) || null;
  };

  const shouldSkipCell = (day: string, periodIndex: number): boolean => {
    for (let i = 0; i < periodIndex; i++) {
      const entry = getScheduleForDayAndPeriod(day, i + 1);
      if (entry?.period_span && entry.period_span > 1) {
        if (i + entry.period_span > periodIndex) {
          return true;
        }
      }
    }
    return false;
  };

  const getTodayDay = () => {
    const dayNum = currentTime.getDay();
    const mapping: { [key: number]: string } = {
      1: 'จันทร์', 2: 'อังคาร', 3: 'พุธ', 4: 'พฤหัสบดี', 5: 'ศุกร์'
    };
    return mapping[dayNum] || null;
  };

  const todayDay = getTodayDay();

  if (loading) {
    return (
      <StudentLayout title="ตารางเรียน">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="ตารางเรียน">
      {/* Modern Header Banner */}
      <div className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-white rounded-2xl p-6 mb-6 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
              <Calendar size={16} />
              <span>ตารางเรียนของฉัน</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              {departmentName || 'สาขาวิชา'}
            </h1>
            <p className="text-white/80 text-sm">
              ภาคเรียนที่ 1 ปีการศึกษา 2568
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center">
              <Clock size={20} className="mx-auto mb-1 opacity-80" />
              <p className="text-2xl font-bold font-mono">
                {currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-xs text-white/70">
                {currentTime.toLocaleDateString('th-TH', { weekday: 'long' })}
              </p>
            </div>
            <button
              onClick={() => exportScheduleToPDF('schedule-table', departmentName)}
              className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 hover:bg-white/20 transition-colors"
            >
              <Download size={20} className="mx-auto mb-1" />
              <p className="text-xs">ดาวน์โหลด PDF</p>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border/50 text-center hover:shadow-md hover:-translate-y-1 transition-all">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-2">
            <BookOpen size={20} className="text-white" />
          </div>
          <p className="text-2xl font-bold text-emerald-600">{schedule.length}</p>
          <p className="text-xs text-muted-foreground">คาบเรียน/สัปดาห์</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border/50 text-center hover:shadow-md hover:-translate-y-1 transition-all">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Calendar size={20} className="text-white" />
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {new Set(schedule.map(s => s.subject_name)).size}
          </p>
          <p className="text-xs text-muted-foreground">วิชาที่เรียน</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border/50 text-center hover:shadow-md hover:-translate-y-1 transition-all">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-2">
            <User size={20} className="text-white" />
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {new Set(schedule.filter(s => s.teacher_name).map(s => s.teacher_name)).size}
          </p>
          <p className="text-xs text-muted-foreground">อาจารย์ผู้สอน</p>
        </div>
      </div>

      {/* Schedule Table */}
      <div id="schedule-table" className="bg-card rounded-xl shadow-sm border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-center px-3 py-3 text-sm font-semibold border-r border-border/50 w-24">
                  วัน/คาบ
                </th>
                {timeSlots.map((slot, idx) => (
                  <th
                    key={idx}
                    className={`text-center px-2 py-3 text-xs font-medium border-r border-border/50 ${slot.period === 'lunch' ? 'bg-amber-50 dark:bg-amber-950/30 w-20' : 'w-24'
                      }`}
                  >
                    <div className="font-semibold">{slot.period === 'lunch' ? '🍽️' : `คาบ ${slot.period}`}</div>
                    <div className="text-muted-foreground text-[10px]">{slot.time}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((day) => {
                const isToday = day === todayDay;
                return (
                  <tr
                    key={day}
                    className={`border-b border-border/50 last:border-0 ${isToday ? 'bg-primary/5' : ''
                      }`}
                  >
                    <td className={`px-3 py-4 text-sm font-semibold border-r border-border/50 text-center ${isToday ? 'bg-primary/10' : 'bg-muted/30'
                      }`}>
                      <div className="flex items-center justify-center gap-2">
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${dayColors[day]}`} />
                        <span>{day}</span>
                        {isToday && (
                          <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded-full">วันนี้</span>
                        )}
                      </div>
                    </td>
                    {timeSlots.map((slot, slotIdx) => {
                      if (slot.period === 'lunch') {
                        return (
                          <td key={slotIdx} className="text-center py-4 bg-amber-50/50 dark:bg-amber-950/20 border-r border-border/50">
                            <span className="text-xs text-amber-600 dark:text-amber-400">พัก</span>
                          </td>
                        );
                      }

                      const periodNum = typeof slot.period === 'number' ? slot.period : -1;
                      const arrayIndex = periodNum <= 5 ? periodNum - 1 : periodNum - 2;

                      if (arrayIndex === -1) return null;
                      if (shouldSkipCell(day, arrayIndex)) return null;

                      const entry = getScheduleForDayAndPeriod(day, periodNum);
                      const colspan = entry?.period_span || 1;

                      return (
                        <td
                          key={slotIdx}
                          colSpan={colspan}
                          className="px-1 py-2 text-center border-r border-border/50 align-top"
                        >
                          {entry ? (
                            <div className={`group min-h-[60px] flex flex-col justify-center rounded-lg p-2 bg-gradient-to-br ${dayColors[day]} text-white shadow-sm hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer`}>
                              <p className="text-xs font-bold leading-tight line-clamp-2">
                                {entry.subject_name}
                              </p>
                              {entry.room_name && (
                                <p className="text-[10px] opacity-90 mt-1 flex items-center justify-center gap-1">
                                  <MapPin size={10} /> {entry.room_name}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="min-h-[60px] flex items-center justify-center">
                              <span className="text-xs text-muted-foreground/30">-</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="font-medium">สี:</span>
        {days.map(day => (
          <div key={day} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded bg-gradient-to-r ${dayColors[day]}`} />
            <span>{day}</span>
          </div>
        ))}
      </div>
    </StudentLayout>
  );
};

export default StudentSchedule;
