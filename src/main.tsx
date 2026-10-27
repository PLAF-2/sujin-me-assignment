import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/noto-serif-kr/300.css';
import '@fontsource/noto-serif-kr/500.css';
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import './styles/tokens.css';
import './styles/global.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

const root = document.getElementById('root');
if (!root) throw new Error('#root element is missing from index.html');

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
