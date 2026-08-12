/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock env before anything else imports it
vi.mock("@/config/env", () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
    NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    NEXT_PUBLIC_API_URL: "http://localhost:8000",
  },
}));

// Mock the supabase client module
const mockSignUp = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockResetPasswordForEmail = vi.fn();
const mockUpdateUser = vi.fn();
const mockResend = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signUp: mockSignUp,
      signInWithPassword: mockSignInWithPassword,
      resetPasswordForEmail: mockResetPasswordForEmail,
      updateUser: mockUpdateUser,
      resend: mockResend,
    },
  }),
}));

// Import after mocking
import {
  resendVerificationEmail,
  resetPassword,
  signInWithEmail,
  signUpWithEmail,
  updatePassword,
} from "../auth-client";

describe("auth-client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1.1
  it("signUpWithEmail calls supabase.auth.signUp with correct params", async () => {
    mockSignUp.mockResolvedValue({ data: { user: { id: "1" } }, error: null });

    await signUpWithEmail("test@example.com", "password123", "Test User");

    expect(mockSignUp).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
      options: {
        data: { full_name: "Test User" },
        emailRedirectTo: expect.stringContaining("/api/auth/callback?type=signup"),
      },
    });
  });

  // Test 1.2
  it("signUpWithEmail returns supabase response", async () => {
    const mockResponse = { data: { user: { id: "1" } }, error: null };
    mockSignUp.mockResolvedValue(mockResponse);

    const result = await signUpWithEmail("test@example.com", "password123", "Test User");

    expect(result).toEqual(mockResponse);
  });

  // Test 1.3
  it("signInWithEmail calls supabase.auth.signInWithPassword", async () => {
    mockSignInWithPassword.mockResolvedValue({ data: { session: {} }, error: null });

    await signInWithEmail("test@example.com", "password123");

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
  });

  // Test 1.4
  it("signInWithEmail returns supabase response", async () => {
    const mockResponse = { data: { session: { access_token: "token" } }, error: null };
    mockSignInWithPassword.mockResolvedValue(mockResponse);

    const result = await signInWithEmail("test@example.com", "password123");

    expect(result).toEqual(mockResponse);
  });

  // Test 1.5
  it("resetPassword calls supabase.auth.resetPasswordForEmail with redirectTo", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ data: {}, error: null });

    await resetPassword("test@example.com");

    expect(mockResetPasswordForEmail).toHaveBeenCalledWith("test@example.com", {
      redirectTo: expect.stringContaining("/reset-password"),
    });
  });

  // Test 1.6
  it("updatePassword calls supabase.auth.updateUser", async () => {
    mockUpdateUser.mockResolvedValue({ data: { user: {} }, error: null });

    await updatePassword("newPassword123");

    expect(mockUpdateUser).toHaveBeenCalledWith({ password: "newPassword123" });
  });

  // Test 1.7
  it("resendVerificationEmail calls supabase.auth.resend", async () => {
    mockResend.mockResolvedValue({ data: {}, error: null });

    await resendVerificationEmail("test@example.com");

    expect(mockResend).toHaveBeenCalledWith({ type: "signup", email: "test@example.com" });
  });
});
