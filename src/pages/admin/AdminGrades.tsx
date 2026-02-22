import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { GraduationCap, Search, Star, Plus, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Student {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  department_id: string | null;
  department_name: string;
  gpa: number | null;
  year: number;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  department_id: string | null;
}

interface GradeEntry {
  subject_id: string;
  subject_name: string;
  subject_code: string;
  credits: number;
  grade_letter: string;
  grade_point: number;
}

const gradeOptions = ['A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'];
const gradePoints: Record<string, number> = {
  'A': 4.0, 'B+': 3.5, 'B': 3.0, 'C+': 2.5, 'C': 2.0, 'D+': 1.5, 'D': 1.0, 'F': 0
};

const AdminGrades = () => {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);

  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [gradeEntries, setGradeEntries] = useState<GradeEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear() + 543);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch departments
      const { data: deptData } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');
      if (deptData) setDepartments(deptData);

      // Fetch students with department
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id, student_id, first_name, last_name, department_id, gpa, year, departments(name)')
        .order('student_id');

      if (studentError) throw studentError;

      if (studentData) {
        setStudents(studentData.map(s => ({
          id: s.id,
          student_id: s.student_id,
          first_name: s.first_name,
          last_name: s.last_name,
          department_id: s.department_id,
          department_name: (s as any).departments?.name || 'ไม่ระบุ',
          gpa: s.gpa,
          year: s.year || 1,
        })));
      }

      // Fetch subjects
      const { data: subjectData, error: subjectError } = await supabase
        .from('subjects')
        .select('id, name, code, department_id')
        .order('code');
      if (subjectError) {
        console.error('Error fetching subjects:', subjectError);
      }
      if (subjectData) setSubjects(subjectData);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลได้',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getGpaColor = (gpa: number | null) => {
    if (gpa === null) return 'text-gray-400';
    if (gpa >= 3.5) return 'text-green-600';
    if (gpa >= 3.0) return 'text-blue-600';
    if (gpa >= 2.5) return 'text-amber-600';
    return 'text-red-600';
  };

  const handleGiveGrade = async (student: Student) => {
    setSelectedStudent(student);

    // Fetch existing grades for this student in selected semester
    const { data: existingGrades } = await supabase
      .from('grades')
      .select('*, subjects(name, code, credits)')
      .eq('student_id', student.id)
      .eq('semester', selectedSemester)
      .eq('academic_year', selectedYear);

    // Initialize grade entries from subjects
    const entries: GradeEntry[] = subjects.map(s => {
      const existing = existingGrades?.find(g => g.subject_id === s.id);
      return {
        subject_id: s.id,
        subject_name: s.name,
        subject_code: s.code,
        credits: 3, // Default credits
        grade_letter: existing?.grade_letter || '',
        grade_point: existing?.grade_point || 0,
      };
    });

    setGradeEntries(entries);
    setGradeModalOpen(true);
  };

  const handleGradeChange = (subjectId: string, grade: string) => {
    setGradeEntries(prev => prev.map(e =>
      e.subject_id === subjectId
        ? { ...e, grade_letter: grade, grade_point: gradePoints[grade] || 0 }
        : e
    ));
  };

  const calculateGpa = () => {
    const gradedEntries = gradeEntries.filter(e => e.grade_letter);
    if (gradedEntries.length === 0) return 0;

    const totalCredits = gradedEntries.reduce((sum, e) => sum + e.credits, 0);
    const totalPoints = gradedEntries.reduce((sum, e) => sum + (e.grade_point * e.credits), 0);

    return totalCredits > 0 ? totalPoints / totalCredits : 0;
  };

  const handleSaveGrades = async () => {
    if (!selectedStudent) return;
    setSaving(true);

    try {
      const gradedEntries = gradeEntries.filter(e => e.grade_letter);

      if (gradedEntries.length === 0) {
        toast({
          title: 'ไม่มีเกรดที่จะบันทึก',
          description: 'กรุณาเลือกเกรดอย่างน้อย 1 วิชา',
          variant: 'destructive',
        });
        setSaving(false);
        return;
      }

      for (const entry of gradedEntries) {
        // Check if grade exists
        const { data: existing, error: checkError } = await supabase
          .from('grades')
          .select('id')
          .eq('student_id', selectedStudent.id)
          .eq('subject_id', entry.subject_id)
          .eq('semester', selectedSemester)
          .eq('academic_year', selectedYear)
          .maybeSingle();

        if (checkError) {
          console.error('Error checking existing grade:', checkError);
        }

        if (existing) {
          // Update
          const { error: updateError } = await supabase
            .from('grades')
            .update({
              grade_letter: entry.grade_letter,
              grade_point: entry.grade_point,
            })
            .eq('id', existing.id);

          if (updateError) {
            console.error('Error updating grade:', updateError);
            throw updateError;
          }
        } else {
          // Insert
          const { error: insertError } = await (supabase as any)
            .from('grades')
            .insert({
              student_id: selectedStudent.id,
              subject_id: entry.subject_id,
              semester: selectedSemester,
              academic_year: selectedYear,
              grade_letter: entry.grade_letter,
              grade_point: entry.grade_point,
            });

          if (insertError) {
            console.error('Error inserting grade:', insertError);
            throw insertError;
          }
        }
      }

      // Calculate and update student GPA from all saved grades
      const { data: allGrades, error: gradesError } = await supabase
        .from('grades')
        .select('grade_point')
        .eq('student_id', selectedStudent.id);

      if (gradesError) {
        console.error('Error fetching all grades:', gradesError);
      }

      if (allGrades && allGrades.length > 0) {
        const credits = 3; // Default credits per subject
        const totalCredits = allGrades.length * credits;
        const totalPoints = allGrades.reduce((sum, g) => sum + (g.grade_point || 0) * credits, 0);
        const newGpa = totalCredits > 0 ? totalPoints / totalCredits : 0;

        const { error: updateGpaError } = await supabase
          .from('students')
          .update({ gpa: parseFloat(newGpa.toFixed(2)) })
          .eq('id', selectedStudent.id);

        if (updateGpaError) {
          console.error('Error updating GPA:', updateGpaError);
          throw updateGpaError;
        }
      }

      toast({
        title: 'บันทึกเกรดสำเร็จ',
        description: `บันทึกเกรดของ ${selectedStudent.first_name} ${selectedStudent.last_name} เรียบร้อยแล้ว`,
      });

      setGradeModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error saving grades:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถบันทึกเกรดได้',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Filter students
  const filteredStudents = students.filter(s => {
    const matchesSearch =
      s.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = !filterDepartment || s.department_id === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  // Calculate statistics
  const stats = {
    totalStudents: students.length,
    studentsWithGpa: students.filter(s => s.gpa !== null && s.gpa > 0).length,
    averageGpa: students.filter(s => s.gpa !== null && s.gpa > 0).length > 0
      ? students.filter(s => s.gpa !== null && s.gpa > 0).reduce((acc, s) => acc + (s.gpa || 0), 0) / students.filter(s => s.gpa !== null && s.gpa > 0).length
      : 0,
    excellentStudents: students.filter(s => s.gpa !== null && s.gpa >= 3.5).length,
    byYear: {
      year1: students.filter(s => s.year === 1).length,
      year2: students.filter(s => s.year === 2).length,
      year3: students.filter(s => s.year === 3).length,
      year4: students.filter(s => s.year === 4).length,
    }
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <GraduationCap className="text-primary" size={28} />
          <div>
            <h1 className="text-2xl font-semibold text-foreground">จัดการผลการเรียน</h1>
            <p className="text-sm text-muted-foreground">ให้เกรดและดูผลการเรียนของนักศึกษา</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards - Prominent */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-5 rounded-xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-users text-xl" />
            </div>
            <div>
              <p className="text-sm opacity-80">นักศึกษาทั้งหมด</p>
              <p className="text-3xl font-bold">{stats.totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-5 rounded-xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-chart-line text-xl" />
            </div>
            <div>
              <p className="text-sm opacity-80">เกรดเฉลี่ยรวม</p>
              <p className="text-3xl font-bold">{stats.averageGpa.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-500 text-white p-5 rounded-xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm opacity-80">เกียรตินิยม (≥3.5)</p>
              <p className="text-3xl font-bold">{stats.excellentStudents}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-5 rounded-xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-graduation-cap text-xl" />
            </div>
            <div>
              <p className="text-sm opacity-80">มีข้อมูล GPA</p>
              <p className="text-3xl font-bold">{stats.studentsWithGpa}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Year distribution */}
      <div className="bg-card p-4 rounded-xl border border-border mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-sm text-muted-foreground">จำนวนนักศึกษา:</span>
            <div className="flex gap-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">ปี1: {stats.byYear.year1}</span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">ปี2: {stats.byYear.year2}</span>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">ปี3: {stats.byYear.year3}</span>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">ปี4: {stats.byYear.year4}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Semester Selection */}
      <div className="bg-card p-4 rounded-xl border border-border mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <span className="font-medium">ภาคเรียน:</span>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
            className="px-4 py-2 border border-border rounded-lg bg-background"
          >
            <option value={1}>ภาคเรียนที่ 1</option>
            <option value={2}>ภาคเรียนที่ 2</option>
            <option value={3}>ภาคฤดูร้อน</option>
          </select>
          <span className="font-medium">ปีการศึกษา:</span>
          <input
            type="number"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="w-24 px-4 py-2 border border-border rounded-lg bg-background"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="ค้นหารหัสนักศึกษา หรือชื่อ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
          />
        </div>
        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          className="px-4 py-2.5 border border-border rounded-lg bg-background"
        >
          <option value="">ทุกสาขา</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="text-left px-4 py-3 text-sm font-medium">รหัสนักศึกษา</th>
                <th className="text-left px-4 py-3 text-sm font-medium">ชื่อ-นามสกุล</th>
                <th className="text-left px-4 py-3 text-sm font-medium">สาขาวิชา</th>
                <th className="text-center px-4 py-3 text-sm font-medium">ชั้นปี</th>
                <th className="text-center px-4 py-3 text-sm font-medium">GPA</th>
                <th className="text-center px-4 py-3 text-sm font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    ไม่พบนักศึกษา
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-sm">{student.student_id}</td>
                    <td className="px-4 py-3 font-medium">{student.first_name} {student.last_name}</td>
                    <td className="px-4 py-3 text-sm">{student.department_name}</td>
                    <td className="px-4 py-3 text-center text-sm">ปี {student.year}</td>
                    <td className={`px-4 py-3 text-center font-bold text-lg ${getGpaColor(student.gpa)}`}>
                      {student.gpa !== null ? student.gpa.toFixed(2) : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleGiveGrade(student)}
                        className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        <Star size={16} />
                        ให้เกรด
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grade Modal */}
      <Dialog open={gradeModalOpen} onOpenChange={setGradeModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="text-primary" size={20} />
              ให้เกรด: {selectedStudent?.first_name} {selectedStudent?.last_name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {/* Student Info */}
            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">รหัสนักศึกษา:</span>
                  <span className="ml-2 font-medium">{selectedStudent?.student_id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">สาขาวิชา:</span>
                  <span className="ml-2 font-medium">{selectedStudent?.department_name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">ภาคเรียน:</span>
                  <span className="ml-2 font-medium">{selectedSemester}/{selectedYear}</span>
                </div>
              </div>
            </div>

            {/* Subjects Table */}
            {subjects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>ยังไม่มีวิชาในระบบ</p>
                <p className="text-sm">กรุณาเพิ่มวิชาในหน้า "จัดการวิชา" ก่อน</p>
              </div>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden mb-6">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium">รหัสวิชา</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">ชื่อวิชา</th>
                      <th className="text-center px-4 py-3 text-sm font-medium">หน่วยกิต</th>
                      <th className="text-center px-4 py-3 text-sm font-medium">เกรด</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gradeEntries.map((entry) => (
                      <tr key={entry.subject_id} className="border-t border-border">
                        <td className="px-4 py-3 text-sm font-mono">{entry.subject_code}</td>
                        <td className="px-4 py-3 text-sm">{entry.subject_name}</td>
                        <td className="px-4 py-3 text-sm text-center">{entry.credits}</td>
                        <td className="px-4 py-3">
                          <select
                            value={entry.grade_letter}
                            onChange={(e) => handleGradeChange(entry.subject_id, e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-center bg-background"
                          >
                            <option value="">-</option>
                            {gradeOptions.map(g => (
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Calculated GPA */}
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">GPA ภาคเรียนนี้:</span>
                <span className="text-2xl font-bold text-primary">
                  {calculateGpa().toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setGradeModalOpen(false)}
                className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveGrades}
                disabled={saving || subjects.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    กำลังบันทึก...
                  </>
                ) : (
                  'บันทึกเกรด'
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminGrades;
