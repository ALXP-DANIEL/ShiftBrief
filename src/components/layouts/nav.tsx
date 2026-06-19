"use client";

import type { Icon } from "@phosphor-icons/react";
import { ClipboardTextIcon } from "@phosphor-icons/react/dist/ssr/ClipboardText";
import { HouseIcon } from "@phosphor-icons/react/dist/ssr/House";
import { ListChecksIcon } from "@phosphor-icons/react/dist/ssr/ListChecks";
import { SignOutIcon } from "@phosphor-icons/react/dist/ssr/SignOut";
import { SparkleIcon } from "@phosphor-icons/react/dist/ssr/Sparkle";
import * as motion from "motion/react-client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/shadcn/button";
import { clearAppAccess } from "@/lib/shiftbrief/access";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "../ui/theme-toggle";
import { useAppAccess } from "./app-access-gate";

const SWIPE_DISTANCE = 36;
const SWIPE_VELOCITY = 450;

const ITEMS: {
  id: string;
  baseHref: string;
  label: string;
  Icon: Icon;
}[] = [
  {
    id: "home",
    baseHref: "/room",
    label: "Home",
    Icon: HouseIcon,
  },
  {
    id: "briefs",
    baseHref: "/briefs",
    label: "Briefs",
    Icon: ClipboardTextIcon,
  },
  {
    id: "tasks",
    baseHref: "/tasks",
    label: "Tasks",
    Icon: ListChecksIcon,
  },
];

function LeaveRoomButton() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  function leaveRoom() {
    clearAppAccess();
    router.replace("/");
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="glass rounded-full"
        onClick={() => setConfirming(true)}
        aria-label="Leave room"
        title="Leave room"
      >
        <SignOutIcon size={18} weight="bold" />
      </Button>
      {confirming && (
        <ResponsiveDialog labelledBy="leave-room-title">
          <h2
            id="leave-room-title"
            className="text-xl font-bold tracking-tight"
          >
            Leave this room?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You will return to the entry page. Admins can restore access later
            using the room code and PIN.
          </p>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="rounded-full"
              onClick={() => setConfirming(false)}
            >
              Stay
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="lg"
              className="rounded-full"
              onClick={leaveRoom}
            >
              Leave room
            </Button>
          </div>
        </ResponsiveDialog>
      )}
    </>
  );
}

function isActiveHref(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({ layoutScope }: { layoutScope: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { activeRoomCode } = useAppAccess();
  const items = ITEMS.map((item) => ({
    ...item,
    href: `${item.baseHref}/${activeRoomCode}`,
  }));
  const activeIndex = items.findIndex(({ baseHref }) =>
    isActiveHref(pathname, baseHref),
  );

  function handlePanEnd(
    _: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number }; velocity: { x: number } },
  ) {
    const movedLeft =
      info.offset.x <= -SWIPE_DISTANCE || info.velocity.x <= -SWIPE_VELOCITY;
    const movedRight =
      info.offset.x >= SWIPE_DISTANCE || info.velocity.x >= SWIPE_VELOCITY;

    if (movedLeft && activeIndex < items.length - 1) {
      router.push(items[activeIndex + 1].href);
    } else if (movedRight && activeIndex > 0) {
      router.push(items[activeIndex - 1].href);
    }
  }

  return (
    <motion.nav
      onPanEnd={handlePanEnd}
      className="glass relative z-20 flex touch-pan-y items-center justify-between gap-1 rounded-full p-1.5 text-foreground lg:justify-start lg:gap-0.5 lg:p-1 lg:shadow-none"
    >
      {items.map(({ id, baseHref, href, label, Icon }) => {
        const isActive = isActiveHref(pathname, baseHref);

        return (
          <Link
            key={id}
            href={href}
            className={cn(
              "relative flex flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-2 transition-colors duration-500 ease-out lg:flex-initial lg:px-3 lg:py-1.5",
              isActive ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {isActive && (
              <motion.span
                layoutId={`${layoutScope}-active`}
                className="absolute inset-0 rounded-full"
                style={{ background: "var(--glass-active)" }}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <Icon
              size={18}
              weight={isActive ? "fill" : "regular"}
              className="relative z-10 lg:size-4"
            />
            <span
              className="relative z-10 overflow-hidden whitespace-nowrap text-[12px] font-semibold lg:text-[11px]"
              style={{
                maxWidth: isActive ? 80 : 0,
                opacity: isActive ? 1 : 0,
                transition: "max-width 0.32s ease, opacity 0.25s ease",
              }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </motion.nav>
  );
}

export function Nav() {
  const pathname = usePathname();
  const { activeRoomCode, hasAccess, role } = useAppAccess();

  if (pathname === "/") return null;

  if (role === "worker") {
    return (
      <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-5 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 lg:px-10 xl:px-16">
        <Link
          href={`/room/${activeRoomCode}`}
          className="flex items-center gap-2 text-[var(--shift-home-text)]"
        >
          <SparkleIcon weight="fill" size={18} />
          <span className="text-xs font-bold tracking-[0.16em] uppercase">
            ShiftBrief
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <LeaveRoomButton />
          <ThemeToggle />
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="fixed inset-x-0 top-0 z-50 flex justify-end px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2">
          <LeaveRoomButton />
          <ThemeToggle />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-5 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 lg:hidden">
        <Link
          href={`/room/${activeRoomCode}`}
          className="flex items-center gap-2 text-[var(--shift-home-text)]"
        >
          <SparkleIcon weight="fill" size={18} />
          <span className="text-xs font-bold tracking-[0.16em] uppercase">
            ShiftBrief
          </span>
        </Link>
        <ThemeToggle />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <NavLinks layoutScope="mobile-nav" />
      </div>

      <div className="fixed inset-x-0 top-0 z-50 hidden items-center justify-between px-8 py-4 lg:flex xl:px-12">
        <Link
          href={`/room/${activeRoomCode}`}
          className="glass flex items-center gap-2.5 rounded-full px-3.5 py-2 text-foreground"
        >
          <SparkleIcon weight="fill" size={20} />
          <span className="text-base font-bold tracking-tight">ShiftBrief</span>
        </Link>

        <div className="flex items-center gap-2">
          <NavLinks layoutScope="desktop-nav" />
          <LeaveRoomButton />
          <ThemeToggle />
        </div>
      </div>
    </>
  );
}
