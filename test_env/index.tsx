
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// dev-ui/index.tsx
// This is a placeholder TSX file for a potential React-based testing environment.
// The html-refactor script should ignore this file when processing HTML.

import React from 'react'; // Assuming React for a .tsx file example

interface TestComponentProps {
  title: string;
  initialCount?: number;
}

const TestComponent: React.FC<TestComponentProps> = ({ title, initialCount = 0 }) => {
  const [count, setCount] = React.useState(initialCount);

  // Styles defined in JSX are handled by the JSX transpiler (e.g., Babel)
  // and React, not by the html-refactor tool.
  const componentStyle: React.CSSProperties = {
    border: '2px solid #007bff',
    padding: '15px',
    margin: '20px 0',
    borderRadius: '8px',
    backgroundColor: '#f8f9fa',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: '#28a745',
    color: 'white',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginLeft: '10px'
  };

  return (
    <div style={componentStyle}>
      <h2>{title} (React TSX Component)</h2>
      <p>This component is for testing purposes and should be ignored by <code>html-refactor</code>.</p>
      <p>Current count: <strong>{count}</strong></p>
      <button style={buttonStyle} onClick={() => setCount(prev => prev + 1)}>
        Increment Count
      </button>
      <p style={{ fontSize: '0.9em', color: '#6c757d', marginTop: '10px' }}>
        <em>(Component-internal styles are managed by React/JSX, not by the HTML refactoring tool.)</em>
      </p>
    </div>
  );
};

// Example of how it might be rendered if this were part of a full React app:
// const App = () => (
//   <div>
//     <h1>Development UI with React</h1>
//     <TestComponent title="Sample TSX Element" initialCount={5} />
//   </div>
// );
//
// if (typeof document !== 'undefined') {
//   const rootElement = document.getElementById('react-root');
//   if (rootElement) {
//     // For React 18+
//     // const root = ReactDOM.createRoot(rootElement);
//     // root.render(<App />);
//   }
// }

export default TestComponent;
