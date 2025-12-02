import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Loader2, CheckCircle2, Sparkles } from 'lucide-react';

const ResultBox = ({ text, isExpanded, toggleExpand, isLoading }) => {
  const containerRef = useRef(null);
  const bubblesRef = useRef(null);
  const ballarr = useRef([]);
  const ballpos = useRef([]);
  const intervalRef = useRef(null);
  
  // State สำหรับจัดการ Phase: Loading -> Success -> Normal
  const [showSuccess, setShowSuccess] = useState(false);
  const prevLoading = useRef(isLoading);

  const isHovering = useRef(false);
  const COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#82ca9d', '#FF9F1C', '#FF4081', '#3D5AFE'];

  // --- Logic เดิมของฟองสบู่ (Bubble Logic) ---
  const startBubbles = () => {
    if (isExpanded || isLoading) return;
    if (intervalRef.current) return;

    if (bubblesRef.current) {
      for (let i = 0; i < 15; i++) {
        const randomBottom = (Math.random() * bubblesRef.current.clientHeight - 50);
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.left = Math.random() * bubblesRef.current.clientWidth + 'px';
        div.style.bottom = randomBottom + "px";
        div.style.width = '15px';
        div.style.height = '15px';
        div.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
        div.style.opacity = '0.5'; 
        div.style.borderRadius = '100%';
        div.className = "balls"; 
        div.style.pointerEvents = 'none'; 
        
        ballarr.current.push(div);
        ballpos.current.push(randomBottom);
        bubblesRef.current.appendChild(div);
      }

      intervalRef.current = setInterval(() => {
        if (!bubblesRef.current) return;
        const containerHeight = bubblesRef.current.clientHeight;
        const containerWidth = bubblesRef.current.clientWidth;
        for (let i = 0; i < ballarr.current.length; i++) {
          ballpos.current[i] += 1;
          if (ballpos.current[i] > containerHeight) {
              ballpos.current[i] = -20;
              ballarr.current[i].style.left = Math.random() * containerWidth + 'px';
          }
          if (ballarr.current[i]) {
              ballarr.current[i].style.bottom = ballpos.current[i] + "px";
          }
        }
      }, 20);
    }
  };

  const stopBubbles = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    ballarr.current.forEach(ball => {
      if (ball && ball.parentNode) ball.parentNode.removeChild(ball);
    });
    ballarr.current = [];
    ballpos.current = [];
  };

  const handleMouseEnter = () => {
    isHovering.current = true;
    startBubbles();
  };

  const handleMouseLeave = () => {
    isHovering.current = false;
    stopBubbles();
  };

  useEffect(() => {
    return () => stopBubbles();
  }, []);

  useEffect(() => {
    stopBubbles(); 
    if (!isExpanded && isHovering.current && !isLoading) {
        startBubbles();
    }
  }, [isExpanded, isLoading]);

  // --- Logic ใหม่: ตรวจจับการเปลี่ยน Phase (Loading -> Success) ---
  useEffect(() => {
    // ถ้าสถานะเปลี่ยนจาก กำลังโหลด (True) -> เสร็จแล้ว (False)
    if (prevLoading.current === true && isLoading === false) {
        setShowSuccess(true); // เข้าสู่โหมด Success
        
        // โชว์ Success ค้างไว้ 1.5 วินาที แล้วค่อยกลับเป็นปกติ
        const timer = setTimeout(() => {
            setShowSuccess(false);
        }, 1500);
        
        return () => clearTimeout(timer);
    }
    prevLoading.current = isLoading;
  }, [isLoading]);

  // --- Render Header Content ตาม Phase ---
  const renderHeaderContent = () => {
    // 1. Phase: กำลังประมวลผล (Loading)
    if (isLoading) {
        return (
            <div className="phase-content loading">
                <Loader2 className="spin-anim" size={20} />
                <span style={{ fontWeight: 500 }}>AI Neural Processing...</span>
            </div>
        );
    }
    
    // 2. Phase: เสร็จสิ้น (Success / Cool Phase)
    if (showSuccess) {
        return (
            <div className="phase-content success fade-in">
                <CheckCircle2 size={22} color="white" />
                <span style={{ fontWeight: 'bold', color: 'white' }}>Analysis Complete!</span>
                <Sparkles className="sparkle-anim" size={18} color="#FFD700" style={{ marginLeft: 5 }} />
            </div>
        );
    }

    // 3. Phase: ปกติ (Normal)
    return (
        <div className="phase-content normal fade-in">
            <span>💡</span> 
            <span>มุมมองภาพรวม (AI Analysis) {isExpanded ? '' : '- คลิกเพื่ออ่านผล'}</span>
        </div>
    );
  };

  // --- Dynamic Style สำหรับ Header Background ---
  const getHeaderStyle = () => {
    const baseStyle = {
        padding: '15px 25px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'all 0.5s ease', // เพิ่ม Transition ให้พื้นหลังเปลี่ยนสีนุ่มๆ
        position: 'relative',
        zIndex: 2,
    };

    if (isLoading) {
        return {
            ...baseStyle,
            // Gradient ไหลๆ สีฟ้า-ม่วง-เทา
            background: 'linear-gradient(270deg, #eef2f3, #e0eafc, #d4fc79)',
            backgroundSize: '400% 400%',
            animation: 'gradient-flow 3s ease infinite',
            color: '#555'
        };
    }

    if (showSuccess) {
        return {
            ...baseStyle,
            // สีเขียวสดใส (Success State)
            backgroundColor: '#48c774', 
            color: 'white',
            boxShadow: '0 4px 15px rgba(72, 199, 116, 0.4)'
        };
    }

    // Normal State
    return {
        ...baseStyle,
        background: isExpanded ? '#82ca9d' : 'transparent',
        color: isExpanded ? 'white' : '#444',
    };
  };

  return (
    <div 
      ref={containerRef} 
      className="result-box-wrapper" 
      onMouseEnter={handleMouseEnter} 
      onMouseLeave={handleMouseLeave}  
      style={{ 
        display: 'flex',
        flexDirection: 'column', 
        height: '100%', 
        position: 'relative',
        backgroundColor: '#f8f9fa', 
        overflow: 'hidden',
      }}
    >
      
      <div 
        ref={bubblesRef} 
        style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          pointerEvents: 'none', zIndex: 1
        }}
      />

      {/* Header Bar with Animation Phases */}
      <div 
        onClick={toggleExpand}
        style={getHeaderStyle()}
      >
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', width: '100%' }}>
            {renderHeaderContent()}
        </h3>
        
        {/* ซ่อนลูกศรตอนกำลังโหลด หรือตอน Success เพื่อความ Clean */}
        {!isLoading && !showSuccess && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
                {isExpanded ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
            </div>
        )}
      </div>
      
      {/* Content Area */}
      <div style={{ 
        flex: 1,
        padding: '20px',
        overflowY: 'auto',
        opacity: isExpanded ? 1 : 0,
        transition: '0.3s',
        pointerEvents: isExpanded ? 'auto' : 'none',
        backgroundColor: 'transparent', 
        position: 'relative',
        zIndex: 2 
      }}>
        <div style={{ 
            fontSize: '1.1rem', 
            lineHeight: '1.6', 
            color: '#333',
            whiteSpace: 'pre-line' 
        }}>
            {text || "เลื่อนดูข้อมูลกราฟ แล้วหยุดเพื่อให้ AI วิเคราะห์..."}
        </div>
      </div>

      <style>{`
        .spin-anim { animation: spin 2s linear infinite; }
        
        @keyframes spin { 100% { transform: rotate(360deg); } }
        
        /* Animation สำหรับพื้นหลังไหลๆ */
        @keyframes gradient-flow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }

        /* Animation ตอน Text โผล่มา */
        .fade-in { animation: fadeIn 0.5s ease-out; }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* Animation ประกายวิ้งๆ */
        .sparkle-anim { animation: pulse-scale 1s infinite alternate; }
        @keyframes pulse-scale {
            from { transform: scale(0.8); opacity: 0.7; }
            to { transform: scale(1.2); opacity: 1; }
        }

        .phase-content {
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;
        }
      `}</style>
    </div>
  );
};

export default ResultBox;