import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';

interface ThemeToggleProps {
    showLabel?: boolean;
    variant?: 'icon' | 'dropdown';
}

export default function ThemeToggle({ showLabel = false, variant = 'icon' }: ThemeToggleProps) {
    const { theme, setTheme, actualTheme } = useTheme();

    if (variant === 'icon') {
        const cycleTheme = () => {
            if (theme === 'light') setTheme('dark');
            else if (theme === 'dark') setTheme('system');
            else setTheme('light');
        };

        return (
            <button
                onClick={cycleTheme}
                className="p-2 rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
                title={`ธีม: ${theme === 'light' ? 'สว่าง' : theme === 'dark' ? 'มืด' : 'ตามระบบ'}`}
            >
                {actualTheme === 'dark' ? (
                    <Moon size={20} className="text-yellow-400" />
                ) : (
                    <Sun size={20} className="text-amber-500" />
                )}
                {showLabel && (
                    <span className="text-sm">
                        {theme === 'light' ? 'สว่าง' : theme === 'dark' ? 'มืด' : 'อัตโนมัติ'}
                    </span>
                )}
            </button>
        );
    }

    return (
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
            <button
                onClick={() => setTheme('light')}
                className={`p-2 rounded-md transition-all ${theme === 'light'
                        ? 'bg-card shadow-sm text-amber-500'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                title="โหมดสว่าง"
            >
                <Sun size={16} />
            </button>
            <button
                onClick={() => setTheme('dark')}
                className={`p-2 rounded-md transition-all ${theme === 'dark'
                        ? 'bg-card shadow-sm text-yellow-400'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                title="โหมดมืด"
            >
                <Moon size={16} />
            </button>
            <button
                onClick={() => setTheme('system')}
                className={`p-2 rounded-md transition-all ${theme === 'system'
                        ? 'bg-card shadow-sm text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                title="ตามระบบ"
            >
                <Monitor size={16} />
            </button>
        </div>
    );
}
