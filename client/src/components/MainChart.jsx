import React from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// ============================================================================
// 1. Custom Active Dot (ฉบับขุดหาข้อมูล + แก้จุดสี่เหลี่ยม)
// ============================================================================
const CustomActiveDot = (props) => {
  // รับ prop onDotClick มาแทน onClick
  const { cx, cy, stroke, payload, onDotClick } = props;

  if (!cx || !cy) return null;

  const handleDotClick = (e) => {
    e.stopPropagation();

    if (onDotClick && payload) {
      // --- ขั้นตอนการขุดหาข้อมูล (Data Mining) ---
      
      // 1. หาชื่อ (Name)
      const name = payload.name || (payload.payload && payload.payload.name) || "Unknown";

      // 2. หาค่า (Value) - พยายามหาทุกที่ที่เป็นไปได้
      let val = payload.uv;
      if (val === undefined) val = payload.value; 
      if (val === undefined && payload.payload) val = payload.payload.uv || payload.payload.value;
      
      // ถ้าหาไม่เจอจริงๆ ให้เป็น 0 (กัน Undefined หลุดไป Server)
      if (val === undefined || val === null) val = 0;

      // Debug: ดูใน Console Browser ว่าส่งอะไรออกไป
      console.log(`🚀 [MainChart] Sending Dot Data: Name=${name}, Value=${val}`);

      // ส่งข้อมูลออกไป
      onDotClick({ 
        name: name, 
        uv: val 
      });
    }
  };

  return (
    // ใช้ overflow: visible เพื่อไม่ให้เงาวงกลมโดนตัดเป็นสี่เหลี่ยม
    <svg x={cx - 15} y={cy - 15} width={30} height={30} style={{ overflow: 'visible' }}>
      <g style={{ cursor: 'pointer', pointerEvents: 'auto' }} onClick={handleDotClick}>
        {/* วงแหวนเงาใหญ่ๆ (เพื่อให้กดง่าย + สวย) */}
        <circle cx={15} cy={15} r={12} fill={stroke} fillOpacity={0.2} />
        {/* จุดสีจริง */}
        <circle cx={15} cy={15} r={7} fill={stroke} stroke="white" strokeWidth={2} />
      </g>
    </svg>
  );
};

const MainChart = ({ data, type = 'bar', onDataClick }) => {

  // ฟังก์ชันคลิกสำหรับ Bar/Pie
  const handleStandardClick = (input) => {
    if (!onDataClick) return;
    const realData = input.payload || input;
    
    // Logic หาค่าเหมือนกัน
    let val = realData.uv;
    if (val === undefined) val = realData.value;
    if (val === undefined) val = 0;

    if (realData && realData.name) {
      console.log(`📊 [MainChart] Standard Click: ${realData.name} = ${val}`);
      onDataClick({ name: realData.name, uv: val });
    }
  };

  const tooltipSettings = {
    wrapperStyle: { pointerEvents: 'none', zIndex: 100 }, 
    contentStyle: { pointerEvents: 'none', borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
    cursor: { stroke: '#ccc', strokeWidth: 1, pointerEvents: 'none' }
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip {...tooltipSettings} />
            <Line 
              type="monotone" 
              dataKey="uv" 
              stroke="#8884d8" 
              strokeWidth={3} 
              style={{ pointerEvents: 'none' }}
              dot={{ 
                r: 5, strokeWidth: 2, cursor: 'pointer', pointerEvents: 'auto', 
                onClick: handleStandardClick 
              }} 
              // ส่ง onDotClick แทน onClick เพื่อไม่ให้ Recharts ทับ
              activeDot={<CustomActiveDot onDotClick={onDataClick} />}
            />
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip {...tooltipSettings} />
            <Area 
              type="monotone" 
              dataKey="uv" 
              stroke="#82ca9d" 
              fill="#82ca9d" 
              style={{ cursor: 'pointer', pointerEvents: 'none' }}
              dot={{ 
                r: 5, stroke: '#82ca9d', strokeWidth: 2, fill: '#fff', 
                cursor: 'pointer', pointerEvents: 'auto', 
                onClick: handleStandardClick 
              }}
              // ส่ง onDotClick แทน onClick
              activeDot={<CustomActiveDot onDotClick={onDataClick} />}
            />
          </AreaChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              innerRadius={50}
              outerRadius={70}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="uv"
              onClick={handleStandardClick}
              cursor="pointer"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        );

      case 'bar':
      default:
        return (
          <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip {...tooltipSettings} cursor={{ fill: 'transparent', pointerEvents: 'none' }} />
            <Bar dataKey="uv" onClick={handleStandardClick} cursor="pointer">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#8884d8' : '#82ca9d'} />
              ))}
            </Bar>
          </BarChart>
        );
    }
  };

  return (
    <div style={{ width: '100%', height: '220px' }}> 
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};

export default MainChart;