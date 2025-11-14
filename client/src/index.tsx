import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';
import './styles/globals.css';
import { ThemeProvider } from './context/ThemeContext';

const sentryDsn = process.env.SENTRY_DSN;
if (sentryDsn) {
  const parseRate = (value: string | undefined, fallback: number) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    tracePropagationTargets: ['localhost', /^\//],
    tracesSampleRate: parseRate(process.env.SENTRY_TRACES_SAMPLE_RATE, 0.2),
    profilesSampleRate: parseRate(process.env.SENTRY_PROFILES_SAMPLE_RATE, 0),
  });
}

const ErrorFallback: React.FC = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-neutral-100 px-6 text-center text-neutral-1000 dark:bg-neutral-1000 dark:text-neutral-0">
    <h1 className="text-24 font-semibold">Something went wrong</h1>
    <p className="text-14 text-neutral-700 dark:text-neutral-300">
      Our team has been notified. Please refresh your browser to continue.
    </p>
  </div>
);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
