import React from 'react';
import { Globe, Send } from 'lucide-react';
import CharacterZone from '../Widgets/CharacterZone';

const RightPanel = ({ 
  aiState, countdown, closeAi, 
  userQuestion, setUserQuestion, handleAsk, isProcessing, 
  currentLang, setCurrentLang 
}) => {
  return (
    <aside className="right-panel">
      <div className="char-stage">
         <CharacterZone 
           status={aiState.status} 
           text={aiState.message} 
           isTextVisible={aiState.isVisible} 
           countdown={countdown} 
           onClose={closeAi}
         />
      </div>

      <div className="control-panel">
          <form onSubmit={handleAsk} className="ask-input-wrapper">
             <input 
                type="text" placeholder="Ask Somjeed..." 
                value={userQuestion} 
                onChange={(e) => setUserQuestion(e.target.value)} 
                disabled={isProcessing} 
             />
             <button type="submit" disabled={isProcessing || !userQuestion}>
               <div style={{display:'flex'}}><Send size={16}/></div>
             </button>
          </form>
          
          <div className="lang-switcher-row">
             <div style={{color:"#666", marginRight:'5px'}}><Globe size={16}/></div>
             {['TH', 'EN', 'JP'].map(lang => (
                 <button 
                   key={lang} 
                   className={`lang-btn ${currentLang === lang ? 'active' : ''}`} 
                   onClick={() => setCurrentLang(lang)}
                 >
                   {lang}
                 </button>
             ))}
          </div>
      </div>
    </aside>
  );
};
export default RightPanel;