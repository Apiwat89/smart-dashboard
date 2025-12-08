import React, { useState } from 'react';
import { Sparkles, Copy, RefreshCw, ChevronUp, ChevronDown, Loader2, Check } from 'lucide-react';

const ResultBox = ({ text, isExpanded, toggleExpand, isLoading, onRefresh }) => {
  const [isCopied, setIsCopied] = useState(false);

  // ฟังก์ชันจัดรูปแบบข้อความ
  const renderFormattedText = (inputText) => {
    if (typeof inputText !== 'string' || !inputText) {
        return "Waiting for data analysis...";
    }
    return inputText.split(/(\*\*.*?\*\*)/g).map((part, index) => 
      part.startsWith('**') && part.endsWith('**') 
        ? <strong key={index} style={{color:'#000'}}>{part.slice(2, -2)}</strong> 
        : part
    );
  };

  // ฟังก์ชันกดปุ่ม Copy
  const handleCopy = (e) => {
    e.stopPropagation(); // หยุดไม่ให้คลิกทะลุไปสั่งพับกล่อง
    console.log(text);
    if (!text) return;
    
    const textToCopy = typeof text === 'string' ? text : String(text);

    navigator.clipboard.writeText(textToCopy).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // คืนค่าปุ่มหลัง 2 วินาที
    });
  };

  // ฟังก์ชันกดปุ่ม Refresh
  const handleRefresh = (e) => {
    e.stopPropagation(); // หยุดไม่ให้คลิกทะลุ
    if (onRefresh) {
        onRefresh(); // เรียกฟังก์ชันที่ส่งมาจาก App.jsx
    }
  };

  return (
    <div className="result-box-container">
      {/* Header */}
      <div className="result-header" onClick={toggleExpand}>
        <div className="header-left">
           {isLoading ? <Loader2 size={18} className="icon-sparkle spin-anim" /> : <Sparkles size={18} className="icon-sparkle" />}
           <span className="header-title" style={{ color: isLoading ? '#00c49f' : '#2d3436' }}>
              {isLoading ? "Analyzing Data..." : "AI Summary"}
           </span>
        </div>
        
        <div className="header-right">
           {!isLoading && (
             <>
               {/* ปุ่ม Copy */}
               <button className="icon-btn" title="Copy to clipboard" onClick={handleCopy}>
                 {isCopied ? <Check size={16} color="#00c49f"/> : <Copy size={16}/>}
               </button>
               
               {/* ปุ่ม Refresh */}
               <button className="icon-btn" title="Re-analyze view" onClick={handleRefresh}>
                 <RefreshCw size={16}/>
               </button>
             </>
           )}
           
           {/* ปุ่มพับ/ขยาย */}
           <div className="toggle-indicator">
             {isExpanded ? <ChevronDown size={20}/> : <ChevronUp size={20}/>}
           </div>
        </div>
      </div>

      {/* Content */}
      <div className="result-content-wrapper">
        {isLoading ? (
          <div className="loading-state">
             <div className="typing-indicator"><span></span><span></span><span></span></div>
             <span style={{marginLeft:'10px'}}>Generating insights...</span>
          </div>
        ) : (
          <div className="result-text">{renderFormattedText(text)}</div>
        )}
      </div>

      <style>{`.spin-anim { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ResultBox;