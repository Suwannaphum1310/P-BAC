import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  course: string;
  year: number;
  gpa: number;
  status: 'active' | 'inactive';
}

const StudentInfo = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const students: Student[] = [
    { id: '65001', name: 'สมชาย ใจดี', course: 'ช่างยนต์', year: 2, gpa: 3.45, status: 'active' },
    { id: '65002', name: 'สมหญิง แสนสวย', course: 'เทคโนโลยีธุรกิจดิจิทัล', year: 1, gpa: 3.82, status: 'active' },
    { id: '65003', name: 'วิชัย เก่งมาก', course: 'อิเล็กทรอนิกส์', year: 2, gpa: 2.95, status: 'active' },
    { id: '64001', name: 'นภา สดใส', course: 'การจัดการงานบริการสถานพยาบาล', year: 3, gpa: 3.12, status: 'active' },
    { id: '64002', name: 'ประสิทธิ์ ขยัน', course: 'ช่างยนต์', year: 3, gpa: 3.67, status: 'inactive' },
  ];

  const filteredStudents = students.filter(
    (s) =>
      s.name.includes(searchTerm) ||
      s.id.includes(searchTerm) ||
      s.course.includes(searchTerm)
  );

  return (
    <DashboardLayout title="ข้อมูลนักศึกษา">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <input
            type="text"
            placeholder="ค้นหานักศึกษา..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors">
          <Plus size={20} />
          เพิ่มนักศึกษา
        </button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">รหัสนักศึกษา</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">ชื่อ-นามสกุล</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">สาขา</th>
                <th className="px-6 py-4 text-center text-sm font-semibold">ชั้นปี</th>
                <th className="px-6 py-4 text-center text-sm font-semibold">GPA</th>
                <th className="px-6 py-4 text-center text-sm font-semibold">สถานะ</th>
                <th className="px-6 py-4 text-center text-sm font-semibold">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id} className="border-t border-border hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-mono">{student.id}</td>
                  <td className="px-6 py-4">{student.name}</td>
                  <td className="px-6 py-4">{student.course}</td>
                  <td className="px-6 py-4 text-center">ปี {student.year}</td>
                  <td className="px-6 py-4 text-center font-semibold">{student.gpa.toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        student.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {student.status === 'active' ? 'กำลังศึกษา' : 'พักการเรียน'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit size={18} />
                      </button>
                      <button className="p-2 text-destructive hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            ไม่พบข้อมูลนักศึกษา
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentInfo;
