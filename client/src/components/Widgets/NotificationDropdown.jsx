import React from 'react';

const NotificationDropdown = ({ notifications, onClose }) => {
  const styles = {
    overlay: { position: 'fixed', inset: 0, zIndex: 99 },
    dropdown: {
      position: 'absolute',
      top: '55px',
      right: '300px',
      width: '320px',
      background: 'var(--bg-card)',
      borderRadius: '12px',
      boxShadow: '0 5px 20px rgba(0,0,0,0.15)',
      border: '1px solid #f0f0f0',
      zIndex: 10000,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    },
    header: { padding: '15px', borderBottom: '1px solid #f5f5f5', fontWeight: 600, color: "var(--text-main)" },
    list: { maxHeight: '350px', overflowY: 'auto' },
    empty: { padding: '30px 20px', textAlign: 'center', color: '#a4b0be', fontSize: '0.9rem' },
    item: {
      padding: '12px 15px',
      borderBottom: '1px solid #f9f9f9',
      cursor: 'default',
      display: 'flex',
      gap: '12px',
      alignItems: 'start',
      transition: '0.2s'
    }
  };

  return (
    <>
      <div style={styles.overlay} onClick={onClose} />
      
      <div className="notification-dropdown fade-in" style={styles.dropdown}>
        <div style={styles.header}>🔔 การแจ้งเตือน ({notifications.length})</div>
        
        <div style={styles.list}>
          {notifications.length === 0 ? (
            <div style={styles.empty}>ไม่มีการแจ้งเตือนใหม่</div>
          ) : (
            notifications.map((notif, index) => (
              <div 
                key={index} 
                style={styles.item}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ fontSize: '1.2rem', marginTop: '2px' }}>
                  {notif.type === 'alert' ? '🔴' : notif.type === 'info' ? 'ℹ️' : '✅'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '2px', color: "var(--text-muted)" }}>{notif.title}</div>
                  <div style={{ fontSize: '0.8rem', lineHeight: '1.4', color: "var(--text-muted)" }}>{notif.message}</div>
                  <div style={{ fontSize: '0.7rem', marginTop: '6px', textAlign: 'right' }}>{notif.time}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationDropdown;