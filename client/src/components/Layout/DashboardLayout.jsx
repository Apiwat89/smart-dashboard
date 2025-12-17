import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import RightPanel from './RightPanel';
import Footer from './Footer';

const DashboardLayout = ({ 
  children, 
  isSidebarCollapsed, toggleSidebar,
  user,
  rightPanelProps,
  summaryWidget,
  scrollRef,
  menuItems,
  activePageId,
  onMenuClick,
  onLogout,
  pageTitle,
  notifications,
  theme, toggleTheme
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <div 
        className={`app-container ${isSidebarCollapsed ? 'sidebar-closed' : ''}`}
        style={{ flex: 1, height: 'auto', minHeight: 0 }} 
      >
        {/* ✅ ส่ง onLogout ต่อไปให้ Sidebar */}
        <Sidebar 
            isCollapsed={isSidebarCollapsed} 
            toggle={toggleSidebar} 
            menuItems={menuItems}
            activePageId={activePageId}
            onMenuClick={onMenuClick}
            onLogout={onLogout} 
        />

        <Header 
            user={user} 
            title={pageTitle} 
            notifications={notifications}
            theme={theme}             // 👈 ส่งต่อ
            toggleTheme={toggleTheme} // 👈 ส่งต่อ
        />

        <main className="main-content">
          <div className="content-scroll-area" ref={scrollRef}>
              <div className="widgets-container">
                  {children}
              </div>
              <div className="bottom-spacer" style={{ height: '80px' }}></div>
          </div>

          <hr style={{width:"95%", border:"1px solid rgba(180, 180, 180, 0.11)", marginTop:'0', marginBottom:'0'}} />
          {summaryWidget && (
             <div className="fixed-bottom-summary">
                {summaryWidget}
             </div>
          )}
        </main>

        <RightPanel {...rightPanelProps} />
      </div>

      <div style={{ flexShrink: 0, zIndex: 100, background: 'white'}}>
         <Footer />
      </div>
    </div>
  );
};

export default DashboardLayout;