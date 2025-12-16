import React from 'react';
import { Bell } from 'lucide-react'; // อย่าลืม import icon กระดิ่งถ้าใช้

const Header = ({ user }) => {
  return (
    <header className="header">
       {/* ส่วน Search Bar (ซ้าย) */}
       <div className="search-bar">
          <input type="text" placeholder="Search..." />
       </div>

       {/* ส่วน User Profile (ขวา) */}
       <div className="user-profile">
          
          {/* ปุ่มกระดิ่งแจ้งเตือน */}
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '10px', color: '#64748b' }}>
             <Bell size={20} />
          </button>

          {/* ⭐ ส่วนแสดงชื่อและ Role (แก้ตรงนี้) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: '1.2', marginRight: '10px' }}>
              <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#2d3436' }}>
                  {user.name}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '500' }}>
                  {user.role}
              </span>
          </div>

          {/* รูป Avatar */}
          <img 
            src={user.avatar || "https://cdn-icons-png.flaticon.com/512/847/847969.png"} // รูป default
            alt="user" 
            className="avatar" 
          />
       </div>
    </header>
  );
};

export default Header;