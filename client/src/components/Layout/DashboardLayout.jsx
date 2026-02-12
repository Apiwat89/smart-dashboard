import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import RightPanel from './RightPanel';
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
  theme, toggleTheme,
  isPlaying, togglePlay, autoPlayCountdown,
  newsText,    
  newsType,   
  rightPanelWidth,    
  onResizerMouseDown, 
  lastUpdated
}) => {
  return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
          <div 
            className={`app-container ${isSidebarCollapsed ? 'sidebar-closed' : ''}`}
            style={{ 
              display: 'grid', '--dynamic-right-width': `${rightPanelWidth}px`,
              gridTemplateColumns: `var(--current-sidebar-width, ${isSidebarCollapsed ? '72px' : '240px'}) 1fr auto var(--dynamic-right-width)`,
              gridTemplateAreas: '"sidebar header header header" "sidebar main resizer right"',
            }}
        >
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
            theme={theme}
            toggleTheme={toggleTheme}
            isPlaying={isPlaying}     
            togglePlay={togglePlay}   
            autoPlayCountdown={autoPlayCountdown}    
            lastUpdated={lastUpdated}
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
      
      <div style={{ flexShrink: 0, height: '40px', zIndex: 10000, background: 'white'}}>
            <NewsTicker text={newsText} type={newsType} />
      </div>
    </div>
  );
};

export default DashboardLayout;