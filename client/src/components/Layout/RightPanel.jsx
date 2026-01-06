import React, { useState, useEffect, useRef } from 'react';
import { Globe, X, Sparkles } from 'lucide-react';
import CharacterZone from '../Widgets/CharacterZone';

const RightPanel = ({
  aiState,
  countdown,
  closeAi,
  currentLang,
  setCurrentLang,
  onSpeechEnd,
  summaryWidget,
  suggestedQuestions = [],
  onSelectQuestion
}) => {
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const suggestBoxRef = useRef(null);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestBoxRef.current && !suggestBoxRef.current.contains(event.target)) {
        setIsSuggestOpen(false);
      }
    };

    if (isSuggestOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSuggestOpen]);

  const UI_TEXT = {
    TH: { title: "คำถามที่น่าสนใจ ✨", loading: "กำลังคิดคำถาม..." },
    EN: { title: "Interesting Questions ✨", loading: "Thinking..." },
    JP: { title: "おすすめの質問 ✨", loading: "考え中..." },
    CN: { title: "有趣的提问 ✨", loading: "正在思考..." },
    KR: { title: "흥미로운 질문 ✨", loading: "생각 중..." },
    VN: { title: "Câu hỏi thú vị ✨", loading: "Đang suy nghĩ..." }
  };

  return (
    <aside
      className="right-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'visible' // Necessary for popup overflow
      }}
    >
      {/* 1. Language Switcher */}
      <div className="lang-switcher-row">
        <Globe size={14} color="#94a3b8" style={{ marginRight: '4px' }} />
        {['TH', 'EN', 'JP', 'CN', 'KR', 'VN'].map((lang) => (
          <button
            key={lang}
            className={`lang-btn ${currentLang === lang ? 'active' : ''}`}
            onClick={() => setCurrentLang(lang)}
          >
            {lang}
          </button>
        ))}
      </div>

      {/* 2. Character Zone (Video) */}
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

      {/* 3. AI Summary & Chat */}
      <div className="display-area" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {summaryWidget}
      </div>

      {/* 4. Suggested Questions Interaction */}
      <div 
        className={`chat-interaction-group ${isSuggestOpen ? 'is-open' : ''}`}
        ref={suggestBoxRef} 
      >
        <div className="suggested-questions-box">
          <div className="suggest-header">{UI_TEXT[currentLang]?.title || UI_TEXT['TH'].title}</div>
          <div className="questions-list">
            {
            suggestedQuestions.length === 0 ? (<div style={{ padding: '10px', textAlign: 'center', color: 'var(--text-muted)' }}>{UI_TEXT[currentLang]?.loading}</div>) :
            suggestedQuestions.map((q, idx) => (
              <button 
                key={idx} 
                className="question-item"
                
                // ⭐⭐⭐ แก้ตรงนี้ครับ: เปลี่ยนให้มันทำ 2 อย่างพร้อมกัน
                onClick={() => {
                    onSelectQuestion(q);      // 1. ส่งคำถามไปให้ App.jsx ทำงาน
                    setIsSuggestOpen(false);  // 2. สั่งปิดกล่อง Popup ตัวเองทันที
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
          {isSuggestOpen ? <div style={{ alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white' }}> <X size={22} /> </div> : <Sparkles size={50} />}
        </button>
      </div>
    </aside>
  );
};

export default RightPanel;