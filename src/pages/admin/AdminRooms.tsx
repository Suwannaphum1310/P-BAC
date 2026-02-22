import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { DoorOpen, Plus, Search, Edit, Trash2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Room {
  id: string;
  name: string;
  building: string | null;
  capacity: number | null;
}

const AdminRooms = () => {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    building: '',
    capacity: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('rooms').select('*').order('name');
      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถโหลดข้อมูลได้", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (room?: Room) => {
    if (room) {
      setSelectedRoom(room);
      setFormData({
        name: room.name,
        building: room.building || '',
        capacity: room.capacity?.toString() || '',
      });
    } else {
      setSelectedRoom(null);
      setFormData({ name: '', building: '', capacity: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast({ title: "ข้อมูลไม่ครบ", description: "กรุณากรอกชื่อห้อง", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const roomData = {
        name: formData.name.trim(),
        building: formData.building.trim() || null,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
      };

      if (selectedRoom) {
        const { error } = await supabase.from('rooms').update(roomData).eq('id', selectedRoom.id);
        if (error) throw error;
        toast({ title: "บันทึกสำเร็จ", description: "อัปเดตข้อมูลห้องเรียบร้อยแล้ว" });
      } else {
        const { error } = await supabase.from('rooms').insert(roomData);
        if (error) throw error;
        toast({ title: "เพิ่มสำเร็จ", description: "เพิ่มห้องใหม่เรียบร้อยแล้ว" });
      }

      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error saving room:', error);
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถบันทึกข้อมูลได้", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRoom) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('rooms').delete().eq('id', selectedRoom.id);
      if (error) throw error;
      toast({ title: "ลบสำเร็จ", description: "ลบข้อมูลห้องเรียบร้อยแล้ว" });
      setIsDeleteDialogOpen(false);
      setSelectedRoom(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting room:', error);
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถลบข้อมูลได้", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const openDeleteDialog = (room: Room) => {
    setSelectedRoom(room);
    setIsDeleteDialogOpen(true);
  };

  const filteredRooms = rooms.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.building && r.building.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
          <DoorOpen className="text-primary" size={28} />
          <h1 className="text-2xl font-semibold text-foreground">จัดการห้องเรียน</h1>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2">
          <Plus size={18} />
          เพิ่มห้อง
        </Button>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input placeholder="ค้นหาด้วยชื่อห้อง หรืออาคาร..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
      </div>

      <div className="bg-background rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">ชื่อห้อง</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">อาคาร</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">ความจุ</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-muted-foreground">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'ไม่พบข้อมูลห้องที่ค้นหา' : 'ยังไม่มีข้อมูลห้อง'}
                  </td>
                </tr>
              ) : (
                filteredRooms.map((room) => (
                  <tr key={room.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium">{room.name}</td>
                    <td className="px-4 py-3 text-sm">{room.building || '-'}</td>
                    <td className="px-4 py-3 text-sm">{room.capacity ? `${room.capacity} คน` : '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenModal(room)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                          <Edit size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(room)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
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

      <p className="mt-4 text-sm text-muted-foreground">ทั้งหมด {filteredRooms.length} ห้อง</p>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedRoom ? 'แก้ไขข้อมูลห้อง' : 'เพิ่มห้องใหม่'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="name">ชื่อห้อง *</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="เช่น ห้อง 101" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="building">อาคาร</Label>
              <Input id="building" value={formData.building} onChange={(e) => setFormData({ ...formData, building: e.target.value })} placeholder="เช่น อาคาร A" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="capacity">ความจุ (คน)</Label>
              <Input id="capacity" type="number" min="1" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} placeholder="เช่น 40" className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {selectedRoom ? 'บันทึก' : 'เพิ่ม'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ยืนยันการลบ</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">คุณต้องการลบห้อง "{selectedRoom?.name}" ใช่หรือไม่?</p>
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

export default AdminRooms;
