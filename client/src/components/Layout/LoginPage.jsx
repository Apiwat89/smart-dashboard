import React, { useState } from 'react';

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // จำลองการเช็ค (ของจริงต้องเช็คกับ Database)
    if (username === 'admin' && password === '1234') {
      onLogin({ 
          name: 'Admin User', 
          role: 'CEO', 
          avatar: 'https://i.pravatar.cc/150?img=12' 
      });
    } else {
      setError('รหัสผ่านผิดครับ (ลอง admin / 1234)');
    }
  };

  return (
    <div style={{ 
      height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', 
      background: 'linear-gradient(135deg, #e0f2fe 0%, #f0fdf4 100%)'
    }}>
      <div style={{ 
        background: 'white', padding: '40px', borderRadius: '20px', 
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '350px', textAlign: 'center' 
      }}>
        <div style={{width:'60px', height:'60px', background:'#10b981', borderRadius:'15px', margin:'0 auto 20px', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'30px', fontWeight:'bold'}}>S</div>
        <h2 style={{marginBottom:'20px', color:'#333'}}>Somjeed Login</h2>
        
        <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
          <input 
            type="text" placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)}
            style={{padding:'12px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'16px'}}
          />
          <input 
            type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}
            style={{padding:'12px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'16px'}}
          />
          {error && <div style={{color:'red', fontSize:'14px'}}>{error}</div>}
          
          <button type="submit" style={{
            padding:'12px', background:'#10b981', color:'white', border:'none', 
            borderRadius:'8px', fontSize:'16px', fontWeight:'bold', cursor:'pointer', marginTop:'10px'
          }}>
            เข้าสู่ระบบ
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;