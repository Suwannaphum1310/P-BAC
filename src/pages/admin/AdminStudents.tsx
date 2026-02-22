import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Users, Plus, Search, Edit, Trash2, Loader2, FileDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { usePdfExport } from '@/hooks/usePdfExport';
import { useExcelExport } from '@/hooks/useExcelExport';

interface Student {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  department_id: string | null;
  year: number;
  gpa: number | null;
  status: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  birth_date: string | null;
  enrollment_date: string | null;
  education_level?: string | null;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

const AdminStudents = () => {
  const { toast } = useToast();
  const { exportTableToPdf } = usePdfExport();
  const { exportTableToExcel } = useExcelExport();
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    student_id: '',
    first_name: '',
    last_name: '',
    department_id: '',
    year: 1,
    gpa: '',
    status: 'active',
    email: '',
    phone: '',
    address: '',
    birth_date: '',
    education_level: 'ปวช',
  });

  // Fetch students and departments
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsRes, deptsRes] = await Promise.all([
        supabase.from('students').select('*').order('student_id'),
        supabase.from('departments').select('*').order('name'),
      ]);

      if (studentsRes.error) throw studentsRes.error;
      if (deptsRes.error) throw deptsRes.error;

      setStudents(studentsRes.data || []);
      setDepartments(deptsRes.data || []);
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

  const handleOpenModal = (student?: Student) => {
    if (student) {
      setSelectedStudent(student);
      setFormData({
        student_id: student.student_id,
        first_name: student.first_name,
        last_name: student.last_name,
        department_id: student.department_id || '',
        year: student.year,
        gpa: student.gpa?.toString() || '',
        status: student.status,
        email: student.email || '',
        phone: student.phone || '',
        address: student.address || '',
        birth_date: student.birth_date || '',
        education_level: student.education_level || 'ปวช',
      });
    } else {
      setSelectedStudent(null);
      setFormData({
        student_id: '',
        first_name: '',
        last_name: '',
        department_id: '',
        year: 1,
        gpa: '',
        status: 'active',
        email: '',
        phone: '',
        address: '',
        birth_date: '',
        education_level: 'ปวช',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.student_id || !formData.first_name || !formData.last_name) {
      toast({
        title: "ข้อมูลไม่ครบ",
        description: "กรุณากรอกรหัสนักศึกษา ชื่อ และนามสกุล",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const studentData = {
        student_id: formData.student_id.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        department_id: formData.department_id || null,
        year: formData.year,
        gpa: formData.gpa ? parseFloat(formData.gpa) : null,
        status: formData.status,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        education_level: formData.education_level,
      };

      if (selectedStudent) {
        // Update existing student
        const { error } = await supabase
          .from('students')
          .update(studentData)
          .eq('id', selectedStudent.id);

        if (error) throw error;

        toast({
          title: "บันทึกสำเร็จ",
          description: "อัปเดตข้อมูลนักศึกษาเรียบร้อยแล้ว",
        });
      } else {
        // Insert new student
        const { error } = await supabase
          .from('students')
          .insert(studentData);

        if (error) throw error;

        toast({
          title: "เพิ่มสำเร็จ",
          description: "เพิ่มนักศึกษาใหม่เรียบร้อยแล้ว",
        });
      }

      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error saving student:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถบันทึกข้อมูลได้",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedStudent) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', selectedStudent.id);

      if (error) throw error;

      toast({
        title: "ลบสำเร็จ",
        description: "ลบข้อมูลนักศึกษาเรียบร้อยแล้ว",
      });

      setIsDeleteDialogOpen(false);
      setSelectedStudent(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting student:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบข้อมูลได้",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const openDeleteDialog = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">กำลังศึกษา</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">ลาพักการเรียน</Badge>;
      case 'graduated':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">สำเร็จการศึกษา</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">พ้นสภาพ</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch =
      student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.last_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLevel = levelFilter === 'all' || student.education_level === levelFilter;

    return matchesSearch && matchesLevel;
  });

  const getDepartmentName = (deptId: string | null) => {
    if (!deptId) return '-';
    return departments.find(d => d.id === deptId)?.name || '-';
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="text-primary" size={28} />
          <h1 className="text-2xl font-semibold text-foreground">จัดการนักศึกษา</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              exportTableToPdf(
                filteredStudents.map(s => ({
                  ...s,
                  department_name: getDepartmentName(s.department_id),
                  gpa_display: s.gpa?.toFixed(2) || '-',
                  status_display: s.status === 'active' ? 'Active' : s.status === 'graduated' ? 'Graduated' : s.status,
                })),
                [
                  { header: 'Student ID', key: 'student_id' },
                  { header: 'First Name', key: 'first_name' },
                  { header: 'Last Name', key: 'last_name' },
                  { header: 'Level', key: 'education_level' },
                  { header: 'Department', key: 'department_name' },
                  { header: 'Year', key: 'year' },
                  { header: 'GPA', key: 'gpa_display' },
                  { header: 'Status', key: 'status_display' },
                ],
                {
                  title: 'Student List',
                  subtitle: `Total: ${filteredStudents.length} students`,
                  filename: 'students_list',
                }
              );
              toast({ title: "Export สำเร็จ", description: "ดาวน์โหลดไฟล์ PDF เรียบร้อย" });
            }}
            className="gap-2"
          >
            <FileDown size={18} />
            Export PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              exportTableToExcel(
                filteredStudents.map(s => ({
                  ...s,
                  department_name: getDepartmentName(s.department_id),
                  gpa_display: s.gpa?.toFixed(2) || '-',
                  status_display: s.status === 'active' ? 'กำลังศึกษา' : s.status === 'graduated' ? 'สำเร็จการศึกษา' : s.status,
                })),
                [
                  { header: 'รหัสนักศึกษา', key: 'student_id' },
                  { header: 'ชื่อ', key: 'first_name' },
                  { header: 'นามสกุล', key: 'last_name' },
                  { header: 'ระดับ', key: 'education_level' },
                  { header: 'สาขา', key: 'department_name' },
                  { header: 'ชั้นปี', key: 'year' },
                  { header: 'GPA', key: 'gpa_display' },
                  { header: 'สถานะ', key: 'status_display' },
                ],
                { filename: 'students_list' }
              );
              toast({ title: "Export สำเร็จ", description: "ดาวน์โหลดไฟล์ Excel เรียบร้อย" });
            }}
            className="gap-2"
          >
            <FileDown size={18} />
            Export Excel
          </Button>
          <Button onClick={() => handleOpenModal()} className="gap-2">
            <Plus size={18} />
            เพิ่มนักศึกษา
          </Button>
        </div>
      </div>

      {/* Statistics Cards - Prominent */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-5 rounded-xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm opacity-80">นักศึกษาทั้งหมด</p>
              <p className="text-3xl font-bold">{students.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-5 rounded-xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-user-check text-xl" />
            </div>
            <div>
              <p className="text-sm opacity-80">กำลังศึกษา</p>
              <p className="text-3xl font-bold">{students.filter(s => s.status === 'active').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-500 text-white p-5 rounded-xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-chart-line text-xl" />
            </div>
            <div>
              <p className="text-sm opacity-80">GPA เฉลี่ย</p>
              <p className="text-3xl font-bold">
                {students.filter(s => s.gpa !== null && s.gpa > 0).length > 0
                  ? (students.filter(s => s.gpa !== null && s.gpa > 0).reduce((acc, s) => acc + (s.gpa || 0), 0) / students.filter(s => s.gpa !== null && s.gpa > 0).length).toFixed(2)
                  : '-'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-5 rounded-xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-award text-xl" />
            </div>
            <div>
              <p className="text-sm opacity-80">เกียรตินิยม (≥3.5)</p>
              <p className="text-3xl font-bold">{students.filter(s => s.gpa !== null && s.gpa >= 3.5).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Year & Status distribution */}
      <div className="bg-card p-4 rounded-xl border border-border mb-6">
        <div className="flex flex-wrap gap-6 items-center">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">ชั้นปี:</span>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">ปี1: {students.filter(s => s.year === 1).length}</span>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">ปี2: {students.filter(s => s.year === 2).length}</span>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">ปี3: {students.filter(s => s.year === 3).length}</span>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">ปี4: {students.filter(s => s.year === 4).length}</span>
          </div>
          <div className="border-l border-border pl-6 flex items-center gap-4">
            <span className="text-sm text-muted-foreground">สถานะ:</span>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">ศึกษา: {students.filter(s => s.status === 'active').length}</span>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">จบ: {students.filter(s => s.status === 'graduated').length}</span>
            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">พ้นสภาพ: {students.filter(s => s.status === 'suspended').length}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="ค้นหาด้วยรหัส หรือชื่อนักศึกษา..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="w-full md:w-48">
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger>
              <SelectValue placeholder="ระดับการศึกษา" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด (ปวช/ปวส)</SelectItem>
              <SelectItem value="ปวช">ปวช</SelectItem>
              <SelectItem value="ปวส">ปวส</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-background rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">รหัสนักศึกษา</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">ชื่อ-นามสกุล</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">ระดับ</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">สาขา</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">ชั้นปี</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">GPA</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">สถานะ</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-muted-foreground">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'ไม่พบข้อมูลนักศึกษาที่ค้นหา' : 'ยังไม่มีข้อมูลนักศึกษา'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium">{student.student_id}</td>
                    <td className="px-4 py-3 text-sm">{student.first_name} {student.last_name}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant="outline" className={student.education_level === 'ปวส' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-blue-50 text-blue-700 border-blue-200'}>
                        {student.education_level || 'ปวช'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">{getDepartmentName(student.department_id)}</td>
                    <td className="px-4 py-3 text-sm">ปี {student.year}</td>
                    <td className="px-4 py-3 text-sm">{student.gpa?.toFixed(2) || '-'}</td>
                    <td className="px-4 py-3">{getStatusBadge(student.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenModal(student)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(student)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
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

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedStudent ? 'แก้ไขข้อมูลนักศึกษา' : 'เพิ่มนักศึกษาใหม่'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="student_id">รหัสนักศึกษา *</Label>
                <Input
                  id="student_id"
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  placeholder="เช่น 65123456"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="education_level">ระดับการศึกษา</Label>
                <Select
                  value={formData.education_level}
                  onValueChange={(value) => setFormData({ ...formData, education_level: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ปวช">ปวช</SelectItem>
                    <SelectItem value="ปวส">ปวส</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="year">ชั้นปี</Label>
                <Select
                  value={formData.year.toString()}
                  onValueChange={(value) => setFormData({ ...formData, year: parseInt(value) })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">ปี 1</SelectItem>
                    <SelectItem value="2">ปี 2</SelectItem>
                    <SelectItem value="3">ปี 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">ชื่อ *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="ชื่อ"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="last_name">นามสกุล *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="นามสกุล"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="department">สาขา</Label>
              <Select
                value={formData.department_id}
                onValueChange={(value) => setFormData({ ...formData, department_id: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="เลือกสาขา" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gpa">GPA</Label>
                <Input
                  id="gpa"
                  type="number"
                  step="0.01"
                  min="0"
                  max="4"
                  value={formData.gpa}
                  onChange={(e) => setFormData({ ...formData, gpa: e.target.value })}
                  placeholder="0.00 - 4.00"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="status">สถานะ</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">กำลังศึกษา</SelectItem>
                    <SelectItem value="inactive">ลาพักการเรียน</SelectItem>
                    <SelectItem value="graduated">สำเร็จการศึกษา</SelectItem>
                    <SelectItem value="suspended">พ้นสภาพ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">อีเมล</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="example@email.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="phone">เบอร์โทร</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0812345678"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {selectedStudent ? 'บันทึก' : 'เพิ่ม'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ยืนยันการลบ</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            คุณต้องการลบข้อมูลนักศึกษา "{selectedStudent?.first_name} {selectedStudent?.last_name}" ใช่หรือไม่?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              ลบ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminStudents;
