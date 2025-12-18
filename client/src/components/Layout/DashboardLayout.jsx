import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import RightPanel from './RightPanel';
import Footer from './Footer';
import NewsTicker from '../Widgets/NewsTicker';

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
  theme, toggleTheme,
  // ⭐ รับ props เพิ่ม
  isPlaying, togglePlay, autoPlayCountdown,
  newsText,      // ⭐ รับข้อความข่าวเข้ามา
  newsType,       // ⭐ รับประเภทข่าว (alert/info)
  onCapture, isCapturing
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <div 
        className={`app-container ${isSidebarCollapsed ? 'sidebar-closed' : ''}`}
        style={{ flex: 1, height: 'auto', minHeight: 0 }} 
      >
        <Sidebar 
            isCollapsed={isSidebarCollapsed} 
            toggle={toggleSidebar} 
            menuItems={menuItems}
            activePageId={activePageId}
            onMenuClick={onMenuClick}
            onLogout={onLogout} 
        />

        {/* ⭐ ส่งต่อให้ Header */}
        <Header 
            user={user} 
            title={pageTitle} 
            notifications={notifications}
            theme={theme}
            toggleTheme={toggleTheme}
            isPlaying={isPlaying}     // 👈 ส่งไป
            togglePlay={togglePlay}   // 👈 ส่งไป
            autoPlayCountdown={autoPlayCountdown}
            onCapture={onCapture}     // 👈 ส่งต่อ
            isCapturing={isCapturing} // 👈 ส่งต่อ
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
         <NewsTicker text={newsText} type={newsType} />
         {/* <Footer /> */}
      </div>
    </div>
  );
};

export default DashboardLayout;