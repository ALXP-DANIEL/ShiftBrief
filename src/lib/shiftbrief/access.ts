export const APP_ACCESS_KEY = "shiftbrief:appAccess";
export const APP_DESTINATION_KEY = "shiftbrief:appDestination";
export const ACTIVE_ROOM_KEY = "shiftbrief:activeRoom";
export const APP_ROLE_KEY = "shiftbrief:appRole";
export const APP_ACCESS_EVENT = "shiftbrief:app-access";

export type AppRole = "admin" | "worker";

export function hasAppAccess(): boolean {
  return localStorage.getItem(APP_ACCESS_KEY) === "granted";
}

export function getAppDestination(): string | null {
  return localStorage.getItem(APP_DESTINATION_KEY);
}

export function getActiveRoomCode(): string | null {
  return localStorage.getItem(ACTIVE_ROOM_KEY);
}

export function getAppRole(): AppRole | null {
  const role = localStorage.getItem(APP_ROLE_KEY);
  return role === "admin" || role === "worker" ? role : null;
}

export function clearAppAccess(): void {
  localStorage.removeItem(APP_ACCESS_KEY);
  localStorage.removeItem(APP_DESTINATION_KEY);
  localStorage.removeItem(ACTIVE_ROOM_KEY);
  localStorage.removeItem(APP_ROLE_KEY);
  window.dispatchEvent(new Event(APP_ACCESS_EVENT));
}

export function grantAppAccess(
  destination: string,
  roomCode: string,
  role: AppRole,
): void {
  localStorage.setItem(APP_ACCESS_KEY, "granted");
  localStorage.setItem(APP_DESTINATION_KEY, destination);
  localStorage.setItem(ACTIVE_ROOM_KEY, roomCode);
  localStorage.setItem(APP_ROLE_KEY, role);
  window.dispatchEvent(new Event(APP_ACCESS_EVENT));
}
