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

        <div className="footer-links">
          <a href="#">Privacy Policy</a>
          <span className="separator">•</span>
          <a href="#">Terms of Service</a>
          <span className="separator">•</span>
          <a href="#">Help Center</a>
        </div>

        <div className="footer-right">
          <div className='footer-right-vs'>
            <span className="version-tag">v2.5.0 (Beta)</span>
            <div className="social-icons">
             <div style={{marginRight:'10px'}}><Github size={20} /></div> 
              <Twitter size={20} />
            </div>
          </div>
        </div>

      </div>
      
      <div className="footer-bottom">
         Made with <Heart size={12} fill="red" color="red" style={{margin:'0 4px'}} /> by Somjeed Team
      </div>
    </footer>
  );
};

export default Footer;