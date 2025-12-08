import React from 'react';
import { Users, Clock, Activity, DollarSign } from 'lucide-react';
import MainChart from './MainChart';

const VisualFactory = ({ widget, onChartClick }) => {
  const { type, title, value, trend, data, status, keys } = widget;

  if (type === 'kpi') {
    let Icon = Users, iconColor = "#00c49f", bgIcon = "#e6f7f3";
    if (title.includes("Revenue")) { Icon = DollarSign; iconColor="#0984e3"; bgIcon="#dfe6e9"; }
    
    return (
      <div className="stat-card" style={{height: '100%'}}>
         <div style={{background: bgIcon, padding:'10px', borderRadius:'10px', color: iconColor}}>
            <Icon size={20}/>
         </div>
         <div>
            <h3 style={{margin:0, fontSize:'1.4rem'}}>{value}</h3>
            <div style={{fontSize:'0.8rem', color:'#888', display:'flex', gap:'5px'}}>
               {title} <span style={{color: status==='up'?'green':'red', fontWeight:'bold'}}>{trend}</span>
            </div>
         </div>
      </div>
    );
  }

  if (['area', 'doughnut', 'bar', 'line', 'radar', 'radial', 'composed'].includes(type)) {
     return (
        <div className="chart-card" 
             style={{height: '100%', display:'flex', flexDirection:'column', cursor: 'pointer'}} 
             onClick={() => onChartClick(null, data)}>
           <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}>
              <h3 style={{margin:0, fontSize:'0.95rem', fontWeight:'600'}}>{title}</h3>
           </div>
           
           <div style={{flex:1, width:'100%', minHeight:0}}>
              <MainChart type={type} data={data} dataKeys={keys} onDataClick={(point) => onChartClick(point, data)} />
           </div>
        </div>
     );
  }
  return null;
};
export default VisualFactory;