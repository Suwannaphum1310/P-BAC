import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, GraduationCap, ChevronRight, Sun, Moon } from 'lucide-react';
import logo from '../assets/logo.png';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Dark mode state with localStorage persistence
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('pbac-theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('pbac-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('pbac-theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const navLinks = [
    { href: '/', label: 'หน้าแรก' },
    { href: '/#about', label: 'เกี่ยวกับเรา' },
    { href: '/#courses', label: 'หลักสูตร' },
    { href: '/#contact', label: 'ติดต่อเรา' },
    { href: '/grades', label: 'ตรวจสอบผลการเรียน' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path.split('#')[0]);
  };

  // Check if on a page with light background (not homepage hero)
  const isOnLightPage = location.pathname !== '/';
  const shouldUseDarkText = isScrolled || isOnLightPage;

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${shouldUseDarkText
        ? 'bg-background/95 backdrop-blur-xl shadow-xl border-b border-border/50'
        : 'bg-transparent'
        }`}
    >
      <div className="container mx-auto">
        <div className="flex items-center justify-center h-20 lg:h-24 px-4 lg:px-8 gap-10 lg:gap-20">
          {/* Left Block: Logo */}
          <div className="flex-none items-center justify-start">
            <Link
              to="/"
              className="flex items-center gap-3 lg:gap-4 group flex-shrink-0"
            >
              <div className={`relative p-2 lg:p-2 rounded-xl transition-all duration-300 ${shouldUseDarkText ? 'bg-primary/10' : 'bg-background/20 backdrop-blur-sm'
                }`}>
                <img
                  src={logo}
                  alt="P-BAC Logo"
                  className="h-10 lg:h-12 w-auto transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <div className="flex flex-col">
                <span className={`font-bold text-lg lg:text-xl leading-tight transition-colors duration-300 whitespace-nowrap ${shouldUseDarkText ? 'text-primary' : 'text-primary-foreground'
                  }`}>
                  วิทยาลัยเทคโนโลยี
                </span>
                <span className={`text-sm lg:text-base font-medium transition-colors duration-300 whitespace-nowrap ${isScrolled ? 'text-secondary' : 'text-secondary'
                  }`}>
                  ภูเวียงบัณฑิต (P-BAC)
                </span>
              </div>
            </Link>
          </div>

          {/* Center Block: Navigation */}
          <nav className="hidden xl:flex items-center justify-center flex-none px-2 lg:px-4">
            <div className={`flex items-center gap-1.5 px-2 py-2 rounded-full transition-all duration-300 ${shouldUseDarkText
              ? 'bg-primary/10 backdrop-blur-md border border-primary/20'
              : 'bg-black/20 backdrop-blur-md border border-white/10'
              }`}>
              {navLinks.map((link) => {
                const isHashLink = link.href.includes('#');
                const baseClassName = `relative px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 cursor-pointer whitespace-nowrap ${isActive(link.href)
                  ? 'bg-primary text-white shadow-lg'
                  : shouldUseDarkText
                    ? 'text-primary hover:bg-primary/20'
                    : 'text-white hover:bg-white/10'
                  }`;

                if (isHashLink) {
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      className={baseClassName}
                    >
                      {link.label}
                    </a>
                  );
                }

                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={baseClassName}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Right Block: Action Buttons */}
          <div className="hidden lg:flex flex-none items-center justify-end gap-3 lg:gap-4 min-w-0">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-2.5 rounded-full transition-all duration-300 ${shouldUseDarkText
                ? 'text-foreground hover:bg-muted'
                : 'text-primary-foreground hover:bg-white/20'
                }`}
              aria-label="สลับโหมดมืด/สว่าง"
              title={isDarkMode ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <Link
              to="/student-login"
              className={`group flex items-center gap-2 px-6 lg:px-7 py-2.5 rounded-full font-medium text-sm transition-all duration-300 border whitespace-nowrap ${shouldUseDarkText
                ? 'border-[#10B981] text-[#10B981] hover:bg-[#10B981] hover:text-white'
                : 'border-green-400 text-green-400 hover:bg-green-400/20'
                }`}
            >
              <GraduationCap size={16} />
              <span>สำหรับนักศึกษา</span>
            </Link>
            <Link
              to="/login"
              className={`group flex items-center gap-2 px-6 lg:px-7 py-2.5 rounded-full font-medium text-sm transition-all duration-300 border whitespace-nowrap ${shouldUseDarkText
                ? 'border-primary text-primary hover:bg-primary hover:text-white'
                : 'border-white text-white hover:bg-white/20'
                }`}
            >
              <GraduationCap size={16} />
              <span>สำหรับอาจารย์</span>
            </Link>
            <Link
              to="/register"
              className="group flex items-center gap-2 bg-[#8B0000] text-white px-7 lg:px-9 py-2.5 rounded-full font-medium text-sm shadow-lg hover:bg-red-900 transition-all duration-300 whitespace-nowrap"
            >
              <span>สมัครเรียน</span>
              <ChevronRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex-1 flex justify-end">
            <button
              className={`p-2.5 rounded-xl transition-all duration-300 ${shouldUseDarkText
                ? 'text-foreground hover:bg-muted'
                : 'text-primary-foreground hover:bg-background/20'
                }`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav
        className={`lg:hidden absolute top-full left-0 w-full bg-card backdrop-blur-xl shadow-2xl border-t border-border/50 transition-all duration-500 overflow-hidden ${isMobileMenuOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'
          }`}
      >
        <div className="container flex flex-col gap-2 p-4">
          {navLinks.map((link, index) => {
            const isHashLink = link.href.includes('#');
            const baseClassName = `py-4 px-5 rounded-xl font-medium transition-all duration-300 flex items-center justify-between ${isActive(link.href)
              ? 'bg-primary text-primary-foreground shadow-lg'
              : 'text-card-foreground hover:bg-muted'
              }`;

            if (isHashLink) {
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={baseClassName}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <span>{link.label}</span>
                  <ChevronRight size={18} className={isActive(link.href) ? 'text-primary-foreground' : 'text-card-foreground/60'} />
                </a>
              );
            }

            return (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={baseClassName}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span>{link.label}</span>
                <ChevronRight size={18} className={isActive(link.href) ? 'text-primary-foreground' : 'text-card-foreground/60'} />
              </Link>
            );
          })}

          {/* Mobile Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="py-4 px-5 rounded-xl font-medium text-card-foreground hover:bg-muted flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full border border-primary flex items-center justify-center text-primary">
              {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
            </div>
            <span>{isDarkMode ? 'โหมดสว่าง' : 'โหมดมืด'}</span>
          </button>

          <div className="h-px bg-border my-2" />

          <Link
            to="/student-login"
            onClick={() => setIsMobileMenuOpen(false)}
            className="py-4 px-5 rounded-xl font-medium text-card-foreground hover:bg-muted flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full border border-[#10B981] flex items-center justify-center text-[#10B981]">
              <GraduationCap size={14} />
            </div>
            <span>สำหรับนักศึกษา</span>
          </Link>

          <Link
            to="/login"
            onClick={() => setIsMobileMenuOpen(false)}
            className="py-4 px-5 rounded-xl font-medium text-card-foreground hover:bg-muted flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full border border-primary flex items-center justify-center text-primary">
              <GraduationCap size={14} />
            </div>
            <span>สำหรับอาจารย์</span>
          </Link>

          <Link
            to="/register"
            onClick={() => setIsMobileMenuOpen(false)}
            className="bg-[#8B0000] text-white py-4 px-5 rounded-xl font-medium text-center mt-2 shadow-lg flex items-center justify-center gap-2"
          >
            <span>สมัครเรียน</span>
            <ChevronRight size={18} />
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default Header;
