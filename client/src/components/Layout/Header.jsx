import React, { useState } from 'react';
import { Bell, Moon, Sun, Play, Pause, Timer} from 'lucide-react'; // ⭐ Import Play/Pause เพิ่ม
import NotificationDropdown from '../Widgets/NotificationDropdown'; 
import CaptureButton from '../Widgets/CaptureButton';

const formatTime = (seconds) => {
   if (seconds < 60) return `${seconds}s`; // ถ้าน้อยกว่า 60 วิ ให้โชว์ "15s" ปกติ
   
   const m = Math.floor(seconds / 60);
   const s = seconds % 60;
   // ถ้านาทีขึ้นไป ให้โชว์แบบ "1:05m"
   return `${m}:${s.toString().padStart(2, '0')}m`;
 };

// รับ isPlaying, togglePlay เข้ามา
const Header = ({ user, title, lastUpdated, notifications = [], theme, toggleTheme, isPlaying, togglePlay, autoPlayCountdown, onCapture, isCapturing}) => {
   const [showNotif, setShowNotif] = useState(false);

   return (
     <header className="header" style={{ 
         position: 'relative', 
         background: 'var(--bg-card)',
         borderBottom: '1px solid var(--border-color)',
         color: 'var(--text-main)'
     }}>
        
        {/* ส่วน Title */}
        <div className="header-title-section" style={{ flex: 1 }}>
           <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)', fontWeight: 600 }}>
              {title || "Overview Dashboard"} 
           </h2>
           <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
              ข้อมูลอัปเดตล่าสุด: {lastUpdated || new Date().toLocaleDateString('th-TH')}
           </span>
        </div>

        {/* ส่วน User Profile (ขวา) */}
        <div className="user-profile">
           
            <div style={{
               display: 'flex', alignItems: 'center',
               background: isPlaying ? 'rgba(0, 196, 159, 0.1)' : 'var(--bg-input)',
               border: `1px solid ${isPlaying ? 'var(--primary-green)' : 'var(--border-color)'}`,
               borderRadius: '30px', 
               padding: '4px 6px 4px 12px',
               marginRight: '15px',
               transition: 'all 0.3s ease',
               minWidth: '90px', // กำหนดความกว้างขั้นต่ำ กันกล่องยืดหดวูบวาบตอนเลขเปลี่ยนหลัก
               justifyContent: 'space-between'
           }}>
               {/* ส่วนแสดงเวลา (เรียกใช้ฟังก์ชัน formatTime) */}
               <div style={{ 
                   display: 'flex', alignItems: 'center', gap: '6px', 
                   marginRight: '8px',
                   color: isPlaying ? 'var(--primary-green)' : 'var(--text-muted)',
                   fontWeight: '600', fontSize: '0.85rem'
               }}>
                   <Timer size={16} />
                   <span style={{ fontVariantNumeric: 'tabular-nums' }}> {/* tabular-nums ช่วยให้เลขไม่กระดึ๊บ */}
                      {formatTime(autoPlayCountdown)}
                   </span>
               </div>

               {/* ปุ่ม Play/Pause เหมือนเดิม */}
               <button 
                  onClick={togglePlay}
                  style={{
                      background: isPlaying ? 'var(--primary-green)' : 'var(--bg-card)',
                      border: isPlaying ? 'none' : '1px solid var(--border-color)', 
                      cursor: 'pointer', padding: '6px', borderRadius: '50%',
                      color: isPlaying ? 'white' : 'var(--text-muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s'
                  }}
               >
                  {isPlaying ? <Pause size={14} fill="white" /> : <Play size={14} style={{ marginLeft: '2px' }} />}
               </button>
           </div>

           {/* ปุ่ม Capture */}
           <CaptureButton onCapture={onCapture} isCapturing={isCapturing} />
        
           {/* ปุ่ม Theme */}
           <button 
              onClick={toggleTheme}
              style={{ 
                  background: 'var(--bg-hover)',
                  border: '1px solid var(--border-color)', 
                  cursor: 'pointer', marginRight: '10px', padding: '8px',
                  borderRadius: '50%', color: 'var(--text-main)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
           >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
           </button>
           
           {/* ปุ่ม Notification */}
           <button 
              onClick={() => setShowNotif(!showNotif)} 
              style={{ 
                  background: 'none', border: 'none', cursor: 'pointer', 
                  marginRight: '15px', color: 'var(--text-muted)', position: 'relative', 
                  display: 'flex', alignItems: 'center'
              }}
           >
              <Bell size={22} />
              {notifications.length > 0 && (
                  <span style={{
                      position: 'absolute', top: '5px', right: '10px',
                      width: '8px', height: '8px', background: '#ff4757',
                      borderRadius: '50%', border: '1px solid var(--bg-card)'
                  }} />
              )}
           </button>

           {/* ชื่อและ Avatar */}
           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: '1.3', marginRight: '12px' }}>
               <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)' }}>{user.name}</span>
               <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>{user.role}</span>
           </div>

           <img 
             src={user.avatar || "https://cdn-icons-png.flaticon.com/512/847/847969.png"} 
             alt="user" className="avatar" 
             style={{ border: '2px solid var(--border-color)' }} 
           />
        </div>

        {showNotif && (
            <NotificationDropdown notifications={notifications} onClose={() => setShowNotif(false)} />
        )}
     </header>
   );
};

export default Header;