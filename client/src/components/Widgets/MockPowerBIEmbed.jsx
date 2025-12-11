import React, { useEffect, useState, useRef } from 'react';

const MockPowerBIEmbed = ({ eventHandlers, getEmbeddedComponent }) => {

  // --- 1. ข้อมูลเริ่มต้น (Initial Data) ---
  const initialData = {
    revenue: 4200000,
    profit: 1800000,
    customers: 15400,
    growth: 12.5,
    // ข้อมูลกราฟแท่ง (NA, EU, APAC)
    bars: [
        { label: 'NA', val1: 2000000, val2: 1200000 }, 
        { label: 'EU', val1: 1500000, val2: 900000 }, 
        { label: 'APAC', val1: 700000, val2: 500000 }
    ],
    // ข้อมูลตารางล่าสุด
    transactions: [
        { date: '2024-09-30', client: 'Acme Corp', amount: 5000, status: 'Completed' },
        { date: '2024-09-30', client: 'Global Inc', amount: 3200, status: 'Processing' },
        { date: '2024-09-29', client: 'Stark Ind', amount: 8500, status: 'Completed' },
        { date: '2024-09-29', client: 'Wayne Ent', amount: 1200, status: 'Pending' }
    ]
  };

  // State สำหรับแสดงผลหน้าจอ
  const [data, setData] = useState(initialData);
  
  // Ref สำหรับเก็บข้อมูลล่าสุดให้ AI (แก้ปัญหา Closure Stale)
  const dataRef = useRef(initialData);

  // --- 2. สร้างจังหวะหัวใจ (Real-time Simulation) ---
  useEffect(() => {
    const interval = setInterval(() => {
      // สุ่มตัวเลขขยับนิดหน่อย
      const fluctuate = (val, range) => val + Math.floor((Math.random() - 0.5) * range);

      const newData = {
        ...dataRef.current,
        // ขยับตัวเลข KPI
        revenue: fluctuate(dataRef.current.revenue, 5000), 
        profit: fluctuate(dataRef.current.profit, 2000),
        customers: fluctuate(dataRef.current.customers, 5),
        
        // ขยับกราฟแท่ง
        bars: dataRef.current.bars.map(b => ({
            ...b,
            val1: Math.max(100000, fluctuate(b.val1, 50000)), // อย่าให้ติดลบ
            val2: Math.max(50000, fluctuate(b.val2, 30000))
        })),

        // เพิ่ม Transaction ใหม่ทุกๆ 3 รอบ (สุ่ม)
        transactions: Math.random() > 0.7 
            ? [
                { 
                  date: new Date().toISOString().split('T')[0], 
                  client: `Client ${Math.floor(Math.random() * 900) + 100}`, 
                  amount: Math.floor(Math.random() * 9000) + 1000, 
                  status: Math.random() > 0.5 ? 'Completed' : 'Processing' 
                },
                ...dataRef.current.transactions.slice(0, 4) // เก็บแค่ 5 อันล่าสุด
              ] 
            : dataRef.current.transactions
      };

      setData(newData);
      dataRef.current = newData; // อัปเดต Ref ด้วย
    }, 2000); // ขยับทุก 2 วินาที

    return () => clearInterval(interval);
  }, []);

  // --- 3. จำลอง SDK Logic (ส่งข้อมูลล่าสุดจาก Ref ให้ AI) ---
  useEffect(() => {
    if (getEmbeddedComponent) {
      getEmbeddedComponent({
        getPages: async () => [{
           isActive: true,
           getVisuals: async () => {
             // สร้างข้อมูล Text สรุปจากข้อมูลปัจจุบัน (Real-time)
             const cur = dataRef.current;
             return [
               { title: "Total Revenue", data: `Metric,Value\nRevenue,$${(cur.revenue/1000000).toFixed(2)}M` },
               { title: "Active Customers", data: `Metric,Value\nCustomers,${cur.customers}` },
               { title: "Revenue by Region", data: cur.bars.map(b => `${b.label},$${(b.val1/1000000).toFixed(2)}M`).join('\n') },
               { title: "Recent Transactions", data: cur.transactions.map(t => `${t.date},${t.client},$${t.amount},${t.status}`).join('\n') }
             ].map(v => ({
                title: v.title,
                exportData: async () => ({ data: v.data }) 
             }));
           }
        }]
      });
    }
  }, []);

  // Helper ฟังก์ชันแปลงตัวเลขให้สวย
  const fmt = (num) => num.toLocaleString(); 
  const fmtM = (num) => `$${(num / 1000000).toFixed(2)}M`;

  // ฟังก์ชัน Trigger (เหมือนเดิม)
  const handleSimulateClick = (category, value) => {
    const handler = eventHandlers?.get('dataSelected');
    if (handler) {
      handler({
        detail: {
          dataPoints: [{
              identity: [{ equals: category }],
              values: [{ formattedValue: value }]
          }]
        }
      });
    }
  };

  // --- Styles ---
  const styles = {
    container: { width: '100%', height: '100%', backgroundColor: '#eaeaea', border: '1px solid #ccc', fontFamily: '"Segoe UI", sans-serif' },
    header: { padding: '8px 15px', background: '#f3f2f1', borderBottom: '1px solid #e1dfdd', display: 'flex', justifyContent: 'space-between' },
    canvasBox: { padding: '20px', height: 'calc(100% - 40px)', overflowY: 'auto', background: '#eaeaea' },
    reportCanvas: { 
        backgroundColor: '#fff', boxShadow: '0 0 20px rgba(0,0,0,0.1)', padding: '15px', height: '800px', 
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: '100px 300px 300px', gap: '15px'
    },
    tile: { background: '#fff', border: '1px solid #e6e6e6', padding: '15px', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: '0.2s' },
    tileTitle: { fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '10px' },
    kpiValue: { fontSize: '28px', fontWeight: 'bold', color: '#0078d4', transition: 'color 0.3s' }, // เพิ่ม transition
  };

  return (
    <div style={styles.container}>
      <iframe title="Sample Report Demo" width="1140" height="541.25" src="https://playground.powerbi.com/sampleReportEmbed" frameborder="0" allowFullScreen="true"></iframe>
      <div style={styles.header}>
        <span style={{ fontWeight: '600', color: '#333' }}>Live Sales Dashboard 🔴</span>
        <span style={{ fontSize:'12px', color:'#666' }}>Last updated: {new Date().toLocaleTimeString()}</span>
      </div>

      <div style={styles.canvasBox}>
        <div style={styles.reportCanvas}>
           
           {/* --- KPI Cards (วิ่งได้) --- */}
           <div style={styles.tile} onClick={() => handleSimulateClick("Total Revenue", fmtM(data.revenue))}>
              <div style={styles.tileTitle}>Total Revenue</div>
              <div style={styles.kpiValue}>{fmtM(data.revenue)}</div>
              <div style={{fontSize:'12px', color:'green'}}>▲ 5% vs Target</div>
           </div>

           <div style={styles.tile} onClick={() => handleSimulateClick("Gross Profit", fmtM(data.profit))}>
              <div style={styles.tileTitle}>Gross Profit</div>
              <div style={{...styles.kpiValue, color:'#107c10'}}>{fmtM(data.profit)}</div>
              <div style={{fontSize:'12px', color:'#666'}}>Margin 42.8%</div>
           </div>

           <div style={styles.tile} onClick={() => handleSimulateClick("Active Customers", fmt(data.customers))}>
              <div style={styles.tileTitle}>Active Customers</div>
              <div style={styles.kpiValue}>{fmt(data.customers)}</div>
              <div style={{fontSize:'12px', color:'green'}}>Online Now</div>
           </div>

           <div style={styles.tile}>
              <div style={styles.tileTitle}>Growth Rate</div>
              <div style={{...styles.kpiValue, color:'#d13438'}}>{data.growth}%</div>
              <div style={{fontSize:'12px', color:'red'}}>stable</div>
           </div>

           {/* --- Main Chart (กราฟขยับได้) --- */}
           <div 
             style={{...styles.tile, gridColumn: 'span 3', position:'relative'}}
             onClick={() => handleSimulateClick("North America Sales", fmtM(data.bars[0].val1))}
           >
              <div style={styles.tileTitle}>Live Revenue Stream (Real-time)</div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '20px', paddingBottom:'10px' }}>
                 {data.bars.map((bar, idx) => (
                     <div key={idx} style={{width:'25%', height:'100%', display:'flex', flexDirection:'column', justifyContent:'flex-end', position:'relative'}}>
                        {/* แท่งบน */}
                        <div style={{
                            height: `${(bar.val1 / 2500000) * 80}%`, // คำนวณความสูง % ตามค่าจริง
                            background: '#0078d4', 
                            transition: 'height 0.5s ease-out', // ✨ Animation สมูทๆ
                            marginBottom: '2px'
                        }} title={`${bar.label} Main: $${bar.val1}`}></div>
                        
                        {/* แท่งล่าง */}
                        <div style={{
                            height: `${(bar.val2 / 2500000) * 80}%`, 
                            background: '#50e6ff', 
                            transition: 'height 0.5s ease-out' 
                        }}></div>
                        
                        <div style={{textAlign:'center', fontSize:'11px', marginTop:'5px'}}>{bar.label}</div>
                     </div>
                 ))}
              </div>
           </div>

           {/* --- Donut Chart --- */}
           <div style={styles.tile} onClick={() => handleSimulateClick("Electronics Category", "45% Mix")}>
              <div style={styles.tileTitle}>Sales Mix</div>
              <div style={{flex:1, display:'flex', justifyContent:'center', alignItems:'center'}}>
                <div style={{
                    width:'120px', height:'120px', borderRadius:'50%', 
                    background: `conic-gradient(#0078d4 0% ${40 + (data.customers % 10)}%, #FFBB28 ${40 + (data.customers % 10)}% 75%, #FF8042 75% 100%)`, // หมุนสีเล่นๆ ตามเลขลูกค้า
                    transition: 'background 0.5s ease',
                    position:'relative', display:'flex', justifyContent:'center', alignItems:'center'
                }}>
                    <div style={{width:'70px', height:'70px', background:'white', borderRadius:'50%', display:'flex', justifyContent:'center', alignItems:'center', fontSize:'12px'}}>Live</div>
                </div>
              </div>
           </div>

           {/* --- Table (ข้อมูลไหล) --- */}
           <div style={{...styles.tile, gridColumn: 'span 4', cursor: 'default'}}>
              <div style={styles.tileTitle}>Live Transactions Feed</div>
              <table style={{width:'100%', fontSize:'12px', borderCollapse:'collapse'}}>
                 <thead style={{textAlign:'left', color:'#888'}}><tr><th>Time</th><th>Customer</th><th>Amount</th><th>Status</th></tr></thead>
                 <tbody>
                    {data.transactions.map((t, i) => (
                        <tr key={i} style={{animation: i===0 ? 'flash 1s' : 'none'}}> {/* ไฟกระพริบแถวแรก */}
                            <td style={{padding:'5px', borderBottom:'1px solid #eee'}}>{t.date}</td>
                            <td style={{padding:'5px', borderBottom:'1px solid #eee'}}>{t.client}</td>
                            <td style={{padding:'5px', borderBottom:'1px solid #eee', fontWeight:'bold'}}>${t.amount}</td>
                            <td style={{padding:'5px', borderBottom:'1px solid #eee', color: t.status==='Completed'?'green':'orange'}}>{t.status}</td>
                        </tr>
                    ))}
                 </tbody>
              </table>
           </div>

        </div>
      </div>
      <style>{`
        @keyframes flash {
            0% { background-color: #e6fffa; }
            100% { background-color: transparent; }
        }
      `}</style>
    </div>
  );
};

export default MockPowerBIEmbed;