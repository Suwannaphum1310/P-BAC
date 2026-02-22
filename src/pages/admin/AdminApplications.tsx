import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Eye, Check, X, Download, Search, Filter, Printer, UserPlus } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface Application {
    id: string;
    created_at: string;
    status: string;
    course: string;
    prefix: string;
    first_name: string;
    last_name: string;
    id_card: string;
    birth_date: string;
    phone: string;
    email: string | null;
    line_id: string | null;
    facebook: string | null;
    address: string;
    parent_name: string;
    parent_relation: string;
    parent_phone: string;
    parent_occupation: string | null;
    chronic_disease: string | null;
    allergies: string | null;
    previous_school: string;
    gpa: number;
    graduation_year: string;
    photo_url: string | null;
    id_card_file_url: string | null;
    // Optional documents
    house_reg_file_url?: string | null;
    transcript_file_url?: string | null;
    medical_cert_file_url?: string | null;
    parent_id_file_url?: string | null;
    student_id_ref?: string | null;
}

const courseLabels: Record<string, string> = {
    'automotive': 'ช่างยนต์',
    'electronics': 'อิเล็กทรอนิกส์',
    'digital-business': 'เทคโนโลยีธุรกิจดิจิทัล',
    'healthcare': 'การจัดการงานบริการสถานพยาบาล',
};

// Map course to department code prefix
const courseToDeptPrefix: Record<string, string> = {
    'automotive': 'AUTO',
    'electronics': 'ELEC',
    'digital-business': 'DIGB',
    'healthcare': 'HEAL',
};

const statusLabels: Record<string, { label: string; color: string }> = {
    'pending': { label: 'รอตรวจสอบ', color: 'bg-yellow-100 text-yellow-800' },
    'approved': { label: 'อนุมัติ', color: 'bg-green-100 text-green-800' },
    'rejected': { label: 'ไม่อนุมัติ', color: 'bg-red-100 text-red-800' },
    'student_created': { label: 'สร้างบัญชีแล้ว', color: 'bg-blue-100 text-blue-800' },
};

