import React from 'react';
import { Heart, Github, Twitter } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="dashboard-footer">
      <div className="footer-content">
        
        {/* ฝั่งซ้าย: Copyright */}
        <div className="footer-left">
          <span>&copy; {currentYear} <strong>Somjeed System</strong>. All rights reserved.</span>
        </div>

        {/* ตรงกลาง: ลิงก์ต่างๆ
        <div className="footer-links">
          <a href="#">Privacy Policy</a>
          <span className="separator">•</span>
          <a href="#">Terms of Service</a>
          <span className="separator">•</span>
          <a href="#">Help Center</a>
        </div> */}

        {/* ฝั่งขวา: Version & Credit
        <div className="footer-right">
          <span className="version-tag">v2.5.0 (Beta)</span>
          <div className="social-icons">
             <Github size={16} />
             <Twitter size={16} />
          </div>
        </div> */}

      </div>
      
      {/* บรรทัดล่างสุด (Optional): Credit ทีมพัฒนา
      <div className="footer-bottom">
         Made with <Heart size={12} fill="red" color="red" style={{margin:'0 4px'}} /> by Somjeed Team
      </div> */}
    </footer>
  );
};

export default Footer;