import React from 'react';
import { LayoutDashboard, BarChart, Users, Globe, PieChart, Settings, Menu } from 'lucide-react';

const IconMap = {
  LayoutDashboard, BarChart, Users, Globe, PieChart, Settings
};

const Sidebar = ({ isCollapsed, toggle, menuItems = [], activePageId, onMenuClick }) => {
  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      
      {/* ส่วนหัว Logo */}
      <div className="sidebar-header" style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
         <div style={{
             width:'36px', height:'36px', 
             background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', // สีเขียวน้องส้มจี๊ด
             borderRadius:'10px', 
             display:'flex', alignItems:'center', justifyContent:'center',
             color:'white', fontWeight:'bold', flexShrink: 0
         }}>
            S
         </div>
         {!isCollapsed && <span style={{marginLeft:'12px', fontWeight:'700', fontSize:'1.2rem', color:'#334155'}}>Somjeed</span>}
      </div>

      {/* ส่วนเมนู */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
           const Icon = IconMap[item.icon] || LayoutDashboard; 
           // เช็คว่าเมนูนี้ถูกเลือกอยู่หรือเปล่า
           const isActive = activePageId === item.id;

           return (
             <button 
               key={item.id}
               className={`nav-item ${isActive ? 'active' : ''}`} // ใส่ class active
               onClick={() => onMenuClick(item.id)}
               title={item.title} // Tooltip ตอนพับจอ
               style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}
             >
               <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
               {!isCollapsed && <span style={{whiteSpace:'nowrap'}}>{item.title}</span>}
             </button>
           );
        })}
      </nav>
      
      {/* ปุ่มพับเมนู */}
      <div className="sidebar-footer" onClick={toggle}>
          {isCollapsed ? <Menu size={20}/> : 'Collapse Menu'}
      </div>
    </aside>
  );
};

export default Sidebar;