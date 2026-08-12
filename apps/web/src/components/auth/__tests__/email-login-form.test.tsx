/**
 * @vitest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils";
import { EmailLoginForm } from "../email-login-form";

vi.mock("@/config/env", () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
    NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    NEXT_PUBLIC_API_URL: "http://localhost:8000",
  },
}));

describe("EmailLoginForm", () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    isSubmitting: false,
    error: null as string | null,
  };

  // Test 3.1
  it("renders email and password input fields", () => {
    renderWithProviders(<EmailLoginForm {...defaultProps} />);

    expect(screen.getByPlaceholderText("Email address")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
  });

  // Test 3.2
  it("renders sign in button", () => {
    renderWithProviders(<EmailLoginForm {...defaultProps} />);

    expect(screen.getByRole("button", { name: "Sign in with email" })).toBeInTheDocument();
  });

  // Test 3.3
  it("shows validation error for invalid email", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EmailLoginForm {...defaultProps} />);

    await user.type(screen.getByPlaceholderText("Email address"), "invalid");
    await user.type(screen.getByPlaceholderText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign in with email" }));

    await waitFor(() => {
      expect(screen.getByText("Please enter a valid email address.")).toBeInTheDocument();
    });
  });

  // Test 3.4
  it("shows validation error for empty password", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EmailLoginForm {...defaultProps} />);

    await user.type(screen.getByPlaceholderText("Email address"), "test@example.com");
    await user.click(screen.getByRole("button", { name: "Sign in with email" }));

    await waitFor(() => {
      expect(screen.getByText("Password must be at least 8 characters.")).toBeInTheDocument();
    });
  });

  // Test 3.5
  it("calls onSubmit with email and password on valid form submission", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<EmailLoginForm {...defaultProps} onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText("Email address"), "test@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign in with email" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith("test@example.com", "password123");
    });
  });

  // Test 3.6
  it("disables button when isSubmitting is true", () => {
    renderWithProviders(<EmailLoginForm {...defaultProps} isSubmitting={true} />);

    expect(screen.getByRole("button", { name: "Sign in with email" })).toBeDisabled();
  });

  // Test 3.7
  it("displays error message from error prop", () => {
    renderWithProviders(<EmailLoginForm {...defaultProps} error="Invalid email or password." />);

    expect(screen.getByText("Invalid email or password.")).toBeInTheDocument();
  });

  // Test 3.8
  it("renders forgot password link", () => {
    renderWithProviders(<EmailLoginForm {...defaultProps} />);

    expect(screen.getByText("Forgot password?")).toBeInTheDocument();
  });

  // Test 3.9
  it("renders sign up link", () => {
    renderWithProviders(<EmailLoginForm {...defaultProps} />);

    expect(screen.getByText("Sign up")).toBeInTheDocument();
  });
});
