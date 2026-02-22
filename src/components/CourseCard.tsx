import { useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CourseCardProps {
  icon: string;
  title: string;
  description: string;
  delay?: number;
}

// Course details data
const courseDetails: Record<string, { fullDescription: string; highlights: string[]; careers: string[] }> = {
  'ช่างยนต์': {
    fullDescription: 'หลักสูตรช่างยนต์ มุ่งเน้นการผลิตช่างเทคนิคที่มีความรู้ความสามารถในด้านเครื่องยนต์ ระบบส่งกำลัง ระบบเบรก ระบบไฟฟ้ารถยนต์ และเทคโนโลยียานยนต์สมัยใหม่ รวมถึงรถยนต์ไฟฟ้า (EV)',
    highlights: [
      'ฝึกปฏิบัติกับเครื่องยนต์และรถยนต์จริง',
      'เรียนรู้ระบบไฟฟ้ารถยนต์และอิเล็กทรอนิกส์',
      'เทคโนโลยีรถยนต์ไฟฟ้า (EV) และไฮบริด',
      'ฝึกงานกับศูนย์บริการยานยนต์ชั้นนำ',
    ],
    careers: ['ช่างซ่อมรถยนต์', 'ช่างเทคนิคศูนย์บริการ', 'พนักงานอะไหล่', 'เปิดอู่ซ่อมรถส่วนตัว'],
  },
  'อิเล็กทรอนิกส์': {
    fullDescription: 'หลักสูตรอิเล็กทรอนิกส์ เน้นการเรียนรู้วงจรอิเล็กทรอนิกส์ ระบบสื่อสาร ระบบควบคุมอัตโนมัติ และเทคโนโลยี IoT พร้อมทักษะการซ่อมบำรุงอุปกรณ์อิเล็กทรอนิกส์',
    highlights: [
      'วงจรอิเล็กทรอนิกส์และไมโครคอนโทรลเลอร์',
      'ระบบสื่อสารและโทรคมนาคม',
      'Internet of Things (IoT)',
      'ระบบควบคุมอัตโนมัติในอุตสาหกรรม',
    ],
    careers: ['ช่างอิเล็กทรอนิกส์', 'ช่างซ่อมอุปกรณ์ไฟฟ้า', 'ช่างเทคนิคโรงงาน', 'ช่างติดตั้งระบบ'],
  },
  'เทคโนโลยีธุรกิจดิจิทัล': {
    fullDescription: 'หลักสูตรเทคโนโลยีธุรกิจดิจิทัล เตรียมความพร้อมสู่โลกธุรกิจยุคดิจิทัล ครอบคลุมการตลาดออนไลน์ E-commerce การออกแบบเว็บไซต์ และการจัดการข้อมูลธุรกิจ',
    highlights: [
      'การตลาดดิจิทัลและ Social Media',
      'การสร้างและจัดการร้านค้าออนไลน์',
      'การออกแบบกราฟิกและเว็บไซต์',
      'การวิเคราะห์ข้อมูลธุรกิจ',
    ],
    careers: ['นักการตลาดดิจิทัล', 'ผู้ดูแลร้านค้าออนไลน์', 'นักออกแบบกราฟิก', 'เจ้าหน้าที่ IT'],
  },
  'การจัดการงานบริการสถานพยาบาล': {
    fullDescription: 'หลักสูตรการจัดการงานบริการสถานพยาบาล มุ่งผลิตบุคลากรที่มีความรู้ด้านการบริหารจัดการสถานพยาบาล การดูแลผู้ป่วย และการบริการด้านสุขภาพอย่างมืออาชีพ',
    highlights: [
      'การบริหารจัดการสถานพยาบาล',
      'การดูแลและบริการผู้ป่วย',
      'ความรู้พื้นฐานทางการแพทย์',
      'ฝึกงานในโรงพยาบาลและคลินิก',
    ],
    careers: ['เจ้าหน้าที่บริหารงานโรงพยาบาล', 'ผู้ช่วยพยาบาล', 'เจ้าหน้าที่ประสานงาน', 'พนักงานต้อนรับสถานพยาบาล'],
  },
};

const CourseCard = ({ icon, title, description, delay = 0 }: CourseCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const details = courseDetails[title] || {
    fullDescription: description,
    highlights: [],
    careers: [],
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <>
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        className="card-glow bg-muted p-8 rounded-2xl border border-border transition-all duration-300 hover:-translate-y-2 hover:shadow-lg hover:border-secondary group"
        style={{ transitionDelay: `${delay}ms` }}
      >
        <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl mb-5 transition-all duration-300 group-hover:bg-secondary group-hover:text-secondary-foreground relative z-10">
          <i className={icon} />
        </div>
        <h3 className="text-xl font-semibold mb-3 relative z-10">{title}</h3>
        <p className="text-muted-foreground mb-5 relative z-10">{description}</p>
        <button
          onClick={() => setIsOpen(true)}
          className="text-primary font-semibold flex items-center gap-2 transition-all duration-300 hover:gap-3 relative z-10"
        >
          ดูรายละเอียด <ArrowRight size={16} />
        </button>
      </div>

      {/* Course Detail Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl">
                <i className={icon} />
              </div>
              สาขาวิชา{title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-2">
            {/* Description */}
            <div>
              <h4 className="font-semibold text-lg mb-2">เกี่ยวกับหลักสูตร</h4>
              <p className="text-muted-foreground">{details.fullDescription}</p>
            </div>

            {/* Highlights */}
            {details.highlights.length > 0 && (
              <div>
                <h4 className="font-semibold text-lg mb-3">สิ่งที่จะได้เรียนรู้</h4>
                <ul className="space-y-2">
                  {details.highlights.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <i className="fa-solid fa-check-circle text-green-500 mt-1" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Careers */}
            {details.careers.length > 0 && (
              <div>
                <h4 className="font-semibold text-lg mb-3">อาชีพที่สามารถทำได้</h4>
                <div className="flex flex-wrap gap-2">
                  {details.careers.map((career, index) => (
                    <span
                      key={index}
                      className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                    >
                      {career}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="pt-4 border-t border-border">
              <a
                href="/register"
                className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium hover:bg-primary/90 transition-colors"
              >
                สมัครเรียนสาขานี้
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CourseCard;
