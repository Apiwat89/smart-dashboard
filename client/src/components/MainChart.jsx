import React from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const COLORS = ['#00C49F', '#FFBB28', '#FF8042', '#0088FE', '#AA336A'];

const CustomActiveDot = (props) => {
    const { cx, cy, stroke, payload, onDotClick } = props;
    if (!cx || !cy) return null;
    const handleDotClick = (e) => {
      e.stopPropagation();
      if (onDotClick && payload) onDotClick({ name: payload.name, uv: payload.uv || payload.value });
    };
    return (
      <svg x={cx - 10} y={cy - 10} width={20} height={20} style={{ overflow: 'visible' }}>
        <circle cx={10} cy={10} r={6} fill={stroke} stroke="white" strokeWidth={2} style={{ cursor: 'pointer' }} onClick={handleDotClick} />
        <circle cx={10} cy={10} r={10} fill={stroke} fillOpacity={0.3} style={{ pointerEvents: 'none' }}/>
      </svg>
    );
};

const MainChart = ({ data, type = 'bar', onDataClick }) => {
  
  // 1. ปรับ Margin ให้ชิดขึ้น เพราะกล่องเล็กลง
  const commonProps = { margin: { top: 5, right: 5, left: -25, bottom: 0 } };

  // 2. ฟังก์ชันตัดคำ (ถ้ายาวเกิน 5 ตัวอักษร ให้ใส่ ...)
  const formatXAxis = (tickItem) => {
      if (typeof tickItem === 'string' && tickItem.length > 5) {
          return tickItem.substring(0, 5) + '..';
      }
      return tickItem;
  };

  // 3. ปรับ Font แกน X/Y ให้เล็กลง (fontSize: 10)
  const axisProps = { 
      axisLine: false, 
      tickLine: false, 
      fontSize: 10,   // 👈 ลดขนาดตัวหนังสือ
      tick: { fill: '#aaa' } 
  };
  
  const handlePieClick = (data) => {
     if (onDataClick && data) onDataClick({ name: data.name, uv: data.value || data.uv });
  };

  const renderChart = () => {
    switch (type) {
      case 'area':
        return (
          <AreaChart data={data} {...commonProps}>
            <defs>
              <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00C49F" stopOpacity={0.3}/><stop offset="95%" stopColor="#00C49F" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
            
            {/* ใส่ tickFormatter เพื่อตัดคำ */}
            <XAxis dataKey="name" {...axisProps} tickFormatter={formatXAxis} interval="preserveStartEnd" />
            <YAxis {...axisProps} />
            
            <Tooltip contentStyle={{borderRadius:'10px', fontSize:'12px'}} cursor={{stroke:'#00C49F'}} />
            <Area type="monotone" dataKey="uv" stroke="#00C49F" strokeWidth={2} fillOpacity={1} fill="url(#colorUv)" />
          </AreaChart>
        );

      case 'doughnut':
        return (
            <PieChart>
              {/* 4. ลดขนาดวงกลม (Radius) ให้พอดีกล่องเล็ก */}
              <Pie 
                data={data} 
                innerRadius={45}  
                outerRadius={65} 
                paddingAngle={5} 
                dataKey="uv" 
                onClick={handlePieClick} 
                cursor="pointer"
              >
                {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{fontSize:'12px'}} />
              {/* ปรับขนาดตัวหนังสือตรงกลาง */}
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                 <tspan x="50%" dy="-5" fontSize="16" fontWeight="bold" fill="#333">Data</tspan>
              </text>
            </PieChart>
        );

      case 'bar':
        return (
           <BarChart data={data} {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee"/>
              <XAxis dataKey="name" {...axisProps} tickFormatter={formatXAxis} />
              <YAxis {...axisProps} />
              <Tooltip cursor={{fill: '#f0f0f0'}} contentStyle={{borderRadius:'10px', fontSize:'12px'}}/>
              <Bar dataKey="uv" fill="#00C49F" radius={[4, 4, 0, 0]} onClick={handlePieClick} cursor="pointer"/>
           </BarChart>
        );

      case 'line':
        return (
           <LineChart data={data} {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee"/>
              <XAxis dataKey="name" {...axisProps} tickFormatter={formatXAxis} />
              <YAxis {...axisProps} domain={[0, 5]} />
              <Tooltip contentStyle={{borderRadius:'10px', fontSize:'12px'}}/>
              <Line type="monotone" dataKey="uv" stroke="#FFBB28" strokeWidth={2} dot={{r:3}} />
           </LineChart>
        );

      default: return null;
    }
  };

  return <ResponsiveContainer width="100%" height="100%">{renderChart()}</ResponsiveContainer>;
};

export default MainChart;