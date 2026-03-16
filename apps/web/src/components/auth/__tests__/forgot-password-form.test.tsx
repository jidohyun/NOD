import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils";
import { ForgotPasswordForm } from "../forgot-password-form";

vi.mock("@/config/env", () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
    NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    NEXT_PUBLIC_API_URL: "http://localhost:8000",
  },
}));

describe("ForgotPasswordForm", () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    isSubmitting: false,
    sent: false,
  };

  // Test 8.1
  it("renders email input and send button", () => {
    renderWithProviders(<ForgotPasswordForm {...defaultProps} />);

    expect(screen.getByPlaceholderText("Email address")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send reset link" })).toBeInTheDocument();
  });

  // Test 8.2
  it("shows validation error for invalid email", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordForm {...defaultProps} />);

    await user.type(screen.getByPlaceholderText("Email address"), "invalid");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() => {
      expect(screen.getByText("Please enter a valid email address.")).toBeInTheDocument();
    });
  });

  // Test 8.3
  it("calls onSubmit with email", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordForm {...defaultProps} onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText("Email address"), "test@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith("test@example.com");
    });
  });

  // Test 8.4
  it("shows success message when sent is true", () => {
    renderWithProviders(<ForgotPasswordForm {...defaultProps} sent={true} />);

    expect(
      screen.getByText("Password reset link sent. Please check your inbox.")
    ).toBeInTheDocument();
  });

  // Test 8.5 (page integration tested separately)

  // Test 8.6
  it("renders back to login link", () => {
    renderWithProviders(<ForgotPasswordForm {...defaultProps} />);

    expect(screen.getByText("Back to login")).toBeInTheDocument();
  });
});
