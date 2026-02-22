import DashboardLayout from '@/components/DashboardLayout';
import { Users, GraduationCap, BookOpen, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const stats = [
    { icon: Users, label: 'นักศึกษาทั้งหมด', value: '245', color: 'bg-blue-500' },
    { icon: GraduationCap, label: 'นักศึกษาจบปีนี้', value: '52', color: 'bg-green-500' },
    { icon: BookOpen, label: 'รายวิชาที่เปิดสอน', value: '18', color: 'bg-purple-500' },
    { icon: TrendingUp, label: 'เกรดเฉลี่ยรวม', value: '3.25', color: 'bg-orange-500' },
  ];

  return (
    <DashboardLayout title="ภาพรวม">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-card rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center text-card`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">กิจกรรมล่าสุด</h3>
          <div className="space-y-4">
            {[
              { text: 'เพิ่มนักศึกษาใหม่ 3 คน', time: '5 นาทีที่แล้ว' },
              { text: 'อัปเดตผลการเรียน สาขาช่างยนต์', time: '1 ชั่วโมงที่แล้ว' },
              { text: 'ประกาศตารางสอบกลางภาค', time: '2 ชั่วโมงที่แล้ว' },
              { text: 'แก้ไขข้อมูลอาจารย์ 2 ท่าน', time: 'เมื่อวานนี้' },
            ].map((activity, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                <span>{activity.text}</span>
                <span className="text-sm text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">การแจ้งเตือน</h3>
          <div className="space-y-4">
            {[
              { text: 'มีใบสมัครใหม่รอตรวจสอบ 5 ใบ', type: 'warning' },
              { text: 'กำหนดส่งเกรดภายใน 3 วัน', type: 'info' },
              { text: 'ประชุมคณะครู วันศุกร์นี้', type: 'info' },
            ].map((notification, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  notification.type === 'warning' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
                }`}
              >
                {notification.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
