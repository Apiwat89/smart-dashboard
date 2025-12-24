import React, { useState, useEffect, useRef } from 'react'; //
import { Globe, X, Sparkles } from 'lucide-react';
import CharacterZone from '../Widgets/CharacterZone';

const RightPanel = ({ 
  aiState, countdown, closeAi, 
  handleAsk, isProcessing, 
  currentLang, setCurrentLang, onSpeechEnd,
  summaryWidget,
  // ⭐ รับ props เพิ่มเติมที่ส่งมาจาก App.jsx
  suggestedQuestions = [], 
  onSelectQuestion 
}) => {
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const suggestBoxRef = useRef(null); // ⭐ สร้าง Ref สำหรับอ้างอิงกล่อง Popup

  useEffect(() => {
    const handleClickOutside = (event) => {
      // ถ้ามีการคลิก และจุดที่คลิกไม่ได้อยู่ใน suggestBoxRef (ตัวกล่อง Popup)
      if (suggestBoxRef.current && !suggestBoxRef.current.contains(event.target)) {
        setIsSuggestOpen(false); // สั่งปิดทันที
      }
    };

    if (isSuggestOpen) {
      // ลงทะเบียน Event เมื่อ Popup เปิด
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      // ล้าง Event เมื่อ Popup ปิด หรือ Component ถูกทำลาย
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSuggestOpen]);

  return (
    <aside className="right-panel" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        position: 'relative',
        /* ⭐ ต้องเป็น visible เพื่อให้ Popup คำถามลอยพ้นขอบพาเนลขวาไปทับ Dashboard ได้ */
        overflow: 'visible' 
      }}>
      {/* 1. Language Switcher - ปุ่มเปลี่ยนภาษาด้านบน */}
      <div className="lang-switcher-row">
        <Globe size={14} color="#94a3b8" style={{marginRight: '4px'}}/>
        {['TH', 'EN', 'JP', 'CN', 'KR'].map(lang => (
            <button 
              key={lang} 
              className={`lang-btn ${currentLang === lang ? 'active' : ''}`} 
              onClick={() => setCurrentLang(lang)}
            >
              {lang}
            </button>
        ))}
      </div>

      {/* 2. Character Zone (ครึ่งบน) - แสดงวิดีโอ AI Mascot */}
      <div className="char-stage" style={{ flex: '0 0 35%', borderRadius: '16px', overflow: 'hidden', minHeight: '80px', position: 'relative' }}>
         <CharacterZone 
           status={aiState.status} 
           text={aiState.message} 
           isTextVisible={false} 
           countdown={countdown} 
           onClose={closeAi}
           lang={currentLang}
           onSpeechEnd={onSpeechEnd}
         />
      </div>

      {/* 3. AI Summary & Chat Display (ครึ่งล่าง) - กล่องสรุปที่จะติด Header และ Scroll แค่เนื้อหา */}
      <div className="display-area" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
         {summaryWidget}
      </div>

      {/* 4. ⭐ Suggested Questions Interaction (Slide-out Style) */}
      <div 
        className={`chat-interaction-group ${isSuggestOpen ? 'is-open' : ''}`}
        ref={suggestBoxRef} 
      >
        <div className="suggested-questions-box">
          <div className="suggest-header">คำถามที่น่าสนใจ ✨</div>
          <div className="questions-list">
            {suggestedQuestions.map((q, idx) => (
              <button 
                key={idx} 
                className="question-item"
                onClick={() => {
                  onSelectQuestion(q);
                  setIsSuggestOpen(false); // ปิดเมื่อเลือกคำถาม
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <button 
          className="ask-trigger-fab-dynamic"
          onClick={() => setIsSuggestOpen(!isSuggestOpen)}
        >
          {isSuggestOpen ? <div style={{  alignItems: 'center', justifyContent: 'center',height: '100%', color: 'white'}}> <X size={22} /> </div> : <Sparkles size={50} />}
        </button>
      </div>
    </aside>
  );
};

export default RightPanel;