import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Users, Loader2, Search } from 'lucide-react';
import TeacherLayout from '@/components/TeacherLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface Student {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  department_id: string | null;
  year: number;
  email: string | null;
  phone: string | null;
  status: string;
}

interface Department {
  id: string;
  name: string;
}

const TeacherStudents = () => {
  const { profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teachingDeptIds, setTeachingDeptIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, [profile]);

  const fetchData = async () => {
    if (!profile) return;
    
    setLoading(true);
    try {
      // Fetch departments and schedule entries to know which departments this teacher teaches
      const [deptsRes, schedulesRes] = await Promise.all([
        supabase.from('departments').select('*'),
        supabase.from('schedule_entries').select('department_id').eq('teacher_name', profile.full_name),
      ]);

      const depts = deptsRes.data || [];
      setDepartments(depts);

      // Get unique department IDs that this teacher teaches
      const deptIds = [...new Set((schedulesRes.data || []).map(s => s.department_id))];
      setTeachingDeptIds(deptIds);

      // Fetch students from those departments
      if (deptIds.length > 0) {
        const { data: studentsData } = await supabase
          .from('students')
          .select('*')
          .in('department_id', deptIds)
          .order('student_id');

        setStudents(studentsData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDepartmentName = (deptId: string | null) => {
    if (!deptId) return '-';
    return departments.find(d => d.id === deptId)?.name || '-';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">กำลังศึกษา</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">ลาพักการเรียน</Badge>;
      case 'graduated':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">สำเร็จการศึกษา</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.last_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = selectedDepartment === 'all' || student.department_id === selectedDepartment;
    
    return matchesSearch && matchesDepartment;
  });

  // Filter departments to only show ones this teacher teaches
  const teachingDepartments = departments.filter(d => teachingDeptIds.includes(d.id));

  if (loading) {
    return (
      <TeacherLayout title="รายชื่อนักศึกษา">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout title="รายชื่อนักศึกษา">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Users className="text-emerald-600" size={28} />
        <h1 className="text-2xl font-semibold text-foreground">รายชื่อนักศึกษาที่สอน</h1>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <Label htmlFor="department">สาขา</Label>
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="ทุกสาขา" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกสาขา</SelectItem>
              {teachingDepartments.map(dept => (
                <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="search">ค้นหา</Label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              id="search"
              placeholder="ค้นหาด้วยรหัส หรือชื่อนักศึกษา..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">รหัสนักศึกษา</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">ชื่อ-นามสกุล</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">สาขา</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">ชั้นปี</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">อีเมล</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">เบอร์โทร</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    {teachingDeptIds.length === 0 
                      ? 'ไม่มีข้อมูลสาขาที่สอน' 
                      : 'ไม่พบข้อมูลนักศึกษา'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium">{student.student_id}</td>
                    <td className="px-4 py-3 text-sm">{student.first_name} {student.last_name}</td>
                    <td className="px-4 py-3 text-sm">{getDepartmentName(student.department_id)}</td>
                    <td className="px-4 py-3 text-sm">ปี {student.year}</td>
                    <td className="px-4 py-3 text-sm">{student.email || '-'}</td>
                    <td className="px-4 py-3 text-sm">{student.phone || '-'}</td>
                    <td className="px-4 py-3">{getStatusBadge(student.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Total count */}
      <p className="mt-4 text-sm text-muted-foreground">
        ทั้งหมด {filteredStudents.length} คน
      </p>
    </TeacherLayout>
  );
};

export default TeacherStudents;
