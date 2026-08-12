import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils";
import { ResetPasswordForm } from "../reset-password-form";

vi.mock("@/config/env", () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
    NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    NEXT_PUBLIC_API_URL: "http://localhost:8000",
  },
}));

describe("ResetPasswordForm", () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    isSubmitting: false,
    success: false,
  };

  // Test 9.1
  it("renders new password and confirm password fields", () => {
    renderWithProviders(<ResetPasswordForm {...defaultProps} />);

    expect(screen.getByPlaceholderText("New password")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Confirm password")).toBeInTheDocument();
  });

  // Test 9.2
  it("shows validation error for password less than 8 characters", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordForm {...defaultProps} />);

    await user.type(screen.getByPlaceholderText("New password"), "short");
    await user.type(screen.getByPlaceholderText("Confirm password"), "short");
    await user.click(screen.getByRole("button", { name: "Change password" }));

    await waitFor(() => {
      expect(screen.getByText("Password must be at least 8 characters.")).toBeInTheDocument();
    });
  });

  // Test 9.3
  it("shows validation error for password mismatch", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordForm {...defaultProps} />);

    await user.type(screen.getByPlaceholderText("New password"), "password123");
    await user.type(screen.getByPlaceholderText("Confirm password"), "different123");
    await user.click(screen.getByRole("button", { name: "Change password" }));

    await waitFor(() => {
      expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    });
  });

  // Test 9.4
  it("calls onSubmit with new password on valid submission", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordForm {...defaultProps} onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText("New password"), "password123");
    await user.type(screen.getByPlaceholderText("Confirm password"), "password123");
    await user.click(screen.getByRole("button", { name: "Change password" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith("password123");
    });
  });

  // Test 9.5
  it("shows success message and login link when success is true", () => {
    renderWithProviders(<ResetPasswordForm {...defaultProps} success={true} />);

    expect(screen.getByText("Your password has been changed.")).toBeInTheDocument();
    expect(screen.getByText("Go to login")).toBeInTheDocument();
  });

  // Test 9.6 (page integration tested separately)
});
