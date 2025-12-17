import React, { useState, useEffect } from 'react';
import { PowerBIEmbed } from 'powerbi-client-react';
import { models } from 'powerbi-client';
import { useMsal } from "@azure/msal-react"; // ใช้ MSAL
import { powerBIRequest } from "../../authConfig";

const RealPowerBIEmbed = ({ eventHandlers, getEmbeddedComponent, onReportRendered, targetPageName }) => {
  const { instance, accounts } = useMsal(); // ดึง User
  const [embedConfig, setEmbedConfig] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        // 1. ขอ Token จาก Microsoft (สิทธิ์ User)
        const response = await instance.acquireTokenSilent({
          ...powerBIRequest, // 👈 ⭐ แก้ตรงนี้! เปลี่ยนจาก loginRequest เป็น powerBIRequest
          account: accounts[0]
        });

        // 2. ตั้งค่า Config
        setEmbedConfig({
          type: 'report',
          id: "935ea8f7-0352-461b-86cf-1894c5f48160", // 👈 REPORT ID
          embedUrl: "https://app.powerbi.com/reportEmbed",
          accessToken: response.accessToken,
          tokenType: models.TokenType.Aad, // ใช้ AAD Token
          
          pageName: targetPageName || undefined,

          settings: {
            panes: {
              filters: { visible: false },
              pageNavigation: { visible: false }
            },
            background: models.BackgroundType.Transparent
          }
        });
      } catch (err) {
        console.error("Login Error:", err);
        setError("กรุณาล็อกอินใหม่ หรือตรวจสอบสิทธิ์ Power BI");
      }
    };

    if (accounts.length > 0) {
        fetchToken();
    }
  }, [instance, accounts, targetPageName]);

  const handleRendered = (event) => { if (onReportRendered) onReportRendered(event); };
  const mergedHandlers = new Map(eventHandlers || []);
  mergedHandlers.set('rendered', handleRendered);

  if (error) return <div style={{ color: 'red', padding: '20px' }}>⚠️ {error}</div>;
  if (!embedConfig) return <div style={{ padding: '20px' }}>⏳ กำลังยืนยันตัวตน...</div>;

  return (
    <div style={{ height: '100%', width: '100%' }}>
       <PowerBIEmbed
          embedConfig={embedConfig}
          eventHandlers={mergedHandlers}
          getEmbeddedComponent={getEmbeddedComponent}
          cssClassName={"report-style-class"}
       />
    </div>
  );
};

export default RealPowerBIEmbed;