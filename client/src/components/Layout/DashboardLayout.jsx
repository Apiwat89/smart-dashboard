import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import RightPanel from './RightPanel';

const DashboardLayout = ({ 
  children, 
  isSidebarCollapsed, toggleSidebar,
  user,
  rightPanelProps,
  summaryWidget,
  scrollRef // ✨ รับ Ref เข้ามาเพื่อจับ Event การเลื่อน
}) => {
  return (
    <div className={`app-container ${isSidebarCollapsed ? 'sidebar-closed' : ''}`}>
      
      <Sidebar isCollapsed={isSidebarCollapsed} toggle={toggleSidebar} />
      <Header user={user} />

      <main className="main-content">
        
        {/* ✨ แปะ ref ไว้ตรงนี้ เพื่อให้ App.jsx มาสั่งจับ event scroll ได้ */}
        <div className="content-scroll-area" ref={scrollRef}>
            <div className="widgets-container">
                {children}
            </div>
            <div className="bottom-spacer" style={{ height: '80px' }}></div>
        </div>

        {summaryWidget && (
           <div className="fixed-bottom-summary">
              {summaryWidget}
           </div>
        )}

      </main>

      <RightPanel {...rightPanelProps} />
    </div>
  );
};

export default DashboardLayout;