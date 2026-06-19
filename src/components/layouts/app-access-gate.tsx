"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { HomeVoiceUpdate } from "@/components/shiftbrief/home-voice-update";
import {
  APP_ACCESS_EVENT,
  type AppRole,
  clearAppAccess,
  getActiveRoomCode,
  getAppDestination,
  getAppRole,
  grantAppAccess,
  hasAppAccess,
} from "@/lib/shiftbrief/access";

type AppAccessContextValue = {
  hasAccess: boolean;
  activeRoomCode: string | null;
  role: AppRole | null;
  grantAccess: (destination: string, roomCode: string, role: AppRole) => void;
};

const AppAccessContext = createContext<AppAccessContextValue>({
  hasAccess: false,
  activeRoomCode: null,
  role: null,
  grantAccess: () => undefined,
});

function isEntryRoute(pathname: string): boolean {
  return (
    pathname === "/" || pathname === "/join" || pathname.startsWith("/join/")
  );
}

export function useAppAccess() {
  return useContext(AppAccessContext);
}

export function AppAccessGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);

  useEffect(() => {
    function syncAccess() {
      setHasAccess(hasAppAccess());
      setActiveRoomCode(getActiveRoomCode());
      setRole(getAppRole());
      setReady(true);
    }

    syncAccess();
    window.addEventListener("storage", syncAccess);
    window.addEventListener(APP_ACCESS_EVENT, syncAccess);

    return () => {
      window.removeEventListener("storage", syncAccess);
      window.removeEventListener(APP_ACCESS_EVENT, syncAccess);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;

    if ((!hasAccess || !activeRoomCode || !role) && !isEntryRoute(pathname)) {
      router.replace("/");
      return;
    }

    if (hasAccess && activeRoomCode && pathname === "/") {
      const destination = getAppDestination();
      if (destination) router.replace(destination);
      return;
    }

    if (hasAccess && activeRoomCode && pathname === "/briefs") {
      router.replace(`/briefs/${activeRoomCode}`);
      return;
    }

    if (hasAccess && activeRoomCode && pathname === "/tasks") {
      router.replace(`/tasks/${activeRoomCode}`);
      return;
    }

    if (role === "worker" && !pathname.startsWith("/room/")) {
      router.replace(`/room/${activeRoomCode}`);
    }
  }, [activeRoomCode, hasAccess, pathname, ready, role, router]);

  useEffect(() => {
    if (!ready || !hasAccess || !activeRoomCode) return;

    const controller = new AbortController();

    fetch(`/api/shifts/${encodeURIComponent(activeRoomCode)}`, {
      cache: "no-store",
      signal: controller.signal,
    }).then((response) => {
      if (response.ok) return;
      clearAppAccess();
      setHasAccess(false);
      setActiveRoomCode(null);
      setRole(null);
      router.replace("/");
    });

    return () => controller.abort();
  }, [activeRoomCode, hasAccess, ready, router]);

  const value = useMemo(
    () => ({
      hasAccess,
      activeRoomCode,
      role,
      grantAccess: (
        destination: string,
        roomCode: string,
        nextRole: AppRole,
      ) => {
        grantAppAccess(destination, roomCode, nextRole);
        setHasAccess(true);
        setActiveRoomCode(roomCode);
        setRole(nextRole);
      },
    }),
    [activeRoomCode, hasAccess, role],
  );

  if (!ready && !isEntryRoute(pathname)) return null;
  if ((!hasAccess || !activeRoomCode || !role) && !isEntryRoute(pathname))
    return null;

  return (
    <AppAccessContext.Provider value={value}>
      {children}
      {role === "admin" && activeRoomCode && pathname !== "/" && (
        <HomeVoiceUpdate code={activeRoomCode} appRole="admin" />
      )}
    </AppAccessContext.Provider>
  );
}
