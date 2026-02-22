import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ExportOptions {
    filename?: string;
    title?: string;
    subtitle?: string;
    orientation?: 'portrait' | 'landscape';
    format?: 'a4' | 'letter';
}

/**
 * Export an HTML element to PDF
 */
export async function exportToPDF(
    elementId: string,
    options: ExportOptions = {}
): Promise<void> {
    const {
        filename = 'document.pdf',
        title,
        subtitle,
        orientation = 'landscape',
        format = 'a4',
    } = options;

    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element with id "${elementId}" not found`);
        alert('ไม่พบตารางที่จะดาวน์โหลด');
        return;
    }

    // Show loading state
    const originalText = element.style.opacity;
    element.style.opacity = '1';

    try {
        // Clone the element to avoid modifying the original
        const clone = element.cloneNode(true) as HTMLElement;
        clone.style.position = 'absolute';
        clone.style.left = '-9999px';
        clone.style.top = '0';
        clone.style.width = element.offsetWidth + 'px';
        clone.style.background = '#ffffff';
        clone.style.padding = '20px';
        document.body.appendChild(clone);

        // Wait for images to load
        await new Promise(resolve => setTimeout(resolve, 100));

        // Create canvas from element
        const canvas = await html2canvas(clone, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            allowTaint: true,
            removeContainer: true,
        });

        // Remove clone
        document.body.removeChild(clone);

        // Calculate dimensions
        const imgData = canvas.toDataURL('image/png', 1.0);
        const pdf = new jsPDF({
            orientation,
            unit: 'mm',
            format,
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;

        let yOffset = margin;

        // Add header
        pdf.setFontSize(16);
        pdf.setTextColor(0, 0, 0);
        pdf.text('P-BAC Schedule Export', pageWidth / 2, yOffset + 8, { align: 'center' });
        yOffset += 12;

        // Add title if provided
        if (title) {
            pdf.setFontSize(14);
            pdf.text(title, pageWidth / 2, yOffset + 6, { align: 'center' });
            yOffset += 10;
        }

        // Add subtitle if provided
        if (subtitle) {
            pdf.setFontSize(10);
            pdf.setTextColor(100, 100, 100);
            pdf.text(subtitle, pageWidth / 2, yOffset + 4, { align: 'center' });
            yOffset += 8;
        }

        // Add timestamp
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        const timestamp = new Date().toLocaleString('th-TH', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
        pdf.text(`Exported: ${timestamp}`, pageWidth / 2, yOffset + 4, { align: 'center' });
        pdf.setTextColor(0, 0, 0);
        yOffset += 10;

        // Calculate image dimensions to fit page
        const availableWidth = pageWidth - (margin * 2);
        const availableHeight = pageHeight - yOffset - margin - 10;

        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);

        const scaledWidth = imgWidth * ratio;
        const scaledHeight = imgHeight * ratio;

        const xOffset = (pageWidth - scaledWidth) / 2;

        // Add image to PDF
        pdf.addImage(imgData, 'PNG', xOffset, yOffset, scaledWidth, scaledHeight);

        // Add footer
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text(
            'P-BAC - Phuwiangbandith Technological College',
            pageWidth / 2,
            pageHeight - 5,
            { align: 'center' }
        );

        // Save PDF with correct filename
        const safeFilename = filename.replace(/[^a-zA-Z0-9ก-๙\-_\.]/g, '_');
        // Save PDF using blob download for reliable filename
        const pdfBlob = pdf.output('blob');
        const blobUrl = URL.createObjectURL(pdfBlob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = safeFilename.endsWith('.pdf') ? safeFilename : `${safeFilename}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up blob URL
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);

        console.log('PDF exported successfully:', link.download);
    } catch (error) {
        console.error('Error exporting to PDF:', error);
        alert('เกิดข้อผิดพลาดในการสร้าง PDF กรุณาลองใหม่อีกครั้ง');
        throw error;
    } finally {
        element.style.opacity = originalText;
    }
}

/**
 * Export schedule to PDF with custom styling
 */
export async function exportScheduleToPDF(
    elementId: string,
    departmentName: string
): Promise<void> {
    await exportToPDF(elementId, {
        filename: `schedule_${departmentName || 'export'}.pdf`,
        title: 'Class Schedule',
        subtitle: `${departmentName || 'Department'} - Semester 1/2568`,
        orientation: 'landscape',
    });
}

/**
 * Export grades to PDF with custom styling
 */
export async function exportGradesToPDF(
    elementId: string,
    studentName: string
): Promise<void> {
    await exportToPDF(elementId, {
        filename: `grades_${studentName || 'export'}.pdf`,
        title: 'Student Grades',
        subtitle: studentName || 'Student',
        orientation: 'portrait',
    });
}
