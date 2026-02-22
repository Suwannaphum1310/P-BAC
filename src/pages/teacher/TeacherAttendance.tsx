import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ClipboardCheck, Loader2, Check, X, Clock, AlertCircle, Search } from 'lucide-react';
import TeacherLayout from '@/components/TeacherLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { notifyAttendanceMarked } from '@/utils/notifications';

interface Student {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  department_id: string | null;
}

interface ScheduleEntry {
  id: string;
  subject_name: string | null;
  day_of_week: string;
  period_start: number;
  department_id: string;
}

interface Department {
  id: string;
  name: string;
}

interface AttendanceRecord {
  id: string;
  student_id: string;
  status: string;
  note: string | null;
}

const TeacherAttendance = () => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [attendance, setAttendance] = useState<Map<string, AttendanceRecord>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    fetchData();
  }, [profile]);

  useEffect(() => {
    if (selectedSchedule) {
      fetchAttendance();
    }
  }, [selectedDate, selectedSchedule]);

  const fetchData = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      const [deptsRes, schedulesRes, studentsRes] = await Promise.all([
        supabase.from('departments').select('*'),
        supabase.from('schedule_entries').select('*').eq('teacher_name', profile.full_name),
        supabase.from('students').select('*').eq('status', 'active'),
      ]);

      setDepartments(deptsRes.data || []);
      setScheduleEntries(schedulesRes.data || []);
      setStudents(studentsRes.data || []);

      // Auto-select first schedule
      if (schedulesRes.data && schedulesRes.data.length > 0) {
        setSelectedSchedule(schedulesRes.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    if (!selectedSchedule) return;

    try {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data } = await supabase
        .from('attendance')
        .select('*')
        .eq('schedule_entry_id', selectedSchedule)
        .gte('check_in_time', startOfDay.toISOString())
        .lte('check_in_time', endOfDay.toISOString());

      const attendanceMap = new Map<string, AttendanceRecord>();
      data?.forEach(record => {
        attendanceMap.set(record.student_id, record);
      });
      setAttendance(attendanceMap);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const handleStatusChange = async (studentId: string, status: string) => {
    if (!selectedSchedule || !user) return;

    setSaving(true);
    try {
      const existingRecord = attendance.get(studentId);

      if (existingRecord) {
        const { error } = await supabase
          .from('attendance')
          .update({ status, recorded_by: user.id })
          .eq('id', existingRecord.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('attendance')
          .insert({
            student_id: studentId,
            schedule_entry_id: selectedSchedule,
            status,
            check_in_time: new Date(selectedDate).toISOString(),
            recorded_by: user.id,
          });

        if (error) throw error;
      }

      await fetchAttendance();
      toast({ title: "บันทึกสำเร็จ" });

      // Get student's user_id from profiles and notify them
      const student = students.find(s => s.id === studentId);
      if (student && selectedEntry?.subject_name) {
        // Find the student's user_id from students table
        const { data: studentData } = await supabase
          .from('profiles')
          .select('id')
          .eq('full_name', `${student.first_name} ${student.last_name}`)
          .single();

        if (studentData?.id) {
          notifyAttendanceMarked(
            studentData.id,
            selectedEntry.subject_name,
            status as 'present' | 'late' | 'absent'
          );
        }
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลได้",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">มาเรียน</Badge>;
      case 'late':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">มาสาย</Badge>;
      case 'absent':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">ขาดเรียน</Badge>;
      case 'excused':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">ลา</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">ยังไม่เช็ค</Badge>;
    }
  };

  const getDepartmentName = (deptId: string | null) => {
    if (!deptId) return '-';
    return departments.find(d => d.id === deptId)?.name || '-';
  };

  // Get students for selected schedule's department
  const selectedEntry = scheduleEntries.find(e => e.id === selectedSchedule);
  const filteredStudents = students
    .filter(s => s.department_id === selectedEntry?.department_id)
    .filter(s =>
      s.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.last_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Stats
  const stats = {
    total: filteredStudents.length,
    present: filteredStudents.filter(s => attendance.get(s.id)?.status === 'present').length,
    late: filteredStudents.filter(s => attendance.get(s.id)?.status === 'late').length,
    absent: filteredStudents.filter(s => attendance.get(s.id)?.status === 'absent').length,
    excused: filteredStudents.filter(s => attendance.get(s.id)?.status === 'excused').length,
  };

  if (loading) {
    return (
      <TeacherLayout title="บันทึกการเข้าเรียน">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout title="บันทึกการเข้าเรียน">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <ClipboardCheck className="text-emerald-600" size={28} />
        <h1 className="text-2xl font-semibold text-foreground">บันทึกการเข้าเรียน</h1>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <Label htmlFor="date">วันที่</Label>
          <Input
            id="date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="schedule">วิชา/คาบ</Label>
          <Select value={selectedSchedule} onValueChange={setSelectedSchedule}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="เลือกวิชา" />
            </SelectTrigger>
            <SelectContent>
              {scheduleEntries.map(entry => (
                <SelectItem key={entry.id} value={entry.id}>
                  {entry.subject_name} - คาบ {entry.period_start} ({entry.day_of_week})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="search">ค้นหานักศึกษา</Label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              id="search"
              placeholder="ค้นหาด้วยรหัส หรือชื่อ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
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

      {/* Student List */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">ลำดับ</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">รหัสนักศึกษา</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">ชื่อ-นามสกุล</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">สถานะ</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-muted-foreground">บันทึก</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    {scheduleEntries.length === 0
                      ? 'ไม่มีวิชาที่สอน'
                      : 'ไม่พบนักศึกษาในสาขานี้'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, index) => {
                  const record = attendance.get(student.id);
                  return (
                    <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm">{index + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium">{student.student_id}</td>
                      <td className="px-4 py-3 text-sm">{student.first_name} {student.last_name}</td>
                      <td className="px-4 py-3">{getStatusBadge(record?.status || '')}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant={record?.status === 'present' ? 'default' : 'outline'}
                            onClick={() => handleStatusChange(student.id, 'present')}
                            disabled={saving}
                            className="w-9 h-9 p-0"
                          >
                            <Check size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant={record?.status === 'late' ? 'default' : 'outline'}
                            onClick={() => handleStatusChange(student.id, 'late')}
                            disabled={saving}
                            className="w-9 h-9 p-0"
                          >
                            <Clock size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant={record?.status === 'absent' ? 'destructive' : 'outline'}
                            onClick={() => handleStatusChange(student.id, 'absent')}
                            disabled={saving}
                            className="w-9 h-9 p-0"
                          >
                            <X size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant={record?.status === 'excused' ? 'secondary' : 'outline'}
                            onClick={() => handleStatusChange(student.id, 'excused')}
                            disabled={saving}
                            className="w-9 h-9 p-0"
                          >
                            <AlertCircle size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </TeacherLayout>
  );
};

export default TeacherAttendance;
