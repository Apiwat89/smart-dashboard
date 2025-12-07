import React from 'react';
import { LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react';

const Sidebar = ({ isCollapsed, toggle }) => (
  <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
    <div className="brand-wrapper">
      <div className="brand-icon">S</div>
      <span className="brand-text">SOMJEED</span>
      {!isCollapsed && <button className="toggle-btn" onClick={toggle}><ChevronLeft size={16}/></button>}
    </div>
    {isCollapsed && <button className="toggle-btn" style={{margin:'0 auto 20px'}} onClick={toggle}><ChevronRight size={16}/></button>}
    
    <nav className="sidebar-nav">
       <div className="menu-item active"><LayoutGrid size={20}/> <span className="menu-text">Overview</span></div>
    </nav>
  </aside>
);
export default Sidebar;