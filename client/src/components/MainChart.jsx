import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// รับ props 'data' มาจาก App.jsx
const MainChart = ({ data, onDataClick }) => {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: '250px' }}>
      
      <ResponsiveContainer width="100%" height="100%">
        {/* ส่ง data ที่รับมาเข้าไปใน BarChart */}
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip 
            cursor={{ fill: 'transparent' }}
            contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
          <Bar dataKey="uv" fill="#8884d8" onClick={(data) => onDataClick(data)}>
            {/* วนลูปสร้างแท่งกราฟ (ถ้า data มีค่า) */}
            {data && data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                cursor="pointer" 
                fill={index % 2 === 0 ? '#8884d8' : '#82ca9d'} 
                // เพิ่มลูกเล่น Hover แล้วเปลี่ยนสีนิดหน่อย
                className="bar-cell"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

    </div>
  );
};

export default MainChart;