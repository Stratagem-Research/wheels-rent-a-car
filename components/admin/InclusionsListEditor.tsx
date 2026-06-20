"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type InclusionsListEditorProps = {
  inclusions: string[];
  onChange: (inclusions: string[]) => void;
};

export function InclusionsListEditor({ inclusions, onChange }: InclusionsListEditorProps) {
  return (
    <div>
      <p className="label-md text-ink-70 mb-2">Inclusions</p>
      <div className="flex flex-col gap-2">
        {inclusions.map((inc, incIndex) => (
          <div key={incIndex} className="flex items-center gap-2">
            <Input
              value={inc}
              onChange={(e) => {
                const next = inclusions.map((line, j) => (j === incIndex ? e.target.value : line));
                onChange(next);
              }}
            />
            <Button
              type="button"
              variant="tertiary"
              size="md"
              aria-label="Remove inclusion"
              onClick={() => onChange(inclusions.filter((_, j) => j !== incIndex))}
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onChange([...inclusions, ""])}
        >
          <Plus className="size-4" aria-hidden="true" />
          Add inclusion
        </Button>
      </div>
    </div>
  );
}
