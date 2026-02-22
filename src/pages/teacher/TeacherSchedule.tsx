import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Loader2 } from 'lucide-react';
import TeacherLayout from '@/components/TeacherLayout';

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

const TeacherSchedule = () => {
  const { profile } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  const days = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์'];
  
  const timeSlots = [
    { period: 1, time: '08:10-08:40' },
    { period: 2, time: '08:40-09:30' },
    { period: 3, time: '09:30-10:20' },
    { period: 4, time: '10:20-11:10' },
    { period: 5, time: '11:10-12:00' },
    { period: 6, time: '12:50-13:40' },
    { period: 7, time: '13:40-14:30' },
    { period: 8, time: '14:30-15:20' },
    { period: 9, time: '15:20-16:10' },
  ];

  useEffect(() => {
    fetchData();
  }, [profile]);

  const fetchData = async () => {
    if (!profile) return;
    
    try {
      const [deptsRes, scheduleRes] = await Promise.all([
        supabase.from('departments').select('*'),
        supabase.from('schedule_entries').select('*').eq('teacher_name', profile.full_name),
      ]);

      setDepartments(deptsRes.data || []);
      setSchedule(scheduleRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDepartmentName = (deptId: string) => {
    return departments.find(d => d.id === deptId)?.name || '-';
  };

  const getScheduleForDayAndPeriod = (day: string, period: number): ScheduleEntry | null => {
    return schedule.find(s => s.day_of_week === day && s.period_start === period) || null;
  };

  if (loading) {
    return (
      <TeacherLayout title="ตารางสอน">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout title="ตารางสอน">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="text-emerald-600" size={28} />
        <h1 className="text-2xl font-semibold text-foreground">ตารางสอนของฉัน</h1>
      </div>

      {/* Schedule Table */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-emerald-50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground border-b border-border w-20">
                  คาบ/วัน
                </th>
                {days.map(day => (
                  <th key={day} className="px-4 py-3 text-center text-sm font-medium text-muted-foreground border-b border-border">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(slot => (
                <tr key={slot.period} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3 bg-muted/30">
                    <div className="text-sm font-medium">คาบ {slot.period}</div>
                    <div className="text-xs text-muted-foreground">{slot.time}</div>
                  </td>
                  {days.map(day => {
                    const entry = getScheduleForDayAndPeriod(day, slot.period);
                    return (
                      <td key={day} className="px-2 py-2 text-center">
                        {entry ? (
                          <div className="bg-emerald-100 rounded-lg p-2 text-left">
                            <p className="font-medium text-sm text-emerald-800">{entry.subject_name}</p>
                            <p className="text-xs text-emerald-600">{getDepartmentName(entry.department_id)}</p>
                            <p className="text-xs text-muted-foreground mt-1">ห้อง: {entry.room_name || '-'}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-card rounded-xl shadow-sm border border-border">
        <h3 className="font-semibold mb-3">สรุปตารางสอน</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-emerald-600">{schedule.length}</p>
            <p className="text-sm text-muted-foreground">คาบสอนทั้งหมด</p>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-blue-600">
              {new Set(schedule.map(s => s.subject_name)).size}
            </p>
            <p className="text-sm text-muted-foreground">วิชาที่สอน</p>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-purple-600">
              {new Set(schedule.map(s => s.department_id)).size}
            </p>
            <p className="text-sm text-muted-foreground">สาขาที่สอน</p>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-orange-600">
              {new Set(schedule.map(s => s.day_of_week)).size}
            </p>
            <p className="text-sm text-muted-foreground">วันที่สอน</p>
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
};

export default TeacherSchedule;
