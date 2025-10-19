// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React from 'react';

// --- Component: ErrorBoundary ---
/**
 * @interface ErrorBoundaryProps
 * @description Props for the `ErrorBoundary` component, requiring children and a fallback UI.
 */
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

/**
 * @interface ErrorBoundaryState
 * @description State for the `ErrorBoundary` component, tracking if an error has occurred.
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null; // Stores the error object
  errorInfo: React.ErrorInfo | null; // Stores component stack information
}

/**
 * @class ErrorBoundary
 * @extends React.Component
 * @description An enterprise-grade error boundary component that catches JavaScript errors
 *              anywhere in its child component tree, logs them, and displays a predefined
 *              fallback UI instead of crashing the entire application. This prevents white screens.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  /**
   * @method getDerivedStateFromError
   * @param {Error} error - The error that was thrown.
   * @returns {ErrorBoundaryState} - Updated state to indicate an error has occurred.
   * @description A static method to update state when an error is thrown, causing the next render
   *              to display the fallback UI.
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null }; // errorInfo is handled in componentDidCatch
  }

  /**
   * @method componentDidCatch
   * @param {Error} error - The error that was caught.
   * @param {React.ErrorInfo} errorInfo - Object with `componentStack` key.
   * @description Catches JavaScript errors in child components. This method is used for
   *              side-effects like logging the error to a service (e.g., Sentry, Bugsnag).
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to an external error reporting service (e.g., Sentry, Datadog RUM)
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
    // You might send this to a service here:
    // logErrorToService(error, errorInfo);
    this.setState({ errorInfo }); // Store error info for potential display/debugging
  }

  render() {
    if (this.state.hasError) {
      // Render the custom fallback UI when an error is detected
      return this.props.fallback;
    }

    // Otherwise, render the children normally
    return this.props.children;
  }
}