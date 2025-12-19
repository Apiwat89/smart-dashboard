import React, { useState, useEffect, useRef } from 'react';
import { PowerBIEmbed } from 'powerbi-client-react';
import { models } from 'powerbi-client';
import { useMsal } from "@azure/msal-react"; 
import { powerBIRequest } from "../../authConfig";

const RealPowerBIEmbed = ({ eventHandlers, getEmbeddedComponent, onReportRendered, targetPageName }) => {
  const { instance, accounts } = useMsal(); 
  const [embedConfig, setEmbedConfig] = useState(null);
  
  // ใช้ Ref ภายในช่วยจับอีกแรง
  const reportRef = useRef(null);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await instance.acquireTokenSilent({
          ...powerBIRequest,
          account: accounts[0]
        });

        setEmbedConfig({
          type: 'report', // ✅ ต้องเป็น report เท่านั้น
          id: "8ea65247-20ec-48bb-b405-2d9d6eb9cc63", 
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
        console.error("Login Error:", err);
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
          
          // ⭐⭐⭐ จุดสำคัญที่สุด: บังคับจับยัดใส่มือ App.jsx ⭐⭐⭐
          getEmbeddedComponent={(embedObject) => {
             console.log("🟢 Power BI Object Loaded:", embedObject); // เช็คใน Console ดูว่าขึ้นไหม
             reportRef.current = embedObject;
             
             // ส่งกลับไปที่ App.jsx ทันทีที่ได้ของ
             if (getEmbeddedComponent) {
                 getEmbeddedComponent(embedObject);
             }
          }}
       />
    </div>
  );
};

export default RealPowerBIEmbed;