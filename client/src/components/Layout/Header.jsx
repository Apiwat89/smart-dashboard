import React, { useState } from 'react';
import { Bell, Moon, Sun, Play, Pause, Timer } from 'lucide-react';
import NotificationDropdown from '../Widgets/NotificationDropdown';

const formatTime = (seconds) => {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}m`;
};

const Header = ({
  user,
  title,
  lastUpdated,
  notifications = [],
  theme,
  toggleTheme,
  isPlaying,
  togglePlay,
  autoPlayCountdown,
}) => {
  const [showNotif, setShowNotif] = useState(false);

  // Styles Object (แยกออกมาเพื่อให้ JSX สะอาดขึ้น)
  const styles = {
    header: {
      position: 'relative',
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-color)',
      color: 'var(--text-main)',
    },
    timerBox: {
      display: 'flex',
      alignItems: 'center',
      background: isPlaying ? 'rgba(0, 196, 159, 0.1)' : 'var(--bg-input)',
      border: `1px solid ${isPlaying ? 'var(--primary-green)' : 'var(--border-color)'}`,
      borderRadius: '30px',
      padding: '4px 6px 4px 12px',
      marginRight: '15px',
      transition: 'all 0.3s ease',
      minWidth: '90px',
      justifyContent: 'space-between',
    },
    playBtn: {
      background: isPlaying ? 'var(--primary-green)' : 'var(--bg-card)',
      border: isPlaying ? 'none' : '1px solid var(--border-color)',
      cursor: 'pointer',
      padding: '6px',
      borderRadius: '50%',
      color: isPlaying ? 'white' : 'var(--text-muted)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s',
    },
    themeBtn: {
      background: 'var(--bg-hover)',
      border: '1px solid var(--border-color)',
      cursor: 'pointer',
      marginRight: '10px',
      padding: '8px',
      borderRadius: '50%',
      color: 'var(--text-main)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    notifBadge: {
      position: 'absolute',
      top: '5px',
      right: '10px',
      width: '8px',
      height: '8px',
      background: '#ff4757',
      borderRadius: '50%',
      border: '1px solid var(--bg-card)',
    },
  };

  return (
    <header className="header" style={styles.header}>
      {/* 1. Title Section */}
      <div className="header-title-section" style={{ flex: 1 }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)', fontWeight: 600 }}>
          {title || "Overview Dashboard"}
        </h2>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
          ข้อมูลอัปเดตล่าสุด: {lastUpdated || new Date().toLocaleDateString('th-TH')}
        </span>
      </div>

      {/* 2. User & Controls Section */}
      <div className="user-profile">
        {/* Timer Control */}
        <div style={styles.timerBox}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '8px', color: isPlaying ? 'var(--primary-green)' : 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>
            <Timer size={16} />
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(autoPlayCountdown)}
            </span>
          </div>
          <button onClick={togglePlay} style={styles.playBtn}>
            {isPlaying ? <Pause size={14} fill="white" /> : <Play size={14} style={{ marginLeft: '2px' }} />}
          </button>
        </div>

        {/* Theme Toggle */}
        <button onClick={toggleTheme} style={styles.themeBtn}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notifications */}
        <button
          onClick={() => setShowNotif(!showNotif)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '15px', color: 'var(--text-muted)', position: 'relative', display: 'flex', alignItems: 'center' }}
        >
          <Bell size={22} />
          {notifications.length > 0 && <span style={styles.notifBadge} />}
        </button>

        {/* User Profile */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: '1.3', marginRight: '12px' }}>
          <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)' }}>{user?.name}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>{user?.role}</span>
        </div>

        <img
          src={user?.avatar || "https://cdn-icons-png.flaticon.com/512/847/847969.png"}
          alt="user"
          className="avatar"
          style={{ border: '2px solid var(--border-color)' }}
        />
      </div>

      {showNotif && (
        <NotificationDropdown notifications={notifications} onClose={() => setShowNotif(false)} />
      )}
    </header>
  );
};

export default Header;