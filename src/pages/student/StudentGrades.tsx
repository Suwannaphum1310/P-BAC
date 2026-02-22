import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Loader2, Award, BookOpen, Target, Star, Download } from 'lucide-react';
import StudentLayout from '@/components/StudentLayout';
import { exportGradesToPDF } from '@/utils/exportPDF';

interface Student {
  id: string;
  gpa: number | null;
  year: number;
  department_id: string | null;
}

interface Department {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

const StudentGrades = () => {
  const { user, profile } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock grades data - in production this would come from the database
  const mockGrades: { [key: string]: { grade: string; point: number } } = {
    'CS101': { grade: 'A', point: 4.0 },
    'CS102': { grade: 'B+', point: 3.5 },
    'MA101': { grade: 'B', point: 3.0 },
    'EN101': { grade: 'A', point: 4.0 },
    'GE101': { grade: 'B+', point: 3.5 },
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      const { data: studentData } = await supabase
        .from('students')
        .select('id, gpa, year, department_id')
        .eq('email', user.email)
        .maybeSingle();

      if (studentData) {
        setStudent(studentData);

        if (studentData.department_id) {
          const { data: deptData } = await supabase
            .from('departments')
            .select('*')
            .eq('id', studentData.department_id)
            .single();

          setDepartment(deptData);

          const { data: subjectsData } = await supabase
            .from('subjects')
            .select('*')
            .eq('department_id', studentData.department_id);

          setSubjects(subjectsData || []);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGpaColor = (gpa: number | null) => {
    if (!gpa) return 'text-muted-foreground';
    if (gpa >= 3.5) return 'text-emerald-600';
    if (gpa >= 3.0) return 'text-blue-600';
    if (gpa >= 2.5) return 'text-amber-600';
    if (gpa >= 2.0) return 'text-orange-600';
    return 'text-red-600';
  };

  const getGpaBg = (gpa: number | null) => {
    if (!gpa) return 'from-gray-400 to-gray-500';
    if (gpa >= 3.5) return 'from-emerald-400 to-emerald-600';
    if (gpa >= 3.0) return 'from-blue-400 to-blue-600';
    if (gpa >= 2.5) return 'from-amber-400 to-amber-600';
    if (gpa >= 2.0) return 'from-orange-400 to-orange-600';
    return 'from-red-400 to-red-600';
  };

  const getGpaStatus = (gpa: number | null) => {
    if (!gpa) return { text: '-', emoji: '📊' };
    if (gpa >= 3.5) return { text: 'ดีเยี่ยม', emoji: '🏆' };
    if (gpa >= 3.0) return { text: 'ดี', emoji: '⭐' };
    if (gpa >= 2.5) return { text: 'พอใช้', emoji: '👍' };
    if (gpa >= 2.0) return { text: 'ผ่าน', emoji: '✅' };
    return { text: 'ต้องปรับปรุง', emoji: '📈' };
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    if (grade.startsWith('C')) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    if (grade.startsWith('D')) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
  };

  const gpaStatus = getGpaStatus(student?.gpa);

  if (loading) {
    return (
      <StudentLayout title="ผลการเรียน">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="ผลการเรียน">
      {/* GPA Hero Card */}
      <div className={`bg-gradient-to-r ${getGpaBg(student?.gpa)} text-white rounded-2xl p-6 mb-6 shadow-lg relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            {/* GPA Circle */}
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-white flex flex-col items-center justify-center">
                  <span className={`text-3xl font-bold ${getGpaColor(student?.gpa)}`}>
                    {student?.gpa?.toFixed(2) || '-'}
                  </span>
                  <span className="text-xs text-muted-foreground">GPA</span>
                </div>
              </div>
              <div className="absolute -top-1 -right-1 text-3xl">{gpaStatus.emoji}</div>
            </div>

            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-1">{profile?.full_name || 'นักศึกษา'}</h2>
              <p className="text-white/80 text-sm">{department?.name || 'สาขาวิชา'}</p>
              <p className="text-white/60 text-xs mt-1">ชั้นปีที่ {student?.year || '-'}</p>
              <div className="mt-2 inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                {gpaStatus.text}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center">
              <Target size={20} className="mx-auto mb-1 opacity-80" />
              <p className="text-2xl font-bold">3.50</p>
              <p className="text-xs text-white/70">เป้าหมาย</p>
            </div>
            <button
              onClick={() => exportGradesToPDF('grades-content', profile?.full_name || 'นักศึกษา')}
              className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 hover:bg-white/20 transition-colors"
            >
              <Download size={20} className="mx-auto mb-1" />
              <p className="text-xs">ดาวน์โหลด PDF</p>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div id="grades-content">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-card rounded-xl p-4 shadow-sm border border-border/50 text-center hover:shadow-md hover:-translate-y-1 transition-all">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-2">
              <BookOpen size={20} className="text-white" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{subjects.length}</p>
            <p className="text-xs text-muted-foreground">วิชาทั้งหมด</p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-sm border border-border/50 text-center hover:shadow-md hover:-translate-y-1 transition-all">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Award size={20} className="text-white" />
            </div>
            <p className="text-2xl font-bold text-emerald-600">
              {Object.values(mockGrades).filter(g => g.point >= 3.5).length}
            </p>
            <p className="text-xs text-muted-foreground">เกรด A/A+</p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-sm border border-border/50 text-center hover:shadow-md hover:-translate-y-1 transition-all">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Star size={20} className="text-white" />
            </div>
            <p className="text-2xl font-bold text-amber-600">
              {((student?.gpa || 0) / 4 * 100).toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">คะแนนรวม</p>
          </div>
        </div>

        {/* GPA Progress Bar */}
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border/50 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">ความก้าวหน้า GPA</span>
            <span className="text-sm text-muted-foreground">
              {student?.gpa?.toFixed(2) || 0} / 4.00
            </span>
          </div>
          <div className="h-4 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${getGpaBg(student?.gpa)} rounded-full transition-all duration-1000 relative`}
              style={{ width: `${((student?.gpa || 0) / 4) * 100}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0.00</span>
            <span>2.00</span>
            <span>4.00</span>
          </div>
        </div>

        {/* Subjects Table */}
        <div className="bg-card rounded-xl shadow-sm border border-border/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-border/50">
            <h3 className="font-semibold flex items-center gap-2">
              <BookOpen size={18} className="text-primary" />
              รายวิชาที่ลงทะเบียน
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">รหัสวิชา</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">ชื่อวิชา</th>
                  <th className="text-center px-6 py-3 text-sm font-medium text-muted-foreground">หน่วยกิต</th>
                  <th className="text-center px-6 py-3 text-sm font-medium text-muted-foreground">เกรด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {subjects.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-muted-foreground">
                      <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
                      <p>ยังไม่มีข้อมูลรายวิชา</p>
                    </td>
                  </tr>
                ) : (
                  subjects.map((subject, idx) => {
                    const gradeInfo = mockGrades[subject.code];
                    return (
                      <tr key={subject.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                            {subject.code}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium">{subject.name}</td>
                        <td className="px-6 py-4 text-center text-muted-foreground">3</td>
                        <td className="px-6 py-4 text-center">
                          {gradeInfo ? (
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${getGradeColor(gradeInfo.grade)}`}>
                              {gradeInfo.grade}
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground">
                              รอประกาศ
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Note */}
        <p className="mt-4 text-xs text-muted-foreground text-center">
          * ผลการเรียนอาจมีการเปลี่ยนแปลงตามประกาศของสถานศึกษา
        </p>
      </div>
    </StudentLayout>
  );
};

export default StudentGrades;
