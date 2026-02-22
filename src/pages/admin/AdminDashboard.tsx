import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import { Users, GraduationCap, BookOpen, RefreshCw, BarChart3, Maximize2, X, Clock, Sparkles, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface StatItem {
  icon: typeof Users;
  value: string;
  label: string;
  gradient: string;
  key: string;
}

interface RecentStudent {
  id: string;
  name: string;
  major: string;
  date: string;
  status: 'approved' | 'pending';
}

const majors = ['ช่างยนต์', 'อิเล็กทรอนิกส์', 'เทคโนโลยีธุรกิจดิจิทัล', 'การบัญชี', 'การจัดการงานบริการสถานพยาบาล'];

const AdminDashboard = () => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState<StatItem[]>([
    { icon: Users, value: '0', label: 'นักศึกษาทั้งหมด', gradient: 'from-blue-500 to-blue-600', key: 'students' },
    { icon: Users, value: '0', label: 'อาจารย์', gradient: 'from-emerald-500 to-emerald-600', key: 'teachers' },
    { icon: BookOpen, value: '0', label: 'หลักสูตร', gradient: 'from-purple-500 to-purple-600', key: 'courses' },
  ]);

  const [editStatModalOpen, setEditStatModalOpen] = useState(false);
  const [editingStat, setEditingStat] = useState<StatItem | null>(null);
  const [editStatValue, setEditStatValue] = useState('');

  const [recentStudents, setRecentStudents] = useState<RecentStudent[]>([]);


  const [loading, setLoading] = useState(true);
  const [expandChartOpen, setExpandChartOpen] = useState(false);

  const dayMapping: { [key: number]: string } = {
    0: 'อาทิตย์',
    1: 'จันทร์',
    2: 'อังคาร',
    3: 'พุธ',
    4: 'พฤหัสบดี',
    5: 'ศุกร์',
    6: 'เสาร์',
  };

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch counts
      const [studentsCount, teachersCount, subjectsCount] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }),
        supabase.from('teachers').select('*', { count: 'exact', head: true }),
        supabase.from('subjects').select('*', { count: 'exact', head: true }),
      ]);

      setStats([
        { icon: Users, value: (studentsCount.count || 0).toLocaleString(), label: 'นักศึกษาทั้งหมด', gradient: 'from-blue-500 to-blue-600', key: 'students' },
        { icon: Users, value: (teachersCount.count || 0).toLocaleString(), label: 'อาจารย์', gradient: 'from-emerald-500 to-emerald-600', key: 'teachers' },
        { icon: BookOpen, value: (subjectsCount.count || 0).toLocaleString(), label: 'หลักสูตร', gradient: 'from-purple-500 to-purple-600', key: 'courses' },
      ]);

      // Fetch recent students
      const { data: recent } = await supabase
        .from('students')
        .select('*, departments(name)')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recent) {
        setRecentStudents(recent.map(s => ({
          id: s.student_id,
          name: `${s.first_name} ${s.last_name}`,
          major: (s as any).departments?.name || 'ไม่ระบุ',
          date: new Date(s.created_at).toLocaleDateString('th-TH'),
          status: s.status === 'active' ? 'approved' : 'pending',
        })));
      }

      // Fetch chart data
      const { data: allStudents } = await supabase.from('students').select('status, departments(name)');

      if (allStudents) {
        const deptCounts: Record<string, number> = {};
        const statusCounts = {
          studying: 0,      // กำลังศึกษา
          onLeave: 0,       // ลาพัก
          graduated: 0      // สำเร็จการศึกษา
        };

        allStudents.forEach(s => {
          // Shorten department name for chart display
          let deptName = (s as any).departments?.name || 'ไม่ระบุ';
          deptName = deptName.replace('สาขาวิชา', '').trim();
          if (deptName.length > 20) {
            deptName = deptName.substring(0, 18) + '...';
          }
          deptCounts[deptName] = (deptCounts[deptName] || 0) + 1;

          // Count by Thai status values (and English equivalents)
          const status = s.status || '';
          if (status === 'กำลังศึกษา' || status === 'active') {
            statusCounts.studying++;
          } else if (status === 'ลาพัก' || status === 'ลาออก' || status === 'inactive') {
            statusCounts.onLeave++;
          } else if (status === 'สำเร็จการศึกษา' || status === 'graduated') {
            statusCounts.graduated++;
          }
        });

        setBarChartData(Object.entries(deptCounts).map(([name, value]) => ({ name, value })));
        setPieChartData([
          { name: 'กำลังศึกษา', value: statusCounts.studying, color: '#22C55E' },
          { name: 'ลาพัก/ลาออก', value: statusCounts.onLeave, color: '#F59E0B' },
          { name: 'สำเร็จการศึกษา', value: statusCounts.graduated, color: '#3B82F6' },
        ]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const [barChartData, setBarChartData] = useState<{ name: string; value: number }[]>([]);
  const [pieChartData, setPieChartData] = useState<{ name: string; value: number; color: string }[]>([]);

  // Stat edit handlers
  const handleEditStat = (stat: StatItem) => {
    setEditingStat(stat);
    setEditStatValue(stat.value);
    setEditStatModalOpen(true);
  };

  const handleSaveStat = () => {
    if (!editingStat) return;

    setStats(prev => prev.map(s =>
      s.key === editingStat.key ? { ...s, value: editStatValue } : s
    ));
    setEditStatModalOpen(false);
    toast({
      title: "บันทึกสำเร็จ",
      description: `อัปเดต${editingStat.label}เรียบร้อยแล้ว`,
    });
  };


  return (
    <AdminLayout>
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-2xl p-6 md:p-8 mb-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={20} className="text-yellow-300" />
              <span className="text-primary-foreground/80 text-sm">สวัสดีตอน{currentTime.getHours() < 12 ? 'เช้า' : currentTime.getHours() < 17 ? 'บ่าย' : 'เย็น'}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-1">
              {profile?.full_name || 'ผู้ดูแลระบบ'}
            </h2>
            <p className="text-primary-foreground/70">
              ยินดีต้อนรับเข้าสู่ระบบจัดการวิทยาลัย P-BAC
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Real-time Clock */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-primary-foreground/80" />
                <span className="text-2xl font-mono font-bold">
                  {currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-primary-foreground/70 mt-1">
                {dayMapping[currentTime.getDay()]}ที่ {currentTime.getDate()} {currentTime.toLocaleDateString('th-TH', { month: 'short', year: 'numeric' })}
              </p>
            </div>

            {/* Quick Stats Summary */}
            <div className="hidden md:flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
              <TrendingUp size={20} className="text-green-300" />
              <div>
                <p className="text-xs text-primary-foreground/70">นักศึกษาในระบบ</p>
                <p className="font-bold text-lg">{stats[0]?.value || '0'} คน</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="group bg-background rounded-xl p-6 shadow-sm border border-border hover:shadow-lg hover:border-primary/30 hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className={`bg-gradient-to-br ${stat.gradient} w-14 h-14 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                <stat.icon size={28} />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-muted-foreground text-sm">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Bar Chart */}
        <div className="bg-background rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="text-[#8B1538]" size={20} />
              <h3 className="text-lg font-semibold">นักศึกษาแยกตามสาขา</h3>
            </div>
            <button
              onClick={() => setExpandChartOpen(true)}
              className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
              title="ขยายกราฟ"
            >
              <Maximize2 size={18} />
            </button>
          </div>
          <div className="flex justify-end mb-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-gradient-to-r from-[#8B1538] to-[#C41E3A] rounded"></div>
              <span className="text-muted-foreground text-xs">จำนวนนักศึกษา</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={barChartData.length * 35 + 40}>
            <BarChart data={barChartData} layout="vertical" margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#8B1538" />
                  <stop offset="100%" stopColor="#C41E3A" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="#E5E7EB" />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 14, fill: '#374151', fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                width={200}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg border text-sm">
                        <p className="font-semibold">{label}</p>
                        <p className="text-[#8B1538]">
                          {payload[0].value} คน
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="value"
                fill="url(#barGradient)"
                radius={[0, 4, 4, 0]}
                animationDuration={800}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-background rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-5 h-5 bg-gradient-to-r from-[#8B1538] to-[#C41E3A] rounded-full flex items-center justify-center shadow-sm">
              <Users size={12} className="text-white" />
            </div>
            <h3 className="text-lg font-semibold">สถานะการลงทะเบียน</h3>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <defs>
                <linearGradient id="greenGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="orangeGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>
                <linearGradient id="blueGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#2563EB" />
                </linearGradient>
                <filter id="pieShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.15" />
                </filter>
              </defs>
              <Pie
                data={pieChartData}
                cx="42%"
                cy="50%"
                innerRadius={65}
                outerRadius={115}
                paddingAngle={4}
                dataKey="value"
                animationDuration={1000}
                animationEasing="ease-out"
                stroke="none"
                style={{ filter: 'url(#pieShadow)' }}
              >
                {pieChartData.map((entry, index) => {
                  const gradients = ['url(#greenGradient)', 'url(#orangeGradient)', 'url(#blueGradient)'];
                  return <Cell key={`cell-${index}`} fill={gradients[index] || entry.color} />;
                })}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xl border border-gray-100 backdrop-blur-sm">
                        <p className="font-bold text-foreground text-base">{data.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }}></div>
                          <p className="text-sm text-gray-600">
                            จำนวน: <span className="font-bold" style={{ color: data.color }}>{data.value}</span> คน
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                iconType="circle"
                iconSize={12}
                formatter={(value) => <span className="text-base font-medium text-foreground ml-2">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Students Table */}
      <div className="bg-background rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="p-6 flex items-center justify-between border-b border-border">
          <h3 className="text-lg font-semibold">นักศึกษาที่ลงทะเบียนล่าสุด</h3>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
          </button>
        </div>
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">รหัสนักศึกษา</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">ชื่อ-สกุล</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">สาขาวิชา</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">วันที่ลงทะเบียน</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {recentStudents.map((student, index) => (
              <tr key={index} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4 text-sm font-medium">{student.id}</td>
                <td className="px-6 py-4 text-sm">{student.name}</td>
                <td className="px-6 py-4 text-sm">{student.major}</td>
                <td className="px-6 py-4 text-sm">{student.date}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${student.status === 'approved'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                    }`}>
                    {student.status === 'approved' ? 'อนุมัติแล้ว' : 'รอตรวจสอบ'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Stat Modal */}
      <Dialog open={editStatModalOpen} onOpenChange={setEditStatModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>แก้ไข{editingStat?.label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                จำนวน{editingStat?.label}
              </label>
              <input
                type="text"
                value={editStatValue}
                onChange={(e) => setEditStatValue(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setEditStatModalOpen(false)}
                className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveStat}
                className="px-4 py-2 bg-[#8B1538] text-white rounded-lg hover:bg-[#7A1230] transition-colors"
              >
                บันทึก
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>



      {/* Expand Chart Modal */}
      <Dialog open={expandChartOpen} onOpenChange={setExpandChartOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="text-[#8B1538]" size={24} />
              นักศึกษาแยกตามสาขา
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 max-h-[70vh] overflow-y-auto">
            <div className="flex justify-end mb-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 bg-[#8B1538] rounded"></div>
                <span className="text-muted-foreground">จำนวนนักศึกษา</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={Math.max(450, barChartData.length * 40)}>
              <BarChart data={barChartData} layout="vertical" margin={{ left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={250}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-border">
                          <p className="font-semibold text-foreground">{label}</p>
                          <p className="text-sm text-[#8B1538]">
                            จำนวนนักศึกษา: <span className="font-bold">{payload[0].value}</span> คน
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="#8B1538"
                  radius={[0, 4, 4, 0]}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout >
  );
};

export default AdminDashboard;