const AdminApplications = () => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [creatingStudent, setCreatingStudent] = useState(false);

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const { data, error } = await (supabase as any)
                .from('applications')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setApplications(data || []);
        } catch (error) {
            console.error('Error fetching applications:', error);
            toast.error('ไม่สามารถโหลดข้อมูลใบสมัครได้');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, status: string, app?: Application) => {
        try {
            const { error } = await (supabase as any)
                .from('applications')
                .update({ status })
                .eq('id', id);

            if (error) throw error;

            toast.success(`อัปเดตสถานะเป็น "${statusLabels[status].label}" แล้ว`);

            // Auto-create student when approved
            if (status === 'approved' && app) {
                await autoCreateStudent(app);
            }

            fetchApplications();
            setSelectedApp(null);
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('ไม่สามารถอัปเดตสถานะได้');
        }
    };

    // Auto-create student when application is approved
    const autoCreateStudent = async (app: Application) => {
        try {
            console.log('Auto-creating student for:', app.first_name, app.last_name);

            // Generate student ID
            const studentId = generateStudentId(app.course);
            console.log('Generated student ID:', studentId);

            // Get department ID based on course
            let departmentId: string | null = null;
            const deptCode = courseToDeptPrefix[app.course];
            if (deptCode) {
                const { data: dept } = await supabase
                    .from('departments')
                    .select('id')
                    .eq('code', deptCode)
                    .single();

                if (dept) {
                    departmentId = dept.id;
                } else {
                    // Create department if it doesn't exist
                    const { data: newDept } = await supabase
                        .from('departments')
                        .insert({
                            code: deptCode,
                            name: courseLabels[app.course] || app.course
                        })
                        .select('id')
                        .single();
                    if (newDept) departmentId = newDept.id;
                }
            }
            console.log('Department ID:', departmentId);

            // Create student record (minimal columns that work)
            const { data: newStudent, error: studentError } = await supabase
                .from('students')
                .insert({
                    student_id: studentId,
                    first_name: app.first_name,
                    last_name: app.last_name,
                    email: app.email || null,
                    phone: app.phone || null,
                    department_id: departmentId,
                    gpa: app.gpa || null,
                    year: 1,
                    status: 'active',
                    education_level: 'ปวช',
                } as any)
                .select()
                .single();

            if (studentError) {
                console.error('Error creating student:', studentError);
                toast.error(`อนุมัติแล้ว แต่ไม่สามารถสร้างบัญชีนักศึกษาได้: ${studentError.message}`);
                return;
            }

            console.log('Student created:', newStudent);

            // Update application with student_id_ref
            await (supabase as any)
                .from('applications')
                .update({ student_id_ref: studentId })
                .eq('id', app.id);

            toast.success(`🎓 สร้างนักศึกษาอัตโนมัติ! รหัส: ${studentId}`);
        } catch (error: any) {
            console.error('Auto create student error:', error);
            toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
        }
    };

    const generateStudentId = (course: string) => {
        const year = new Date().getFullYear().toString().slice(-2);
        const prefix = courseToDeptPrefix[course] || 'STU';
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `${prefix}${year}${random}`;
    };

    const createStudentAccount = async (app: Application) => {
        if (creatingStudent) return;
        setCreatingStudent(true);

        try {
            // Generate student ID
            const studentId = generateStudentId(app.course);

            // Get department ID based on course (or create if doesn't exist)
            let departmentId: string | null = null;
            const deptCode = courseToDeptPrefix[app.course];
            if (deptCode) {
                const { data: dept } = await supabase
                    .from('departments')
                    .select('id')
                    .eq('code', deptCode)
                    .single();

                if (dept) {
                    departmentId = dept.id;
                } else {
                    // Create department if it doesn't exist
                    const { data: newDept } = await supabase
                        .from('departments')
                        .insert({
                            code: deptCode,
                            name: courseLabels[app.course] || app.course
                        })
                        .select('id')
                        .single();
                    if (newDept) departmentId = newDept.id;
                }
            }

            // Create student record (minimal columns that work)
            const { error: studentError } = await supabase
                .from('students')
                .insert({
                    student_id: studentId,
                    first_name: app.first_name,
                    last_name: app.last_name,
                    email: app.email || null,
                    phone: app.phone || null,
                    department_id: departmentId,
                    gpa: app.gpa || null,
                    year: 1,
                    status: 'active',
                    education_level: 'ปวช',
                } as any);

            if (studentError) throw studentError;

            // Update application status to student_created
            await (supabase as any)
                .from('applications')
                .update({
                    status: 'student_created',
                    student_id_ref: studentId
                })
                .eq('id', app.id);

            toast.success(`สร้างบัญชีนักศึกษาสำเร็จ! รหัสนักศึกษา: ${studentId}`);
            fetchApplications();
            setSelectedApp(null);
        } catch (error: any) {
            console.error('Error creating student:', error);
            toast.error('ไม่สามารถสร้างบัญชีนักศึกษา: ' + (error.message || 'Unknown error'));
        } finally {
            setCreatingStudent(false);
        }
    };

    const filteredApplications = applications.filter(app => {
        const matchesSearch =
            `${app.first_name} ${app.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.id_card.includes(searchTerm) ||
            app.phone.includes(searchTerm);

        const matchesStatus = statusFilter === 'all' || app.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const printApplication = (app: Application) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>ใบสมัครเรียน - ${app.prefix}${app.first_name} ${app.last_name}</title>
                <style>
                    body { font-family: 'Sarabun', sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                    h1 { text-align: center; color: #7c2d12; margin-bottom: 30px; }
                    .section { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
                    .section-title { font-weight: bold; color: #7c2d12; margin-bottom: 10px; font-size: 16px; }
                    .row { display: flex; margin-bottom: 8px; }
                    .label { width: 150px; color: #666; }
                    .value { flex: 1; font-weight: 500; }
                    .photos { display: flex; gap: 20px; margin-top: 10px; }
                    .photos img { width: 150px; height: auto; border-radius: 8px; }
                    .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 14px; }
                    .status.pending { background: #fef3c7; color: #92400e; }
                    .status.approved { background: #d1fae5; color: #065f46; }
                    .status.rejected { background: #fee2e2; color: #991b1b; }
                    @media print { body { padding: 20px; } }
                </style>
            </head>
            <body>
                <h1>ใบสมัครเรียน วิทยาลัยเทคโนโลยีภูเวียงเทคโนบริหารธุรกิจ</h1>
                <p style="text-align: center;">สมัครเมื่อ: ${formatDate(app.created_at)} | สถานะ: <span class="status ${app.status}">${statusLabels[app.status]?.label || app.status}</span></p>
                
                <div class="section">
                    <div class="section-title">สาขาวิชาที่สมัคร</div>
                    <div class="value">${courseLabels[app.course] || app.course}</div>
                </div>
                
                <div class="section">
                    <div class="section-title">ข้อมูลส่วนตัว</div>
                    <div class="row"><span class="label">ชื่อ-นามสกุล:</span><span class="value">${app.prefix}${app.first_name} ${app.last_name}</span></div>
                    <div class="row"><span class="label">เลขบัตรประชาชน:</span><span class="value">${app.id_card}</span></div>
                    <div class="row"><span class="label">วันเกิด:</span><span class="value">${app.birth_date}</span></div>
                    <div class="row"><span class="label">เบอร์โทร:</span><span class="value">${app.phone}</span></div>
                    <div class="row"><span class="label">อีเมล:</span><span class="value">${app.email || '-'}</span></div>
                    <div class="row"><span class="label">Line ID:</span><span class="value">${app.line_id || '-'}</span></div>
                    <div class="row"><span class="label">Facebook:</span><span class="value">${app.facebook || '-'}</span></div>
                    <div class="row"><span class="label">ที่อยู่:</span><span class="value">${app.address}</span></div>
                </div>
                
                <div class="section">
                    <div class="section-title">ข้อมูลผู้ปกครอง</div>
                    <div class="row"><span class="label">ชื่อผู้ปกครอง:</span><span class="value">${app.parent_name}</span></div>
                    <div class="row"><span class="label">ความสัมพันธ์:</span><span class="value">${app.parent_relation}</span></div>
                    <div class="row"><span class="label">เบอร์โทร:</span><span class="value">${app.parent_phone}</span></div>
                    <div class="row"><span class="label">อาชีพ:</span><span class="value">${app.parent_occupation || '-'}</span></div>
                </div>
                
                <div class="section">
                    <div class="section-title">ประวัติการศึกษา</div>
                    <div class="row"><span class="label">โรงเรียนเดิม:</span><span class="value">${app.previous_school}</span></div>
                    <div class="row"><span class="label">GPA:</span><span class="value">${app.gpa}</span></div>
                    <div class="row"><span class="label">ปีที่จบ:</span><span class="value">${app.graduation_year}</span></div>
                </div>
                
                <div class="section">
                    <div class="section-title">ข้อมูลสุขภาพ</div>
                    <div class="row"><span class="label">โรคประจำตัว:</span><span class="value">${app.chronic_disease || 'ไม่มี'}</span></div>
                    <div class="row"><span class="label">ประวัติแพ้ยา/อาหาร:</span><span class="value">${app.allergies || 'ไม่มี'}</span></div>
                </div>
                
                <div class="section">
                    <div class="section-title">เอกสารแนบ</div>
                    <div class="photos">
                        ${app.photo_url ? `<div><p>รูปถ่ายผู้สมัคร</p><img src="${app.photo_url}" /></div>` : ''}
                        ${app.id_card_file_url ? `<div><p>สำเนาบัตรประชาชน</p><img src="${app.id_card_file_url}" /></div>` : ''}
                    </div>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
    };

    return (
        <AdminLayout title="จัดการใบสมัคร">
            <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-card p-4 rounded-xl shadow-sm">
                        <p className="text-muted-foreground text-sm">ทั้งหมด</p>
                        <p className="text-2xl font-bold">{applications.length}</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-xl shadow-sm">
                        <p className="text-yellow-700 text-sm">รอตรวจสอบ</p>
                        <p className="text-2xl font-bold text-yellow-700">
                            {applications.filter(a => a.status === 'pending').length}
                        </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl shadow-sm">
                        <p className="text-green-700 text-sm">อนุมัติแล้ว</p>
                        <p className="text-2xl font-bold text-green-700">
                            {applications.filter(a => a.status === 'approved').length}
                        </p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-xl shadow-sm">
                        <p className="text-red-700 text-sm">ไม่อนุมัติ</p>
                        <p className="text-2xl font-bold text-red-700">
                            {applications.filter(a => a.status === 'rejected').length}
                        </p>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                        <input
                            type="text"
                            placeholder="ค้นหาชื่อ, เลขบัตร, เบอร์โทร..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="all">ทุกสถานะ</option>
                        <option value="pending">รอตรวจสอบ</option>
                        <option value="approved">อนุมัติแล้ว</option>
                        <option value="rejected">ไม่อนุมัติ</option>
                    </select>
                </div>

                {/* Applications Table */}
                <div className="bg-card rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium">วันที่สมัคร</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">ชื่อ-นามสกุล</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium hidden md:table-cell">สาขา</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium hidden md:table-cell">เบอร์โทร</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">สถานะ</th>
                                    <th className="px-4 py-3 text-center text-sm font-medium">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                            กำลังโหลด...
                                        </td>
                                    </tr>
                                ) : filteredApplications.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                            ไม่พบข้อมูลใบสมัคร
                                        </td>
                                    </tr>
                                ) : (
                                    filteredApplications.map((app) => (
                                        <tr key={app.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3 text-sm">
                                                {formatDate(app.created_at)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    {app.photo_url && (
                                                        <img
                                                            src={app.photo_url}
                                                            alt=""
                                                            className="w-10 h-10 rounded-full object-cover"
                                                        />
                                                    )}
                                                    <div>
                                                        <p className="font-medium">{app.prefix}{app.first_name} {app.last_name}</p>
                                                        <p className="text-sm text-muted-foreground md:hidden">
                                                            {courseLabels[app.course] || app.course}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm hidden md:table-cell">
                                                {courseLabels[app.course] || app.course}
                                            </td>
                                            <td className="px-4 py-3 text-sm hidden md:table-cell">{app.phone}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusLabels[app.status]?.color || 'bg-gray-100'}`}>
                                                    {statusLabels[app.status]?.label || app.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => setSelectedApp(app)}
                                                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                                                    title="ดูรายละเอียด"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Application Detail Modal */}
            <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>รายละเอียดใบสมัคร</DialogTitle>
                    </DialogHeader>

                    {selectedApp && (
                        <div className="space-y-6">
                            {/* Photo and Basic Info */}
                            <div className="flex items-start gap-4">
                                {selectedApp.photo_url && (
                                    <img
                                        src={selectedApp.photo_url}
                                        alt=""
                                        className="w-24 h-24 rounded-lg object-cover"
                                    />
                                )}
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold">
                                        {selectedApp.prefix}{selectedApp.first_name} {selectedApp.last_name}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        สมัครสาขา: {courseLabels[selectedApp.course] || selectedApp.course}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        สมัครเมื่อ: {formatDate(selectedApp.created_at)}
                                    </p>
                                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${statusLabels[selectedApp.status]?.color}`}>
                                        {statusLabels[selectedApp.status]?.label}
                                    </span>
                                </div>
                            </div>

                            {/* Personal Info */}
                            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                                <div>
                                    <p className="text-sm text-muted-foreground">เลขบัตรประชาชน</p>
                                    <p className="font-medium">{selectedApp.id_card}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">วันเกิด</p>
                                    <p className="font-medium">{selectedApp.birth_date}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">เบอร์โทร</p>
                                    <p className="font-medium">{selectedApp.phone}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">อีเมล</p>
                                    <p className="font-medium">{selectedApp.email || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Line ID</p>
                                    <p className="font-medium">{selectedApp.line_id || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Facebook</p>
                                    <p className="font-medium">{selectedApp.facebook || '-'}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-sm text-muted-foreground">ที่อยู่</p>
                                    <p className="font-medium">{selectedApp.address}</p>
                                </div>
                            </div>

                            {/* Parent Info */}
                            <div className="p-4 bg-muted/30 rounded-lg">
                                <h4 className="font-semibold mb-3">ข้อมูลผู้ปกครอง</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">ชื่อผู้ปกครอง</p>
                                        <p className="font-medium">{selectedApp.parent_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">ความสัมพันธ์</p>
                                        <p className="font-medium">{selectedApp.parent_relation}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">เบอร์โทร</p>
                                        <p className="font-medium">{selectedApp.parent_phone}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">อาชีพ</p>
                                        <p className="font-medium">{selectedApp.parent_occupation || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Education */}
                            <div className="p-4 bg-muted/30 rounded-lg">
                                <h4 className="font-semibold mb-3">ประวัติการศึกษา</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <p className="text-sm text-muted-foreground">โรงเรียนเดิม</p>
                                        <p className="font-medium">{selectedApp.previous_school}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">GPA</p>
                                        <p className="font-medium">{selectedApp.gpa}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">ปีที่จบ</p>
                                        <p className="font-medium">{selectedApp.graduation_year}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Health Info */}
                            <div className="p-4 bg-muted/30 rounded-lg">
                                <h4 className="font-semibold mb-3">ข้อมูลสุขภาพ</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">โรคประจำตัว</p>
                                        <p className="font-medium">{selectedApp.chronic_disease || 'ไม่มี'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">ประวัติแพ้ยา/อาหาร</p>
                                        <p className="font-medium">{selectedApp.allergies || 'ไม่มี'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Documents */}
                            <div className="p-4 bg-muted/30 rounded-lg">
                                <h4 className="font-semibold mb-3">เอกสารแนบ</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-2">รูปถ่ายผู้สมัคร</p>
                                        {selectedApp.photo_url ? (
                                            <div className="space-y-2">
                                                <a href={selectedApp.photo_url} target="_blank" rel="noopener noreferrer">
                                                    <img
                                                        src={selectedApp.photo_url}
                                                        alt="รูปถ่ายผู้สมัคร"
                                                        className="w-full max-w-[200px] h-auto rounded-lg border shadow-sm hover:opacity-80 transition-opacity cursor-pointer"
                                                    />
                                                </a>
                                                <a
                                                    href={selectedApp.photo_url}
                                                    download={`photo_${selectedApp.first_name}_${selectedApp.last_name}.jpg`}
                                                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                                >
                                                    <Download size={14} />
                                                    ดาวน์โหลดรูป
                                                </a>
                                            </div>
                                        ) : (
                                            <p className="text-muted-foreground">ไม่มี</p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-2">สำเนาบัตรประชาชน</p>
                                        {selectedApp.id_card_file_url ? (
                                            <div className="space-y-2">
                                                <a href={selectedApp.id_card_file_url} target="_blank" rel="noopener noreferrer">
                                                    <img
                                                        src={selectedApp.id_card_file_url}
                                                        alt="สำเนาบัตรประชาชน"
                                                        className="w-full max-w-[200px] h-auto rounded-lg border shadow-sm hover:opacity-80 transition-opacity cursor-pointer"
                                                    />
                                                </a>
                                                <a
                                                    href={selectedApp.id_card_file_url}
                                                    download={`idcard_${selectedApp.first_name}_${selectedApp.last_name}.jpg`}
                                                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                                >
                                                    <Download size={14} />
                                                    ดาวน์โหลดสำเนาบัตร
                                                </a>
                                            </div>
                                        ) : (
                                            <p className="text-muted-foreground">ไม่มี</p>
                                        )}
                                    </div>
                                </div>

                                {/* Optional Documents - Show only if any exist */}
                                {(selectedApp.house_reg_file_url || selectedApp.transcript_file_url || selectedApp.medical_cert_file_url || selectedApp.parent_id_file_url) && (
                                    <div className="mt-4 pt-4 border-t border-border/50">
                                        <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                                            <i className="fa-solid fa-circle-info text-blue-500" />
                                            เอกสารเพิ่มเติม
                                        </p>
                                        <div className="grid grid-cols-2 gap-4">
                                            {selectedApp.house_reg_file_url && (
                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-2">สำเนาทะเบียนบ้าน</p>
                                                    <a href={selectedApp.house_reg_file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                                                        <Download size={14} />
                                                        ดูเอกสาร
                                                    </a>
                                                </div>
                                            )}
                                            {selectedApp.transcript_file_url && (
                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-2">ใบ ปพ.1 / ใบรับรองผลการเรียน</p>
                                                    <a href={selectedApp.transcript_file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                                                        <Download size={14} />
                                                        ดูเอกสาร
                                                    </a>
                                                </div>
                                            )}
                                            {selectedApp.medical_cert_file_url && (
                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-2">ใบรับรองแพทย์</p>
                                                    <a href={selectedApp.medical_cert_file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                                                        <Download size={14} />
                                                        ดูเอกสาร
                                                    </a>
                                                </div>
                                            )}
                                            {selectedApp.parent_id_file_url && (
                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-2">สำเนาบัตรประชาชนผู้ปกครอง</p>
                                                    <a href={selectedApp.parent_id_file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                                                        <Download size={14} />
                                                        ดูเอกสาร
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap justify-between gap-3 pt-4 border-t">
                                <button
                                    onClick={() => printApplication(selectedApp)}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                                >
                                    <Printer size={18} />
                                    พิมพ์ใบสมัคร
                                </button>
                                <div className="flex flex-wrap gap-3">
                                    {selectedApp.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => updateStatus(selectedApp.id, 'rejected')}
                                                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                            >
                                                <X size={18} />
                                                ไม่อนุมัติ
                                            </button>
                                            <button
                                                onClick={() => updateStatus(selectedApp.id, 'approved', selectedApp)}
                                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                            >
                                                <Check size={18} />
                                                อนุมัติ
                                            </button>
                                        </>
                                    )}
                                    {selectedApp.status === 'approved' && (
                                        <>
                                            <button
                                                onClick={() => createStudentAccount(selectedApp)}
                                                disabled={creatingStudent}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                            >
                                                <UserPlus size={18} />
                                                {creatingStudent ? 'กำลังสร้าง...' : 'สร้างบัญชีนักศึกษา'}
                                            </button>
                                            <button
                                                onClick={() => updateStatus(selectedApp.id, 'pending')}
                                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                            >
                                                <i className="fa-solid fa-rotate-left" />
                                                รีเซ็ตสถานะ
                                            </button>
                                        </>
                                    )}
                                    {selectedApp.status === 'student_created' && (
                                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
                                            <Check size={18} />
                                            สร้างบัญชีแล้ว {selectedApp.student_id_ref && `(${selectedApp.student_id_ref})`}
                                        </div>
                                    )}
                                    {selectedApp.status === 'rejected' && (
                                        <button
                                            onClick={() => updateStatus(selectedApp.id, 'pending')}
                                            className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                                        >
                                            รีเซ็ตสถานะ
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
};

export default AdminApplications;
