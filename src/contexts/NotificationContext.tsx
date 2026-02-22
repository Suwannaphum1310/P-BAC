import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'class' | 'grade' | 'announcement' | 'attendance';
    read: boolean;
    createdAt: Date;
    link?: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    clearNotification: (id: string) => Promise<void>;
    addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => Promise<void>;
    refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [channel, setChannel] = useState<RealtimeChannel | null>(null);

    // Fetch notifications from database
    const fetchNotifications = useCallback(async () => {
        if (!user) {
            setNotifications([]);
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await (supabase as any)
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error('Error fetching notifications:', error);
                // Fall back to sample notifications if table doesn't exist
                if (error.code === '42P01' || error.message?.includes('does not exist')) {
                    setNotifications(getSampleNotifications());
                }
                return;
            }

            const formattedNotifications: Notification[] = (data || []).map(n => ({
                id: n.id,
                title: n.title,
                message: n.message,
                type: n.type as Notification['type'],
                read: n.read,
                createdAt: new Date(n.created_at),
                link: n.link || undefined,
            }));

            setNotifications(formattedNotifications);
        } catch (error) {
            console.error('Error:', error);
            // Use sample notifications as fallback
            setNotifications(getSampleNotifications());
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Sample notifications for when database isn't set up
    const getSampleNotifications = (): Notification[] => [
        {
            id: '1',
            title: '📢 ประกาศ',
            message: 'กำหนดส่งรายงานวิชา Computer Science ภายในวันศุกร์ที่ 15 ม.ค.',
            type: 'announcement',
            read: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 30),
            link: '/student/schedule',
        },
        {
            id: '2',
            title: '📚 คาบเรียนถัดไป',
            message: 'วิชาคณิตศาสตร์ ห้อง 301 ในอีก 15 นาที',
            type: 'class',
            read: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 10),
        },
        {
            id: '3',
            title: '🎉 ประกาศผลสอบ',
            message: 'ผลสอบกลางภาควิชาภาษาอังกฤษประกาศแล้ว',
            type: 'grade',
            read: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
            link: '/student/grades',
        },
        {
            id: '4',
            title: '✅ เช็คชื่อสำเร็จ',
            message: 'บันทึกการเข้าเรียนวิชาคอมพิวเตอร์เรียบร้อยแล้ว',
            type: 'success',
            read: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        },
    ];

    // Set up realtime subscription
    useEffect(() => {
        if (!user) return;

        fetchNotifications();

        // Subscribe to realtime changes
        const realtimeChannel = supabase
            .channel(`notifications:${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newNotification: Notification = {
                            id: payload.new.id,
                            title: payload.new.title,
                            message: payload.new.message,
                            type: payload.new.type as Notification['type'],
                            read: payload.new.read,
                            createdAt: new Date(payload.new.created_at),
                            link: payload.new.link || undefined,
                        };
                        setNotifications(prev => [newNotification, ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        setNotifications(prev =>
                            prev.map(n =>
                                n.id === payload.new.id
                                    ? { ...n, read: payload.new.read }
                                    : n
                            )
                        );
                    } else if (payload.eventType === 'DELETE') {
                        setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        setChannel(realtimeChannel);

        return () => {
            if (realtimeChannel) {
                supabase.removeChannel(realtimeChannel);
            }
        };
    }, [user, fetchNotifications]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = async (id: string) => {
        // Optimistic update
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );

        try {
            const { error } = await (supabase as any)
                .from('notifications')
                .update({ read: true })
                .eq('id', id);

            if (error && error.code !== '42P01') {
                console.error('Error marking as read:', error);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const markAllAsRead = async () => {
        if (!user) return;

        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));

        try {
            const { error } = await (supabase as any)
                .from('notifications')
                .update({ read: true })
                .eq('user_id', user.id)
                .eq('read', false);

            if (error && error.code !== '42P01') {
                console.error('Error marking all as read:', error);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const clearNotification = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.filter(n => n.id !== id));

        try {
            const { error } = await (supabase as any)
                .from('notifications')
                .delete()
                .eq('id', id);

            if (error && error.code !== '42P01') {
                console.error('Error deleting notification:', error);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const addNotification = async (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
        if (!user) return;

        try {
            const { error } = await (supabase as any)
                .from('notifications')
                .insert({
                    user_id: user.id,
                    title: notification.title,
                    message: notification.message,
                    type: notification.type,
                    link: notification.link || null,
                });

            if (error) {
                // If table doesn't exist, just add locally
                if (error.code === '42P01') {
                    const newNotification: Notification = {
                        ...notification,
                        id: Date.now().toString(),
                        read: false,
                        createdAt: new Date(),
                    };
                    setNotifications(prev => [newNotification, ...prev]);
                } else {
                    console.error('Error adding notification:', error);
                }
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const refreshNotifications = async () => {
        await fetchNotifications();
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            markAsRead,
            markAllAsRead,
            clearNotification,
            addNotification,
            refreshNotifications,
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
