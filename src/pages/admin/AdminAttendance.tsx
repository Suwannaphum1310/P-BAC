import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { ClipboardCheck, Search, Loader2, Check, X, Clock, AlertCircle, FileDown, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { usePdfExport } from '@/hooks/usePdfExport';
import { useExcelExport } from '@/hooks/useExcelExport';
import { cn } from '@/lib/utils';

interface Student {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  department_id: string | null;
  year: number;
  status: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

interface ScheduleEntry {
  id: string;
  subject_name: string | null;
  day_of_week: string;
  period_start: number;
  period_span: number;
  department_id: string;
}

interface AttendanceRecord {
  id: string;
  student_id: string;
  status: string;
  check_in_time: string;
  note: string | null;
}

const AdminAttendance = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { exportAttendanceToPdf } = usePdfExport();
  const { exportAttendanceToExcel } = useExcelExport();
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [attendance, setAttendance] = useState<Map<string, AttendanceRecord>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedSchedule, setSelectedSchedule] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [viewMode, setViewMode] = useState<'daily' | 'sheet'>('daily');
  const [sheetAttendance, setSheetAttendance] = useState<any[]>([]);
  const [absenceCount, setAbsenceCount] = useState<Map<string, number>>(new Map()); // Track monthly absences per student

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch attendance when date or schedule changes
  useEffect(() => {
    if (selectedSchedule) {
      fetchAttendance();
      fetchMonthlyAbsences(); // Fetch absence counts for alerts
      if (viewMode === 'sheet') {
        fetchSheetAttendance();
      }
    }
  }, [selectedDate, selectedSchedule, viewMode]);

  const fetchSheetAttendance = async () => {
    if (!selectedSchedule || !selectedDate) return;

    try {
      const date = new Date(selectedDate);
      const firstDay = format(new Date(date.getFullYear(), date.getMonth(), 1), 'yyyy-MM-dd') + 'T00:00:00';
      const lastDay = format(new Date(date.getFullYear(), date.getMonth() + 1, 0), 'yyyy-MM-dd') + 'T23:59:59';

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('schedule_entry_id', selectedSchedule)
        .gte('check_in_time', firstDay)
        .lte('check_in_time', lastDay);

      if (error) throw error;
      setSheetAttendance(data || []);
    } catch (error) {
      console.error('Error fetching sheet attendance:', error);
    }
  };

  // Fetch monthly absence counts for all students (for warning alerts)
  const fetchMonthlyAbsences = async () => {
    if (!selectedSchedule || !selectedDate) return;

    try {
      const date = new Date(selectedDate);
      const firstDay = format(new Date(date.getFullYear(), date.getMonth(), 1), 'yyyy-MM-dd') + 'T00:00:00';
      const lastDay = format(new Date(date.getFullYear(), date.getMonth() + 1, 0), 'yyyy-MM-dd') + 'T23:59:59';

      const { data, error } = await supabase
        .from('attendance')
        .select('student_id, status')
        .eq('schedule_entry_id', selectedSchedule)
        .eq('status', 'absent')
        .gte('check_in_time', firstDay)
        .lte('check_in_time', lastDay);

      if (error) throw error;

      // Count absences per student
      const counts = new Map<string, number>();
      (data || []).forEach((record: any) => {
        counts.set(record.student_id, (counts.get(record.student_id) || 0) + 1);
      });
      setAbsenceCount(counts);
    } catch (error) {
      console.error('Error fetching monthly absences:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsRes, deptsRes, schedulesRes] = await Promise.all([
        supabase.from('students').select('*').eq('status', 'active').order('student_id'),
        supabase.from('departments').select('*').order('name'),
        supabase.from('schedule_entries').select('*').order('day_of_week'),
      ]);

      if (studentsRes.error) throw studentsRes.error;
      if (deptsRes.error) throw deptsRes.error;
      if (schedulesRes.error) throw schedulesRes.error;

      setStudents(studentsRes.data || []);
      setDepartments(deptsRes.data || []);
      setScheduleEntries(schedulesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    if (!selectedSchedule || !selectedDate) return;

    try {
      const startOfDay = `${selectedDate}T00:00:00`;
      const endOfDay = `${selectedDate}T23:59:59`;

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('schedule_entry_id', selectedSchedule)
        .gte('check_in_time', startOfDay)
        .lte('check_in_time', endOfDay);

      if (error) throw error;

      const attendanceMap = new Map<string, AttendanceRecord>();
      (data || []).forEach((record: AttendanceRecord) => {
        attendanceMap.set(record.student_id, record);
      });
      setAttendance(attendanceMap);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };


  const handleMarkAttendance = async (studentId: string, status: 'present' | 'late' | 'absent' | 'excused' | null, targetDate?: string) => {
    if (!selectedSchedule || !user) {
      toast({
        title: "กรุณาเลือกวิชา",
        description: "เลือกคาบเรียนก่อนเช็คชื่อ",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Use targetDate if provided, otherwise use selectedDate
      const dateToUse = targetDate || selectedDate;
      const checkInTime = `${dateToUse}T${new Date().toTimeString().slice(0, 8)}`;

      // Find existing record for this student on this specific date
      let existingRecord = null;

      if (viewMode === 'sheet') {
        // In sheet view, always search by both student ID AND date
        existingRecord = sheetAttendance.find(r =>
          r.student_id === studentId &&
          r.check_in_time && r.check_in_time.substring(0, 10) === dateToUse
        );
      } else {
        // In daily view, use the attendance map (date is already filtered)
        existingRecord = attendance.get(studentId);
      }

      if (status === null) {
        if (existingRecord) {
          const { error } = await supabase
            .from('attendance')
            .delete()
            .eq('id', existingRecord.id);
          if (error) throw error;
          toast({ title: "ยกเลิกการเช็คชื่อสำเร็จ", description: "ลบข้อมูลการมาเรียนเรียบร้อย" });
          // Refresh after delete
          await fetchAttendance();
          await fetchSheetAttendance();
        } else {
          toast({ title: "ไม่มีข้อมูล", description: "ไม่พบข้อมูลการเช็คชื่อที่จะลบ", variant: "destructive" });
        }
      } else if (existingRecord) {
        // Update existing record
        const { error } = await supabase
          .from('attendance')
          .update({ status, check_in_time: checkInTime })
          .eq('id', existingRecord.id);

        if (error) throw error;
        toast({ title: "บันทึกสำเร็จ", description: `เช็คชื่อเรียบร้อย: ${getStatusLabel(status)}` });
        // Refresh after update
        await fetchAttendance();
        await fetchSheetAttendance();
      } else {
        // Insert new record
        const { error } = await supabase
          .from('attendance')
          .insert({
            student_id: studentId,
            schedule_entry_id: selectedSchedule,
            status,
            check_in_time: checkInTime,
            recorded_by: user.id,
          });

        if (error) throw error;
        toast({ title: "บันทึกสำเร็จ", description: `เช็คชื่อเรียบร้อย: ${getStatusLabel(status)}` });
        // Refresh after insert
        await fetchAttendance();
        await fetchSheetAttendance();
      }
    } catch (error: any) {
      console.error('Error marking attendance:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: `ไม่สามารถบันทึกการเช็คชื่อได้: ${error.message || 'ข้อผิดพลาดไม่ระบุ'}`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAllPresent = async () => {
    if (!selectedSchedule || !user || filteredStudents.length === 0) return;

    setSaving(true);
    try {
      // Use selectedDate with current time to avoid timezone issues
      const checkInTime = `${selectedDate}T${new Date().toTimeString().slice(0, 8)}`;

      // Separate existing records (update) from new records (insert)
      const recordsToUpdate: any[] = [];
      const recordsToInsert: any[] = [];

      filteredStudents.forEach(student => {
        const existing = attendance.get(student.id);
        if (existing) {
          recordsToUpdate.push({
            id: existing.id,
            student_id: student.id,
            schedule_entry_id: selectedSchedule,
            status: 'present',
            check_in_time: checkInTime,
            recorded_by: user.id
          });
        } else {
          recordsToInsert.push({
            student_id: student.id,
            schedule_entry_id: selectedSchedule,
            status: 'present',
            check_in_time: checkInTime,
            recorded_by: user.id
          });
        }
      });

      // Update existing records
      if (recordsToUpdate.length > 0) {
        const { error: updateError } = await supabase
          .from('attendance')
          .upsert(recordsToUpdate, { onConflict: 'id' });
        if (updateError) throw updateError;
      }

      // Insert new records
      if (recordsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('attendance')
          .insert(recordsToInsert);
        if (insertError) throw insertError;
      }

      toast({
        title: "เช็คชื่อสำเร็จ",
        description: `เช็คชื่อนักศึกษา ${filteredStudents.length} คน เป็น: มาเรียน`,
      });

      await fetchAttendance();
      await fetchSheetAttendance();
    } catch (error: any) {
      console.error('Error marking all present:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: `ไม่สามารถบันทึกการเช็คชื่อแบบกลุ่มได้: ${error.message || 'ข้อผิดพลาดไม่ระบุ'}`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'present': return 'มาเรียน';
      case 'late': return 'มาสาย';
      case 'absent': return 'ขาดเรียน';
      case 'excused': return 'ลาป่วย/ลากิจ';
      default: return status;
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

  const getDayOfWeekThai = (day: string) => {
    const days: Record<string, string> = {
      monday: 'จันทร์',
      tuesday: 'อังคาร',
      wednesday: 'พุธ',
      thursday: 'พฤหัส',
      friday: 'ศุกร์',
      saturday: 'เสาร์',
      sunday: 'อาทิตย์',
    };
    return days[day.toLowerCase()] || day;
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch =
      student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.last_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = selectedDepartment === 'all' || student.department_id === selectedDepartment;

    return matchesSearch && matchesDepartment;
  });

  // Count attendance stats
  const stats = {
    total: filteredStudents.length,
    present: filteredStudents.filter(s => attendance.get(s.id)?.status === 'present').length,
    late: filteredStudents.filter(s => attendance.get(s.id)?.status === 'late').length,
    absent: filteredStudents.filter(s => attendance.get(s.id)?.status === 'absent').length,
    excused: filteredStudents.filter(s => attendance.get(s.id)?.status === 'excused').length,
    unchecked: filteredStudents.filter(s => !attendance.get(s.id)).length,
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="text-primary" size={28} />
          <h1 className="text-2xl font-semibold text-foreground">เช็คชื่อนักศึกษา</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {viewMode === 'daily' && (
            <Button
              variant="default"
              onClick={handleMarkAllPresent}
              disabled={saving || !selectedSchedule || filteredStudents.length === 0}
              className="bg-green-600 hover:bg-green-700 gap-2"
            >
              <Check size={18} />
              มาเรียนทั้งหมด
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              const selectedEntry = scheduleEntries.find(e => e.id === selectedSchedule);
              const subjectName = selectedEntry?.subject_name || 'All Subjects';
              const deptName = selectedDepartment === 'all'
                ? 'All Departments'
                : departments.find(d => d.id === selectedDepartment)?.name || 'Unknown';

              exportAttendanceToPdf(
                filteredStudents,
                attendance,
                subjectName,
                selectedDate,
                deptName
              );
              toast({ title: "Export สำเร็จ", description: "ดาวน์โหลดไฟล์ PDF เรียบร้อย" });
            }}
            disabled={filteredStudents.length === 0}
            className="gap-2"
          >
            <FileDown size={18} />
            PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const selectedEntry = scheduleEntries.find(e => e.id === selectedSchedule);
              const subjectName = selectedEntry?.subject_name || 'All Subjects';
              const deptName = selectedDepartment === 'all'
                ? 'ทุกสาขา'
                : departments.find(d => d.id === selectedDepartment)?.name || 'Unknown';

              exportAttendanceToExcel(
                filteredStudents,
                attendance,
                subjectName,
                selectedDate,
                deptName
              );
              toast({ title: "Export สำเร็จ", description: "ดาวน์โหลดไฟล์ Excel เรียบร้อย" });
            }}
            disabled={filteredStudents.length === 0}
            className="gap-2"
          >
            <FileDown size={18} />
            Excel
          </Button>
        </div>
      </div>

      <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)} className="mb-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="daily">รายวัน</TabsTrigger>
          <TabsTrigger value="sheet">ตารางรวม (Sheet)</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <Label>วันที่</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal mt-1 h-10",
                  "border-2 border-primary/30 hover:border-primary hover:bg-primary/5",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                {selectedDate ? format(new Date(selectedDate), "dd/MM/yyyy", { locale: th }) : "เลือกวันที่"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate ? new Date(selectedDate) : undefined}
                onSelect={(date) => date && setSelectedDate(format(date, 'yyyy-MM-dd'))}
                initialFocus
                locale={th}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <Label htmlFor="department">สาขา</Label>
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="ทุกสาขา" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกสาขา</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="schedule">คาบเรียน/วิชา</Label>
          <Select value={selectedSchedule} onValueChange={setSelectedSchedule}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="เลือกคาบเรียน" />
            </SelectTrigger>
            <SelectContent>
              {scheduleEntries.map((entry) => (
                <SelectItem key={entry.id} value={entry.id}>
                  {entry.subject_name || 'ไม่ระบุวิชา'} - {getDayOfWeekThai(entry.day_of_week)} คาบ {entry.period_start}
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
              placeholder="รหัส หรือชื่อ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-muted-foreground">ทั้งหมด</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-green-600">มาเรียน</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.present}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-yellow-600">มาสาย</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.late}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-red-600">ขาดเรียน</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.absent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-blue-600">ลา</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.excused}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-muted-foreground">ยังไม่เช็ค</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.unchecked}</div>
          </CardContent>
        </Card>
      </div>

      {/* Daily View Table */}
      {viewMode === 'daily' ? (
        <div className="bg-background rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 text-base font-semibold text-muted-foreground whitespace-nowrap">รหัสนักศึกษา</th>
                  <th className="text-left px-4 py-3 text-base font-semibold text-muted-foreground whitespace-nowrap">ชื่อ-นามสกุล</th>
                  <th className="text-left px-4 py-3 text-base font-semibold text-muted-foreground">สาขา</th>
                  <th className="text-left px-4 py-3 text-base font-semibold text-muted-foreground whitespace-nowrap">ชั้นปี</th>
                  <th className="text-left px-4 py-3 text-base font-semibold text-muted-foreground">สถานะ</th>
                  <th className="text-center px-4 py-3 text-base font-semibold text-muted-foreground">เช็คชื่อ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'ไม่พบข้อมูลนักศึกษาที่ค้นหา' : 'ยังไม่มีข้อมูลนักศึกษา'}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => {
                    const record = attendance.get(student.id);
                    const monthlyAbsences = absenceCount.get(student.id) || 0;
                    const hasWarning = monthlyAbsences >= 3;
                    return (
                      <tr key={student.id} className={`hover:bg-muted/30 transition-colors ${hasWarning ? 'bg-red-50 dark:bg-red-950/20' : ''}`}>
                        <td className="px-4 py-4 text-sm font-medium">{student.student_id}</td>
                        <td className="px-4 py-4 text-base font-semibold whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {student.first_name} {student.last_name}
                            {hasWarning && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <span className="inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
                                      {monthlyAbsences}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>⚠️ ขาดเรียนเดือนนี้ {monthlyAbsences} ครั้ง</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm">{getDepartmentName(student.department_id)}</td>
                        <td className="px-4 py-4 text-sm whitespace-nowrap">ปี {student.year}</td>
                        <td className="px-4 py-3">{getStatusBadge(record?.status || '')}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant={record?.status === 'present' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleMarkAttendance(student.id, 'present')}
                              disabled={saving || !selectedSchedule}
                              className="w-10 h-10 p-0 rounded-full"
                              title="มาเรียน"
                            >
                              <Check size={16} />
                            </Button>
                            <Button
                              variant={record?.status === 'late' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleMarkAttendance(student.id, 'late')}
                              disabled={saving || !selectedSchedule}
                              className="w-10 h-10 p-0 rounded-full"
                              title="มาสาย"
                            >
                              <Clock size={16} />
                            </Button>
                            <Button
                              variant={record?.status === 'absent' ? 'destructive' : 'outline'}
                              size="sm"
                              onClick={() => handleMarkAttendance(student.id, 'absent')}
                              disabled={saving || !selectedSchedule}
                              className="w-10 h-10 p-0 rounded-full"
                              title="ขาดเรียน"
                            >
                              <X size={16} />
                            </Button>
                            <Button
                              variant={record?.status === 'excused' ? 'secondary' : 'outline'}
                              size="sm"
                              onClick={() => handleMarkAttendance(student.id, 'excused')}
                              disabled={saving || !selectedSchedule}
                              className="w-10 h-10 p-0 rounded-full"
                              title="ลา"
                            >
                              <AlertCircle size={16} />
                            </Button>
                            {record && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAttendance(student.id, null)}
                                disabled={saving || !selectedSchedule}
                                className="w-10 h-10 p-0 rounded-full text-muted-foreground hover:text-red-500"
                                title="ยกเลิกการเช็คชื่อ (ยังไม่เช็ค)"
                              >
                                <X size={14} />
                              </Button>
                            )}
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
      ) : (
        /* Sheet View (Matrix) */
        <div className="bg-background rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground sticky left-0 bg-muted/50 z-10 w-48 shadow-[1px_0_0_0_rgba(0,0,0,0.1)]">รายชื่อนักศึกษา</th>
                  {[...Array(new Date(new Date(selectedDate).getFullYear(), new Date(selectedDate).getMonth() + 1, 0).getDate())].map((_, i) => (
                    <th key={i} className={`px-2 py-3 font-medium text-muted-foreground min-w-[32px] text-center border-l border-border/50 ${format(new Date(new Date(selectedDate).getFullYear(), new Date(selectedDate).getMonth(), i + 1), 'yyyy-MM-dd') === format(new Date(selectedDate), 'yyyy-MM-dd') ? 'bg-primary/10 text-primary' : ''}`}>
                      {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={32} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'ไม่พบข้อมูลนักศึกษาที่ค้นหา' : 'ยังไม่มีข้อมูลนักศึกษา'}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium sticky left-0 bg-background z-10 shadow-[1px_0_0_0_rgba(0,0,0,0.1)] whitespace-nowrap">
                        <div className="text-sm font-semibold">{student.first_name} {student.last_name}</div>
                        <div className="text-xs text-muted-foreground">{student.student_id}</div>
                      </td>
                      {[...Array(new Date(new Date(selectedDate).getFullYear(), new Date(selectedDate).getMonth() + 1, 0).getDate())].map((_, i) => {
                        const day = i + 1;
                        const dateObj = new Date(selectedDate);
                        // Create date string in yyyy-MM-dd format for comparison
                        const year = dateObj.getFullYear();
                        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                        const dayStr = String(day).padStart(2, '0');
                        const currentMatrixDate = `${year}-${month}-${dayStr}`;

                        const selectedDateStr = format(new Date(selectedDate), 'yyyy-MM-dd');
                        const isSelectedDate = selectedDateStr === currentMatrixDate;

                        // Use string prefix matching to avoid timezone issues
                        const record = sheetAttendance.find(r =>
                          r.student_id === student.id &&
                          r.check_in_time && r.check_in_time.substring(0, 10) === currentMatrixDate
                        );
                        const status = record?.status;

                        return (
                          <td key={i} className="p-0 border-l border-border/50 text-center">
                            <DropdownMenu>
                              <TooltipProvider>
                                <Tooltip>
                                  <DropdownMenuTrigger asChild>
                                    <TooltipTrigger asChild>
                                      <div className={`flex items-center justify-center h-10 w-full hover:bg-muted/50 transition-colors cursor-pointer ${isSelectedDate ? 'bg-primary/5' : ''}`}>
                                        {status === 'present' && <Check size={14} className="text-green-600" />}
                                        {status === 'late' && <Clock size={14} className="text-yellow-600" />}
                                        {status === 'absent' && <X size={14} className="text-red-600" />}
                                        {status === 'excused' && <AlertCircle size={14} className="text-blue-600" />}
                                        {!status && <div className="w-2 h-2 rounded-full bg-border/50" />}
                                      </div>
                                    </TooltipTrigger>
                                  </DropdownMenuTrigger>
                                  <TooltipContent>
                                    วันที่ {day}: {getStatusLabel(status || 'ยังไม่เช็ค')} (คลิกเพื่อเลือกสถานะ)
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleMarkAttendance(student.id, 'present', currentMatrixDate)} className="gap-2">
                                  <Check size={14} className="text-green-600" /> มาเรียน
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleMarkAttendance(student.id, 'late', currentMatrixDate)} className="gap-2">
                                  <Clock size={14} className="text-yellow-600" /> มาสาย
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleMarkAttendance(student.id, 'absent', currentMatrixDate)} className="gap-2">
                                  <X size={14} className="text-red-600" /> ขาดเรียน
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleMarkAttendance(student.id, 'excused', currentMatrixDate)} className="gap-2">
                                  <AlertCircle size={14} className="text-blue-600" /> ลาป่วย/ลากิจ
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleMarkAttendance(student.id, null, currentMatrixDate)} className="gap-2 text-red-500">
                                  <X size={14} /> ยังไม่เช็ค (ลบข้อมูล)
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-muted/20 border-t border-border flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><Check size={14} className="text-green-600" /> มาเรียน</div>
            <div className="flex items-center gap-2"><Clock size={14} className="text-yellow-600" /> มาสาย</div>
            <div className="flex items-center gap-2"><X size={14} className="text-red-600" /> ขาดเรียน</div>
            <div className="flex items-center gap-2"><AlertCircle size={14} className="text-blue-600" /> ลาป่วย/ลากิจ</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-border" /> ยังไม่เช็ค</div>
          </div>
        </div>
      )}

      {/* Info Message */}
      {!selectedSchedule && (
        <p className="mt-4 text-sm text-muted-foreground text-center">
          กรุณาเลือกคาบเรียน/วิชาก่อนเช็คชื่อ
        </p>
      )}
    </AdminLayout>
  );
};

export default AdminAttendance;
