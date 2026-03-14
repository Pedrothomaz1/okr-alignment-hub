import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function ThrowingComponent({ error }: { error: Error }) {
  throw error;
}

describe("ErrorBoundary", () => {
  // Suppress console.error from React's error boundary logging
  const originalConsoleError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });
  afterEach(() => {
    console.error = originalConsoleError;
  });

  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <div>Normal content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText("Normal content")).toBeInTheDocument();
  });

  it("renders fallback UI when child throws", () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent error={new Error("Test crash")} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Algo deu errado")).toBeInTheDocument();
    expect(screen.getByText(/Ocorreu um erro inesperado/)).toBeInTheDocument();
    expect(screen.getByText("Recarregar")).toBeInTheDocument();
  });

  it("renders custom fallback when provided", () => {
    render(
      <ErrorBoundary fallback={<div>Custom error page</div>}>
        <ThrowingComponent error={new Error("Test crash")} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Custom error page")).toBeInTheDocument();
  });

  it("does not expose error details to users", () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent error={new Error("Database connection string: pg://admin:secret@host")} />
      </ErrorBoundary>
    );

    expect(screen.queryByText(/Database/)).not.toBeInTheDocument();
    expect(screen.queryByText(/secret/)).not.toBeInTheDocument();
  });
});
