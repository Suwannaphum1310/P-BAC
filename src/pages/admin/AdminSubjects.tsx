import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { BookOpen, Plus, Search, Edit, Trash2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Subject {
  id: string;
  name: string;
  code: string;
  department_id: string | null;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

const AdminSubjects = () => {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    department_id: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subjectsRes, deptsRes] = await Promise.all([
        supabase.from('subjects').select('*').order('code'),
        supabase.from('departments').select('*').order('name'),
      ]);

      if (subjectsRes.error) throw subjectsRes.error;
      if (deptsRes.error) throw deptsRes.error;

      setSubjects(subjectsRes.data || []);
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

  const handleOpenModal = (subject?: Subject) => {
    if (subject) {
      setSelectedSubject(subject);
      setFormData({
        name: subject.name,
        code: subject.code,
        department_id: subject.department_id || '',
      });
    } else {
      setSelectedSubject(null);
      setFormData({ name: '', code: '', department_id: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.code) {
      toast({
        title: "ข้อมูลไม่ครบ",
        description: "กรุณากรอกชื่อวิชาและรหัสวิชา",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const subjectData = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        department_id: formData.department_id || null,
      };

      if (selectedSubject) {
        const { error } = await supabase
          .from('subjects')
          .update(subjectData)
          .eq('id', selectedSubject.id);
        if (error) throw error;
        toast({ title: "บันทึกสำเร็จ", description: "อัปเดตข้อมูลวิชาเรียบร้อยแล้ว" });
      } else {
        const { error } = await supabase.from('subjects').insert(subjectData);
        if (error) throw error;
        toast({ title: "เพิ่มสำเร็จ", description: "เพิ่มวิชาใหม่เรียบร้อยแล้ว" });
      }

      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error saving subject:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message?.includes('duplicate') ? "รหัสวิชานี้มีอยู่แล้ว" : "ไม่สามารถบันทึกข้อมูลได้",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSubject) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('subjects').delete().eq('id', selectedSubject.id);
      if (error) throw error;
      toast({ title: "ลบสำเร็จ", description: "ลบข้อมูลวิชาเรียบร้อยแล้ว" });
      setIsDeleteDialogOpen(false);
      setSelectedSubject(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถลบข้อมูลได้", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const openDeleteDialog = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsDeleteDialogOpen(true);
  };

  const filteredSubjects = subjects.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code.toLowerCase().includes(searchTerm.toLowerCase())
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
          <BookOpen className="text-primary" size={28} />
          <h1 className="text-2xl font-semibold text-foreground">จัดการรายวิชา</h1>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2">
          <Plus size={18} />
          เพิ่มวิชา
        </Button>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input
          placeholder="ค้นหาด้วยรหัส หรือชื่อวิชา..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="bg-background rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">รหัสวิชา</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">ชื่อวิชา</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">สาขา</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-muted-foreground">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredSubjects.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'ไม่พบข้อมูลวิชาที่ค้นหา' : 'ยังไม่มีข้อมูลวิชา'}
                  </td>
                </tr>
              ) : (
                filteredSubjects.map((subject) => (
                  <tr key={subject.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium">{subject.code}</td>
                    <td className="px-4 py-3 text-sm">{subject.name}</td>
                    <td className="px-4 py-3 text-sm">{getDepartmentName(subject.department_id)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenModal(subject)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                          <Edit size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(subject)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
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

      <p className="mt-4 text-sm text-muted-foreground">ทั้งหมด {filteredSubjects.length} วิชา</p>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedSubject ? 'แก้ไขข้อมูลวิชา' : 'เพิ่มวิชาใหม่'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="code">รหัสวิชา *</Label>
              <Input id="code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="เช่น MTH101" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="name">ชื่อวิชา *</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="เช่น คณิตศาสตร์พื้นฐาน" className="mt-1" />
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
              {selectedSubject ? 'บันทึก' : 'เพิ่ม'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ยืนยันการลบ</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">คุณต้องการลบวิชา "{selectedSubject?.name}" ใช่หรือไม่?</p>
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

export default AdminSubjects;
