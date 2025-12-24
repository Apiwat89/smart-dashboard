import React, { useState } from 'react';
import { Sparkles, Copy, RefreshCw, Loader2, Check } from 'lucide-react';

const ResultBox = ({ text, isLoading, onRefresh }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(String(text)).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  // Helper: Format Bold Text (**...**)
  const formatText = (inputText) => {
    if (!inputText) return "กำลังรอการวิเคราะห์ข้อมูล...";
    return String(inputText).split(/(\*\*.*?\*\*)/g).map((part, index) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={index} style={{ color: '#000', fontWeight: '700' }}>{part.slice(2, -2)}</strong>
        : part
    );
  };

  return (
    <div className="result-box-container static-view">
      <div className="result-header">
        <div className="header-left">
          {isLoading ? <Loader2 size={18} className="icon-sparkle spin-anim" /> : <Sparkles size={18} className="icon-sparkle" />}
          <span className="header-title">{isLoading ? "Analyzing Data..." : "AI Insight Summary"}</span>
        </div>
        
        <div className="header-right">
          {!isLoading && (
            <>
              <button className="icon-btn" title="Copy" onClick={handleCopy}>
                {isCopied ? <Check size={16} color="#00c49f" /> : <Copy size={16} />}
              </button>
              <button className="icon-btn" title="Refresh" onClick={onRefresh}>
                <RefreshCw size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="result-content-wrapper" style={{ flex: 1, overflowY: 'auto' }}>
        {isLoading ? (
          <div className="loading-state">
            <div className="typing-indicator"><span></span><span></span><span></span></div>
            <span style={{ marginLeft: '10px' }}>Generating insights...</span>
          </div>
        ) : (
          <div className="result-text">{formatText(text)}</div>
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