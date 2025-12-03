import React from 'react';
import { Sparkles, Copy, RefreshCw, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';

const ResultBox = ({ text, isExpanded, toggleExpand, isLoading }) => {
  
  // ฟังก์ชันแปลง **Text** ให้เป็นตัวหนา
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

  return (
    <div className="result-box-container">
      
      {/* --- HEADER (คลิกเพื่อพับ/กาง) --- */}
      <div className="result-header" onClick={toggleExpand}>
        <div className="header-left">
           {/* เปลี่ยนไอคอน: ถ้าโหลดอยู่ ให้โชว์ Loader หมุนๆ */}
           {isLoading ? (
             <Loader2 size={18} className="icon-sparkle spin-anim" />
           ) : (
             <Sparkles size={18} className="icon-sparkle" />
           )}
           
           {/* เปลี่ยนข้อความ: ถ้าโหลดอยู่ ให้โชว์ "Analyzing..." แม้จะพับอยู่ก็ตาม */}
           <span 
             className="header-title" 
             style={{ 
               color: isLoading ? '#00c49f' : '#2d3436', // สีเขียวตอนโหลด
               transition: 'color 0.3s' 
             }}
           >
              {isLoading ? "Analyzing Data..." : "AI Summary"}
           </span>
        </div>
        
        <div className="header-right">
           {/* ซ่อนปุ่ม Copy/Refresh ตอนกำลังโหลด เพื่อความสะอาดตา */}
           {!isLoading && (
             <>
               <button className="icon-btn" title="Copy" onClick={(e) => e.stopPropagation()}>
                 <Copy size={16}/>
               </button>
               <button className="icon-btn" title="Refresh" onClick={(e) => e.stopPropagation()}>
                 <RefreshCw size={16}/>
               </button>
             </>
           )}
           
           {/* ปุ่มลูกศร */}
           <div className="toggle-indicator">
             {isExpanded ? <ChevronDown size={20}/> : <ChevronUp size={20}/>}
           </div>
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="result-content-wrapper">
        
        {isLoading ? (
          // === LOADING STATE (แสดงเมื่อกางออกมา) ===
          <div className="loading-state">
             <div className="typing-indicator">
               <span></span><span></span><span></span>
             </div>
             <span className="loading-text">Reading chart data & generating insights...</span>
          </div>
        ) : (
          // === RESULT STATE (ข้อความปกติ) ===
          <div className="result-text">
             {text ? formatText(text) : "Waiting for data..."}
          </div>
        )}

      </div>

      {/* Style สำหรับ Animation หมุนๆ ใส่ไว้ในนี้เพื่อให้ทำงานได้เลยโดยไม่ต้องแก้ App.css */}
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