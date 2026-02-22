import { Link } from 'react-router-dom';
import logo from '@/assets/logo.png';

const Footer = () => {
  return (
    <footer className="bg-[#1a1a1a] text-muted-foreground py-12 text-center">
      <div className="container">
        <div className="flex items-center justify-center gap-3 mb-5">
          <img src={logo} alt="P-BAC Logo" className="h-10" />
          <span className="text-white text-xl font-bold">P-BAC</span>
        </div>
        <p className="text-sm border-t border-muted/30 pt-5">
          &copy; 2025 วิทยาลัยเทคโนโลยีภูเวียงบัณฑิต. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
