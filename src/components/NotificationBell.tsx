import { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, ExternalLink } from 'lucide-react';
import { useNotifications, Notification } from '@/contexts/NotificationContext';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

export default function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getTypeIcon = (type: Notification['type']) => {
        switch (type) {
            case 'class': return '📚';
            case 'grade': return '📊';
            case 'announcement': return '📢';
            case 'success': return '✅';
            case 'warning': return '⚠️';
            default: return 'ℹ️';
        }
    };

    const getTypeBg = (type: Notification['type']) => {
        switch (type) {
            case 'class': return 'bg-blue-100 dark:bg-blue-900/30';
            case 'grade': return 'bg-purple-100 dark:bg-purple-900/30';
            case 'announcement': return 'bg-amber-100 dark:bg-amber-900/30';
            case 'success': return 'bg-emerald-100 dark:bg-emerald-900/30';
            case 'warning': return 'bg-red-100 dark:bg-red-900/30';
            default: return 'bg-gray-100 dark:bg-gray-900/30';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-muted transition-colors"
                title="การแจ้งเตือน"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-card rounded-xl shadow-xl border border-border/50 overflow-hidden z-[100]">
                    {/* Header */}
                    <div className="px-4 py-3 bg-muted/50 border-b border-border/50 flex items-center justify-between">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Bell size={16} />
                            การแจ้งเตือน
                            {unreadCount > 0 && (
                                <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                                    {unreadCount} ใหม่
                                </span>
                            )}
                        </h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                                <CheckCheck size={14} />
                                อ่านทั้งหมด
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground">
                                <Bell size={32} className="mx-auto mb-2 opacity-30" />
                                <p className="text-sm">ไม่มีการแจ้งเตือน</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    onClick={() => {
                                        if (notification.link) {
                                            markAsRead(notification.id);
                                            setIsOpen(false);
                                            window.location.href = notification.link;
                                        }
                                    }}
                                    className={`relative px-4 py-3 border-b border-border/30 hover:bg-muted/50 transition-colors cursor-pointer ${!notification.read ? 'bg-primary/5' : ''
                                        }`}
                                >
                                    {/* Unread indicator */}
                                    {!notification.read && (
                                        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full" />
                                    )}

                                    <div className="flex gap-3">
                                        {/* Icon */}
                                        <div className={`w-10 h-10 rounded-lg ${getTypeBg(notification.type)} flex items-center justify-center flex-shrink-0`}>
                                            <span className="text-lg">{getTypeIcon(notification.type)}</span>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm">{notification.title}</p>
                                            <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                                            <p className="text-[10px] text-muted-foreground/60 mt-1">
                                                {formatDistanceToNow(notification.createdAt, { addSuffix: true, locale: th })}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                                            {!notification.read && (
                                                <button
                                                    onClick={() => markAsRead(notification.id)}
                                                    className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                                                    title="ทำเครื่องหมายว่าอ่านแล้ว"
                                                >
                                                    <Check size={14} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => clearNotification(notification.id)}
                                                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-muted-foreground hover:text-red-500"
                                                title="ลบ"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-3 bg-muted/30 border-t border-border/50 text-center">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    markAllAsRead();
                                }}
                                className="text-sm text-primary hover:underline font-medium"
                            >
                                ✓ ปิดและอ่านทั้งหมด
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
