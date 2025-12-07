import React from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  RadialBarChart, RadialBar, ComposedChart, Legend,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

// --- Constants & Helpers ---
const COLORS = ['#00C49F', '#FFBB28', '#FF8042', '#0088FE', '#AA336A'];

// ฟังก์ชันตัดคำแกน X
const formatXAxis = (tick) => (typeof tick === 'string' && tick.length > 5 ? `${tick.substring(0, 5)}..` : tick);

// Config กลางของกราฟ
const commonChartProps = { margin: { top: 5, right: 5, left: -25, bottom: 0 } };
const axisStyle = { axisLine: false, tickLine: false, fontSize: 10, tick: { fill: '#aaa' } };
const tooltipStyle = { borderRadius: '10px', fontSize: '12px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' };

// จุด Trigger สีส้มตอน Hover
const CustomActiveDot = ({ cx, cy, payload, onDotClick }) => {
  if (!cx || !cy) return null;
  return (
    <svg x={cx - 10} y={cy - 10} width={20} height={20} style={{ overflow: 'visible' }}>
      <circle cx={10} cy={10} r={6} fill="#FF8042" stroke="white" strokeWidth={2} 
        style={{ cursor: 'pointer' }}
        onClick={(e) => { e.stopPropagation(); onDotClick && onDotClick(payload); }} 
      />
      <circle cx={10} cy={10} r={10} fill="#FF8042" fillOpacity={0.3} style={{ pointerEvents: 'none' }}/>
    </svg>
  );
};

// ✨ สร้าง Component Tooltip แบบกำหนดเอง (ใส่ไว้ใน MainChart หรือข้างนอกก็ได้)
const CustomRadialTooltip = ({ active, payload, dataKeys }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ 
        backgroundColor: '#fff', 
        padding: '10px', 
        border: '1px solid #ccc', 
        borderRadius: '10px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
      }}>
        {/* บรรทัดนี้บังคับให้โชว์ชื่อทีม (dataKeys.x) */}
        <p style={{ margin: 0, color: '#333', fontSize: '12px' }}>
           {data[dataKeys.x]}
        </p>
        {/* บรรทัดนี้โชว์ค่าตัวเลข */}
        <p style={{ margin: 0, color: '#8d8d8dff' , fontSize: '12px' }}>
           {`${dataKeys.y} : ${data[dataKeys.y]}`}
        </p>
      </div>
    );
  }
  return null;
};

