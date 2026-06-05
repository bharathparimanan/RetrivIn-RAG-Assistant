import React from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';

const Reports: React.FC = () => {
  const { sessionId } = useParams();
  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-primary)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: 13 }}>
          Evaluating your answers...
        </p>
        <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', fontSize: 11 }}>
          Session: {sessionId}
        </p>
      </div>
    </div>
  );
};

export default Reports;
