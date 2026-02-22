import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';
import { supabase } from '@/integrations/supabase/client';

interface GradeResult {
  subject: string;
  subject_code: string;
  grade_letter: string;
  grade_point: number;
  semester: number;
  academic_year: number;
  credits: number;
}

interface StudentInfo {
  full_name: string;
  student_id: string;
  department: string;
  year: number;
  gpa: number | null;
}

const Grades = () => {
  const [studentId, setStudentId] = useState('');
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [results, setResults] = useState<GradeResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setResults(null);
    setStudentInfo(null);

    try {
      // 1. Find student with department info
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, student_id, first_name, last_name, gpa, year, department_id, departments(name)')
        .eq('student_id', studentId.trim())
        .single();

      if (studentError || !student) {
        setError('ไม่พบข้อมูลนักศึกษา กรุณาตรวจสอบรหัสนักศึกษาอีกครั้ง');
        setIsLoading(false);
        return;
      }

      // 2. Fetch grades with subject details
      const { data: grades, error: gradesError } = await supabase
        .from('grades')
        .select('grade_letter, grade_point, semester, academic_year, subject_id, subjects(name, code, credits)')
        .eq('student_id', student.id)
        .order('academic_year', { ascending: false })
        .order('semester', { ascending: false });

      // Set student info (only after grades query to avoid partial display)
      const studentData: StudentInfo = {
        full_name: `${student.first_name} ${student.last_name}`,
        student_id: student.student_id,
        department: (student as any).departments?.name || 'ไม่ระบุสาขา',
        year: student.year || 1,
        gpa: student.gpa,
      };

      if (gradesError) {
        console.error('Grades error:', gradesError);
        // Still show student info even if grades fail
        setStudentInfo(studentData);
        setResults([]);
        return;
      }

      setStudentInfo(studentData);

      if (grades && grades.length > 0) {
        setResults(grades.map(g => ({
          subject: (g as any).subjects?.name || 'ไม่ระบุวิชา',
          subject_code: (g as any).subjects?.code || '-',
          grade_letter: g.grade_letter || '-',
          grade_point: g.grade_point || 0,
          semester: g.semester,
          academic_year: g.academic_year,
          credits: (g as any).subjects?.credits || 3,
        })));
      } else {
        setResults([]);
      }
    } catch (err: any) {
      console.error('Error fetching grades:', err);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล');
      setStudentInfo(null);
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Group grades by semester/year
  const groupedGrades = results?.reduce((acc, grade) => {
    const key = `${grade.academic_year}-${grade.semester}`;
    if (!acc[key]) {
      acc[key] = {
        academic_year: grade.academic_year,
        semester: grade.semester,
        grades: [],
      };
    }
    acc[key].grades.push(grade);
    return acc;
  }, {} as Record<string, { academic_year: number; semester: number; grades: GradeResult[] }>);

  const getSemesterName = (semester: number) => {
    switch (semester) {
      case 1: return 'ภาคเรียนที่ 1';
      case 2: return 'ภาคเรียนที่ 2';
      case 3: return 'ภาคฤดูร้อน';
      default: return `ภาคเรียนที่ ${semester}`;
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-600 bg-green-50';
      case 'B+': return 'text-blue-600 bg-blue-50';
      case 'B': return 'text-blue-500 bg-blue-50';
      case 'C+': return 'text-yellow-600 bg-yellow-50';
      case 'C': return 'text-yellow-500 bg-yellow-50';
      case 'D+': return 'text-orange-600 bg-orange-50';
      case 'D': return 'text-orange-500 bg-orange-50';
      case 'F': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-20 min-h-[80vh] bg-muted py-12">
        <div className="container max-w-2xl">
          {/* Search Card */}
          <div className="bg-card p-8 rounded-2xl shadow-lg text-center mb-8">
            <i className="fa-solid fa-graduation-cap text-5xl text-primary mb-5 block" />
            <h1 className="text-2xl font-bold mb-2">ตรวจสอบผลการเรียน</h1>
            <p className="text-muted-foreground mb-6">กรอกรหัสนักศึกษาเพื่อดูผลการเรียน</p>

            <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto">
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="รหัสนักศึกษา (เช่น ITBD680001)"
                required
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-center"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground py-3 rounded-full font-medium shadow-primary hover:bg-primary-dark transition-all duration-300 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-2" />
                    กำลังค้นหา...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-search mr-2" />
                    ค้นหา
                  </>
                )}
              </button>
            </form>

            {error && (
              <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg">
                <i className="fa-solid fa-circle-exclamation mr-2" />
                {error}
              </div>
            )}

            <Link to="/" className="inline-block mt-6 text-primary hover:underline">
              <i className="fa-solid fa-arrow-left mr-2" />
              กลับหน้าหลัก
            </Link>
          </div>

          {/* Student Info & Results */}
          {studentInfo && (
            <div className="space-y-6">
              {/* Student Info Card */}
              <div className="bg-card p-6 rounded-2xl shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <i className="fa-solid fa-user-graduate text-2xl text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold">{studentInfo.full_name}</h2>
                    <p className="text-muted-foreground">
                      รหัส: {studentInfo.student_id} | ชั้นปี {studentInfo.year}
                    </p>
                    <p className="text-sm text-muted-foreground">{studentInfo.department}</p>
                  </div>
                  {studentInfo.gpa !== null && (
                    <div className="text-center px-6 py-3 bg-primary text-primary-foreground rounded-xl">
                      <p className="text-xs opacity-80">GPA</p>
                      <p className="text-2xl font-bold">{studentInfo.gpa.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Grades */}
              {results && results.length > 0 ? (
                <>
                  {Object.values(groupedGrades || {}).map((group) => (
                    <div key={`${group.academic_year}-${group.semester}`} className="bg-card rounded-2xl shadow-lg overflow-hidden">
                      <div className="bg-primary/5 px-6 py-3 border-b">
                        <h3 className="font-semibold">
                          {getSemesterName(group.semester)} / ปีการศึกษา {group.academic_year}
                        </h3>
                      </div>
                      <div className="divide-y">
                        {group.grades.map((grade, index) => (
                          <div key={index} className="flex items-center justify-between px-6 py-4 hover:bg-muted/50">
                            <div className="flex-1">
                              <p className="font-medium">{grade.subject}</p>
                              <p className="text-sm text-muted-foreground">
                                {grade.subject_code} • {grade.credits} หน่วยกิต
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className={`px-4 py-2 rounded-lg font-bold ${getGradeColor(grade.grade_letter)}`}>
                                {grade.grade_letter}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              ) : results && results.length === 0 ? (
                <div className="bg-card p-8 rounded-2xl shadow-lg text-center">
                  <i className="fa-solid fa-inbox text-4xl text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">ยังไม่มีข้อมูลผลการเรียน</p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
};

export default Grades;
