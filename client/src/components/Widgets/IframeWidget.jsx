import React from 'react';

const IframeWidget = ({ url, title }) => {
  return (
    <div style={{ width: '100%', height: '100%', borderRadius: '10px', overflow: 'hidden', border: '1px solid #eee', background: '#fff' }}>
      <iframe 
        src={url} 
        title={title}
        width="100%" 
        height="100%" 
        style={{ border: 'none' }}
        allowFullScreen 
      />
    </div>
  );
};

export default IframeWidget;