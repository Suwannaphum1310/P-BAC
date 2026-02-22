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

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const navigate = useNavigate();
  const { signIn, signOut, user, loading, role } = useAuth();

  // Redirect if already logged in and is teacher/admin
  useEffect(() => {
    if (!loading && user && (role === 'teacher' || role === 'admin')) {
      navigate('/redirect', { replace: true });
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

      // Only allow teacher and admin
      if (userRole !== 'teacher' && userRole !== 'admin') {
        // Not a teacher/admin - sign out and show error
        await signOut();

        toast.error(
          'บัญชีนี้เป็นบัญชีนักศึกษา ไม่สามารถเข้าสู่ระบบผ่านหน้าอาจารย์ได้ กรุณาใช้หน้าเข้าสู่ระบบสำหรับนักศึกษา',
          { duration: 5000 }
        );
        setIsLoading(false);
        return;
      }
    }

    toast.success('เข้าสู่ระบบสำเร็จ');
    navigate('/redirect');
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
          <i className="fa-solid fa-chalkboard-user text-5xl text-primary mb-4 block" />
          <h1 className="text-2xl font-bold mb-2">สำหรับอาจารย์</h1>
          <p className="text-muted-foreground">เข้าสู่ระบบเพื่อจัดการข้อมูล</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="อีเมล"
              required
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all ${errors.email ? 'border-destructive' : 'border-border'
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
              placeholder="รหัสผ่าน"
              required
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all ${errors.password ? 'border-destructive' : 'border-border'
                }`}
            />
            {errors.password && (
              <p className="text-destructive text-sm mt-1">{errors.password}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-primary-foreground py-3 rounded-full font-medium shadow-primary hover:bg-primary-dark transition-all duration-300 disabled:opacity-50"
          >
            {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <Link to="/" className="inline-block mt-6 text-primary hover:underline">
          <i className="fa-solid fa-arrow-left mr-2" />
          กลับหน้าหลัก
        </Link>
      </div>
    </div>
  );
};

export default Login;
