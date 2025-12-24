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
        {['TH', 'EN', 'JP', 'CN', 'KR'].map((lang) => (
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
      <div className={`chat-interaction-group ${isSuggestOpen ? 'is-open' : ''}`} ref={suggestBoxRef}>
        <div className="suggested-questions-box">
          <div className="suggest-header">คำถามที่น่าสนใจ ✨</div>
          <div className="questions-list">
            {suggestedQuestions.map((q, idx) => (
              <button key={idx} className="question-item" onClick={() => onSelectQuestion(q)}>
                {q}
              </button>
            ))}
          </div>
        </div>

        <button
          className="ask-trigger-fab-dynamic"
          onClick={() => setIsSuggestOpen(!isSuggestOpen)}
        >
          {isSuggestOpen ? (
            <div style={{ alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white' }}>
              <X size={22} />
            </div>
          ) : (
            <Sparkles size={50} />
          )}
        </button>
      </div>
    </aside>
  );
};

export default RightPanel;