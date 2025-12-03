import React from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const COLORS = ['#00C49F', '#e0e0e0', '#FFBB28', '#FF8042']; // สีเขียวหลัก, สีเทา

// ... (เก็บ Code CustomActiveDot อันเดิมไว้ เพราะ Logic ดีแล้ว) ...
const CustomActiveDot = (props) => {
    const { cx, cy, stroke, payload, onDotClick } = props;
    if (!cx || !cy) return null;
  
    const handleDotClick = (e) => {
      e.stopPropagation();
      if (onDotClick && payload) {
        let val = payload.uv || payload.value || 0;
        const name = payload.name || "Unknown";
        onDotClick({ name, uv: val });
      }
    };
  
    return (
      <svg x={cx - 10} y={cy - 10} width={20} height={20} style={{ overflow: 'visible' }}>
        <circle cx={10} cy={10} r={6} fill={stroke} stroke="white" strokeWidth={2} 
                style={{ cursor: 'pointer' }} onClick={handleDotClick} />
        <circle cx={10} cy={10} r={10} fill={stroke} fillOpacity={0.3} style={{ pointerEvents: 'none' }}/>
      </svg>
    );
};

const MainChart = ({ data, type = 'bar', onDataClick }) => {
  const handleStandardClick = (data) => {
    if (onDataClick && data) {
       onDataClick({ name: data.name, uv: data.value || data.uv });
    }
  };

  const commonProps = { margin: { top: 10, right: 10, left: -20, bottom: 0 } };

  const renderChart = () => {
    switch (type) {
      case 'area':
        return (
          <AreaChart data={data} {...commonProps}>
            <defs>
              <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00C49F" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#00C49F" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} tick={{fill: '#aaa'}} />
            <YAxis axisLine={false} tickLine={false} fontSize={12} tick={{fill: '#aaa'}} />
            <Tooltip contentStyle={{borderRadius: '10px', border:'none', boxShadow:'0 5px 15px rgba(0,0,0,0.1)'}} cursor={{stroke: '#00C49F', strokeWidth: 1}} />
            <Area type="monotone" dataKey="uv" stroke="#00C49F" strokeWidth={3} fillOpacity={1} fill="url(#colorUv)" 
                  activeDot={<CustomActiveDot onDotClick={onDataClick} />} />
          </AreaChart>
        );

      case 'doughnut': // Pie Chart แบบเจาะรู
        return (
            <PieChart>
              <Pie
                data={data}
                innerRadius={60} // เจาะรูตรงกลาง
                outerRadius={80}
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
              {/* ใส่ตัวเลขตรงกลาง */}
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                 <tspan x="50%" dy="-10" fontSize="24" fontWeight="bold" fill="#333">72%</tspan>
                 <tspan x="50%" dy="20" fontSize="12" fill="#999">Female</tspan>
              </text>
            </PieChart>
        );
      
      // ... (Bar Chart ใช้ Logic เดิมได้เลย)
      default: return null;
    }
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      {renderChart()}
    </ResponsiveContainer>
  );
};

export default MainChart;