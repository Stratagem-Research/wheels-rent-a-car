"use client";

import { useForm, type UseFormProps, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

/**
 * Thin wrapper around react-hook-form + zod that infers values from the schema.
 *
 * Modern RHF distinguishes input (the raw field values entered by the user)
 * from output (the transformed values produced by Zod after validation).
 * For schemas without `.transform()` or `.coerce()` these are identical; for
 * schemas that change shape, the form holds `z.input<S>` while `handleSubmit`
 * receives `z.output<S>`.
 *
 * Mode defaults to `"onBlur"` — global form rule (00_global.md §9):
 *   "validate on blur, not on every keystroke. Submit attempts validate all
 *    fields and scroll to the first error."
 */
export function useZodForm<TSchema extends z.ZodObject<z.ZodRawShape>>(
  schema: TSchema,
  options?: Omit<UseFormProps<z.input<TSchema>>, "resolver" | "formControl">,
): UseFormReturn<z.input<TSchema>, unknown, z.output<TSchema>> {
  return useForm<z.input<TSchema>, unknown, z.output<TSchema>>({
    ...options,
    resolver: zodResolver(schema),
    mode: options?.mode ?? "onBlur",
    reValidateMode: options?.reValidateMode ?? "onBlur",
    shouldFocusError: options?.shouldFocusError ?? true,
  });
}
