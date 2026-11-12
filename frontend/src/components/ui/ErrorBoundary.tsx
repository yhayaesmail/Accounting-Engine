import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "./Button.tsx";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("UI error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="panel" style={{ padding: 32, maxWidth: 520 }}>
          <h1 className="page-title">Something went wrong</h1>
          <p className="page-subtitle" style={{ marginBottom: 16 }}>
            {this.state.error.message}
          </p>
          <Button onClick={() => this.setState({ error: null })}>
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
