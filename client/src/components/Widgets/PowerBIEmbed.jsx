import React, { useState, useEffect, useRef } from 'react';
import { PowerBIEmbed } from 'powerbi-client-react';
import { models } from 'powerbi-client';
import { useMsal } from "@azure/msal-react";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { powerBIRequest } from "../../authConfig";

const RealPowerBIEmbed = ({ eventHandlers, getEmbeddedComponent, onReportRendered, targetPageName, ClientID}) => {
  const { instance, accounts } = useMsal();
  const [embedConfig, setEmbedConfig] = useState(null);
  const [needsConsent, setNeedsConsent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const reportRef = useRef(null);

  // Styles
  const styles = {
    container: { height: '100%', width: '100%' },
    centerBox: {
      height: '100%', width: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '20px'
    },
    errorText: { color: '#d13438', fontWeight: 'bold', fontSize: '18px' },
    subText: { color: '#666', fontSize: '14px' },
    button: {
      padding: '12px 24px', background: '#0078d4', color: 'white',
      border: 'none', borderRadius: '4px', cursor: 'pointer',
      fontSize: '16px', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }
  };

  // Handle User Consent
  const handleConsentLogin = async () => {
    const activeAccount = accounts[0];
    const request = { ...powerBIRequest, account: activeAccount };
    try {
      await instance.acquireTokenPopup(request);
      window.location.reload();
    } catch (error) {
      console.error("Popup failed:", error);
      alert("เกิดข้อผิดพลาดในการยืนยันสิทธิ์: " + error.message);
    }
  };

  // Fetch Token Logic
  useEffect(() => {
    const fetchToken = async () => {
      const activeAccount = accounts[0];
      if (!activeAccount) return;

      try {
        const response = await instance.acquireTokenSilent({ ...powerBIRequest, account: activeAccount });
        
        setEmbedConfig({
          type: 'report',
          id: ClientID,
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
        // Check for Consent Required Error
        if (err instanceof InteractionRequiredAuthError || err.message.includes("AADSTS65001") || err.message.includes("consent")) {
          setNeedsConsent(true);
        } else {
          setErrorMessage(err.message);
        }
      }
    };

    if (accounts.length > 0) fetchToken();
  }, [instance, accounts, targetPageName]);

  const mergedHandlers = new Map(eventHandlers || []);
  mergedHandlers.set('rendered', (event) => { if (onReportRendered) onReportRendered(event); });

  // --- Render States ---
  if (needsConsent) {
    return (
      <div style={styles.centerBox}>
        <div style={styles.errorText}>⚠️ กรุณายืนยันสิทธิ์เพื่อดูข้อมูล</div>
        <div style={styles.subText}>เนื่องจากเป็นการเข้าใช้งานครั้งแรก ระบบต้องการการอนุญาตจากคุณ</div>
        <button onClick={handleConsentLogin} style={styles.button}>
          👉 กดปุ่มนี้เพื่อยืนยัน (Authorize)
        </button>
      </div>
    );
  }

  if (errorMessage) {
    return <div style={{ color: 'red', padding: '20px', textAlign: 'center' }}>Error: {errorMessage}</div>;
  }

  if (!embedConfig) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>⏳ กำลังเชื่อมต่อ Power BI...</div>;
  }

  return (
    <div style={styles.container}>
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