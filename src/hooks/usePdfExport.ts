import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Thai font is not included in jsPDF, so we'll use a workaround
// by transliteration or encoding

interface ExportOptions {
  title: string;
  subtitle?: string;
  filename: string;
}

interface TableColumn {
  header: string;
  key: string;
}

export const usePdfExport = () => {
  const exportTableToPdf = (
    data: Record<string, any>[],
    columns: TableColumn[],
    options: ExportOptions
  ) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Set up document properties
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(18);
    doc.text(options.title, pageWidth / 2, 20, { align: 'center' });
    
    // Subtitle
    if (options.subtitle) {
      doc.setFontSize(12);
      doc.text(options.subtitle, pageWidth / 2, 30, { align: 'center' });
    }
    
    // Date
    doc.setFontSize(10);
    const dateText = `Export Date: ${new Date().toLocaleDateString('th-TH')}`;
    doc.text(dateText, pageWidth - 15, 15, { align: 'right' });
    
    // Table data
    const headers = columns.map(col => col.header);
    const rows = data.map(item => 
      columns.map(col => {
        const value = item[col.key];
        if (value === null || value === undefined) return '-';
        if (typeof value === 'number') return value.toString();
        return String(value);
      })
    );
    
    // Generate table
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: options.subtitle ? 40 : 35,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
    });
    
    // Save the PDF
    doc.save(`${options.filename}.pdf`);
  };

  const exportScheduleToPdf = (
    scheduleData: Record<string, (any | null)[]>,
    departmentName: string,
    days: string[],
    timeSlots: { period: number | string; time: string }[]
  ) => {
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for schedule
    
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(16);
    doc.text(`Class Schedule - ${departmentName}`, pageWidth / 2, 15, { align: 'center' });
    
    // Date
    doc.setFontSize(10);
    doc.text(`Export: ${new Date().toLocaleDateString('th-TH')}`, pageWidth - 15, 15, { align: 'right' });
    
    // Build table data
    const numericTimeSlots = timeSlots.filter(slot => typeof slot.period === 'number');
    const headers = ['Day', ...numericTimeSlots.map(slot => `Period ${slot.period}`)];
    
    const rows = days.map(day => {
      const daySchedule = scheduleData[day] || [];
      const row = [day];
      
      numericTimeSlots.forEach((slot, index) => {
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
    
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 25,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3,
        halign: 'center',
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { fontStyle: 'bold', halign: 'left' },
      },
    });
    
    doc.save(`schedule_${departmentName.replace(/\s+/g, '_')}.pdf`);
  };

  const exportAttendanceToPdf = (
    students: any[],
    attendance: Map<string, any>,
    subject: string,
    date: string,
    departmentName: string
  ) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(16);
    doc.text('Attendance Report', pageWidth / 2, 15, { align: 'center' });
    
    // Subject and date
    doc.setFontSize(12);
    doc.text(`Subject: ${subject}`, 15, 28);
    doc.text(`Date: ${new Date(date).toLocaleDateString('th-TH')}`, 15, 35);
    doc.text(`Department: ${departmentName}`, 15, 42);
    
    // Stats
    const stats = {
      total: students.length,
      present: students.filter(s => attendance.get(s.id)?.status === 'present').length,
      late: students.filter(s => attendance.get(s.id)?.status === 'late').length,
      absent: students.filter(s => attendance.get(s.id)?.status === 'absent').length,
      excused: students.filter(s => attendance.get(s.id)?.status === 'excused').length,
    };
    
    doc.setFontSize(10);
    doc.text(`Total: ${stats.total} | Present: ${stats.present} | Late: ${stats.late} | Absent: ${stats.absent} | Excused: ${stats.excused}`, 15, 50);
    
    // Table
    const headers = ['No.', 'Student ID', 'Name', 'Status'];
    const rows = students.map((student, index) => {
      const record = attendance.get(student.id);
      let status = 'Not checked';
      switch (record?.status) {
        case 'present': status = 'Present'; break;
        case 'late': status = 'Late'; break;
        case 'absent': status = 'Absent'; break;
        case 'excused': status = 'Excused'; break;
      }
      return [
        (index + 1).toString(),
        student.student_id,
        `${student.first_name} ${student.last_name}`,
        status,
      ];
    });
    
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 58,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { cellWidth: 35 },
        3: { halign: 'center', cellWidth: 30 },
      },
    });
    
    doc.save(`attendance_${date}.pdf`);
  };

  return {
    exportTableToPdf,
    exportScheduleToPdf,
    exportAttendanceToPdf,
  };
};
