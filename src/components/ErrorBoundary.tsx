import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { failed: boolean };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <main className="error-screen" role="alert">
        <p className="meta">ERR / UNREADABLE RECORD</p>
        <h1 className="error-screen__title">기록을 읽을 수 없습니다.</h1>
        <p className="error-screen__body">지우지 않은 것까지 흐려졌습니다. 처음부터 다시 시작해 주세요.</p>
        <button type="button" className="text-button" onClick={() => window.location.reload()}>
          다시 시작
        </button>
      </main>
    );
  }
}
