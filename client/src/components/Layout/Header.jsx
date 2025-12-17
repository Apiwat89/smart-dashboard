import React, { useState } from 'react';
import { Bell, Moon, Sun } from 'lucide-react'; 
import NotificationDropdown from '../Widgets/NotificationDropdown'; 

const Header = ({ user, title, lastUpdated, notifications = [], theme, toggleTheme }) => {
   const [showNotif, setShowNotif] = useState(false);

   return (
     <header className="header" style={{ 
         position: 'relative', 
         background: 'var(--bg-card)',            // ✅ ใช้ตัวแปร
         borderBottom: '1px solid var(--border-color)', // ✅ ใช้ตัวแปร
         color: 'var(--text-main)'                // ✅ ใช้ตัวแปร
     }}>
        
        {/* ส่วน Title + เวลาอัปเดต */}
        <div className="header-title-section" style={{ flex: 1 }}>
           <h2 style={{ 
               margin: 0, 
               fontSize: '1.25rem', 
               color: 'var(--text-main)',         // ✅ เปลี่ยนจาก #2d3436 เป็นตัวแปร
               fontWeight: 600 
           }}>
              {title || "Overview Dashboard"} 
           </h2>
           <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}> {/* ✅ เปลี่ยนสี */}
              ข้อมูลอัปเดตล่าสุด: {lastUpdated || new Date().toLocaleDateString('th-TH')}
           </span>
        </div>

        {/* ส่วน User Profile (ขวา) */}
        <div className="user-profile">
           
           {/* ปุ่มสลับธีม (Sun/Moon) */}
           <button 
              onClick={toggleTheme}
              style={{ 
                  background: 'var(--bg-hover)',  // ✅ ใช้ตัวแปร
                  border: '1px solid var(--border-color)', 
                  cursor: 'pointer', 
                  marginRight: '10px', 
                  padding: '8px',
                  borderRadius: '50%',
                  color: 'var(--text-main)',      // ✅ ใช้ตัวแปร
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
           >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
           </button>
           
           {/* ปุ่มกระดิ่งแจ้งเตือน */}
           <button 
              onClick={() => setShowNotif(!showNotif)} 
              style={{ 
                  background: 'none', border: 'none', cursor: 'pointer', 
                  marginRight: '15px', 
                  color: 'var(--text-muted)',     // ✅ เปลี่ยนจาก #64748b เป็นตัวแปร
                  position: 'relative', 
                  display: 'flex', alignItems: 'center'
              }}
           >
              <Bell size={22} />
              
              {/* จุดแดงแจ้งเตือน */}
              {notifications.length > 0 && (
                  <span style={{
                      position: 'absolute', top: '0', right: '0', // ปรับตำแหน่งให้ตรงมุมขวาบนของไอคอน
                      width: '8px', height: '8px', background: '#ff4757',
                      borderRadius: '50%', border: '1px solid var(--bg-card)' // ขอบสีเดียวกับพื้นหลัง
                  }} />
              )}
           </button>

           {/* ชื่อและ Role */}
           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: '1.3', marginRight: '12px' }}>
               <span style={{ 
                   fontWeight: '600', 
                   fontSize: '0.9rem', 
                   color: 'var(--text-main)'      // ✅ เปลี่ยนจาก #2d3436 เป็นตัวแปร
               }}>
                   {user.name}
               </span>
               <span style={{ 
                   fontSize: '0.75rem', 
                   color: 'var(--text-muted)',    // ✅ เปลี่ยนจาก #94a3b8 เป็นตัวแปร
                   fontWeight: '500' 
               }}>
                   {user.role}
               </span>
           </div>

           {/* รูป Avatar */}
           <img 
             src={user.avatar || "https://cdn-icons-png.flaticon.com/512/847/847969.png"} 
             alt="user" 
             className="avatar" 
             style={{ border: '2px solid var(--border-color)' }} // ✅ เพิ่มขอบให้ Avatar ดูลอย
           />
        </div>

        {/* Dropdown (แสดงเมื่อกด) */}
        {showNotif && (
            <NotificationDropdown 
                notifications={notifications} 
                onClose={() => setShowNotif(false)} 
            />
        )}
     </header>
   );
};

export default Header;