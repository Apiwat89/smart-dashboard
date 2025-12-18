import React from 'react';

const NotificationDropdown = ({ notifications, onClose }) => {
  return (
    <>
      {/* 1. ฉากหลังใสๆ (Backdrop) */}
      <div 
        style={{ position: 'fixed', inset: 0, zIndex: 99 }} 
        onClick={onClose}
      />

      {/* 2. ตัวกล่อง Dropdown */}
      <div className="notification-dropdown fade-in" style={{
        position: 'absolute',
        top: '55px', // ขยับขึ้นมานิดนึงให้ชิดกระดิ่ง
        right: '300px',  // ชิดขวาเทียบกับปุ่มแม่
        width: '320px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 5px 20px rgba(0,0,0,0.15)',
        border: '1px solid #f0f0f0',
        zIndex: 10000,
        overflow: 'hidden',
        display: 'flex',       // จัด Layout ใหม่
        flexDirection: 'column',
        backgroundColor: "var(--bg-card)"
      }}>
        {/* Header */}
        <div style={{ padding: '15px', borderBottom: '1px solid #f5f5f5', fontWeight: 600, color: "var(--text-main)", backgroundColor: "var(--bg-card)" }}>
           🔔 การแจ้งเตือน ({notifications.length})
        </div>

        {/* List Items */}
        <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
           {notifications.length === 0 ? (
               <div style={{ padding: '30px 20px', textAlign: 'center', color: '#a4b0be', fontSize: '0.9rem' }}>
                   ไม่มีการแจ้งเตือนใหม่
               </div>
           ) : (
               notifications.map((notif, index) => (
                   <div key={index} style={{
                       padding: '12px 15px',
                       borderBottom: '1px solid #f9f9f9',
                       cursor: 'default', // เปลี่ยน cursor เป็นธรรมดาเพราะกดไปก็ไม่มีอะไรเกิดขึ้น
                       display: 'flex',
                       gap: '12px',
                       alignItems: 'start',
                       transition: '0.2s'
                   }}
                   onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-card)"}
                   onMouseLeave={(e) => e.currentTarget.style.background = "var(--bg-card)"}
                   >
                       {/* ไอคอน */}
                       <div style={{ fontSize: '1.2rem', marginTop: '2px'}}>
                           {notif.type === 'alert' ? '🔴' : notif.type === 'info' ? 'ℹ️' : '✅'}
                       </div>
                       
                       {/* เนื้อหา */}
                       <div style={{ flex: 1 }}>
                           <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '2px', color: "var(--text-muted)"}}>
                               {notif.title}
                           </div>
                           <div style={{ fontSize: '0.8rem', lineHeight: '1.4', color:"var(--text-muted)" }}>
                               {notif.message}
                           </div>
                           <div style={{ fontSize: '0.7rem', marginTop: '6px', textAlign: 'right' }}>
                               {notif.time}
                           </div>
                       </div>
                   </div>
               ))
           )}
        </div>
        
        {/* ❌ ลบส่วน Footer "ดูทั้งหมด" ทิ้งไปแล้ว */}
      </div>
    </>
  );
};

export default NotificationDropdown;