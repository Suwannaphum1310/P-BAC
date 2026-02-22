import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, HelpCircle } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { notifyNewApplication } from '@/utils/notifications';

// Helper component for document info - uses Popover for mobile tap support
const InfoButton = ({ text, imagePath }: { text: string, imagePath?: string }) => (
  <Popover>
    <PopoverTrigger asChild>
      <button type="button" className="ml-1 text-muted-foreground hover:text-primary transition-colors">
        <HelpCircle size={14} />
      </button>
    </PopoverTrigger>
    <PopoverContent className="max-w-xs text-sm p-3" side="top">
      <div className="space-y-3">
        {imagePath && (
          <div className="rounded-lg overflow-hidden border border-border">
            <img
              src={imagePath}
              alt="ตัวอย่าง"
              className="w-full h-auto object-cover"
            />
          </div>
        )}
        <p>{text}</p>
      </div>
    </PopoverContent>
  </Popover>
);

const Register = () => {
  const [formData, setFormData] = useState({
    // สาขาวิชา
    course: '',
    educationLevel: '', // ระดับการศึกษา
    // ข้อมูลส่วนตัว
    prefix: '',
    firstName: '',
    lastName: '',
    idCard: '',
    birthDate: '',
    phone: '',
    email: '',
    lineId: '',
    facebook: '',
    address: '',
    // ข้อมูลผู้ปกครอง
    parentName: '',
    parentRelation: '',
    parentPhone: '',
    parentOccupation: '',
    // ข้อมูลสุขภาพ
    chronicDisease: '',
    allergies: '',
    // ประวัติการศึกษา
    previousSchool: '',
    gpa: '',
    graduationYear: '',
    // ยินยอม
    acceptPolicy: false,
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [idCardPreview, setIdCardPreview] = useState<string>('');

  // Required documents
  const [houseRegFile, setHouseRegFile] = useState<File | null>(null);
  const [houseRegPreview, setHouseRegPreview] = useState<string>('');
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const [transcriptPreview, setTranscriptPreview] = useState<string>('');
  const [medicalCertFile, setMedicalCertFile] = useState<File | null>(null);
  const [medicalCertPreview, setMedicalCertPreview] = useState<string>('');
  const [parentIdFile, setParentIdFile] = useState<File | null>(null);
  const [parentIdPreview, setParentIdPreview] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const idCardInputRef = useRef<HTMLInputElement>(null);
  const houseRegInputRef = useRef<HTMLInputElement>(null);
  const transcriptInputRef = useRef<HTMLInputElement>(null);
  const medicalCertInputRef = useRef<HTMLInputElement>(null);
  const parentIdInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else {
      // Validate GPA to not exceed 4.00
      if (name === 'gpa') {
        const gpaValue = parseFloat(value);
        if (gpaValue > 4) {
          setFormData({ ...formData, [name]: '4.00' });
          return;
        }
        if (gpaValue < 0) {
          setFormData({ ...formData, [name]: '0' });
          return;
        }
      }
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'idCard' | 'houseReg' | 'transcript' | 'medicalCert' | 'parentId') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 2MB)');
      return;
    }

    // Validate file type
    const validTypes = type === 'photo'
      ? ['image/jpeg', 'image/png']
      : ['image/jpeg', 'image/png', 'application/pdf'];

    if (!validTypes.includes(file.type)) {
      toast.error(`รูปแบบไฟล์ไม่ถูกต้อง (${type === 'photo' ? 'JPG, PNG' : 'JPG, PNG, PDF'})`);
      return;
    }

    const isPdf = file.type === 'application/pdf';
    const preview = isPdf ? 'pdf' : URL.createObjectURL(file);

    if (type === 'photo') {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    } else if (type === 'idCard') {
      setIdCardFile(file);
      setIdCardPreview(preview);
    } else if (type === 'houseReg') {
      setHouseRegFile(file);
      setHouseRegPreview(preview);
    } else if (type === 'transcript') {
      setTranscriptFile(file);
      setTranscriptPreview(preview);
    } else if (type === 'medicalCert') {
      setMedicalCertFile(file);
      setMedicalCertPreview(preview);
    } else if (type === 'parentId') {
      setParentIdFile(file);
      setParentIdPreview(preview);
    }
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error } = await supabase.storage
      .from('applications')
      .upload(fileName, file);

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('applications')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.acceptPolicy) {
      toast.error('กรุณายอมรับนโยบายความเป็นส่วนตัว');
      return;
    }

    if (!photoFile || !idCardFile || !houseRegFile || !transcriptFile || !medicalCertFile || !parentIdFile) {
      toast.error('กรุณาอัปโหลดเอกสารให้ครบถ้วนทุกรายการ');
      return;
    }

    setIsLoading(true);

    try {
      // Upload required files
      const photoUrl = await uploadFile(photoFile, 'photos');
      const idCardFileUrl = await uploadFile(idCardFile, 'id_cards');

      if (!photoUrl || !idCardFileUrl) {
        toast.error('เกิดข้อผิดพลาดในการอัปโหลดไฟล์');
        setIsLoading(false);
        return;
      }

      // Upload required document files
      const houseRegFileUrl = await uploadFile(houseRegFile, 'house_regs');
      const transcriptFileUrl = await uploadFile(transcriptFile, 'transcripts');
      const medicalCertFileUrl = await uploadFile(medicalCertFile, 'medical_certs');
      const parentIdFileUrl = await uploadFile(parentIdFile, 'parent_ids');

      if (!houseRegFileUrl || !transcriptFileUrl || !medicalCertFileUrl || !parentIdFileUrl) {
        toast.error('เกิดข้อผิดพลาดในการอัปโหลดเอกสารเพิ่มเติม');
        setIsLoading(false);
        return;
      }

      // Insert application data to Supabase
      const { error } = await (supabase as any)
        .from('applications')
        .insert({
          course: formData.course,
          education_level: formData.educationLevel,
          prefix: formData.prefix,
          first_name: formData.firstName,
          last_name: formData.lastName,
          id_card: formData.idCard,
          birth_date: formData.birthDate,
          phone: formData.phone,
          email: formData.email || null,
          line_id: formData.lineId || null,
          facebook: formData.facebook || null,
          address: formData.address,
          parent_name: formData.parentName,
          parent_relation: formData.parentRelation,
          parent_phone: formData.parentPhone,
          parent_occupation: formData.parentOccupation || null,
          chronic_disease: formData.chronicDisease || null,
          allergies: formData.allergies || null,
          previous_school: formData.previousSchool,
          gpa: parseFloat(formData.gpa),
          graduation_year: formData.graduationYear,
          photo_url: photoUrl,
          id_card_file_url: idCardFileUrl,
          // Required documents
          house_reg_file_url: houseRegFileUrl,
          transcript_file_url: transcriptFileUrl,
          medical_cert_file_url: medicalCertFileUrl,
          parent_id_file_url: parentIdFileUrl,
        });

      if (error) {
        console.error('Insert error:', error);
        toast.error('เกิดข้อผิดพลาดในการส่งใบสมัคร: ' + error.message);
        setIsLoading(false);
        return;
      }

      toast.success('ส่งใบสมัครเรียบร้อยแล้ว! ทางวิทยาลัยจะติดต่อกลับเร็วๆ นี้');

      // Notify admins about new application
      notifyNewApplication(`${formData.firstName} ${formData.lastName}`);

      // Reset form
      setFormData({
        course: '', educationLevel: '', prefix: '', firstName: '', lastName: '', idCard: '',
        birthDate: '', phone: '', email: '', lineId: '', facebook: '', address: '',
        parentName: '', parentRelation: '', parentPhone: '', parentOccupation: '',
        chronicDisease: '', allergies: '', previousSchool: '', gpa: '',
        graduationYear: '', acceptPolicy: false,
      });
      setPhotoFile(null);
      setIdCardFile(null);
      setPhotoPreview('');
      setIdCardPreview('');
      // Reset optional documents
      setHouseRegFile(null);
      setHouseRegPreview('');
      setTranscriptFile(null);
      setTranscriptPreview('');
      setMedicalCertFile(null);
      setMedicalCertPreview('');
      setParentIdFile(null);
      setParentIdPreview('');

    } catch (error) {
      console.error('Submit error:', error);
      toast.error('เกิดข้อผิดพลาดในการส่งใบสมัคร');
    } finally {
      setIsLoading(false);
    }
  };

  const courses = [
    { value: 'automotive', label: 'ช่างยนต์' },
    { value: 'electronics', label: 'อิเล็กทรอนิกส์' },
    { value: 'digital-business', label: 'เทคโนโลยีธุรกิจดิจิทัล' },
    { value: 'healthcare', label: 'การจัดการงานบริการสถานพยาบาล' },
  ];

  const relations = [
    { value: 'father', label: 'บิดา' },
    { value: 'mother', label: 'มารดา' },
    { value: 'grandparent', label: 'ปู่/ย่า/ตา/ยาย' },
    { value: 'uncle-aunt', label: 'ลุง/ป้า/น้า/อา' },
    { value: 'other', label: 'อื่นๆ' },
  ];

  const inputClass = "w-full px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all";
  const labelClass = "block text-sm font-medium mb-2 text-foreground";

  return (
    <div className="min-h-screen">
      <Header />

      {/* Page Header */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-center">
        <div className="container">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">สมัครเรียนออนไลน์</h1>
          <p className="opacity-90">กรอกข้อมูลเพื่อสมัครเข้าศึกษาต่อที่ P-BAC</p>
        </div>
      </section>

      <main className="section bg-muted">
        <div className="container max-w-4xl">
          <div className="bg-card p-6 md:p-10 rounded-2xl shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-10">

              {/* เลือกสาขาวิชา */}
              <div className="pb-8 border-b border-border">
                <h3 className="text-xl font-semibold mb-6 flex items-center gap-3 text-primary">
                  <i className="fa-solid fa-graduation-cap" />
                  เลือกสาขาวิชา
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>สาขาวิชาที่ต้องการสมัคร <span className="text-destructive">*</span></label>
                    <select
                      name="course"
                      value={formData.course}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    >
                      <option value="">-- กรุณาเลือกสาขาวิชา --</option>
                      {courses.map((course) => (
                        <option key={course.value} value={course.value}>
                          {course.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>ระดับการศึกษา <span className="text-destructive">*</span></label>
                    <select
                      name="educationLevel"
                      value={formData.educationLevel}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    >
                      <option value="">-- กรุณาเลือกระดับ --</option>
                      <option value="ปวช.">ปวช. (ประกาศนียบัตรวิชาชีพ)</option>
                      <option value="ปวส.">ปวส. (ประกาศนียบัตรวิชาชีพชั้นสูง)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ข้อมูลส่วนตัว */}
              <div className="pb-8 border-b border-border">
                <h3 className="text-xl font-semibold mb-6 flex items-center gap-3 text-primary">
                  <i className="fa-solid fa-user" />
                  ข้อมูลส่วนตัว
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>คำนำหน้า <span className="text-destructive">*</span></label>
                    <select
                      name="prefix"
                      value={formData.prefix}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    >
                      <option value="">เลือก</option>
                      <option value="นาย">นาย</option>
                      <option value="นางสาว">นางสาว</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>ชื่อ <span className="text-destructive">*</span></label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className={labelClass}>นามสกุล <span className="text-destructive">*</span></label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>เลขบัตรประจำตัวประชาชน <span className="text-destructive">*</span></label>
                    <input
                      type="text"
                      name="idCard"
                      value={formData.idCard}
                      onChange={handleChange}
                      maxLength={13}
                      required
                      placeholder="เลข 13 หลัก"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className={labelClass}>วัน/เดือน/ปีเกิด <span className="text-destructive">*</span></label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            inputClass,
                            "flex items-center justify-start text-left cursor-pointer",
                            !formData.birthDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                          {formData.birthDate
                            ? format(new Date(formData.birthDate), "dd/MM/yyyy", { locale: th })
                            : "วว/ดด/ปปปป"}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.birthDate ? new Date(formData.birthDate) : undefined}
                          onSelect={(date) => date && setFormData({ ...formData, birthDate: format(date, 'yyyy-MM-dd') })}
                          captionLayout="dropdown-buttons"
                          fromYear={1950}
                          toYear={new Date().getFullYear()}
                          locale={th}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <label className={labelClass}>เบอร์โทรศัพท์ <span className="text-destructive">*</span></label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="0XX-XXX-XXXX"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className={labelClass}>อีเมล</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="example@email.com"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Line ID (ไม่บังคับ)</label>
                    <input
                      type="text"
                      name="lineId"
                      value={formData.lineId}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className={labelClass}>Facebook (ไม่บังคับ)</label>
                  <input
                    type="text"
                    name="facebook"
                    value={formData.facebook}
                    onChange={handleChange}
                    placeholder="ชื่อ Facebook หรือ Link"
                    className={inputClass}
                  />
                </div>

                <div className="mt-4">
                  <label className={labelClass}>ที่อยู่ปัจจุบัน <span className="text-destructive">*</span></label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    required
                    placeholder="บ้านเลขที่ หมู่ ซอย ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
                    className={`${inputClass} resize-none`}
                  />
                </div>
              </div>

              {/* ข้อมูลผู้ปกครอง */}
              <div className="pb-8 border-b border-border">
                <h3 className="text-xl font-semibold mb-6 flex items-center gap-3 text-primary">
                  <i className="fa-solid fa-users" />
                  ข้อมูลผู้ปกครอง
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>ชื่อ-นามสกุล ผู้ปกครอง <span className="text-destructive">*</span></label>
                    <input
                      type="text"
                      name="parentName"
                      value={formData.parentName}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>ความสัมพันธ์ <span className="text-destructive">*</span></label>
                    <select
                      name="parentRelation"
                      value={formData.parentRelation}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    >
                      <option value="">-- เลือกความสัมพันธ์ --</option>
                      {relations.map((rel) => (
                        <option key={rel.value} value={rel.value}>
                          {rel.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className={labelClass}>เบอร์โทรศัพท์ผู้ปกครอง <span className="text-destructive">*</span></label>
                    <input
                      type="tel"
                      name="parentPhone"
                      value={formData.parentPhone}
                      onChange={handleChange}
                      required
                      placeholder="0XX-XXX-XXXX"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>อาชีพ</label>
                    <input
                      type="text"
                      name="parentOccupation"
                      value={formData.parentOccupation}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              {/* ข้อมูลสุขภาพ */}
              <div className="pb-8 border-b border-border">
                <h3 className="text-xl font-semibold mb-6 flex items-center gap-3 text-primary">
                  <i className="fa-solid fa-heart-pulse" />
                  ข้อมูลสุขภาพ
                </h3>

                <div>
                  <label className={labelClass}>โรคประจำตัว (ถ้ามี)</label>
                  <input
                    type="text"
                    name="chronicDisease"
                    value={formData.chronicDisease}
                    onChange={handleChange}
                    placeholder="ระบุโรคประจำตัว หรือ พิมพ์ ไม่มี"
                    className={inputClass}
                  />
                </div>

                <div className="mt-4">
                  <label className={labelClass}>ประวัติการแพ้ยา/อาหาร (ถ้ามี)</label>
                  <input
                    type="text"
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleChange}
                    placeholder="ระบุสิ่งที่แพ้ หรือ พิมพ์ ไม่มี"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* ประวัติการศึกษา */}
              <div className="pb-8 border-b border-border">
                <h3 className="text-xl font-semibold mb-6 flex items-center gap-3 text-primary">
                  <i className="fa-solid fa-school" />
                  ประวัติการศึกษา
                </h3>

                <div>
                  <label className={labelClass}>โรงเรียนเดิม <span className="text-destructive">*</span></label>
                  <input
                    type="text"
                    name="previousSchool"
                    value={formData.previousSchool}
                    onChange={handleChange}
                    required
                    placeholder="ชื่อโรงเรียนที่จบการศึกษาล่าสุด"
                    className={inputClass}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className={labelClass}>เกรดเฉลี่ยสะสม (GPA) <span className="text-destructive">*</span></label>
                    <input
                      type="number"
                      name="gpa"
                      value={formData.gpa}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      max="4"
                      required
                      placeholder="0.00 - 4.00"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>ปีที่จบการศึกษา <span className="text-destructive">*</span></label>
                    <input
                      type="text"
                      name="graduationYear"
                      value={formData.graduationYear}
                      onChange={handleChange}
                      required
                      placeholder="เช่น 2567"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              {/* เอกสารประกอบการสมัคร */}
              <div className="pb-8 border-b border-border">
                <h3 className="text-xl font-semibold mb-6 flex items-center gap-3 text-primary">
                  <i className="fa-solid fa-file-arrow-up" />
                  เอกสารประกอบการสมัคร
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* รูปถ่ายผู้สมัคร */}
                  <div>
                    <label className={labelClass}>รูปถ่ายผู้สมัคร <span className="text-destructive">*</span><InfoButton text="รูปถ่ายหน้าตรง ขนาด 1 นิ้ว หรือ 1.5 นิ้ว พื้นหลังสีขาวหรือสีฟ้า แต่งกายสุภาพ" imagePath="/examples/example_photo_1767889070728.png" /></label>
                    <div
                      onClick={() => photoInputRef.current?.click()}
                      className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                    >
                      {photoPreview ? (
                        <div className="space-y-2">
                          <img src={photoPreview} alt="Preview" className="w-24 h-24 object-cover rounded-lg mx-auto" />
                          <p className="text-sm text-muted-foreground">{photoFile?.name}</p>
                        </div>
                      ) : (
                        <>
                          <i className="fa-solid fa-cloud-arrow-up text-3xl text-primary mb-2" />
                          <p className="font-medium">เลือกไฟล์รูปถ่าย</p>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      รองรับไฟล์ JPG, PNG <span className="text-destructive">ขนาดไม่เกิน 2MB</span>
                    </p>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={(e) => handleFileChange(e, 'photo')}
                      className="hidden"
                    />
                  </div>

                  {/* สำเนาบัตรประชาชน */}
                  <div>
                    <label className={labelClass}>สำเนาบัตรประชาชน <span className="text-destructive">*</span><InfoButton text="ถ่ายสำเนาบัตรประชาชนด้านหน้าให้ชัดเจน เซ็นรับรองสำเนาถูกต้อง" imagePath="/examples/example_idcard_1767889088017.png" /></label>
                    <div
                      onClick={() => idCardInputRef.current?.click()}
                      className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                    >
                      {idCardPreview ? (
                        <div className="space-y-2">
                          {idCardPreview === 'pdf' ? (
                            <i className="fa-solid fa-file-pdf text-4xl text-red-500" />
                          ) : (
                            <img src={idCardPreview} alt="Preview" className="w-24 h-24 object-cover rounded-lg mx-auto" />
                          )}
                          <p className="text-sm text-muted-foreground">{idCardFile?.name}</p>
                        </div>
                      ) : (
                        <>
                          <i className="fa-solid fa-cloud-arrow-up text-3xl text-primary mb-2" />
                          <p className="font-medium">เลือกไฟล์สำเนาบัตร</p>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      รองรับไฟล์ JPG, PNG, PDF <span className="text-destructive">ขนาดไม่เกิน 2MB</span>
                    </p>
                    <input
                      ref={idCardInputRef}
                      type="file"
                      accept="image/jpeg,image/png,application/pdf"
                      onChange={(e) => handleFileChange(e, 'idCard')}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* เอกสารเพิ่มเติม */}
                <div className="mt-6 pt-6 border-t border-border/50">
                  <p className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-circle-info text-blue-500" />
                    เอกสารเพิ่มเติม
                  </p>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* สำเนาทะเบียนบ้าน */}
                    <div>
                      <label className={labelClass}>สำเนาทะเบียนบ้าน <span className="text-destructive">*</span><InfoButton text="ถ่ายสำเนาทะเบียนบ้านหน้าที่มีชื่อ student_id_ref เซ็นรับรองสำเนาถูกต้อง" imagePath="/examples/example_house_reg_1767889110289.png" /></label>
                      <div
                        onClick={() => houseRegInputRef.current?.click()}
                        className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                      >
                        {houseRegPreview ? (
                          <div className="space-y-2">
                            {houseRegPreview === 'pdf' ? (
                              <i className="fa-solid fa-file-pdf text-4xl text-red-500" />
                            ) : (
                              <img src={houseRegPreview} alt="Preview" className="w-24 h-24 object-cover rounded-lg mx-auto" />
                            )}
                            <p className="text-sm text-muted-foreground">{houseRegFile?.name}</p>
                          </div>
                        ) : (
                          <>
                            <i className="fa-solid fa-cloud-arrow-up text-3xl text-muted-foreground mb-2" />
                            <p className="font-medium text-muted-foreground">เลือกไฟล์ทะเบียนบ้าน</p>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        รองรับไฟล์ JPG, PNG, PDF <span className="text-destructive">ขนาดไม่เกิน 2MB</span>
                      </p>
                      <input
                        ref={houseRegInputRef}
                        type="file"
                        accept="image/jpeg,image/png,application/pdf"
                        onChange={(e) => handleFileChange(e, 'houseReg')}
                        className="hidden"
                      />
                    </div>

                    {/* ใบ ปพ.1 / ใบรับรองผลการเรียน */}
                    <div>
                      <label className={labelClass}>ใบ ปพ.1 / ใบรับรองผลการเรียน <span className="text-destructive">*</span><InfoButton text="ใบ ปพ.1 คือใบแสดงผลการเรียน (Transcript) ขอได้จากโรงเรียนเดิม แสดงเกรดเฉลี่ยสะสม" imagePath="/examples/example_transcript_1767889150278.png" /></label>
                      <div
                        onClick={() => transcriptInputRef.current?.click()}
                        className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                      >
                        {transcriptPreview ? (
                          <div className="space-y-2">
                            {transcriptPreview === 'pdf' ? (
                              <i className="fa-solid fa-file-pdf text-4xl text-red-500" />
                            ) : (
                              <img src={transcriptPreview} alt="Preview" className="w-24 h-24 object-cover rounded-lg mx-auto" />
                            )}
                            <p className="text-sm text-muted-foreground">{transcriptFile?.name}</p>
                          </div>
                        ) : (
                          <>
                            <i className="fa-solid fa-cloud-arrow-up text-3xl text-muted-foreground mb-2" />
                            <p className="font-medium text-muted-foreground">เลือกไฟล์ ปพ.1</p>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        รองรับไฟล์ JPG, PNG, PDF <span className="text-destructive">ขนาดไม่เกิน 2MB</span>
                      </p>
                      <input
                        ref={transcriptInputRef}
                        type="file"
                        accept="image/jpeg,image/png,application/pdf"
                        onChange={(e) => handleFileChange(e, 'transcript')}
                        className="hidden"
                      />
                    </div>

                    {/* ใบรับรองแพทย์ */}
                    <div>
                      <label className={labelClass}>ใบรับรองแพทย์ <span className="text-destructive">*</span><InfoButton text="ใบรับรองแพทย์ขอได้จากโรงพยาบาลหรือคลินิก รับรองว่าสุขภาพแข็งแรง ไม่มีโรคติดต่อ" imagePath="/examples/example_medical_1767889169244.png" /></label>
                      <div
                        onClick={() => medicalCertInputRef.current?.click()}
                        className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                      >
                        {medicalCertPreview ? (
                          <div className="space-y-2">
                            {medicalCertPreview === 'pdf' ? (
                              <i className="fa-solid fa-file-pdf text-4xl text-red-500" />
                            ) : (
                              <img src={medicalCertPreview} alt="Preview" className="w-24 h-24 object-cover rounded-lg mx-auto" />
                            )}
                            <p className="text-sm text-muted-foreground">{medicalCertFile?.name}</p>
                          </div>
                        ) : (
                          <>
                            <i className="fa-solid fa-cloud-arrow-up text-3xl text-muted-foreground mb-2" />
                            <p className="font-medium text-muted-foreground">เลือกไฟล์ใบรับรองแพทย์</p>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        รองรับไฟล์ JPG, PNG, PDF <span className="text-destructive">ขนาดไม่เกิน 2MB</span>
                      </p>
                      <input
                        ref={medicalCertInputRef}
                        type="file"
                        accept="image/jpeg,image/png,application/pdf"
                        onChange={(e) => handleFileChange(e, 'medicalCert')}
                        className="hidden"
                      />
                    </div>

                    {/* สำเนาบัตรประชาชนผู้ปกครอง */}
                    <div>
                      <label className={labelClass}>สำเนาบัตรประชาชนผู้ปกครอง <span className="text-destructive">*</span><InfoButton text="สำเนาบัตรประชาชนของผู้ปกครอง (บิดา/มารดา) เซ็นรับรองสำเนาถูกต้อง" imagePath="/examples/example_parent_id_1767889187886.png" /></label>
                      <div
                        onClick={() => parentIdInputRef.current?.click()}
                        className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                      >
                        {parentIdPreview ? (
                          <div className="space-y-2">
                            {parentIdPreview === 'pdf' ? (
                              <i className="fa-solid fa-file-pdf text-4xl text-red-500" />
                            ) : (
                              <img src={parentIdPreview} alt="Preview" className="w-24 h-24 object-cover rounded-lg mx-auto" />
                            )}
                            <p className="text-sm text-muted-foreground">{parentIdFile?.name}</p>
                          </div>
                        ) : (
                          <>
                            <i className="fa-solid fa-cloud-arrow-up text-3xl text-muted-foreground mb-2" />
                            <p className="font-medium text-muted-foreground">เลือกไฟล์บัตรผู้ปกครอง</p>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        รองรับไฟล์ JPG, PNG, PDF <span className="text-destructive">ขนาดไม่เกิน 2MB</span>
                      </p>
                      <input
                        ref={parentIdInputRef}
                        type="file"
                        accept="image/jpeg,image/png,application/pdf"
                        onChange={(e) => handleFileChange(e, 'parentId')}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ยินยอมนโยบายความเป็นส่วนตัว */}
              <div className="bg-accent/50 p-4 rounded-lg">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="acceptPolicy"
                    checked={formData.acceptPolicy}
                    onChange={handleChange}
                    className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm">
                    ข้าพเจ้ายอมรับ
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setShowPrivacyModal(true); }}
                      className="text-primary underline hover:no-underline mx-1"
                    >
                      นโยบายความเป็นส่วนตัว
                    </button>
                    และยินยอมให้วิทยาลัยเก็บรวบรวมข้อมูลเพื่อการศึกษา <span className="text-destructive">*</span>
                  </span>
                </label>
              </div>

              {/* Privacy Policy Modal */}
              <Dialog open={showPrivacyModal} onOpenChange={setShowPrivacyModal}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-primary flex items-center gap-2">
                      <i className="fa-solid fa-shield-halved" />
                      นโยบายความเป็นส่วนตัว
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 text-sm">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2"><i className="fa-solid fa-database text-primary" /> การเก็บรวบรวมข้อมูล</h4>
                      <p className="text-muted-foreground">
                        วิทยาลัยเทคโนโลยีภูเวียงบัณฑิต เก็บรวบรวมข้อมูลส่วนบุคคลของผู้สมัครเรียน ได้แก่ ชื่อ-นามสกุล ที่อยู่
                        เบอร์โทรศัพท์ อีเมล รูปถ่าย สำเนาบัตรประชาชน และเอกสารอื่นๆ ที่จำเป็นต่อการสมัครเรียน
                      </p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2"><i className="fa-solid fa-clipboard-list text-primary" /> วัตถุประสงค์ในการใช้ข้อมูล</h4>
                      <ul className="text-muted-foreground list-disc list-inside space-y-1">
                        <li>ดำเนินการรับสมัครและพิจารณาคุณสมบัติผู้สมัคร</li>
                        <li>ติดต่อสื่อสารเกี่ยวกับการสมัครเรียน</li>
                        <li>จัดทำทะเบียนนักศึกษา</li>
                        <li>ปฏิบัติตามกฎระเบียบของสถานศึกษา</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2"><i className="fa-solid fa-lock text-primary" /> การรักษาความปลอดภัยข้อมูล</h4>
                      <p className="text-muted-foreground">
                        วิทยาลัยมีมาตรการรักษาความปลอดภัยข้อมูลส่วนบุคคลอย่างเหมาะสม ข้อมูลจะถูกเก็บรักษาในระบบที่มีการป้องกัน
                        และจะไม่เปิดเผยต่อบุคคลภายนอก ยกเว้นกรณีที่กฎหมายกำหนด
                      </p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2"><i className="fa-solid fa-calendar-days text-primary" /> ระยะเวลาในการเก็บข้อมูล</h4>
                      <p className="text-muted-foreground">
                        ข้อมูลจะถูกเก็บรักษาตลอดระยะเวลาที่ศึกษาอยู่ และอีก 5 ปีหลังจากจบการศึกษา
                        ตามระเบียบของกระทรวงศึกษาธิการ
                      </p>
                    </div>
                    <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
                      <h4 className="font-semibold mb-2 text-primary flex items-center gap-2"><i className="fa-solid fa-phone" /> ติดต่อสอบถาม</h4>
                      <p className="text-muted-foreground">
                        หากมีข้อสงสัยเกี่ยวกับนโยบายความเป็นส่วนตัว สามารถติดต่อได้ที่<br />
                        อีเมล: p.bac.2024@gmail.com<br />
                        โทร: 089-4204315
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => setShowPrivacyModal(false)}
                      className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      เข้าใจแล้ว
                    </button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Submit */}
              <div className="text-center pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-primary text-primary-foreground px-12 py-4 rounded-full font-medium text-lg shadow-lg hover:bg-primary/90 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin mr-2" />
                      กำลังส่งข้อมูล...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-paper-plane mr-2" />
                      ส่งใบสมัคร
                    </>
                  )}
                </button>
                <p className="mt-4 text-sm text-muted-foreground">
                  หมายเหตุ: ทางวิทยาลัยจะติดต่อกลับภายใน 3 วันทำการ
                </p>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default Register;
