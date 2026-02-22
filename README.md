# 🎓 P-BAC — ระบบจัดการสถานศึกษา

> ระบบบริหารจัดการสถานศึกษาแบบครบวงจร สำหรับวิทยาลัยอาชีวศึกษา  
> พัฒนาด้วย React + TypeScript + Supabase

![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Database-3FCF8E?logo=supabase&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)

---

## 📋 สารบัญ

- [✨ ฟีเจอร์หลัก](#-ฟีเจอร์หลัก)
- [🏗️ เทคโนโลยีที่ใช้](#️-เทคโนโลยีที่ใช้)
- [🚀 วิธีติดตั้งและรัน](#-วิธีติดตั้งและรัน)
- [📁 โครงสร้างโปรเจกต์](#-โครงสร้างโปรเจกต์)
- [👥 ระบบผู้ใช้งาน](#-ระบบผู้ใช้งาน)
- [📸 ภาพตัวอย่าง](#-ภาพตัวอย่าง)

---

## ✨ ฟีเจอร์หลัก

### 🔐 ระบบยืนยันตัวตน (Authentication)
- เข้าสู่ระบบ / สมัครสมาชิก
- แบ่งสิทธิ์ตามบทบาท (Admin, Teacher, Student)
- ระบบ Protected Routes

### 👨‍💼 ผู้ดูแลระบบ (Admin)
- **แดชบอร์ด** — ภาพรวมสถิตินักศึกษา, เกรด, การเข้าเรียน
- **จัดการนักศึกษา** — เพิ่ม, แก้ไข, ลบข้อมูลนักศึกษา
- **จัดการรายวิชา** — สร้างและจัดการรายวิชาตามสาขา
- **จัดการผลการเรียน** — ให้เกรดและคำนวณ GPA อัตโนมัติ
- **จัดการตารางเรียน** — สร้างตารางเรียนตามสาขาวิชา
- **เช็คชื่อเข้าเรียน** — บันทึกการเข้าเรียนรายวัน
- **จัดการข่าวประชาสัมพันธ์** — เผยแพร่ข่าวสารประกาศ
- **จัดการครูอาจารย์** — บันทึกข้อมูลครูผู้สอน
- **จัดการห้องเรียน** — จัดการข้อมูลห้องเรียน
- **จัดการใบสมัคร** — ตรวจสอบและอนุมัติใบสมัคร
- **จัดการสิทธิ์ผู้ใช้** — กำหนดบทบาทผู้ใช้งาน

### 👨‍🏫 ครูอาจารย์ (Teacher)
- **แดชบอร์ด** — ภาพรวมสถิติการสอน
- **เช็คชื่อ** — บันทึกการเข้าเรียนของนักศึกษา
- **ตารางสอน** — ดูตารางสอนประจำสัปดาห์
- **รายชื่อนักศึกษา** — ดูข้อมูลนักศึกษาในชั้นเรียน

### 👨‍🎓 นักศึกษา (Student)
- **แดชบอร์ด** — ภาพรวมข้อมูลส่วนตัว, ตารางเรียน, ข่าวสาร
- **ผลการเรียน** — ดูเกรดและ GPA
- **เช็คชื่อ** — ดูประวัติการเข้าเรียน
- **ตารางเรียน** — ดูตารางเรียนประจำสัปดาห์

### 🔔 ระบบแจ้งเตือน (Notifications)
- แจ้งเตือนแบบ Real-time
- แจ้งเตือนประกาศ, เกรด, เช็คชื่อ, ตารางเรียน
- อ่านแล้ว / ยังไม่อ่าน

### 🎨 ระบบ UI/UX
- รองรับ Dark Mode / Light Mode
- Responsive Design รองรับทุกหน้าจอ
- ระบบแจ้งเตือน Toast
- Export PDF / Excel

---

## 🏗️ เทคโนโลยีที่ใช้

| เทคโนโลยี | รายละเอียด |
|-----------|-----------|
| **React 18** | Frontend Framework |
| **TypeScript** | Type-safe JavaScript |
| **Vite** | Build Tool & Dev Server |
| **Tailwind CSS** | Utility-first CSS Framework |
| **shadcn/ui** | UI Component Library |
| **Supabase** | Backend-as-a-Service (Database, Auth) |
| **React Router** | Client-side Routing |
| **React Query** | Data Fetching & Caching |
| **Recharts** | Charts & Data Visualization |
| **Lucide React** | Icon Library |
| **jsPDF** | PDF Export |
| **xlsx** | Excel Export |
| **Zod** | Schema Validation |

---

## 🚀 วิธีติดตั้งและรัน

### ข้อกำหนด
- **Node.js** 18+
- **npm** 9+

### ขั้นตอนการติดตั้ง

```bash
# 1. Clone โปรเจกต์
git clone https://github.com/Suwannaphum1310/P-BAC.git

# 2. เข้าไปที่โฟลเดอร์โปรเจกต์
cd P-BAC

# 3. ติดตั้ง Dependencies
npm install

# 4. ตั้งค่า Environment Variables
# สร้างไฟล์ .env แล้วเพิ่ม:
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 5. รัน Development Server
npm run dev
```

เปิดเบราว์เซอร์ไปที่ `http://localhost:8080`

### คำสั่งอื่นๆ

```bash
npm run build       # Build สำหรับ Production
npm run preview     # Preview Production Build
npm run lint        # ตรวจสอบ Code Quality
```

---

## 📁 โครงสร้างโปรเจกต์

```
P-BAC/
├── public/                 # Static assets
├── src/
│   ├── assets/             # รูปภาพและไฟล์สื่อ
│   ├── components/         # React Components
│   │   ├── ui/             # shadcn/ui Components
│   │   ├── AdminLayout.tsx
│   │   ├── StudentLayout.tsx
│   │   ├── TeacherLayout.tsx
│   │   ├── NotificationBell.tsx
│   │   └── ...
│   ├── contexts/           # React Context Providers
│   │   ├── AuthContext.tsx
│   │   ├── NotificationContext.tsx
│   │   └── ThemeContext.tsx
│   ├── hooks/              # Custom React Hooks
│   ├── integrations/       # Supabase Client & Types
│   ├── pages/              # หน้าเว็บทั้งหมด
│   │   ├── admin/          # หน้าสำหรับ Admin
│   │   ├── teacher/        # หน้าสำหรับ Teacher
│   │   ├── student/        # หน้าสำหรับ Student
│   │   ├── Login.tsx
│   │   ├── Profile.tsx
│   │   └── ...
│   ├── utils/              # Utility Functions
│   ├── App.tsx             # Main Application
│   ├── main.tsx            # Entry Point
│   └── index.css           # Global Styles
├── supabase/               # Supabase Migrations & Functions
├── package.json
├── tailwind.config.ts
├── vite.config.ts
└── tsconfig.json
```

---

## 👥 ระบบผู้ใช้งาน

| บทบาท | สิทธิ์การเข้าถึง |
|-------|-----------------|
| **Admin** | จัดการข้อมูลทั้งหมด, ดูแลระบบ, อนุมัติใบสมัคร |
| **Teacher** | เช็คชื่อ, ดูตารางสอน, ดูรายชื่อนักศึกษา |
| **Student** | ดูผลการเรียน, ตารางเรียน, ประวัติเช็คชื่อ |

---

## 🗄️ ฐานข้อมูล (Supabase)

ตารางหลักในระบบ:

| ตาราง | คำอธิบาย |
|-------|---------|
| `profiles` | ข้อมูลโปรไฟล์ผู้ใช้ |
| `students` | ข้อมูลนักศึกษา |
| `teachers` | ข้อมูลครูอาจารย์ |
| `departments` | ข้อมูลสาขาวิชา |
| `subjects` | ข้อมูลรายวิชา |
| `grades` | ข้อมูลผลการเรียน |
| `attendance` | ข้อมูลการเช็คชื่อ |
| `schedule_entries` | ข้อมูลตารางเรียน/ตารางสอน |
| `rooms` | ข้อมูลห้องเรียน |
| `news` | ข้อมูลข่าวประชาสัมพันธ์ |
| `notifications` | ข้อมูลการแจ้งเตือน |
| `user_roles` | ข้อมูลสิทธิ์ผู้ใช้ |

---

## 📸 ภาพตัวอย่าง

> 📌 เร็วๆ นี้...

---

## 👨‍💻 ผู้พัฒนา

- **Suwannaphum1310** — [GitHub](https://github.com/Suwannaphum1310)

---

## 📄 License

This project is for educational purposes.
