"use client";

import * as React from "react";
import type { TeamMember } from "@/lib/content/about";
import { TeamCard } from "@/components/about/TeamCard";

export function TeamGrid({ members }: { members: TeamMember[] }) {
  const [activeName, setActiveName] = React.useState<string | null>(null);

  return (
    <ul className="mt-10 grid gap-10 sm:grid-cols-2 sm:gap-12 lg:grid-cols-3">
      {members.map((member) => {
        const isFlipped = activeName === member.name;
        return (
          <li key={member.name}>
            <TeamCard
              name={member.name}
              role={member.role}
              photo={member.photo}
              quote={member.quote}
              bio={member.bio}
              highlights={member.highlights}
              flipped={isFlipped}
              onToggle={() => setActiveName(isFlipped ? null : member.name)}
            />
          </li>
        );
      })}
    </ul>
  );
}
