import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { z } from 'zod';

const signupSchema = z.object({
  fullName: z.string().min(2, 'กรุณากรอกชื่อ-สกุลอย่างน้อย 2 ตัวอักษร').max(100, 'ชื่อยาวเกินไป'),
  email: z.string().email('กรุณากรอกอีเมลที่ถูกต้อง').max(255, 'อีเมลยาวเกินไป'),
  password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'รหัสผ่านไม่ตรงกัน',
  path: ['confirmPassword'],
});

const Signup = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ fullName?: string; email?: string; password?: string; confirmPassword?: string }>({});
  const navigate = useNavigate();
  const { signUp, user, loading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    // Validate inputs
    const result = signupSchema.safeParse({ fullName, email, password, confirmPassword });
    if (!result.success) {
      const fieldErrors: { fullName?: string; email?: string; password?: string; confirmPassword?: string } = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field as keyof typeof fieldErrors] = err.message;
      });
      setErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    const { error } = await signUp(email, password, fullName);
    
    if (error) {
      if (error.message.includes('User already registered')) {
        toast.error('อีเมลนี้ถูกใช้งานแล้ว');
      } else if (error.message.includes('Password should be at least')) {
        toast.error('รหัสผ่านไม่ตรงตามเงื่อนไข');
      } else {
        toast.error('เกิดข้อผิดพลาดในการสมัครสมาชิก');
      }
      setIsLoading(false);
      return;
    }

    toast.success('สมัครสมาชิกสำเร็จ! กำลังเข้าสู่ระบบ...');
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted to-border">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted to-border py-20">
      <div className="bg-card p-12 rounded-2xl shadow-lg w-full max-w-md text-center">
        <div className="mb-8">
          <i className="fa-solid fa-user-plus text-5xl text-primary mb-4 block" />
          <h1 className="text-2xl font-bold mb-2">สมัครสมาชิก</h1>
          <p className="text-muted-foreground">สร้างบัญชีสำหรับอาจารย์</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="ชื่อ-สกุล"
              required
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all ${
                errors.fullName ? 'border-destructive' : 'border-border'
              }`}
            />
            {errors.fullName && (
              <p className="text-destructive text-sm mt-1">{errors.fullName}</p>
            )}
          </div>
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="อีเมล"
              required
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all ${
                errors.email ? 'border-destructive' : 'border-border'
              }`}
            />
            {errors.email && (
              <p className="text-destructive text-sm mt-1">{errors.email}</p>
            )}
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
              required
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all ${
                errors.password ? 'border-destructive' : 'border-border'
              }`}
            />
            {errors.password && (
              <p className="text-destructive text-sm mt-1">{errors.password}</p>
            )}
          </div>
          <div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="ยืนยันรหัสผ่าน"
              required
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all ${
                errors.confirmPassword ? 'border-destructive' : 'border-border'
              }`}
            />
            {errors.confirmPassword && (
              <p className="text-destructive text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-primary-foreground py-3 rounded-full font-medium shadow-primary hover:bg-primary-dark transition-all duration-300 disabled:opacity-50"
          >
            {isLoading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
          </button>
        </form>

        <div className="mt-6 text-sm text-muted-foreground">
          มีบัญชีอยู่แล้ว?{' '}
          <Link to="/login" className="text-primary hover:underline font-medium">
            เข้าสู่ระบบ
          </Link>
        </div>

        <Link to="/" className="inline-block mt-6 text-primary hover:underline">
          <i className="fa-solid fa-arrow-left mr-2" />
          กลับหน้าหลัก
        </Link>
      </div>
    </div>
  );
};

export default Signup;
