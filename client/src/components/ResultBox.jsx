import React from 'react';
import { Sparkles, Copy, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react';

const ResultBox = ({ text, isExpanded, toggleExpand, isLoading }) => {
  
  // ฟังก์ชันแปลง **Text** ให้เป็นตัวหนา (เผื่อ AI ส่ง Markdown มา)
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
           <Sparkles size={18} className="icon-sparkle" />
           <span className="header-title">AI Summary</span>
        </div>
        
        <div className="header-right">
           <button className="icon-btn" title="Copy" onClick={(e) => e.stopPropagation()}>
             <Copy size={16}/>
           </button>
           <button className="icon-btn" title="Refresh" onClick={(e) => e.stopPropagation()}>
             <RefreshCw size={16}/>
           </button>
           {/* ปุ่มลูกศร */}
           <div className="toggle-indicator">
             {isExpanded ? <ChevronDown size={20}/> : <ChevronUp size={20}/>}
           </div>
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="result-content-wrapper">
        
        {isLoading ? (
          // === LOADING STATE (จุดวิ่งๆ สีเขียว) ===
          <div className="loading-state">
             <div className="typing-indicator">
               <span></span><span></span><span></span>
             </div>
             <span className="loading-text">Analyzing dashboard data...</span>
          </div>
        ) : (
          // === RESULT STATE (ข้อความปกติ) ===
          <div className="result-text">
             {text ? formatText(text) : "Waiting for data..."}
          </div>
        )}

      </div>
    </div>
  );
};

export default ResultBox;