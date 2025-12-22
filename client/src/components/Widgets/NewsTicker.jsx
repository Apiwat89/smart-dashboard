// NewsTicker.jsx

const NewsTicker = ({ text, type = 'info' }) => {
  if (!text) return null;

  return (
    <div className="ticker-container">
      <div 
        className="ticker-label" 
        style={{ backgroundColor: type === 'alert' ? '#ff4757' : '#00c49f' }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {type === 'alert' ? <AlertTriangle size={18} /> : <Info size={18} />}
            {type === 'alert' ? 'CRITICAL UPDATE' : 'LIVE DASHBOARD'}
        </span>
      </div>

      <div className="ticker-track">
        <div className="ticker-content">
          {/* ทำซ้ำข้อความ 4 ครั้งเพื่อให้ตัววิ่งต่อเนื่องกันสนิทแม้ข่าวจะยาว */}
          {[1, 2, 3, 4].map((i) => (
            <span key={i}>
              {text} &nbsp;&nbsp;&nbsp;&nbsp; ● &nbsp;&nbsp;&nbsp;&nbsp;
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};