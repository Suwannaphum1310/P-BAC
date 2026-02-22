import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';
import MessengerButton from '@/components/MessengerButton';
import CourseCard from '@/components/CourseCard';
import NewsCard from '@/components/NewsCard';
import PrivilegeCard from '@/components/PrivilegeCard';
import { useRevealAnimation } from '@/hooks/useRevealAnimation';
import logo from '@/assets/logo.png';
import heroBg from '@/assets/hero-bg.jpg';
import aboutImg from '@/assets/about-college.jpg';
import ctaBg from '@/assets/cta-bg.jpg';
import { supabase } from '@/integrations/supabase/client';

const HeroSection = () => {
  const [typedText, setTypedText] = useState('');
  const fullText = 'Phuwiang Bundit Technological College';

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i < fullText.length) {
        setTypedText(fullText.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 80);
    return () => clearInterval(timer);
  }, []);

  return (
    <section
      id="hero"
      className="min-h-screen relative flex items-center justify-center text-center text-primary-foreground pt-20"
      style={{ backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 hero-gradient" />

      {/* Floating Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="floating-shape w-48 h-48 bg-primary-foreground/10 top-[10%] left-[10%]" style={{ animationDuration: '25s' }} />
        <div className="floating-shape w-72 h-72 bg-secondary/10 bottom-[20%] right-[10%]" style={{ animationDuration: '30s' }} />
        <div className="floating-shape w-36 h-36 bg-primary-foreground/10 bottom-[10%] left-[20%]" style={{ animationDuration: '20s' }} />
      </div>

      {/* Content */}
      <div className="container relative z-10 max-w-3xl px-4">
        <div className="animate-fade-in-up">
          <img src={logo} alt="P-BAC Logo" className="h-36 mx-auto mb-6 logo-glow" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-3 text-shadow animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          วิทยาลัยเทคโนโลยีภูเวียงบัณฑิต
        </h1>
        <h2 className="text-xl md:text-2xl font-normal mb-5 text-secondary animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {typedText}
          <span className="animate-pulse">|</span>
        </h2>
        <p className="text-lg mb-8 opacity-90 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          สร้างอนาคตที่มั่นคง ด้วยการศึกษาวิชาชีพที่ทันสมัย
        </p>
        <div className="flex flex-wrap gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <a
            href="#courses"
            className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-medium shadow-primary hover:bg-primary-dark hover:-translate-y-1 transition-all duration-300"
          >
            ดูหลักสูตร
          </a>
          <a
            href="#contact"
            className="bg-secondary text-secondary-foreground px-8 py-3 rounded-full font-medium shadow-gold hover:bg-secondary-dark hover:-translate-y-1 transition-all duration-300"
          >
            ติดต่อ
          </a>
        </div>
      </div>
    </section>
  );
};

const PrivilegesSection = () => {
  const privileges = [
    { icon: 'fa-solid fa-hand-holding-dollar', title: 'กู้ กยศ. ได้ 100%', description: 'แบ่งเบาภาระค่าใช้จ่ายผู้ปกครอง ผ่อนชำระคืนเมื่อมีรายได้' },
    { icon: 'fa-solid fa-shirt', title: 'ฟรี! ชุดนักศึกษา', description: 'และอุปกรณ์การเรียนครบครัน สำหรับผู้สมัครรอบโควต้า' },
    { icon: 'fa-solid fa-wifi', title: 'ห้องเรียนทันสมัย', description: 'ห้องปฏิบัติการคอมพิวเตอร์และช่าง พร้อม Wi-Fi ฟรีทั่ววิทยาลัย' },
    { icon: 'fa-solid fa-briefcase', title: 'จบแล้วมีงานทำ', description: 'มีเครือข่ายสถานประกอบการ MOU รองรับการฝึกงานและทำงานจริง' },
  ];

  return (
    <section className="bg-primary text-primary-foreground py-16">
      <div className="container">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">สิทธิพิเศษสำหรับนักศึกษา P-BAC</h2>
          <p className="opacity-80">โอกาสทางการศึกษาและสวัสดิการที่เรามอบให้</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {privileges.map((item, index) => (
            <PrivilegeCard key={index} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
};

const AboutSection = () => {
  const { ref: leftRef, isVisible: leftVisible } = useRevealAnimation();
  const { ref: rightRef, isVisible: rightVisible } = useRevealAnimation();

  return (
    <section id="about" className="section bg-background">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div
            ref={leftRef}
            className={`reveal-left ${leftVisible ? 'reveal-active' : ''}`}
          >
            <img
              src={aboutImg}
              alt="วิทยาลัยเทคโนโลยีภูเวียงบัณฑิต"
              className="rounded-2xl shadow-lg w-full h-auto"
            />
          </div>
          <div
            ref={rightRef}
            className={`reveal-right ${rightVisible ? 'reveal-active' : ''}`}
          >
            <h3 className="section-subtitle">เกี่ยวกับเรา</h3>
            <h2 className="section-title">มุ่งมั่นสร้างสรรค์บัณฑิตคุณภาพ</h2>
            <p className="text-muted-foreground mb-6">
              วิทยาลัยเทคโนโลยีภูเวียงบัณฑิต (P-BAC) เป็นสถาบันการศึกษาที่มุ่งเน้นการผลิตบุคลากรที่มีคุณภาพในสายวิชาชีพ
              พร้อมด้วยทักษะทางเทคโนโลยีที่ทันสมัย เพื่อตอบสนองความต้องการของตลาดแรงงานและการพัฒนาประเทศ
            </p>
            <ul className="space-y-3 mb-8">
              {[
                'หลักสูตรทันสมัย เน้นปฏิบัติจริง',
                'คณาจารย์ผู้เชี่ยวชาญและเอาใจใส่',
                'อุปกรณ์การเรียนครบครัน',
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-3">
                  <i className="fa-solid fa-check-circle text-secondary-dark" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <a
              href="#"
              className="inline-block border-2 border-primary text-primary px-6 py-2.5 rounded-full font-medium hover:bg-primary hover:text-primary-foreground transition-all duration-300"
            >
              อ่านเพิ่มเติม
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

const NewsSection = () => {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const { data } = await supabase
          .from('news')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(3);

        if (data && data.length > 0) {
          setNews(data.map(n => ({
            image: n.image_url || 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400',
            date: new Date(n.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
            title: n.title,
            excerpt: n.content,
          })));
        }
      } catch (error) {
        console.error('Error fetching news:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  if (loading || news.length === 0) return null;

  return (
    <section id="news" className="section bg-muted">
      <div className="container">
        <div className="section-header text-center">
          <h3 className="section-subtitle">ข่าวประชาสัมพันธ์และกิจกรรม</h3>
          <h2 className="section-title">ข่าวสารล่าสุด</h2>
          <p className="text-muted-foreground">ติดตามข่าวสารและกิจกรรมของวิทยาลัย</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {news.map((item, index) => (
            <NewsCard key={index} {...item} delay={index * 100} />
          ))}
        </div>
        <div className="text-center mt-10">
          <Link
            to="/news"
            className="inline-flex items-center gap-2 border-2 border-primary text-primary px-8 py-3 rounded-full font-medium hover:bg-primary hover:text-primary-foreground transition-all duration-300"
          >
            ดูข่าวทั้งหมด
            <i className="fa-solid fa-arrow-right" />
          </Link>
        </div>
      </div>
    </section>
  );
};

const CoursesSection = () => {
  const courses = [
    { icon: 'fa-solid fa-wrench', title: 'ช่างยนต์', description: 'เรียนรู้ระบบเครื่องยนต์ ยานยนต์สมัยใหม่ และการซ่อมบำรุงอย่างมืออาชีพ' },
    { icon: 'fa-solid fa-microchip', title: 'อิเล็กทรอนิกส์', description: 'เรียนรู้วงจรอิเล็กทรอนิกส์ ระบบสื่อสาร และเทคโนโลยี IoT ที่ทันสมัย' },
    { icon: 'fa-solid fa-laptop-code', title: 'เทคโนโลยีธุรกิจดิจิทัล', description: 'เรียนรู้การใช้เทคโนโลยีดิจิทัลเพื่อธุรกิจ E-commerce และการตลาดออนไลน์' },
    { icon: 'fa-solid fa-user-nurse', title: 'การจัดการงานบริการสถานพยาบาล', description: 'เตรียมความพร้อมสู่การทำงานในสถานพยาบาลและการดูแลสุขภาพอย่างมืออาชีพ' },
  ];

  return (
    <section id="courses" className="section bg-card">
      <div className="container">
        <div className="section-header text-center">
          <h3 className="section-subtitle">หลักสูตรของเรา</h3>
          <h2 className="section-title">สาขาวิชาที่เปิดสอน</h2>
          <p className="text-muted-foreground">เลือกเรียนในสิ่งที่ใช่ เพื่ออนาคตที่ชอบ</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {courses.map((course, index) => (
            <CourseCard key={index} {...course} delay={index * 100} />
          ))}
        </div>
      </div>
    </section>
  );
};

const CTASection = () => {
  return (
    <section
      className="py-24 relative text-primary-foreground"
      style={{ backgroundImage: `url(${ctaBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}
    >
      <div className="absolute inset-0 cta-gradient" />
      <div className="container relative z-10 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-5">พร้อมที่จะเริ่มต้นอนาคตของคุณหรือยัง?</h2>
        <p className="text-lg mb-8 opacity-90">สมัครเรียนวันนี้ เพื่อก้าวสู่ความสำเร็จในสายอาชีพที่คุณใฝ่ฝัน</p>
        <Link
          to="/register"
          className="inline-block bg-card text-primary px-8 py-3 rounded-full font-medium hover:bg-secondary hover:text-secondary-foreground transition-all duration-300"
        >
          สมัครเรียนออนไลน์
        </Link>
      </div>
    </section>
  );
};

const ContactSection = () => {
  const { ref: leftRef, isVisible: leftVisible } = useRevealAnimation();
  const { ref: rightRef, isVisible: rightVisible } = useRevealAnimation();

  return (
    <section id="contact" className="section bg-background">
      <div className="container">
        <div className="section-header text-center">
          <h3 className="section-subtitle">ติดต่อเรา</h3>
          <h2 className="section-title">สอบถามข้อมูลเพิ่มเติม</h2>
        </div>
        <div className="grid lg:grid-cols-5 rounded-2xl overflow-hidden shadow-lg">
          {/* Contact Info */}
          <div
            ref={leftRef}
            className={`lg:col-span-2 bg-primary text-primary-foreground p-10 reveal-left ${leftVisible ? 'reveal-active' : ''}`}
          >
            <div className="space-y-8">
              <div className="flex gap-5">
                <i className="fa-solid fa-location-dot text-2xl text-secondary" />
                <div>
                  <h4 className="text-lg font-semibold mb-1">ที่อยู่</h4>
                  <p className="opacity-80">บ้านหนองหญ้าปล้อง อำเภอ ภูเวียง ขอนแก่น 40150</p>
                </div>
              </div>

              {/* Map */}
              <div className="rounded-lg overflow-hidden">
                <iframe
                  src="https://maps.google.com/maps?q=วิทยาลัยเทคโนโลยีภูเวียงบัณฑิต&t=k&z=17&ie=UTF8&iwloc=&output=embed"
                  width="100%"
                  height="200"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="แผนที่วิทยาลัย"
                />
              </div>

              <div className="flex gap-5">
                <i className="fa-solid fa-phone text-2xl text-secondary" />
                <div>
                  <h4 className="text-lg font-semibold mb-1">เบอร์โทรศัพท์</h4>
                  <p className="opacity-80">089-4204315<br />081-9388519<br />087-2163787</p>
                </div>
              </div>

              <div className="flex gap-5">
                <i className="fa-solid fa-envelope text-2xl text-secondary" />
                <div>
                  <h4 className="text-lg font-semibold mb-1">อีเมล</h4>
                  <p className="opacity-80">p.bac.2024@gmail.com</p>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex gap-4 pt-4">
                <a
                  href="https://www.facebook.com/profile.php?id=61552255512101"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-primary-foreground/10 rounded-full flex items-center justify-center hover:bg-secondary hover:text-secondary-foreground transition-all duration-300"
                >
                  <i className="fa-brands fa-facebook-f" />
                </a>
                <a
                  href="https://line.me/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-primary-foreground/10 rounded-full flex items-center justify-center hover:bg-secondary hover:text-secondary-foreground transition-all duration-300"
                >
                  <i className="fa-brands fa-line" />
                </a>
                <a
                  href="https://www.youtube.com/@pbacphuwiang"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-primary-foreground/10 rounded-full flex items-center justify-center hover:bg-secondary hover:text-secondary-foreground transition-all duration-300"
                >
                  <i className="fa-brands fa-youtube" />
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div
            ref={rightRef}
            className={`lg:col-span-3 bg-card p-10 reveal-right ${rightVisible ? 'reveal-active' : ''}`}
          >
            <form className="space-y-5">
              <div>
                <input
                  type="text"
                  placeholder="ชื่อ-นามสกุล"
                  required
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-white dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                />
              </div>
              <div>
                <input
                  type="email"
                  placeholder="อีเมล"
                  required
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-white dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                />
              </div>
              <div>
                <input
                  type="tel"
                  placeholder="เบอร์โทรศัพท์"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-white dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                />
              </div>
              <div>
                <textarea
                  rows={5}
                  placeholder="ข้อความของคุณ"
                  required
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none bg-white dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                />
              </div>
              <button
                type="submit"
                className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-medium shadow-primary hover:bg-primary-dark hover:-translate-y-0.5 transition-all duration-300"
              >
                ส่งข้อความ
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <PrivilegesSection />
        <AboutSection />
        <NewsSection />
        <CoursesSection />
        <CTASection />
        <ContactSection />
      </main>
      <Footer />
      <BackToTop />
      <MessengerButton />
    </div>
  );
};

export default Index;
