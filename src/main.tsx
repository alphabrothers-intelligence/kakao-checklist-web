import { StrictMode, Component, type ReactNode, type ErrorInfo } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('화면을 표시하지 못했습니다.', error, info.componentStack); }
  render() { return this.state.failed ? <main className="container"><h1>화면을 불러오지 못했어요.</h1><p>새로고침한 후 다시 시도해 주세요.</p><button className="primary" onClick={() => location.reload()}>새로고침</button></main> : this.props.children; }
}
createRoot(document.getElementById('root')!).render(<StrictMode><ErrorBoundary><App /></ErrorBoundary></StrictMode>);
