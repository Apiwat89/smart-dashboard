// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";

// 1. ✅ ย้าย Config มาประกาศไว้ที่นี่ (เป็นค่าคงที่)
const loginRequest = {
    scopes: ["User.Read"]
};

const powerBIRequest = {
    scopes: ["https://analysis.windows.net/powerbi/api/Report.Read.All"]
};

const root = ReactDOM.createRoot(document.getElementById('root'));

const BASE_URL = "https://smart-dashboard-7382.onrender.com";

const bootstrap = async () => {
  try {
    // 2. ดึง Config จาก Server
    // ⚠️ อย่าลืมแก้ URL ให้ถูกต้องตามที่คุยกันไว้ (เช่น /api/auth-config)
    const response = await fetch(`/api/auth-config`);
    
    if (!response.ok) throw new Error("โหลด Config ไม่สำเร็จ");
    
    const serverConfig = await response.json();

    // 3. สร้าง msalConfig
    const msalConfig = {
        auth: {
            clientId: serverConfig.clientId,
            authority: serverConfig.authority,
            redirectUri: window.location.origin,
        },
        cache: {
            cacheLocation: "sessionStorage",
            storeAuthStateInCookie: false,
        }
    };

    const msalInstance = new PublicClientApplication(msalConfig);
    await msalInstance.initialize();

    // 4. ✅ ส่ง loginRequest และ powerBIRequest เข้าไปเป็น Props ให้ App
    root.render(
      <React.StrictMode>
        <MsalProvider instance={msalInstance}>
          <App 
            loginRequest={loginRequest} 
            powerBIRequest={powerBIRequest} 
          />
        </MsalProvider>
      </React.StrictMode>
    );

  } catch (error) {
    console.error("Critical Error:", error);
    root.render(<div style={{padding: 20, color:'red'}}>Error Loading Config: {error.message}</div>);
  }
};

bootstrap();