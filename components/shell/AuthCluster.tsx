"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as Popover from "@radix-ui/react-popover";
import { LogOut, BookOpen, FileText, User as UserIcon, Heart, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/hooks/useSession";

/**
 * Header right-cluster — swaps"Sign in / Register" for an avatar dropdown
 * once a session exists, per 00_global.md §3.
 *
 * `transparent` indicates the parent header is in overlay mode over a
 * dark hero, so text/icons need light treatment.
 */

export interface AuthClusterProps {
  transparent: boolean;
}

export function AuthCluster({ transparent }: AuthClusterProps) {
  const { session, ready, signOut } = useSession();
  const router = useRouter();

  // During SSR + the initial hydration, render the signed-out version so the
  // markup is stable. Once `ready` flips true the correct cluster paints.
  if (!ready || !session) {
    return <SignedOut transparent={transparent} />;
  }

  const onSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const initials =
    `${session.user.firstName?.[0] ?? ""}${session.user.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className={cn(
            "text-paper inline-flex size-9 items-center justify-center rounded-full",
            "bg-ink-100 hover:bg-ink-80",
            "focus-visible:outline-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2",
          )}
        >
          <span className="label-md">{initials || <UserIcon className="size-4" />}</span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className={cn("bg-surface border-border z-50 w-64 rounded-lg border p-2", "")}
        >
          <div className="px-3 py-2">
            <div className="headline-xs text-ink-95 truncate">
              {session.user.firstName} {session.user.lastName}
            </div>
            <div className="label-sm text-ink-50 truncate">{session.user.email}</div>
          </div>
          <hr className="border-border my-1" />
          <MenuLink href="/account" icon={<LayoutDashboard className="size-4" />}>
            Dashboard
          </MenuLink>
          <MenuLink href="/account/bookings" icon={<BookOpen className="size-4" />}>
            My bookings
          </MenuLink>
          <MenuLink href="/account/documents" icon={<FileText className="size-4" />}>
            Documents
          </MenuLink>
          <MenuLink href="/account/saved-vehicles" icon={<Heart className="size-4" />}>
            Saved cars
          </MenuLink>
          <MenuLink href="/account/profile" icon={<UserIcon className="size-4" />}>
            Profile
          </MenuLink>
          <hr className="border-border my-1" />
          <button
            type="button"
            onClick={onSignOut}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left",
              "body-md text-ink-95",
              "hover:bg-ink-10 focus-visible:outline-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2",
            )}
          >
            <LogOut className="text-ink-60 size-4" />
            Sign out
          </button>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function MenuLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2",
        "body-md text-ink-95",
        "hover:bg-ink-10 focus-visible:outline-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2",
      )}
    >
      <span className="text-ink-60">{icon}</span>
      {children}
    </Link>
  );
}

function SignedOut({ transparent }: { transparent: boolean }) {
  return (
    <>
      <Link
        href="/manage-booking"
        className={cn(
          "label-lg rounded-md px-2 py-1 whitespace-nowrap",
          transparent ? "text-paper hover:bg-white/10" : "text-ink-80 hover:bg-ink-10",
        )}
      >
        Manage booking
      </Link>
      <Link
        href="/login"
        className={cn(
          "label-lg rounded-md px-2 py-1 whitespace-nowrap",
          transparent ? "text-paper hover:bg-white/10" : "text-ink-80 hover:bg-ink-10",
        )}
      >
        Sign in
      </Link>
      <Button asChild variant="primary" size="sm">
        <Link href="/register">Register</Link>
      </Button>
    </>
  );
}
