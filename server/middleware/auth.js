const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/discovery/v2.0/keys`
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function(err, key) {
    if (err) {
        console.error("❌ JWKS Error (ดึงกุญแจไม่สำเร็จ):", err.message);
        return callback(err, null);
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log("❌ No Token Provided");
    return res.status(401).json({ message: "Access Denied" });
  }

  // DEBUG MODE: แอบดูไส้ใน Token ก่อนตรวจจริง
  const decodedTemp = jwt.decode(token);
  console.log("🔍 [DEBUG] Token info:");
  console.log("   - Audience (aud):", decodedTemp?.aud);
  console.log("   - Issuer (iss):", decodedTemp?.iss);
  console.log("   - Expected Client ID:", process.env.AZURE_CLIENT_ID);
  console.log("   - Expected Tenant ID:", process.env.AZURE_TENANT_ID);

  // เริ่มตรวจจริง
  jwt.verify(token, getKey, {
    // ถ้า Audience ไม่ตรงกัน มันจะ Error ทันที
    audience: process.env.AZURE_CLIENT_ID, 
    // ถ้า Issuer ไม่ตรง (v1 vs v2) ก็จะ Error
    issuer: `https://sts.windows.net/${process.env.AZURE_TENANT_ID}/`, 
    algorithms: ['RS256']
  }, (err, decoded) => {
    if (err) {
      return console.error("❌ Token Verification Failed:", err.message);
    }
    
    console.log("✅ Token Verified!");
    req.user = decoded;
    next();
  });
};

module.exports = verifyToken;