import { Component, type ComponentType, type ErrorInfo, type ReactNode } from 'react';
import { RotateCw } from 'lucide-react';
import { GlassCard } from '@workspace/afterglow-design-system/components/afterglow/glass-card';
import { Button } from '@workspace/afterglow-design-system/components/afterglow/button';

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  FallbackComponent?: ComponentType<ErrorFallbackProps>;
  /** Changing this clears a caught error. Pass the route to recover on navigation. */
  resetKey?: unknown;
}

interface ErrorBoundaryState {
  error: Error | null;
}

function toError(value: unknown): Error {
  if (value instanceof Error) return value;
  if (typeof value === 'string') return new Error(value);
  try {
    return new Error(JSON.stringify(value));
  } catch {
    return new Error(String(value));
  }
}

function DefaultFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="flex min-h-[60dvh] w-full items-center justify-center p-6" role="alert">
      <GlassCard className="w-full max-w-lg">
        <h1 className="type-title mb-2">Something went wrong</h1>
        <p>This part of the app hit an error. The rest of the app is still running.</p>
        {import.meta.env.DEV ? (
          <pre className="mt-4 overflow-x-auto rounded-sm border border-line bg-bg-raised p-3 text-left text-xs text-ink-muted">
            {error.message || String(error)}
          </pre>
        ) : null}
        <Button className="mt-6" onClick={resetError} icon={<RotateCw className="h-4 w-4" />} data-testid="button-error-reset">
          Try again
        </Button>
      </GlassCard>
    </div>
  );
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error: toError(error) };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', toError(error), info.componentStack);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (this.state.error !== null && prevProps.resetKey !== this.props.resetKey) this.resetError();
  }

  resetError = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (error === null) return this.props.children;
    const Fallback = this.props.FallbackComponent ?? DefaultFallback;
    return <Fallback error={error} resetError={this.resetError} />;
  }
}