// --- Component หลัก ---
const MainChart = ({ data, type = 'bar', onDataClick, dataKeys = { x: 'name', y: 'uv' } }) => {
  
  const handleClick = (item, e) => {
    e?.stopPropagation();
    if (onDataClick && item) {
       // แปลงข้อมูลให้เป็น Format มาตรฐานก่อนส่งกลับ
       onDataClick({ 
         name: item[dataKeys.x] || item.name, 
         uv: item[dataKeys.y] || item.value 
       });
    }
  };

  const renderChart = () => {
    switch (type) {
      case 'area':
        return (
          <AreaChart data={data} {...commonChartProps}>
            <defs>
              <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00C49F" stopOpacity={0.3}/><stop offset="95%" stopColor="#00C49F" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee"/>
            <XAxis dataKey={dataKeys.x} {...axisStyle} tickFormatter={formatXAxis} interval="preserveStartEnd" />
            <YAxis {...axisStyle} />
            <Tooltip contentStyle={tooltipStyle} cursor={{stroke:'#00C49F'}} />
            
            <Area type="monotone" dataKey={dataKeys.y} stroke="#00C49F" strokeWidth={2} fillOpacity={1} fill="url(#colorUv)" 
              dot={{
                r: 3,
                fill: "white",   
                stroke: "#00C49F", 
                strokeWidth: 2
              }}/>
            {/* Invisible Line for Click Trigger */}
            <Line type="monotone" dataKey={dataKeys.y} stroke="none" strokeWidth={0} 
              activeDot={<CustomActiveDot onDotClick={(p) => handleClick(p)} />} 
              tooltipType="none" 
            />
          </AreaChart>
        );

      case 'bar':
        return (
           <BarChart data={data} {...commonChartProps}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee"/>
              <XAxis dataKey={dataKeys.x} {...axisStyle} tickFormatter={formatXAxis} />
              <YAxis {...axisStyle} />
              <Tooltip cursor={{fill: '#f5f7fa'}} contentStyle={tooltipStyle}/>
              <Bar dataKey={dataKeys.y} fill="#00C49F" radius={[4, 4, 0, 0]} cursor="pointer"
                 onClick={(data, i, e) => handleClick(data, e)} 
              />
           </BarChart>
        );

      case 'line':
        return (
           <LineChart data={data} {...commonChartProps}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee"/>
              <XAxis dataKey={dataKeys.x} {...axisStyle} tickFormatter={formatXAxis} />
              <YAxis {...axisStyle} />
              <Tooltip contentStyle={tooltipStyle}/>
              <Line type="monotone" dataKey={dataKeys.y} stroke="#FFBB28" strokeWidth={2} dot={{r:3}}
                 activeDot={<CustomActiveDot onDotClick={(p) => handleClick(p)} />} 
              />
           </LineChart>
        );

      case 'doughnut':
        return (
            <PieChart>
              <Pie data={data} innerRadius={45} outerRadius={65} paddingAngle={5} 
                dataKey={dataKeys.y} nameKey={dataKeys.x} cursor="pointer"
                onClick={(data, i, e) => handleClick(data, e)}
              >
                {data.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                 <tspan x="50%" dy="-5" fontSize="16" fontWeight="bold" fill="#333">Data</tspan>
              </text>
            </PieChart>
        );

      case 'radar':
        return (
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="#e0e0e0" />
            <PolarAngleAxis dataKey={dataKeys.x} tick={{ fill: '#888', fontSize: 11 }} />
            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
            <Radar
              name="Value"
              dataKey={dataKeys.y}
              stroke="#00C49F"
              fill="#00C49F"
              fillOpacity={0.5}
              cursor="pointer"
              // Radar คลิกได้ทั้งพื้นที่ (เพราะไม่มีจุดแยก)
              onClick={(e) => {
                 if(e && onDataClick) onDataClick({ name: "Radar Chart", uv: "Overview" }); 
              }}
            />
            <Tooltip contentStyle={tooltipStyle} />
          </RadarChart>
        );

      case 'radial':
        return (
          <RadialBarChart 
            cx="35%"  // ✨ แก้จุดที่ 1: ขยับกราฟไปซ้ายเยอะๆ (30%) จะได้ห่างจาก Legend
            cy="50%" 
            innerRadius="20%" 
            outerRadius="100%" 
            barSize={20} 
            data={data}
          >
            <RadialBar
              minAngle={15}
              label={{ position: 'insideStart', fill: '#fff', fontSize: 10 }}
              background
              clockWise
              dataKey={dataKeys.y}
              cornerRadius={10}
              onClick={(data, i, e) => handleClick(data, e)}
              cursor="pointer"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </RadialBar>
            
            <Legend 
              iconSize={10} 
              layout="vertical" 
              verticalAlign="middle" 
              align="right"
              // ✨ แก้จุดที่ 2: ปรับแต่ง Legend ให้สวยงาม
              wrapperStyle={{ 
                 right: 0, 
                 fontSize: '12px', 
                 fontWeight: '500',
                 color: '#555' 
              }} 
            />
            
            {/* ✨ แก้จุดที่ 3: ใช้ Custom Tooltip แทนของเดิม */}
            <Tooltip content={<CustomRadialTooltip dataKeys={dataKeys} />} cursor={false} />
            
          </RadialBarChart>
        );

      case 'composed':
        return (
          <ComposedChart data={data} {...commonChartProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
            <XAxis dataKey={dataKeys.x} {...axisStyle} tickFormatter={formatXAxis} />
            <YAxis {...axisStyle} />
            <Tooltip contentStyle={tooltipStyle} />
            
            {/* ✨ เพิ่ม onClick ให้ Bar */}
            <Bar 
              dataKey={dataKeys.y} 
              barSize={20} 
              fill="#00C49F" 
              radius={[4, 4, 0, 0]} 
              fillOpacity={0.6}
              cursor="pointer"
              onClick={(data, i, e) => handleClick(data, e)}
            />
            
            {/* ✨ เพิ่ม ActiveDot ให้ Line */}
            <Line 
              type="monotone" 
              dataKey={dataKeys.y} 
              stroke="#FFBB28" 
              strokeWidth={2} 
              dot={{ r: 3, fill: 'white', stroke: '#FFBB28', strokeWidth: 2 }} 
              tooltipType="none" 
            />
          </ComposedChart>
        );

      default: return null;
    }
  };

  return <ResponsiveContainer width="100%" height="100%">{renderChart()}</ResponsiveContainer>;
};

export default MainChart;