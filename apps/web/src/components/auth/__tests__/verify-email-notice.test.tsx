import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils";
import { VerifyEmailNotice } from "../verify-email-notice";

const emailRegex = /test@example.com/;

vi.mock("@/config/env", () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
    NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    NEXT_PUBLIC_API_URL: "http://localhost:8000",
  },
}));

describe("VerifyEmailNotice", () => {
  const defaultProps = {
    email: "test@example.com",
    onResend: vi.fn().mockResolvedValue(undefined),
  };

  // Test 7.1
  it("renders title and description text", () => {
    renderWithProviders(<VerifyEmailNotice {...defaultProps} />);

    expect(screen.getByText("Verify your email")).toBeInTheDocument();
  });

  // Test 7.2
  it("displays the email address", () => {
    renderWithProviders(<VerifyEmailNotice {...defaultProps} />);

    expect(screen.getByText(emailRegex)).toBeInTheDocument();
  });

  // Test 7.3
  it("renders resend button", () => {
    renderWithProviders(<VerifyEmailNotice {...defaultProps} />);

    expect(screen.getByRole("button", { name: "Resend verification email" })).toBeInTheDocument();
  });

  // Test 7.4
  it("calls onResend when resend button is clicked", async () => {
    const onResend = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(<VerifyEmailNotice {...defaultProps} onResend={onResend} />);

    await user.click(screen.getByRole("button", { name: "Resend verification email" }));

    await waitFor(() => {
      expect(onResend).toHaveBeenCalled();
    });
  });

  // Test 7.5
  it("shows success message after resend", async () => {
    const user = userEvent.setup();
    renderWithProviders(<VerifyEmailNotice {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "Resend verification email" }));

    await waitFor(() => {
      expect(screen.getByText("Verification email sent again.")).toBeInTheDocument();
    });
  });

  // Test 7.6
  it("renders back to login link", () => {
    renderWithProviders(<VerifyEmailNotice {...defaultProps} />);

    expect(screen.getByText("Back to login")).toBeInTheDocument();
  });
});
