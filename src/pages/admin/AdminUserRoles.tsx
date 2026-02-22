import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { UserPlus, Trash2, Shield, Search } from "lucide-react";

type AppRole = 'admin' | 'teacher' | 'student';

interface UserWithRole {
  id: string;
  user_id: string;
  role: AppRole;
  email: string | null;
  full_name: string | null;
  created_at: string;
}

const AdminUserRoles = () => {
  const [userRoles, setUserRoles] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // For adding new role
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole>("teacher");
  const [availableProfiles, setAvailableProfiles] = useState<{ user_id: string; full_name: string | null; email: string | null }[]>([]);

  const fetchUserRoles = async () => {
    setLoading(true);
    
    // Fetch user roles with profile data
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('*');

    if (rolesError) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูล Role ได้",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Fetch profiles for these users
    const userIds = rolesData?.map(r => r.user_id) || [];
    
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      const profileMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

      const combinedData: UserWithRole[] = (rolesData || []).map(role => ({
        id: role.id,
        user_id: role.user_id,
        role: role.role as AppRole,
        email: profileMap.get(role.user_id)?.email || null,
        full_name: profileMap.get(role.user_id)?.full_name || null,
        created_at: role.created_at,
      }));

      setUserRoles(combinedData);
    } else {
      setUserRoles([]);
    }
    
    setLoading(false);
  };

  const fetchAvailableProfiles = async () => {
    // Fetch all profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, email');

    // Fetch existing user_roles
    const { data: existingRoles } = await supabase
      .from('user_roles')
      .select('user_id');

    const existingUserIds = new Set(existingRoles?.map(r => r.user_id) || []);

    // Filter out users who already have roles
    const available = (profiles || []).filter(p => !existingUserIds.has(p.user_id));
    setAvailableProfiles(available);
  };

  useEffect(() => {
    fetchUserRoles();
  }, []);

  const handleAddRole = async () => {
    if (!selectedUserId || !selectedRole) {
      toast({
        title: "กรุณากรอกข้อมูล",
        description: "กรุณาเลือกผู้ใช้และ Role",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('user_roles')
      .insert({
        user_id: selectedUserId,
        role: selectedRole,
      });

    if (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "สำเร็จ",
      description: "เพิ่ม Role ให้ผู้ใช้เรียบร้อยแล้ว",
    });

    setDialogOpen(false);
    setSelectedUserId("");
    setSelectedRole("teacher");
    fetchUserRoles();
  };

  const handleUpdateRole = async (id: string, newRole: AppRole) => {
    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole })
      .eq('id', id);

    if (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "สำเร็จ",
      description: "อัปเดต Role เรียบร้อยแล้ว",
    });

    fetchUserRoles();
  };

  const handleDeleteRole = async (id: string) => {
    if (!confirm("ต้องการลบ Role นี้หรือไม่?")) return;

    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "สำเร็จ",
      description: "ลบ Role เรียบร้อยแล้ว",
    });

    fetchUserRoles();
  };

  const getRoleBadgeColor = (role: AppRole) => {
    switch (role) {
      case 'admin':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'teacher':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'student':
        return 'bg-secondary/80 text-secondary-foreground border-secondary';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getRoleLabel = (role: AppRole) => {
    switch (role) {
      case 'admin':
        return 'ผู้ดูแลระบบ';
      case 'teacher':
        return 'อาจารย์';
      case 'student':
        return 'นักศึกษา';
      default:
        return role;
    }
  };

  const filteredUserRoles = userRoles.filter(
    (ur) =>
      ur.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ur.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">จัดการสิทธิ์ผู้ใช้</h1>
            <p className="text-muted-foreground mt-1">
              กำหนด Role และสิทธิ์การเข้าถึงของผู้ใช้ในระบบ
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (open) fetchAvailableProfiles();
          }}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                เพิ่ม Role
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>เพิ่ม Role ให้ผู้ใช้</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>เลือกผู้ใช้</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกผู้ใช้" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProfiles.map((profile) => (
                        <SelectItem key={profile.user_id} value={profile.user_id}>
                          {profile.full_name || profile.email || profile.user_id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>เลือก Role</Label>
                  <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">ผู้ดูแลระบบ (Admin)</SelectItem>
                      <SelectItem value="teacher">อาจารย์ (Teacher)</SelectItem>
                      <SelectItem value="student">นักศึกษา (Student)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddRole} className="w-full">
                  บันทึก
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                รายการผู้ใช้และ Role
              </CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาผู้ใช้..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredUserRoles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                ยังไม่มีการกำหนด Role ให้ผู้ใช้
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อผู้ใช้</TableHead>
                    <TableHead>อีเมล</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">การจัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUserRoles.map((userRole) => (
                    <TableRow key={userRole.id}>
                      <TableCell className="font-medium">
                        {userRole.full_name || "-"}
                      </TableCell>
                      <TableCell>{userRole.email || "-"}</TableCell>
                      <TableCell>
                        <Select
                          value={userRole.role}
                          onValueChange={(v) => handleUpdateRole(userRole.id, v as AppRole)}
                        >
                          <SelectTrigger className={`w-36 border ${getRoleBadgeColor(userRole.role)}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
                            <SelectItem value="teacher">อาจารย์</SelectItem>
                            <SelectItem value="student">นักศึกษา</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteRole(userRole.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminUserRoles;