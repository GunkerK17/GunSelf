"use client";

const GUEST_KEY = "gunself_guest_mode";
const LAST_AUTH_KEY = "gunself_last_auth_method";

export function isGuestSession(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.localStorage.getItem(GUEST_KEY) === "1";
}

export function startGuestSession(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(GUEST_KEY, "1");
}

export function clearGuestSession(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(GUEST_KEY);
}

export function setLastAuthMethod(method: string): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(LAST_AUTH_KEY, method);
}

export function popLastAuthMethod(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem(LAST_AUTH_KEY);
  if (value) {
    window.localStorage.removeItem(LAST_AUTH_KEY);
  }
  return value;
}
