import React, { useState, useEffect, useRef } from 'react';
import { PowerBIEmbed } from 'powerbi-client-react';
import { models } from 'powerbi-client';

// 1. ✅ เพิ่ม InteractionRequiredAuthError เพื่อดักจับ Error
import { useMsal } from "@azure/msal-react"; 
import { InteractionRequiredAuthError } from "@azure/msal-browser"; 
import { powerBIRequest } from "../../authConfig";

const RealPowerBIEmbed = ({ eventHandlers, getEmbeddedComponent, onReportRendered, targetPageName }) => {
  const { instance, accounts } = useMsal(); 
  const [embedConfig, setEmbedConfig] = useState(null);
  
  const reportRef = useRef(null);

  useEffect(() => {
    const fetchToken = async () => {
      const activeAccount = accounts[0];
      if (!activeAccount) return;

      const request = {
          ...powerBIRequest,
          account: activeAccount
      };

      // ฟังก์ชันช่วยตั้งค่า Config (จะได้ไม่ต้องเขียนซ้ำ 2 รอบ)
      const setupConfig = (token) => {
         setEmbedConfig({
          type: 'report',
          id: "8ea65247-20ec-48bb-b405-2d9d6eb9cc63", // Report ID ของคุณ
          embedUrl: "https://app.powerbi.com/reportEmbed",
          accessToken: token,
          tokenType: models.TokenType.Aad,
          pageName: targetPageName || undefined,
          settings: {
            panes: { filters: { visible: false }, pageNavigation: { visible: false } },
            background: models.BackgroundType.Transparent
          }
        });
      };

      try {
        // 2. 🤫 ลองขอ Token แบบเงียบๆ ก่อน
        const response = await instance.acquireTokenSilent(request);
        setupConfig(response.accessToken);

      } catch (err) {
        // 3. 🚨 ถ้า Error เพราะต้องกด Accept (Consent) -> ให้เด้ง Popup
        if (err instanceof InteractionRequiredAuthError) {
           console.warn("Silent token failed, trying popup...");
           try {
             const popupResponse = await instance.acquireTokenPopup(request);
             setupConfig(popupResponse.accessToken); // ถ้ากด Accept ผ่าน ก็โหลดกราฟต่อ
           } catch (popupErr) {
             console.error("Popup failed:", popupErr);
           }
        } else {
           console.error("Login Error:", err);
        }
      }
    };

    if (accounts.length > 0) fetchToken();
  }, [instance, accounts, targetPageName]);

  const mergedHandlers = new Map(eventHandlers || []);
  mergedHandlers.set('rendered', (event) => { if (onReportRendered) onReportRendered(event); });

  if (!embedConfig) return <div style={{ padding: '20px' }}>⏳ กำลังโหลดกราฟ...</div>;

  return (
    <div style={{ height: '100%', width: '100%' }}>
       <PowerBIEmbed
          embedConfig={embedConfig}
          eventHandlers={mergedHandlers}
          cssClassName={"report-style-class"}
          
          getEmbeddedComponent={(embedObject) => {
             // console.log("🟢 Power BI Object Loaded:", embedObject);
             reportRef.current = embedObject;
             
             if (getEmbeddedComponent) {
                 getEmbeddedComponent(embedObject);
             }
          }}
       />
    </div>
  );
};

export default RealPowerBIEmbed;