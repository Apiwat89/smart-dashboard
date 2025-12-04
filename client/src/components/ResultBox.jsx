import React, { useState } from 'react'; // ✨ เพิ่ม useState
import { Sparkles, Copy, RefreshCw, ChevronUp, ChevronDown, Loader2, Check } from 'lucide-react'; // ✨ เพิ่ม Check icon

// ✨ รับ onRefresh เข้ามาใน props
const ResultBox = ({ text, isExpanded, toggleExpand, isLoading, onRefresh }) => {
  
  // สร้าง State สำหรับโชว์ว่า "ก๊อปแล้วนะ" (เปลี่ยนไอคอน Copy -> Check)
  const [isCopied, setIsCopied] = useState(false);

  const formatText = (inputText) => {
    if (!inputText) return "";
    const parts = inputText.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} style={{color:'#000'}}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  // 📋 ฟังก์ชันกด Copy
  const handleCopy = (e) => {
      e.stopPropagation(); // กันไม่ให้ไปกดพับกล่อง
      if (!text) return;

      navigator.clipboard.writeText(text).then(() => {
          setIsCopied(true); // เปลี่ยนไอคอนเป็นถูก
          setTimeout(() => setIsCopied(false), 2000); // 2 วิเปลี่ยนกลับ
      });
  };

  // 🔄 ฟังก์ชันกด Refresh
  const handleRefresh = (e) => {
      e.stopPropagation(); // กันไม่ให้ไปกดพับกล่อง
      if (onRefresh) onRefresh(); // เรียกฟังก์ชันวิเคราะห์ใหม่จาก App.jsx
  };

  return (
    <div className="result-box-container">
      
      {/* --- HEADER --- */}
      <div className="result-header" onClick={toggleExpand}>
        <div className="header-left">
           {isLoading ? (
             <Loader2 size={18} className="icon-sparkle spin-anim" />
           ) : (
             <Sparkles size={18} className="icon-sparkle" />
           )}
           <span 
             className="header-title" 
             style={{ 
               color: isLoading ? '#00c49f' : '#2d3436', 
               transition: 'color 0.3s' 
             }}
           >
              {isLoading ? "Analyzing Data..." : "AI Summary"}
           </span>
        </div>
        
        <div className="header-right">
           {!isLoading && (
             <>
               {/* ✨ ปุ่ม COPY: แก้ไข onClick และเปลี่ยนไอคอนตามสถานะ */}
               <button 
                  className="icon-btn" 
                  title="Copy" 
                  onClick={handleCopy}
               >
                 {isCopied ? <Check size={16} color="green"/> : <Copy size={16}/>}
               </button>

               {/* ✨ ปุ่ม REFRESH: แก้ไข onClick */}
               <button 
                  className="icon-btn" 
                  title="Refresh / Re-analyze" 
                  onClick={handleRefresh}
               >
                 <RefreshCw size={16}/>
               </button>
             </>
           )}
           
           <div className="toggle-indicator">
             {isExpanded ? <ChevronDown size={20}/> : <ChevronUp size={20}/>}
           </div>
        </div>
      </div>

      {/* --- CONTENT AREA (เหมือนเดิม) --- */}
      <div className="result-content-wrapper">
        {isLoading ? (
          <div className="loading-state">
             <div className="typing-indicator">
               <span></span><span></span><span></span>
             </div>
             <span className="loading-text">Reading chart data & generating insights...</span>
          </div>
        ) : (
          <div className="result-text">
             {text ? formatText(text) : "Waiting for data..."}
          </div>
        )}
      </div>

      <style>{`
        .spin-anim {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ResultBox;