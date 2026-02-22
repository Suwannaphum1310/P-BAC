import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { z } from 'zod';

interface Department {
    id: string;
    name: string;
}

const registerSchema = z.object({
    studentId: z.string().min(5, 'กรุณากรอกรหัสนักศึกษา'),
    fullName: z.string().min(2, 'กรุณากรอกชื่อ-นามสกุล'),
    email: z.string().email('กรุณากรอกอีเมลที่ถูกต้อง'),
    password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
    confirmPassword: z.string(),
    departmentId: z.string().min(1, 'กรุณาเลือกสาขาวิชา'),
    educationLevel: z.string().min(1, 'กรุณาเลือกระดับการศึกษา'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'รหัสผ่านไม่ตรงกัน',
    path: ['confirmPassword'],
});

const StudentRegister = () => {
    const [formData, setFormData] = useState({
        studentId: '',
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        departmentId: '',
        educationLevel: '',
    });
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [studentIdVerified, setStudentIdVerified] = useState<boolean | null>(null);
    const [verifyingStudentId, setVerifyingStudentId] = useState(false);
    const navigate = useNavigate();
    const { user, loading } = useAuth();

    // Fetch departments
    useEffect(() => {
        const fetchDepartments = async () => {
            const { data } = await supabase
                .from('departments')
                .select('id, name')
                .order('name');
            if (data) setDepartments(data);
        };
        fetchDepartments();
    }, []);

    // Redirect if already logged in
    useEffect(() => {
        if (!loading && user) {
            navigate('/redirect', { replace: true });
        }
    }, [user, loading, navigate]);

    // Verify student ID
    const verifyStudentId = async (studentId: string) => {
        if (studentId.length < 5) {
            setStudentIdVerified(null);
            return;
        }

        setVerifyingStudentId(true);
        try {
            const { data } = await supabase
                .from('students')
                .select('id, first_name, last_name, department_id')
                .eq('student_id', studentId)
                .maybeSingle();

            if (data) {
                setStudentIdVerified(true);
                // Auto-fill name and department if found
                const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim();
                if (fullName) {
                    setFormData(prev => ({
                        ...prev,
                        fullName: fullName,
                        departmentId: data.department_id || prev.departmentId
                    }));
                }
                setErrors(prev => ({ ...prev, studentId: '' }));
            } else {
                setStudentIdVerified(false);
                setErrors(prev => ({ ...prev, studentId: 'ไม่พบรหัสนักศึกษานี้ในระบบ กรุณาติดต่อเจ้าหน้าที่' }));
            }
        } catch (error) {
            console.error('Error verifying student ID:', error);
            setStudentIdVerified(false);
        } finally {
            setVerifyingStudentId(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }

        // Reset student ID verification when changed
        if (name === 'studentId') {
            setStudentIdVerified(null);
        }
    };

    const handleStudentIdBlur = () => {
        if (formData.studentId.length >= 5) {
            verifyStudentId(formData.studentId);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        // Check if student ID is verified
        if (!studentIdVerified) {
            setErrors({ studentId: 'กรุณาตรวจสอบรหัสนักศึกษาให้ถูกต้อง' });
            return;
        }

        setIsLoading(true);

        // Validate inputs
        const result = registerSchema.safeParse(formData);
        if (!result.success) {
            const fieldErrors: Record<string, string> = {};
            result.error.errors.forEach((err) => {
                if (err.path[0]) {
                    fieldErrors[err.path[0] as string] = err.message;
                }
            });
            setErrors(fieldErrors);
            setIsLoading(false);
            return;
        }

        try {
            // 1. Check if student already has an account
            const { data: existingStudent } = await supabase
                .from('students')
                .select('email')
                .eq('student_id', formData.studentId)
                .single();

            if (existingStudent?.email && existingStudent.email !== formData.email) {
                // Student already registered with different email
                const maskedEmail = existingStudent.email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
                toast.error(`รหัสนักศึกษานี้ลงทะเบียนแล้วด้วยอีเมล ${maskedEmail}`);
                setIsLoading(false);
                return;
            }

            // 2. Sign up the user with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        student_id: formData.studentId,
                    },
                },
            });

            if (authError) {
                if (authError.message.includes('already registered')) {
                    toast.error('อีเมลนี้ถูกใช้งานแล้ว');
                } else {
                    toast.error('เกิดข้อผิดพลาดในการสมัคร: ' + authError.message);
                }
                setIsLoading(false);
                return;
            }

            if (!authData.user) {
                toast.error('ไม่สามารถสร้างบัญชีได้');
                setIsLoading(false);
                return;
            }

            // 3. Assign student role
            const { error: roleError } = await supabase
                .from('user_roles')
                .insert({
                    user_id: authData.user.id,
                    role: 'student',
                });

            if (roleError) {
                console.error('Error assigning role:', roleError);
            }

            // 4. Update profile with full name
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ full_name: formData.fullName })
                .eq('user_id', authData.user.id);

            if (profileError) {
                console.error('Error updating profile:', profileError);
            }

            // 5. Update student record with email and department
            const nameParts = formData.fullName.split(' ');
            const firstName = nameParts[0] || formData.fullName;
            const lastName = nameParts.slice(1).join(' ') || '-';

            const { error: studentError } = await (supabase as any)
                .from('students')
                .update({
                    email: formData.email,
                    first_name: firstName,
                    last_name: lastName,
                    department_id: formData.departmentId,
                    education_level: formData.educationLevel,
                })
                .eq('student_id', formData.studentId);

            if (studentError) {
                console.error('Error updating student record:', studentError);
            }

            toast.success('สร้างบัญชีสำเร็จ! กรุณาเข้าสู่ระบบ');
            navigate('/student-login');
        } catch (error) {
            console.error('Registration error:', error);
            toast.error('เกิดข้อผิดพลาดในการสมัคร');
        } finally {
            setIsLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 py-20 px-4">
            <div className="bg-white p-8 md:p-12 rounded-2xl shadow-lg w-full max-w-md border border-emerald-100">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <i className="fa-solid fa-user-plus text-3xl text-white" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2 text-emerald-800">สมัครบัญชีนักศึกษา</h1>
                    <p className="text-gray-500 text-sm">สร้างบัญชีเพื่อเข้าใช้งานระบบของวิทยาลัย</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Student ID */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            รหัสนักศึกษา <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                name="studentId"
                                value={formData.studentId}
                                onChange={handleChange}
                                onBlur={handleStudentIdBlur}
                                placeholder="เช่น 65010001"
                                required
                                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all ${errors.studentId ? 'border-red-500' :
                                    studentIdVerified === true ? 'border-green-500' :
                                        'border-gray-300'
                                    }`}
                            />
                            {verifyingStudentId && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <i className="fa-solid fa-spinner fa-spin text-gray-400" />
                                </div>
                            )}
                            {studentIdVerified === true && !verifyingStudentId && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <i className="fa-solid fa-check-circle text-green-500" />
                                </div>
                            )}
                        </div>
                        {errors.studentId && (
                            <p className="text-red-500 text-sm mt-1">{errors.studentId}</p>
                        )}
                        {studentIdVerified === true && (
                            <p className="text-green-600 text-sm mt-1">✓ พบข้อมูลนักศึกษาในระบบ</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">กรอกรหัสนักศึกษาที่ได้รับจากวิทยาลัย</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            ชื่อ-นามสกุล <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="กรอกชื่อ-นามสกุลจริง"
                            required
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all ${errors.fullName ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {errors.fullName && (
                            <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            อีเมล <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="student@example.com"
                            required
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all ${errors.email ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {errors.email && (
                            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                        )}
                    </div>

                    {/* Department Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            สาขาวิชา <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="departmentId"
                            value={formData.departmentId}
                            onChange={handleChange}
                            required
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all bg-white ${errors.departmentId ? 'border-red-500' : 'border-gray-300'
                                }`}
                        >
                            <option value="">-- เลือกสาขาวิชา --</option>
                            {departments.map((dept) => (
                                <option key={dept.id} value={dept.id}>
                                    {dept.name}
                                </option>
                            ))}
                        </select>
                        {errors.departmentId && (
                            <p className="text-red-500 text-sm mt-1">{errors.departmentId}</p>
                        )}
                    </div>

                    {/* Education Level Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            ระดับการศึกษา <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="educationLevel"
                            value={formData.educationLevel}
                            onChange={handleChange}
                            required
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all bg-white ${errors.educationLevel ? 'border-red-500' : 'border-gray-300'
                                }`}
                        >
                            <option value="">-- เลือกระดับการศึกษา --</option>
                            <option value="ปวช.">ปวช. (ประกาศนียบัตรวิชาชีพ)</option>
                            <option value="ปวส.">ปวส. (ประกาศนียบัตรวิชาชีพชั้นสูง)</option>
                        </select>
                        {errors.educationLevel && (
                            <p className="text-red-500 text-sm mt-1">{errors.educationLevel}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            รหัสผ่าน <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all ${errors.password ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {errors.password && (
                            <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">อย่างน้อย 6 ตัวอักษร</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            ยืนยันรหัสผ่าน <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {errors.confirmPassword && (
                            <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !studentIdVerified}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-full font-medium shadow-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <i className="fa-solid fa-spinner fa-spin mr-2" />
                                กำลังสร้างบัญชี...
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-user-plus mr-2" />
                                สมัครบัญชี
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                    <p className="text-sm text-gray-500">
                        มีบัญชีอยู่แล้ว?{' '}
                        <Link
                            to="/student-login"
                            className="text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
                        >
                            เข้าสู่ระบบ
                        </Link>
                    </p>
                </div>

                <Link to="/" className="flex items-center justify-center mt-6 text-emerald-600 hover:underline text-sm">
                    <i className="fa-solid fa-arrow-left mr-2" />
                    กลับหน้าหลัก
                </Link>
            </div>
        </div>
    );
};

export default StudentRegister;
