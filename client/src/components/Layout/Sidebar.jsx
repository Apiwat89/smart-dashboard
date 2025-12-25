import React from 'react';
import { LogOut, LayoutDashboard, Map, BarChart, Menu } from 'lucide-react';

// Icon Mapping Configuration
const ICON_MAP = {
  LayoutDashboard: LayoutDashboard,
  Map: Map,
  BarChart: BarChart,
};

const Sidebar = ({ 
  isCollapsed, 
  toggle, 
  menuItems = [], 
  activePageId, 
  onMenuClick, 
  onLogout 
}) => {
  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        <div className="logo">
          <img src="./logo.png" alt="Logo" />
          <div>Insight Aura</div>
        </div>
        <button onClick={toggle}>
          <Menu size={24} />
        </button>
      </div>

      {/* Menu Items */}
      <div className="sidebar-menu">
        {menuItems?.map((item) => {
          // Dynamic Icon Resolution
          const IconComponent = ICON_MAP[item.icon] || LayoutDashboard;
          
          return (
            <div
              key={item.id}
              className={`menu-item ${activePageId === item.id ? 'active' : ''}`}
              onClick={() => onMenuClick(item.id)}
            >
              <IconComponent size={20} />
              <span>{item.title}</span>
            </div>
          );
        })}
      </div>

      {/* Footer / Logout */}
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