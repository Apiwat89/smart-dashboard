import React, { useState, useEffect, useRef } from 'react';
import { PowerBIEmbed } from 'powerbi-client-react';
import { models } from 'powerbi-client';
import { useMsal } from "@azure/msal-react"; 
import { InteractionRequiredAuthError } from "@azure/msal-browser"; 
import { powerBIRequest } from "../../authConfig";

const RealPowerBIEmbed = ({ eventHandlers, getEmbeddedComponent, onReportRendered, targetPageName }) => {
  const { instance, accounts } = useMsal(); 
  const [embedConfig, setEmbedConfig] = useState(null);
  const [needsConsent, setNeedsConsent] = useState(false); // สถานะรอการกดปุ่ม
  const [errorMessage, setErrorMessage] = useState("");

  const reportRef = useRef(null);

  // ฟังก์ชันนี้จะทำงานเมื่อเพื่อนกดปุ่มสีน้ำเงิน
  const handleConsentLogin = async () => {
      const activeAccount = accounts[0];
      const request = { ...powerBIRequest, account: activeAccount };
      try {
          // เด้ง Popup ขึ้นมาให้กด Accept
          await instance.acquireTokenPopup(request);
          // พอกดเสร็จ รีเฟรชหน้าเว็บให้กราฟโหลดใหม่
          window.location.reload(); 
      } catch (error) {
          console.error("Popup failed:", error);
          alert("เกิดข้อผิดพลาดในการยืนยันสิทธิ์: " + error.message);
      }
  };

  useEffect(() => {
    const fetchToken = async () => {
      const activeAccount = accounts[0];
      if (!activeAccount) return;

      const request = { ...powerBIRequest, account: activeAccount };

      try {
        // 1. ลองขอเงียบๆ ก่อน
        const response = await instance.acquireTokenSilent(request);
        
        // ถ้าผ่านฉลุย ก็โหลดกราฟ
        setEmbedConfig({
          type: 'report',
          id: "8ea65247-20ec-48bb-b405-2d9d6eb9cc63", // Report ID
          embedUrl: "https://app.powerbi.com/reportEmbed",
          accessToken: response.accessToken,
          tokenType: models.TokenType.Aad,
          pageName: targetPageName || undefined,
          settings: {
            panes: { filters: { visible: false }, pageNavigation: { visible: false } },
            background: models.BackgroundType.Transparent
          }
        });

      } catch (err) {
        console.error("Token Error:", err);
        
        // 2. 🚨 เช็คว่าเป็น Error เรื่อง Consent หรือไม่ (AADSTS65001)
        // เช็คทั้งแบบ Object Type และเช็คข้อความ Error โดยตรงเพื่อความชัวร์
        if (
            err instanceof InteractionRequiredAuthError || 
            err.message.includes("AADSTS65001") || 
            err.message.includes("consent")
        ) {
           console.warn("Need user consent via popup.");
           setNeedsConsent(true); // สั่งโชว์ปุ่ม
        } else {
           setErrorMessage(err.message);
        }
      }
    };

    if (accounts.length > 0) fetchToken();
  }, [instance, accounts, targetPageName]);

  const mergedHandlers = new Map(eventHandlers || []);
  mergedHandlers.set('rendered', (event) => { if (onReportRendered) onReportRendered(event); });

  // ---------------- UI ส่วนแสดงผล ----------------

  // กรณี 1: ต้องกดอนุญาตก่อน -> โชว์ปุ่ม
  if (needsConsent) {
      return (
          <div style={{ 
              height: '100%', width: '100%', display: 'flex', flexDirection: 'column', 
              alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '20px'
          }}>
              <div style={{ color: '#d13438', fontWeight: 'bold', fontSize: '18px' }}>
                 ⚠️ กรุณายืนยันสิทธิ์เพื่อดูข้อมูล
              </div>
              <div style={{ color: '#666', fontSize: '14px' }}>
                 เนื่องจากเป็นการเข้าใช้งานครั้งแรก ระบบต้องการการอนุญาตจากคุณ
              </div>
              <button 
                  onClick={handleConsentLogin}
                  style={{
                      padding: '12px 24px', background: '#0078d4', color: 'white', 
                      border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
              >
                  👉 กดปุ่มนี้เพื่อยืนยัน (Authorize)
              </button>
          </div>
      );
  }

  // กรณี 2: มี Error อื่นๆ
  if (errorMessage) {
      return <div style={{ color: 'red', padding: '20px', textAlign: 'center' }}>Error: {errorMessage}</div>;
  }

  // กรณี 3: กำลังโหลด
  if (!embedConfig) return <div style={{ padding: '20px', textAlign: 'center' }}>⏳ กำลังเชื่อมต่อ Power BI...</div>;

  // กรณี 4: พร้อมแสดงผล
  return (
    <div style={{ height: '100%', width: '100%' }}>
       <PowerBIEmbed
          embedConfig={embedConfig}
          eventHandlers={mergedHandlers}
          cssClassName={"report-style-class"}
          getEmbeddedComponent={(embedObject) => {
             reportRef.current = embedObject;
             if (getEmbeddedComponent) getEmbeddedComponent(embedObject);
          }}
       />
    </div>
  );
};

export default RealPowerBIEmbed;