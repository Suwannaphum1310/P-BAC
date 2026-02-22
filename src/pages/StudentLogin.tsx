import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const loginSchema = z.object({
    email: z.string().email('กรุณากรอกอีเมลที่ถูกต้อง'),
    password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
});

const StudentLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const navigate = useNavigate();
    const { signIn, signOut, user, loading, role } = useAuth();

    // Redirect if already logged in and is a student
    useEffect(() => {
        if (!loading && user && role === 'student') {
            navigate('/student', { replace: true });
        }
    }, [user, loading, role, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setIsLoading(true);

        // Validate inputs
        const result = loginSchema.safeParse({ email, password });
        if (!result.success) {
            const fieldErrors: { email?: string; password?: string } = {};
            result.error.errors.forEach((err) => {
                if (err.path[0] === 'email') fieldErrors.email = err.message;
                if (err.path[0] === 'password') fieldErrors.password = err.message;
            });
            setErrors(fieldErrors);
            setIsLoading(false);
            return;
        }

        const { error } = await signIn(email, password);

        if (error) {
            if (error.message.includes('Invalid login credentials')) {
                toast.error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
            } else if (error.message.includes('Email not confirmed')) {
                toast.error('กรุณายืนยันอีเมลของคุณก่อนเข้าสู่ระบบ');
            } else {
                toast.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
            }
            setIsLoading(false);
            return;
        }

        // Get current user and check role
        const { data: { user: currentUser } } = await supabase.auth.getUser();

        if (currentUser) {
            const { data: roleData } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', currentUser.id)
                .maybeSingle();

            const userRole = roleData?.role;

            if (userRole !== 'student') {
                // Not a student - sign out and show error
                await signOut();

                const roleLabels: Record<string, string> = {
                    admin: 'ผู้ดูแลระบบ (Admin)',
                    teacher: 'อาจารย์',
                };
                const roleLabel = userRole ? roleLabels[userRole] || userRole : 'ไม่ทราบ';

                toast.error(
                    `บัญชีนี้เป็นบัญชี "${roleLabel}" ไม่สามารถเข้าสู่ระบบผ่านหน้านักศึกษาได้ กรุณาใช้หน้าเข้าสู่ระบบสำหรับอาจารย์`,
                    { duration: 5000 }
                );
                setIsLoading(false);
                return;
            }
        }

        toast.success('เข้าสู่ระบบสำเร็จ');
        navigate('/student');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 py-20">
            <div className="bg-white p-12 rounded-2xl shadow-lg w-full max-w-md text-center border border-emerald-100">
                <div className="mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <i className="fa-solid fa-user-graduate text-3xl text-white" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2 text-emerald-800">สำหรับนักศึกษา</h1>
                    <p className="text-gray-500">เข้าสู่ระบบเพื่อดูผลการเรียนและข้อมูลของคุณ</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="student@pbac.ac.th"
                            required
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all ${errors.email ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {errors.email && (
                            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all ${errors.password ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {errors.password && (
                            <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                        )}
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-full font-medium shadow-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 disabled:opacity-50"
                    >
                        {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                    </button>
                </form>

                <div className="mt-6 pt-6 border-t border-gray-100">
                    <p className="text-sm text-gray-500 mb-3">ยังไม่มีบัญชี?</p>
                    <Link
                        to="/student-register"
                        className="text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
                    >
                        สร้างบัญชีนักศึกษา
                    </Link>
                </div>

                <Link to="/" className="inline-block mt-6 text-emerald-600 hover:underline">
                    <i className="fa-solid fa-arrow-left mr-2" />
                    กลับหน้าหลัก
                </Link>
            </div>
        </div>
    );
};

export default StudentLogin;
