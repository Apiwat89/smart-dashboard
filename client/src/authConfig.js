// src/authConfig.js

export const msalConfig = {
    auth: {
        clientId: "a295f02a-314a-49a5-a910-d9371d468b4d", // 👈 เอา Client ID มาใส่ (เลขเดิม)
        authority: "https://login.microsoftonline.com/43d3e5df-56d2-4b75-9028-17d34764d1a0", // 👈 เอา Tenant ID มาใส่
        redirectUri: "https://5173-firebase-smart-dashboardgit-1765177634868.cluster-htdgsbmflbdmov5xrjithceibm.cloudworkstations.dev", // ต้องตรงกับที่ตั้งใน Azure
    },
    cache: {
        cacheLocation: "sessionStorage", 
        storeAuthStateInCookie: false,
    }
};

// 1. สำหรับ Login และดึงรูปโปรไฟล์ (Graph API)
export const loginRequest = {
    scopes: ["User.Read"]
};

// 2. สำหรับดึงกราฟ Power BI (Power BI API)
// ⭐ เพิ่มตัวนี้เข้ามาใหม่
export const powerBIRequest = {
    scopes: ["https://analysis.windows.net/powerbi/api/Report.Read.All"]
};