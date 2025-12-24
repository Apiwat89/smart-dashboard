// client/src/components/Widgets/ResultBox.jsx

import React, { useState } from 'react';
import { Sparkles, Copy, RefreshCw, Loader2, Check } from 'lucide-react';

const ResultBox = ({ text, isLoading, onRefresh }) => {
  const [isCopied, setIsCopied] = useState(false);

  // ฟังก์ชันจัดรูปแบบข้อความ (ตัวหนา)
  const renderFormattedText = (inputText) => {
    if (typeof inputText !== 'string' || !inputText) {
        return "กำลังรอการวิเคราะห์ข้อมูล...";
    }
    return inputText.split(/(\*\*.*?\*\*)/g).map((part, index) => 
      part.startsWith('**') && part.endsWith('**') 
        ? <strong key={index} style={{color:'#000', fontWeight: '700'}}>{part.slice(2, -2)}</strong> 
        : part
    );
  };

  // ฟังก์ชันกดปุ่ม Copy
  const handleCopy = () => {
    if (!text) return;
    const textToCopy = typeof text === 'string' ? text : String(text);
    navigator.clipboard.writeText(textToCopy).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
      <div className="result-box-container static-view">
      {/* ⭐ Header: ปรับให้ไม่มีฟังก์ชันคลิกพับ และไม่มีไอคอนลูกศร */}
      <div className="result-header">
        <div className="header-left">
           {isLoading ? (
             <Loader2 size={18} className="icon-sparkle spin-anim" />
           ) : (
             <Sparkles size={18} className="icon-sparkle" />
           )}
           <span className="header-title">
              {isLoading ? "Analyzing Data..." : "AI Insight Summary"}
           </span>
        </div>
        
        <div className="header-right">
           {!isLoading && (
             <>
               {/* ปุ่มคัดลอก */}
               <button className="icon-btn" title="Copy to clipboard" onClick={handleCopy}>
                 {isCopied ? <Check size={16} color="#00c49f"/> : <Copy size={16}/>}
               </button>
               
               {/* ปุ่มรีเฟรช */}
               <button className="icon-btn" title="Re-analyze view" onClick={onRefresh}>
                 <RefreshCw size={16}/>
               </button>
             </>
           )}
        </div>
      </div>

      {/* ⭐ Content Section: แสดงผลแบบ Full View เสมอ */}
      <div className="result-content-wrapper" style={{ flex: 1, overflowY: 'auto' }}>
        {isLoading ? (
          <div className="loading-state">
             <div className="typing-indicator"><span></span><span></span><span></span></div>
             <span style={{marginLeft:'10px'}}>Generating insights...</span>
          </div>
        ) : (
          <div className="result-text">
            {renderFormattedText(text)}
          </div>
        )}
      </div>

      <style>{`
        .spin-anim { animation: spin 1s linear infinite; } 
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .static-view { height: 100%; display: flex; flex-direction: column; }
      `}</style>
    </div>
  );
};

export default ResultBox;