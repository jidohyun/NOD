import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils";
import { SignupForm } from "../signup-form";

vi.mock("@/config/env", () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
    NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    NEXT_PUBLIC_API_URL: "http://localhost:8000",
  },
}));

describe("SignupForm", () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    onGoogleSignUp: vi.fn(),
    isSubmitting: false,
    error: null as string | null,
  };

  // Test 4.1
  it("renders name, email, password, and confirm password fields", () => {
    renderWithProviders(<SignupForm {...defaultProps} />);

    expect(screen.getByPlaceholderText("Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email address")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password (8+ characters)")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Confirm password")).toBeInTheDocument();
  });

  // Test 4.2
  it("renders create account button", () => {
    renderWithProviders(<SignupForm {...defaultProps} />);

    expect(screen.getByRole("button", { name: "Create account" })).toBeInTheDocument();
  });

  // Test 4.3
  it("shows validation error for empty name", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignupForm {...defaultProps} />);

    await user.type(screen.getByPlaceholderText("Email address"), "test@example.com");
    await user.type(screen.getByPlaceholderText("Password (8+ characters)"), "password123");
    await user.type(screen.getByPlaceholderText("Confirm password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(screen.getByText("Please enter your name.")).toBeInTheDocument();
    });
  });

  // Test 4.4
  it("shows validation error for invalid email", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignupForm {...defaultProps} />);

    await user.type(screen.getByPlaceholderText("Name"), "Test User");
    await user.type(screen.getByPlaceholderText("Email address"), "invalid");
    await user.type(screen.getByPlaceholderText("Password (8+ characters)"), "password123");
    await user.type(screen.getByPlaceholderText("Confirm password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(screen.getByText("Please enter a valid email address.")).toBeInTheDocument();
    });
  });

  // Test 4.5
  it("shows validation error for password less than 8 characters", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignupForm {...defaultProps} />);

    await user.type(screen.getByPlaceholderText("Name"), "Test User");
    await user.type(screen.getByPlaceholderText("Email address"), "test@example.com");
    await user.type(screen.getByPlaceholderText("Password (8+ characters)"), "short");
    await user.type(screen.getByPlaceholderText("Confirm password"), "short");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(screen.getByText("Password must be at least 8 characters.")).toBeInTheDocument();
    });
  });

  // Test 4.6
  it("shows validation error for password mismatch", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignupForm {...defaultProps} />);

    await user.type(screen.getByPlaceholderText("Name"), "Test User");
    await user.type(screen.getByPlaceholderText("Email address"), "test@example.com");
    await user.type(screen.getByPlaceholderText("Password (8+ characters)"), "password123");
    await user.type(screen.getByPlaceholderText("Confirm password"), "different123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    });
  });

  // Test 4.7
  it("calls onSubmit with name, email, password on valid submission", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<SignupForm {...defaultProps} onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText("Name"), "Test User");
    await user.type(screen.getByPlaceholderText("Email address"), "test@example.com");
    await user.type(screen.getByPlaceholderText("Password (8+ characters)"), "password123");
    await user.type(screen.getByPlaceholderText("Confirm password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith("Test User", "test@example.com", "password123");
    });
  });

  // Test 4.8
  it("disables button and shows loading text when isSubmitting", () => {
    renderWithProviders(<SignupForm {...defaultProps} isSubmitting={true} />);

    const button = screen.getByRole("button", { name: "Creating account..." });
    expect(button).toBeDisabled();
  });

  // Test 4.9
  it("displays error message from error prop", () => {
    renderWithProviders(<SignupForm {...defaultProps} error="This email is already registered." />);

    expect(screen.getByText("This email is already registered.")).toBeInTheDocument();
  });

  // Test 4.10
  it("renders sign in link", () => {
    renderWithProviders(<SignupForm {...defaultProps} />);

    expect(screen.getByText("Sign in")).toBeInTheDocument();
  });

  // Test 4.11
  it("renders Google sign up button", () => {
    renderWithProviders(<SignupForm {...defaultProps} />);

    expect(screen.getByRole("button", { name: "Sign up with Google" })).toBeInTheDocument();
  });
});
