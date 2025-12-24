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
  onCapture, isCapturing,
  rightPanelWidth,     // ⭐ รับเพิ่ม
  onResizerMouseDown,  // ⭐ รับเพิ่ม
}) => {
  return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
          <div 
          className="app-container"
          style={{ 
            display: 'grid',
            // 1fr ตรงกลางคือหัวใจสำคัญที่ทำให้ไม่มีช่องว่าง
            gridTemplateColumns: `${isSidebarCollapsed ? '72px' : '240px'} 1fr auto ${rightPanelWidth}px`,
            gridTemplateAreas: '"sidebar header header header" "sidebar main resizer right"',
          }}
        >
        <Sidebar 
            isCollapsed={isSidebarCollapsed} 
            toggle={toggleSidebar} 
            menuItems={menuItems} // ⭐ เช็คบรรทัดนี้ว่ามีไหม
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

        <div 
          className="resizer-bar" 
          onMouseDown={onResizerMouseDown}
          style={{ gridArea: 'resizer' }}
        />

        <RightPanel {...rightPanelProps} />
      </div>
      
      <div style={{ flexShrink: 0, height: '40px', zIndex: 10000, background: 'white' }}>
         <NewsTicker text={newsText} type={newsType} />
         {/* <Footer /> */}
      </div>
    </div>
  );
};

export default DashboardLayout;