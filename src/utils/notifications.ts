import { supabase } from '@/integrations/supabase/client';

export type NotificationType = 'info' | 'success' | 'warning' | 'class' | 'grade' | 'announcement' | 'attendance';

interface CreateNotificationParams {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    link?: string;
}

/**
 * Create a notification for a single user
 */
export async function createNotification({
    userId,
    title,
    message,
    type,
    link,
}: CreateNotificationParams): Promise<boolean> {
    try {
        const { error } = await (supabase as any)
            .from('notifications')
            .insert({
                user_id: userId,
                title,
                message,
                type,
                link: link || null,
            });

        if (error) {
            console.error('Error creating notification:', error);
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error:', error);
        return false;
    }
}

/**
 * Create notifications for multiple users
 */
export async function createNotificationForUsers(
    userIds: string[],
    title: string,
    message: string,
    type: NotificationType,
    link?: string
): Promise<boolean> {
    if (userIds.length === 0) return true;

    try {
        const notifications = userIds.map(userId => ({
            user_id: userId,
            title,
            message,
            type,
            link: link || null,
        }));

        const { error } = await (supabase as any)
            .from('notifications')
            .insert(notifications);

        if (error) {
            console.error('Error creating notifications:', error);
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error:', error);
        return false;
    }
}

/**
 * Create notification for all users with a specific role
 */
export async function notifyAllStudents(
    title: string,
    message: string,
    type: NotificationType = 'announcement',
    link?: string
): Promise<boolean> {
    try {
        // Get all student user IDs from profiles where role is student
        const { data: students, error: fetchError } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'student');

        if (fetchError) {
            console.error('Error fetching students:', fetchError);
            return false;
        }

        const userIds = students?.map(s => s.id).filter(Boolean) as string[];
        return await createNotificationForUsers(userIds, title, message, type, link);
    } catch (error) {
        console.error('Error:', error);
        return false;
    }
}

/**
 * Create notification for all admins
 */
export async function notifyAllAdmins(
    title: string,
    message: string,
    type: NotificationType = 'info',
    link?: string
): Promise<boolean> {
    try {
        // Get all admin user IDs
        const { data: admins, error: fetchError } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'admin');

        if (fetchError) {
            console.error('Error fetching admins:', fetchError);
            return false;
        }

        const userIds = admins?.map(a => a.id) || [];
        return await createNotificationForUsers(userIds, title, message, type, link);
    } catch (error) {
        console.error('Error:', error);
        return false;
    }
}

/**
 * Create notification for all teachers
 */
export async function notifyAllTeachers(
    title: string,
    message: string,
    type: NotificationType = 'info',
    link?: string
): Promise<boolean> {
    try {
        // Get all teacher user IDs
        const { data: teachers, error: fetchError } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'teacher');

        if (fetchError) {
            console.error('Error fetching teachers:', fetchError);
            return false;
        }

        const userIds = teachers?.map(t => t.id) || [];
        return await createNotificationForUsers(userIds, title, message, type, link);
    } catch (error) {
        console.error('Error:', error);
        return false;
    }
}

// ================== Specific Event Notifications ==================

/**
 * Notify when new news/announcement is published
 */
export async function notifyNewAnnouncement(
    newsTitle: string,
    newsId?: string
): Promise<void> {
    const title = '📢 ประกาศใหม่';
    const message = newsTitle;
    const link = newsId ? `/news` : '/news';

    // Notify all students and teachers
    await Promise.all([
        notifyAllStudents(title, message, 'announcement', link),
        notifyAllTeachers(title, message, 'announcement', link),
    ]);
}

/**
 * Notify admins when new application is submitted
 */
export async function notifyNewApplication(
    applicantName: string,
    applicationId?: string
): Promise<void> {
    const title = '📝 ใบสมัครใหม่';
    const message = `${applicantName} ได้ส่งใบสมัครเข้าเรียน`;
    const link = '/dashboard/applications';

    await notifyAllAdmins(title, message, 'info', link);
}

/**
 * Notify student when attendance is marked
 */
export async function notifyAttendanceMarked(
    studentUserId: string,
    subjectName: string,
    status: 'present' | 'late' | 'absent'
): Promise<void> {
    const statusText = {
        present: '✅ เช็คชื่อสำเร็จ',
        late: '⏰ มาสาย',
        absent: '❌ ขาดเรียน',
    };

    const title = statusText[status];
    const message = `วิชา${subjectName}`;

    await createNotification({
        userId: studentUserId,
        title,
        message,
        type: 'attendance',
        link: '/student/attendance',
    });
}

/**
 * Notify student when grades are published
 */
export async function notifyGradePublished(
    studentUserId: string,
    subjectName: string
): Promise<void> {
    await createNotification({
        userId: studentUserId,
        title: '📊 ประกาศผลสอบ',
        message: `ผลการเรียนวิชา${subjectName}ประกาศแล้ว`,
        type: 'grade',
        link: '/student/grades',
    });
}

/**
 * Notify student about schedule change
 */
export async function notifyScheduleChange(
    studentUserId: string,
    dayOfWeek: string
): Promise<void> {
    await createNotification({
        userId: studentUserId,
        title: '📅 ตารางเรียนเปลี่ยน',
        message: `ตารางเรียนวัน${dayOfWeek}มีการเปลี่ยนแปลง`,
        type: 'class',
        link: '/student/schedule',
    });
}
