import * as XLSX from 'xlsx';

interface ExportOptions {
  sheetName?: string;
  filename: string;
}

interface TableColumn {
  header: string;
  key: string;
}

export const useExcelExport = () => {
  const exportTableToExcel = (
    data: Record<string, any>[],
    columns: TableColumn[],
    options: ExportOptions
  ) => {
    // Create worksheet data with headers
    const headers = columns.map(col => col.header);
    const rows = data.map(item =>
      columns.map(col => {
        const value = item[col.key];
        if (value === null || value === undefined) return '-';
        return value;
      })
    );

    const worksheetData = [headers, ...rows];

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Auto-size columns
    const colWidths = columns.map((col, index) => {
      const maxLength = Math.max(
        col.header.length,
        ...rows.map(row => String(row[index]).length)
      );
      return { wch: Math.min(maxLength + 2, 50) };
    });
    worksheet['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName || 'Sheet1');

    // Save the file
    XLSX.writeFile(workbook, `${options.filename}.xlsx`);
  };

  const exportScheduleToExcel = (
    scheduleData: Record<string, (any | null)[]>,
    departmentName: string,
    days: string[],
    timeSlots: { period: number | string; time: string }[]
  ) => {
    const numericTimeSlots = timeSlots.filter(slot => typeof slot.period === 'number');
    
    // Create headers
    const headers = ['วัน', ...numericTimeSlots.map(slot => `คาบ ${slot.period}`)];
    
    // Create rows
    const rows = days.map(day => {
      const daySchedule = scheduleData[day] || [];
      const row: (string | number)[] = [day];
      
      numericTimeSlots.forEach((slot) => {
        const arrayIndex = typeof slot.period === 'number' 
          ? (slot.period <= 5 ? slot.period - 1 : slot.period - 2)
          : -1;
        
        if (arrayIndex >= 0 && daySchedule[arrayIndex]) {
          const item = daySchedule[arrayIndex];
          row.push(item.subject || '-');
        } else {
          row.push('-');
        }
      });
      
      return row;
    });

    const worksheetData = [headers, ...rows];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Auto-size columns
    worksheet['!cols'] = headers.map(() => ({ wch: 15 }));

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Schedule');
    XLSX.writeFile(workbook, `schedule_${departmentName.replace(/\s+/g, '_')}.xlsx`);
  };

  const exportAttendanceToExcel = (
    students: any[],
    attendance: Map<string, any>,
    subject: string,
    date: string,
    departmentName: string
  ) => {
    // Create headers
    const headers = ['ลำดับ', 'รหัสนักศึกษา', 'ชื่อ-นามสกุล', 'สถานะ', 'หมายเหตุ'];
    
    // Create rows
    const rows = students.map((student, index) => {
      const record = attendance.get(student.id);
      let status = 'ไม่ได้เช็ค';
      switch (record?.status) {
        case 'present': status = 'มาเรียน'; break;
        case 'late': status = 'มาสาย'; break;
        case 'absent': status = 'ขาดเรียน'; break;
        case 'excused': status = 'ลา'; break;
      }
      return [
        index + 1,
        student.student_id,
        `${student.first_name} ${student.last_name}`,
        status,
        record?.note || '-',
      ];
    });

    // Add summary at the top
    const stats = {
      total: students.length,
      present: students.filter(s => attendance.get(s.id)?.status === 'present').length,
      late: students.filter(s => attendance.get(s.id)?.status === 'late').length,
      absent: students.filter(s => attendance.get(s.id)?.status === 'absent').length,
      excused: students.filter(s => attendance.get(s.id)?.status === 'excused').length,
    };

    const summaryRows = [
      ['รายงานการเข้าเรียน'],
      [`วิชา: ${subject}`],
      [`วันที่: ${new Date(date).toLocaleDateString('th-TH')}`],
      [`สาขา: ${departmentName}`],
      [],
      [`รวม: ${stats.total} | มาเรียน: ${stats.present} | มาสาย: ${stats.late} | ขาด: ${stats.absent} | ลา: ${stats.excused}`],
      [],
    ];

    const worksheetData = [...summaryRows, headers, ...rows];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Auto-size columns
    worksheet['!cols'] = [
      { wch: 8 },
      { wch: 15 },
      { wch: 25 },
      { wch: 12 },
      { wch: 20 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
    XLSX.writeFile(workbook, `attendance_${date}.xlsx`);
  };

  return {
    exportTableToExcel,
    exportScheduleToExcel,
    exportAttendanceToExcel,
  };
};
