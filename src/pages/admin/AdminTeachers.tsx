import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { UserCheck, Plus, Search, Edit, Trash2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Teacher {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  department_id: string | null;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

const AdminTeachers = () => {
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department_id: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [teachersRes, deptsRes] = await Promise.all([
        supabase.from('teachers').select('*').order('name'),
        supabase.from('departments').select('*').order('name'),
      ]);

      if (teachersRes.error) throw teachersRes.error;
      if (deptsRes.error) throw deptsRes.error;

      setTeachers(teachersRes.data || []);
      setDepartments(deptsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถโหลดข้อมูลได้", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (teacher?: Teacher) => {
    if (teacher) {
      setSelectedTeacher(teacher);
      setFormData({
        name: teacher.name,
        email: teacher.email || '',
        phone: teacher.phone || '',
        department_id: teacher.department_id || '',
      });
    } else {
      setSelectedTeacher(null);
      setFormData({ name: '', email: '', phone: '', department_id: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast({ title: "ข้อมูลไม่ครบ", description: "กรุณากรอกชื่อครู", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const teacherData = {
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        department_id: formData.department_id || null,
      };

      if (selectedTeacher) {
        const { error } = await supabase.from('teachers').update(teacherData).eq('id', selectedTeacher.id);
        if (error) throw error;
        toast({ title: "บันทึกสำเร็จ", description: "อัปเดตข้อมูลครูเรียบร้อยแล้ว" });
      } else {
        const { error } = await supabase.from('teachers').insert(teacherData);
        if (error) throw error;
        toast({ title: "เพิ่มสำเร็จ", description: "เพิ่มครูใหม่เรียบร้อยแล้ว" });
      }

      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error saving teacher:', error);
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถบันทึกข้อมูลได้", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTeacher) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('teachers').delete().eq('id', selectedTeacher.id);
      if (error) throw error;
      toast({ title: "ลบสำเร็จ", description: "ลบข้อมูลครูเรียบร้อยแล้ว" });
      setIsDeleteDialogOpen(false);
      setSelectedTeacher(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting teacher:', error);
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถลบข้อมูลได้", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const openDeleteDialog = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsDeleteDialogOpen(true);
  };

  const filteredTeachers = teachers.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.email && t.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <UserCheck className="text-primary" size={28} />
          <h1 className="text-2xl font-semibold text-foreground">จัดการครูผู้สอน</h1>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2">
          <Plus size={18} />
          เพิ่มครู
        </Button>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input placeholder="ค้นหาด้วยชื่อครู หรืออีเมล..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
      </div>

      <div className="bg-background rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">ชื่อครู</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">อีเมล</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">เบอร์โทร</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">สาขา</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-muted-foreground">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'ไม่พบข้อมูลครูที่ค้นหา' : 'ยังไม่มีข้อมูลครู'}
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium">{teacher.name}</td>
                    <td className="px-4 py-3 text-sm">{teacher.email || '-'}</td>
                    <td className="px-4 py-3 text-sm">{teacher.phone || '-'}</td>
                    <td className="px-4 py-3 text-sm">{getDepartmentName(teacher.department_id)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenModal(teacher)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                          <Edit size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(teacher)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
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

      <p className="mt-4 text-sm text-muted-foreground">ทั้งหมด {filteredTeachers.length} คน</p>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedTeacher ? 'แก้ไขข้อมูลครู' : 'เพิ่มครูใหม่'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="name">ชื่อครู *</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="เช่น ครูสมชาย ใจดี" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="email">อีเมล</Label>
              <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="example@email.com" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="phone">เบอร์โทร</Label>
              <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="0812345678" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="department">สาขา</Label>
              <Select value={formData.department_id} onValueChange={(value) => setFormData({ ...formData, department_id: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="เลือกสาขา (ถ้ามี)" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {selectedTeacher ? 'บันทึก' : 'เพิ่ม'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ยืนยันการลบ</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">คุณต้องการลบข้อมูลครู "{selectedTeacher?.name}" ใช่หรือไม่?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>ยกเลิก</Button>
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

export default AdminTeachers;
