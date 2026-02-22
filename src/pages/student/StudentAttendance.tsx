import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ClipboardCheck, Loader2, Check, X, Clock, AlertCircle } from 'lucide-react';
import StudentLayout from '@/components/StudentLayout';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface AttendanceRecord {
  id: string;
  status: string;
  check_in_time: string;
  note: string | null;
  schedule_entry_id: string | null;
}

interface ScheduleEntry {
  id: string;
  subject_name: string | null;
  day_of_week: string;
  period_start: number;
}

const StudentAttendance = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<(AttendanceRecord & { subject_name?: string })[]>([]);
  const [stats, setStats] = useState({ present: 0, late: 0, absent: 0, excused: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Find student by email
      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();

      if (studentData) {
        // Fetch attendance records
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select('*')
          .eq('student_id', studentData.id)
          .order('check_in_time', { ascending: false });

        // Fetch schedule entries for subject names
        const { data: scheduleData } = await supabase
          .from('schedule_entries')
          .select('id, subject_name, day_of_week, period_start');

        const scheduleMap = new Map<string, ScheduleEntry>();
        scheduleData?.forEach(s => scheduleMap.set(s.id, s));

        // Merge attendance with subject names
        const mergedAttendance = (attendanceData || []).map(a => ({
          ...a,
          subject_name: a.schedule_entry_id ? scheduleMap.get(a.schedule_entry_id)?.subject_name : null,
        }));

        setAttendance(mergedAttendance);

        // Calculate stats
        const stats = {
          present: mergedAttendance.filter(a => a.status === 'present').length,
          late: mergedAttendance.filter(a => a.status === 'late').length,
          absent: mergedAttendance.filter(a => a.status === 'absent').length,
          excused: mergedAttendance.filter(a => a.status === 'excused').length,
          total: mergedAttendance.length,
        };
        setStats(stats);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100"><Check size={14} className="mr-1" />มาเรียน</Badge>;
      case 'late':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100"><Clock size={14} className="mr-1" />มาสาย</Badge>;
      case 'absent':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100"><X size={14} className="mr-1" />ขาดเรียน</Badge>;
      case 'excused':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100"><AlertCircle size={14} className="mr-1" />ลา</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const attendancePercentage = stats.total > 0
    ? Math.round(((stats.present + stats.late) / stats.total) * 100)
    : 0;

  if (loading) {
    return (
      <StudentLayout title="ประวัติการเข้าเรียน">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="ประวัติการเข้าเรียน">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <ClipboardCheck className="text-sky-600" size={28} />
        <h1 className="text-2xl font-semibold text-foreground">ประวัติการเข้าเรียน</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-card p-4 rounded-lg text-center border border-border">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-sm text-muted-foreground">ทั้งหมด</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center border border-green-200">
          <p className="text-2xl font-bold text-green-600">{stats.present}</p>
          <p className="text-sm text-green-600">มาเรียน</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg text-center border border-yellow-200">
          <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
          <p className="text-sm text-yellow-600">มาสาย</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg text-center border border-red-200">
          <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
          <p className="text-sm text-red-600">ขาดเรียน</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg text-center border border-blue-200">
          <p className="text-2xl font-bold text-blue-600">{stats.excused}</p>
          <p className="text-sm text-blue-600">ลา</p>
        </div>
      </div>

      {/* Attendance Rate */}
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">อัตราการเข้าเรียน</h3>
          <span className="text-3xl font-bold text-sky-600">{attendancePercentage}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-4">
          <div 
            className="bg-sky-500 h-4 rounded-full transition-all duration-500"
            style={{ width: `${attendancePercentage}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          เข้าเรียน {stats.present + stats.late} ครั้ง จากทั้งหมด {stats.total} ครั้ง
        </p>
      </div>

      {/* Attendance List */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">รายการเข้าเรียน</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">วันที่</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">วิชา</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">สถานะ</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-muted-foreground">
                    ยังไม่มีประวัติการเข้าเรียน
                  </td>
                </tr>
              ) : (
                attendance.map((record) => (
                  <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm">
                      {format(new Date(record.check_in_time), 'd MMM yyyy', { locale: th })}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{record.subject_name || '-'}</td>
                    <td className="px-4 py-3">{getStatusBadge(record.status)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{record.note || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentAttendance;
