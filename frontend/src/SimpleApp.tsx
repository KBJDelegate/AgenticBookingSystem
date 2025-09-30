import React from 'react';

function SimpleApp() {
  // Debug logging
  console.log('SimpleApp component is rendering');

  // Add React to global scope for debugging
  (window as any).React = React;

  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f8ff', minHeight: '100vh' }}>
      <h1 style={{ color: 'blue' }}>🚀 Simple React App Working!</h1>
      <p>If you can see this, React is properly mounting.</p>
      <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '8px' }}>
        <h2>Debug Info:</h2>
        <ul>
          <li>React version: {React.version}</li>
          <li>Environment: {process.env.NODE_ENV}</li>
          <li>Current URL: {window.location.href}</li>
        </ul>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '8px' }}>
        <h3>✅ React Component Successfully Rendered!</h3>
        <p>The React application is working correctly.</p>
      </div>
    </div>
  );
}

export default SimpleApp;