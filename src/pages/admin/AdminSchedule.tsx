import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Calendar, Wrench, Cpu, Monitor, HeartPulse, Info, Loader2, FileDown, GraduationCap, Award, ChevronDown, Search, BookOpen } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { usePdfExport } from '@/hooks/usePdfExport';
import { useExcelExport } from '@/hooks/useExcelExport';

interface ScheduleItem {
  subject: string;
  teacher: string;
  room: string;
  colspan?: number;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

interface Subject {
  id: string;
  code: string;
  name: string;
}

type DaySchedule = (ScheduleItem | null)[];
type ScheduleData = Record<string, Record<string, DaySchedule>>;

const AdminSchedule = () => {
  const { toast } = useToast();
  const { exportScheduleToPdf } = usePdfExport();
  const { exportScheduleToExcel } = useExcelExport();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCell, setEditingCell] = useState<{ day: string; period: number } | null>(null);
  const [formData, setFormData] = useState({ subject: '', teacher: '', room: '', colspan: 1 });
  const [scheduleData, setScheduleData] = useState<ScheduleData>({});
  const [loading, setLoading] = useState(true);
  const [expandedLevel, setExpandedLevel] = useState<'pvc' | 'hvs' | null>('pvc');

  // Subject search states
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);

  const days = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์'];

  const timeSlots = [
    { period: 1, time: '08:10 - 08:40' },
    { period: 2, time: '08:40 - 09:30' },
    { period: 3, time: '09:30 - 10:20' },
    { period: 4, time: '10:20 - 11:10' },
    { period: 5, time: '11:10 - 12:00' },
    { period: 'lunch', time: '12:00 - 12:50' },
    { period: 6, time: '12:50 - 13:40' },
    { period: 7, time: '13:40 - 14:30' },
    { period: 8, time: '14:30 - 15:20' },
  ];

  const getDeptIcon = (code: string) => {
    switch (code) {
      case 'automotive': return Wrench;
      case 'electronics': return Cpu;
      case 'digital': return Monitor;
      case 'healthcare': return HeartPulse;
      default: return Wrench;
    }
  };

  // Fetch subjects
  const fetchSubjects = async () => {
    const { data } = await supabase.from('subjects').select('id, code, name').order('name');
    if (data) setSubjects(data);
  };

  // Filtered subjects based on search
  const filteredSubjects = subjects.filter(s =>
    s.name.toLowerCase().includes(subjectSearch.toLowerCase()) ||
    s.code.toLowerCase().includes(subjectSearch.toLowerCase())
  );


  // Fetch departments and schedule entries
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch departments
        const { data: deptData, error: deptError } = await supabase
          .from('departments')
          .select('*')
          .order('name');

        if (deptError) throw deptError;

        if (deptData && deptData.length > 0) {
          setDepartments(deptData);
          setSelectedDeptId(deptData[0].id);

          // Initialize empty schedule for all departments
          const initialSchedule: ScheduleData = {};
          deptData.forEach(dept => {
            initialSchedule[dept.id] = {};
            days.forEach(day => {
              initialSchedule[dept.id][day] = Array(9).fill(null);
            });
          });

          // Fetch schedule entries
          const { data: scheduleEntries, error: scheduleError } = await supabase
            .from('schedule_entries')
            .select('*');

          if (scheduleError) throw scheduleError;

          // Populate schedule data
          if (scheduleEntries) {
            scheduleEntries.forEach(entry => {
              if (initialSchedule[entry.department_id] && initialSchedule[entry.department_id][entry.day_of_week]) {
                const periodIndex = entry.period_start - 1;
                if (periodIndex >= 0 && periodIndex < 9) {
                  initialSchedule[entry.department_id][entry.day_of_week][periodIndex] = {
                    subject: entry.subject_name || '',
                    teacher: entry.teacher_name || '',
                    room: entry.room_name || '',
                    colspan: entry.period_span || 1,
                  };
                }
              }
            });
          }

          setScheduleData(initialSchedule);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถโหลดข้อมูลได้",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCellClick = (day: string, periodIndex: number) => {
    const daySchedule = scheduleData[selectedDeptId]?.[day] || Array(9).fill(null);

    const currentData = daySchedule[periodIndex];
    setEditingCell({ day, period: periodIndex });
    setFormData({
      subject: currentData?.subject || '',
      teacher: currentData?.teacher || '',
      room: currentData?.room || '',
      colspan: currentData?.colspan || 1,
    });
    setSubjectSearch(currentData?.subject || '');
    setShowSubjectDropdown(false);
    fetchSubjects();
    setEditModalOpen(true);
  };

  const handleSaveSchedule = async () => {
    if (!editingCell) return;

    try {
      // First, delete any existing entry for this cell
      const { error: deleteError } = await supabase
        .from('schedule_entries')
        .delete()
        .eq('department_id', selectedDeptId)
        .eq('day_of_week', editingCell.day)
        .eq('period_start', editingCell.period + 1);

      if (deleteError) throw deleteError;

      // Insert new entry if there's a subject
      if (formData.subject) {
        const { error: insertError } = await supabase
          .from('schedule_entries')
          .insert({
            department_id: selectedDeptId,
            day_of_week: editingCell.day,
            period_start: editingCell.period + 1,
            period_span: formData.colspan,
            subject_name: formData.subject,
            teacher_name: formData.teacher,
            room_name: formData.room,
          });

        if (insertError) throw insertError;
      }

      // Update local state
      setScheduleData(prev => {
        const newDaySchedule = [...(prev[selectedDeptId]?.[editingCell.day] || Array(9).fill(null))];

        // Clear previous colspan cells
        const oldData = newDaySchedule[editingCell.period];
        if (oldData?.colspan && oldData.colspan > 1) {
          for (let i = 1; i < oldData.colspan; i++) {
            if (editingCell.period + i < newDaySchedule.length) {
              newDaySchedule[editingCell.period + i] = null;
            }
          }
        }

        // Set new data
        if (formData.subject) {
          newDaySchedule[editingCell.period] = {
            subject: formData.subject,
            teacher: formData.teacher,
            room: formData.room,
            colspan: formData.colspan,
          };
          // Mark colspan cells as null (to be skipped)
          for (let i = 1; i < formData.colspan; i++) {
            if (editingCell.period + i < newDaySchedule.length) {
              newDaySchedule[editingCell.period + i] = null;
            }
          }
        } else {
          newDaySchedule[editingCell.period] = null;
        }

        return {
          ...prev,
          [selectedDeptId]: {
            ...prev[selectedDeptId],
            [editingCell.day]: newDaySchedule,
          },
        };
      });

      setEditModalOpen(false);
      toast({
        title: "บันทึกสำเร็จ",
        description: `อัปเดตตารางเรียนวัน${editingCell.day} คาบที่ ${editingCell.period + 1} เรียบร้อยแล้ว`,
      });
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลได้",
        variant: "destructive",
      });
    }
  };

  const handleClearSchedule = async () => {
    if (!editingCell) return;

    try {
      const { error } = await supabase
        .from('schedule_entries')
        .delete()
        .eq('department_id', selectedDeptId)
        .eq('day_of_week', editingCell.day)
        .eq('period_start', editingCell.period + 1);

      if (error) throw error;

      // Update local state
      setScheduleData(prev => {
        const newDaySchedule = [...(prev[selectedDeptId]?.[editingCell.day] || Array(9).fill(null))];

        // Clear colspan cells too
        const oldData = newDaySchedule[editingCell.period];
        if (oldData?.colspan && oldData.colspan > 1) {
          for (let i = 1; i < oldData.colspan; i++) {
            if (editingCell.period + i < newDaySchedule.length) {
              newDaySchedule[editingCell.period + i] = null;
            }
          }
        }

        newDaySchedule[editingCell.period] = null;

        return {
          ...prev,
          [selectedDeptId]: {
            ...prev[selectedDeptId],
            [editingCell.day]: newDaySchedule,
          },
        };
      });

      setEditModalOpen(false);
      toast({
        title: "ลบข้อมูลสำเร็จ",
        description: `ลบรายวิชาออกจากตารางเรียบร้อยแล้ว`,
      });
    } catch (error) {
      console.error('Error clearing schedule:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบข้อมูลได้",
        variant: "destructive",
      });
    }
  };

  // Helper function to check if a cell should be skipped due to colspan
  const shouldSkipCell = (day: string, periodIndex: number): boolean => {
    const daySchedule = scheduleData[selectedDeptId]?.[day];
    if (!daySchedule) return false;

    for (let i = 0; i < periodIndex; i++) {
      const item = daySchedule[i];
      if (item?.colspan && item.colspan > 1) {
        if (i + item.colspan > periodIndex) {
          return true;
        }
      }
    }
    return false;
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="text-primary" size={28} />
          <h1 className="text-2xl font-semibold text-foreground">ตารางเรียน</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => {
              const deptName = departments.find(d => d.id === selectedDeptId)?.name || 'Unknown';
              exportScheduleToPdf(
                scheduleData[selectedDeptId] || {},
                deptName,
                days,
                timeSlots
              );
              toast({ title: "Export สำเร็จ", description: "ดาวน์โหลดไฟล์ PDF เรียบร้อย" });
            }}
            className="gap-2"
          >
            <FileDown size={18} />
            Export PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const deptName = departments.find(d => d.id === selectedDeptId)?.name || 'Unknown';
              exportScheduleToExcel(
                scheduleData[selectedDeptId] || {},
                deptName,
                days,
                timeSlots
              );
              toast({ title: "Export สำเร็จ", description: "ดาวน์โหลดไฟล์ Excel เรียบร้อย" });
            }}
            className="gap-2"
          >
            <FileDown size={18} />
            Export Excel
          </Button>
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info size={16} />
            คลิกวิชาเพื่อแก้ไข
          </span>
        </div>
      </div>

      {/* Department Selection with ปวช./ปวส. Accordion */}
      <div className="mb-6 space-y-3">
        {/* ปวช. Section */}
        <div className="bg-background rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setExpandedLevel(expandedLevel === 'pvc' ? null : 'pvc')}
            className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary/10 to-transparent hover:from-primary/20 transition-all"
          >
            <div className="flex items-center gap-2">
              <GraduationCap className="text-primary" size={20} />
              <span className="font-semibold text-foreground">ปวช. (ประกาศนียบัตรวิชาชีพ)</span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {departments.filter(d => !d.code.includes('-HV')).length} สาขา
              </span>
            </div>
            <ChevronDown
              className={`text-muted-foreground transition-transform ${expandedLevel === 'pvc' ? 'rotate-180' : ''}`}
              size={20}
            />
          </button>
          {expandedLevel === 'pvc' && (
            <div className="px-4 py-3 border-t border-border bg-muted/30 flex gap-2 flex-wrap">
              {departments.filter(d => !d.code.includes('-HV')).map((dept) => (
                <button
                  key={dept.id}
                  onClick={() => setSelectedDeptId(dept.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedDeptId === dept.id
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-background border border-border text-foreground hover:bg-primary/10 hover:border-primary/30'
                    }`}
                >
                  {dept.name.replace('สาขาวิชา', '')}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ปวส. Section */}
        <div className="bg-background rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setExpandedLevel(expandedLevel === 'hvs' ? null : 'hvs')}
            className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-500/10 to-transparent hover:from-amber-500/20 transition-all"
          >
            <div className="flex items-center gap-2">
              <Award className="text-amber-600" size={20} />
              <span className="font-semibold text-foreground">ปวส. (ประกาศนียบัตรวิชาชีพชั้นสูง)</span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {departments.filter(d => d.code.includes('-HV')).length} สาขา
              </span>
            </div>
            <ChevronDown
              className={`text-muted-foreground transition-transform ${expandedLevel === 'hvs' ? 'rotate-180' : ''}`}
              size={20}
            />
          </button>
          {expandedLevel === 'hvs' && (
            <div className="px-4 py-3 border-t border-border bg-muted/30 flex gap-2 flex-wrap">
              {departments.filter(d => d.code.includes('-HV')).map((dept) => (
                <button
                  key={dept.id}
                  onClick={() => setSelectedDeptId(dept.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedDeptId === dept.id
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'bg-background border border-border text-foreground hover:bg-amber-500/10 hover:border-amber-500/30'
                    }`}
                >
                  {dept.name.replace('สาขาวิชา', '').replace(' (ปวส.)', '')}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Title */}
      <div className="flex items-center gap-2 mb-4">
        {departments.find(d => d.id === selectedDeptId)?.code.includes('-HV') ? (
          <Award className="text-amber-600" size={20} />
        ) : (
          <GraduationCap className="text-primary" size={20} />
        )}
        <h2 className="text-lg font-medium text-primary">
          ตารางเรียน {departments.find(d => d.id === selectedDeptId)?.name || 'เลือกสาขา'}
        </h2>
      </div>

      {/* Schedule Table - Traditional Style */}
      <div className="bg-background rounded-xl shadow-sm border border-border overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[1200px] border-collapse">
          {/* Header Row 1: Time */}
          <thead>
            <tr className="border-b border-border">
              <th className="text-center px-2 py-2 text-xs font-medium bg-muted border-r border-border w-20">เวลา</th>
              {timeSlots.map((slot, idx) => (
                <th
                  key={idx}
                  className={`text-center px-1 py-2 text-xs font-medium border-r border-border ${slot.period === 'lunch' ? 'bg-muted/50 w-24' : 'bg-muted w-28'
                    }`}
                >
                  {slot.time}
                </th>
              ))}
            </tr>
            {/* Header Row 2: Period Numbers */}
            <tr className="border-b border-border">
              <th className="text-center px-2 py-2 text-xs font-medium bg-muted border-r border-border">วัน / คาบ</th>
              {timeSlots.map((slot, idx) => (
                <th
                  key={idx}
                  className={`text-center px-2 py-2 text-sm font-semibold border-r border-border ${slot.period === 'lunch' ? 'bg-muted/50' : 'bg-muted'
                    }`}
                >
                  {slot.period === 'lunch' ? '' : slot.period}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day) => {
              const daySchedule = scheduleData[selectedDeptId]?.[day] || Array(9).fill(null);
              let periodIdx = 0;

              return (
                <tr key={day} className="border-b border-border last:border-0">
                  <td className="px-3 py-4 text-sm font-semibold bg-muted/30 border-r border-border text-center whitespace-nowrap">
                    {day}
                  </td>
                  {timeSlots.map((slot, slotIdx) => {
                    // Lunch break column
                    if (slot.period === 'lunch') {
                      return (
                        <td
                          key={slotIdx}
                          className="text-center py-4 bg-muted/20 border-r border-border"
                          rowSpan={1}
                        >
                          <span className="text-xs text-muted-foreground font-medium writing-vertical">
                            พักกลางวัน
                          </span>
                        </td>
                      );
                    }

                    // Map slot period to array index (1-5 → 0-4, 6-9 → 5-8)
                    const arrayIndex = typeof slot.period === 'number'
                      ? (slot.period <= 5 ? slot.period - 1 : slot.period - 2)
                      : -1;

                    if (arrayIndex === -1) return null;

                    // Check if this cell should be skipped
                    if (shouldSkipCell(day, arrayIndex)) {
                      return null;
                    }

                    const item = daySchedule[arrayIndex];
                    const colspan = item?.colspan || 1;

                    return (
                      <td
                        key={slotIdx}
                        colSpan={colspan}
                        onClick={() => handleCellClick(day, arrayIndex)}
                        className="px-2 py-2 text-center hover:bg-blue-50 transition-colors cursor-pointer border-r border-border align-top min-h-[80px]"
                      >
                        {item ? (
                          <div className="group min-h-[60px] flex flex-col justify-center">
                            <p className="text-sm font-medium text-foreground group-hover:text-blue-600 transition-colors leading-tight">
                              {item.subject}
                            </p>
                            {item.teacher && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {item.teacher} {item.room && `( ${item.room} )`}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="min-h-[60px] flex items-center justify-center">
                            <span className="text-xs text-muted-foreground/40">-</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span>* คลิกที่ช่องเพื่อแก้ไขตารางเรียน</span>
        <span>* สามารถกำหนดคาบที่ต่อเนื่องกันได้</span>
      </div>

      {/* Edit Schedule Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              แก้ไขตารางเรียน - วัน{editingCell?.day} คาบที่ {editingCell ? editingCell.period + 1 : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-6 py-4">
            {/* Left Column - Form */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">ชื่อวิชา</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                  <input
                    type="text"
                    value={subjectSearch}
                    onChange={(e) => {
                      setSubjectSearch(e.target.value);
                      setFormData({ ...formData, subject: e.target.value });
                      setShowSubjectDropdown(e.target.value.length > 0);
                    }}
                    onBlur={() => setTimeout(() => setShowSubjectDropdown(false), 200)}
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                    placeholder="ค้นหาหรือพิมพ์ชื่อวิชา..."
                  />
                </div>
                {formData.subject && (
                  <p className="text-xs text-green-600 mt-1">✓ วิชาที่เลือก: {formData.subject}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">ชื่อครูผู้สอน</label>
                <input
                  type="text"
                  value={formData.teacher}
                  onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                  placeholder="เช่น ครูสมชาย"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">ห้องเรียน</label>
                <input
                  type="text"
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                  placeholder="เช่น ห้อง 101"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">จำนวนคาบต่อเนื่อง</label>
                <select
                  value={formData.colspan}
                  onChange={(e) => setFormData({ ...formData, colspan: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                >
                  {[1, 2, 3, 4].map(n => (
                    <option key={n} value={n}>{n} คาบ</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right Column - Subject Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">รายการวิชา</label>
              <div className="bg-muted/30 border border-border rounded-lg p-3 h-[280px] overflow-y-auto">
                {(subjectSearch.length > 0 ? filteredSubjects : subjects).length > 0 ? (
                  (subjectSearch.length > 0 ? filteredSubjects : subjects).map((subject) => (
                    <button
                      key={subject.id}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, subject: subject.name });
                        setSubjectSearch(subject.name);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-primary/10 rounded-md transition-colors flex items-center gap-2 mb-1"
                    >
                      <BookOpen size={14} className="text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <span className="text-sm font-medium block truncate">{subject.name}</span>
                        <span className="text-xs text-muted-foreground">({subject.code})</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {subjectSearch.length > 0 ? 'ไม่พบวิชาที่ค้นหา' : 'ยังไม่มีรายวิชาในระบบ'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex gap-3 justify-between pt-2 border-t border-border">
            <button
              onClick={handleClearSchedule}
              className="px-4 py-2 text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/10 transition-colors"
            >
              ลบรายวิชา
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveSchedule}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-colors"
              >
                บันทึก
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminSchedule;
