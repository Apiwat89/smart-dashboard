import React from 'react';
import { LogOut, LayoutDashboard, Map, BarChart, Menu } from 'lucide-react'; // ⭐ 1. Import ไอคอนที่ต้องใช้

const Sidebar = ({ isCollapsed, toggle, menuItems, activePageId, onMenuClick, onLogout }) => {

  // ⭐ 2. ฟังก์ชันเลือกไอคอนตามชื่อที่ส่งมา
  const getIcon = (iconName) => {
      switch(iconName) {
          case 'LayoutDashboard': return <LayoutDashboard size={20} />;
          case 'Map': return <Map size={20} />;
          case 'BarChart': return <BarChart size={20} />;
          default: return <LayoutDashboard size={20} />;
      }
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* ส่วน Header */}
      <div className="sidebar-header">
         <div className="logo"><img src="./logo.png" alt="" /></div>
         <button onClick={toggle}>
            <Menu size={24} /> {/* ใช้ไอคอน Menu แทนตัวอักษร ☰ */}
         </button>
      </div>

      {/* เมนูต่างๆ */}
      <div className="sidebar-menu">
        {menuItems.map((item) => (
          <div 
            key={item.id} 
            className={`menu-item ${activePageId === item.id ? 'active' : ''}`}
            onClick={() => onMenuClick(item.id)}
            title={isCollapsed ? item.title : ""} /* เอาเมาส์ชี้แล้วขึ้นชื่อ */
          >
            {/* ⭐ 3. แสดงไอคอนตรงนี้ (มันจะไม่ถูกซ่อนโดย CSS) */}
            {getIcon(item.icon)}
            
            {/* ข้อความ (ตัวนี้จะถูก CSS สั่งซ่อนเมื่อ collapsed) */}
            <span>{item.title}</span>
          </div>
        ))}
      </div>

      {/* ปุ่ม Logout */}
      <div className="sidebar-footer">
          <button onClick={onLogout} className="logout-btn" title="ออกจากระบบ">
              <LogOut size={20} />
              <span className="logout-text">ออกจากระบบ</span>
          </button>
      </div>
    </aside>
  );
};

export default Sidebar;