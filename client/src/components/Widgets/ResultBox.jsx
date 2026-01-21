import React, { useState } from 'react';
import { Sparkles, RefreshCw, Loader2, QrCode, X } from 'lucide-react';
import QRCode from "react-qr-code";
import { dashboardService } from '../../api/apiClient';

const ResultBox = ({ text, isLoading, onRefresh }) => {
  const [showQR, setShowQR] = useState(false);
  const [qrUrl, setQrUrl] = useState(""); // ตัวแปรเก็บ Link ที่ได้จาก Server
  const [isGenerating, setIsGenerating] = useState(false); // สถานะตอนกำลังคุยกับ Server

  // Helper: Format Bold Text (**...**)
  const formatText = (inputText) => {
    if (!inputText) return "กำลังรอการวิเคราะห์ข้อมูล...";
    return String(inputText).split(/(\*\*.*?\*\*)/g).map((part, index) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={index} style={{ color: '#000', fontWeight: '700' }}>{part.slice(2, -2)}</strong>
        : part
    );
  };

  const handleCreateServerQR = async () => {
    if (!text) return;
    setIsGenerating(true);

    try {
        // เรียกใช้ฟังก์ชันที่เราเพิ่งเพิ่มเข้าไป
        const fullLink = await dashboardService.shareSummary(text);
        
        if (fullLink) {
            setQrUrl(fullLink);
            setShowQR(true);
        } else {
            alert("ไม่ได้รับลิงก์จาก Server");
        }
    } catch (error) {
        alert("เชื่อมต่อ Server ไม่ได้");
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <>
      <div className="result-box-container static-view">
        <div className="result-header">
          <div className="header-left">
            {isLoading ? <Loader2 size={18} className="icon-sparkle spin-anim" /> : <Sparkles size={18} className="icon-sparkle" />}
            <span className="header-title">{isLoading ? "Analyzing Data..." : "AI Insight Summary"}</span>
          </div>
          
          <div className="header-right">
            {!isLoading && (
              <>
                {/* ปุ่มสร้าง QR Code แบบผ่าน Server */}
                <button 
                    className="icon-btn" 
                    title="Scan to Mobile" 
                    onClick={handleCreateServerQR}
                    disabled={isGenerating} // ห้ามกดรัวๆ
                >
                  {isGenerating ? <Loader2 size={16} className="spin-anim"/> : <QrCode size={16} />}
                </button>

                <button className="icon-btn" title="Refresh" onClick={onRefresh}>
                  <RefreshCw size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="result-content-wrapper">
          {isLoading ? (
            <div className="loading-state">
              <div className="typing-indicator"><span></span><span></span><span></span></div>
              <span className='loading-text' style={{ marginLeft: '10px' }}>Generating insights...</span>
            </div>
          ) : (
            <div className="result-text">{formatText(text)}</div>
          )}
        </div>
      </div>

      {/* --- ส่วน QR Code Modal --- */}
      {showQR && (
        <div className="qr-modal-overlay" onClick={() => setShowQR(false)}>
            <div className="qr-modal-content" onClick={e => e.stopPropagation()}>
                
                <button className="qr-modal-close" onClick={() => setShowQR(false)}>
                    <X size={24} />
                </button>

                <h3 className="qr-modal-title">สแกนเพื่ออ่านบนมือถือ</h3>
                
                <div className="qr-wrapper">
                    {/* ✅ ใช้ qrUrl ที่เป็น Link สั้นๆ จาก Server 
                       QR Code จะโล่งสะอาดตา สแกนง่ายมาก
                    */}
                    <QRCode 
                        value={qrUrl} 
                        size={256} 
                        level="L" 
                    />
                </div>
                
                <p className="qr-modal-desc">
                    ใช้กล้องมือถือสแกนเพื่อเปิดหน้าเว็บ <br/>
                    (รองรับทั้ง iOS และ Android)
                </p>
            </div>
        </div>
      )}
    </>
  );
};

export default ResultBox;