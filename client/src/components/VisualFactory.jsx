import React from 'react';
import { Users, Clock, Activity, DollarSign } from 'lucide-react';
import MainChart from './MainChart';

const VisualFactory = ({ widget, onChartClick }) => {
  const { type, title, value, trend, data, status } = widget;

  // 1. KPI CARD (คงเดิม)
  if (type === 'kpi') {
    let Icon = Users;
    let iconColor = "#00c49f";
    let bgIcon = "#e6f7f3";
    if (title.includes("Wait")) { Icon = Clock; iconColor="#ff7675"; bgIcon="#ffeaa7"; }
    else if (title.includes("Revenue")) { Icon = DollarSign; iconColor="#0984e3"; bgIcon="#dfe6e9"; }
    else if (title.includes("Satisfaction")) { Icon = Activity; iconColor="#fdcb6e"; bgIcon="#fff7d1"; }

    return (
      <div className="stat-card" style={{height: '100%', boxSizing:'border-box'}}>
         <div style={{background: bgIcon, padding:'10px', borderRadius:'10px', color: iconColor}}>
            <Icon size={20}/>
         </div>
         <div>
            <h3 style={{margin:0, fontSize:'1.4rem'}}>{value}</h3>
            <div style={{fontSize:'0.8rem', color:'#888', display:'flex', gap:'5px'}}>
               {title} <span style={{color: status==='good'||status==='up'?'green':'red', fontWeight:'bold'}}>{trend}</span>
            </div>
         </div>
      </div>
    );
  }

  // 2. GRAPH ZONE (แก้ใหม่)
  const chartTypeMap = { 'area': 'area', 'doughnut': 'doughnut', 'bar': 'bar', 'line': 'line' };

  if (chartTypeMap[type]) {
     return (
        <div className="chart-card" style={{height: '100%', display:'flex', flexDirection:'column'}}>
           <div style={{display:'flex',justifyContent:'space-between', marginBottom:'15px'}}>
              <h3 style={{margin:0, fontSize:'0.95rem', fontWeight:'600'}}>{title}</h3>
              {type === 'area' && <select style={{border:'1px solid #ddd', borderRadius:'5px', fontSize:'0.8rem'}}><option>Monthly</option></select>}
           </div>
           
           {/* บังคับความสูงกราฟให้พอดี */}
           <div style={{flex:1, width:'100%'}}>
              <MainChart 
                 type={chartTypeMap[type]} 
                 data={data} 
                 onDataClick={(point) => onChartClick(point, data)}
              />
           </div>
        </div>
     );
  }

  return <div style={{padding:20, color:'red'}}>Unknown Type</div>;
};

export default VisualFactory;