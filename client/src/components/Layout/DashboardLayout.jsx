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
  scrollRef 
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <div 
        className={`app-container ${isSidebarCollapsed ? 'sidebar-closed' : ''}`}
        style={{ flex: 1, height: 'auto', minHeight: 0 }} 
      >
        <Sidebar isCollapsed={isSidebarCollapsed} toggle={toggleSidebar} />
        <Header user={user} />

        <main className="main-content">
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

      <div style={{ flexShrink: 0, zIndex: 100, background: 'white'}}>
         <Footer />
      </div>
    </div>
  );
};

export default DashboardLayout;