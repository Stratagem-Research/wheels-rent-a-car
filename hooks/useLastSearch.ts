"use client";

import * as React from "react";
import { defaultSearchCriteria, readLastSearch, writeLastSearch } from "@/lib/search/persistence";
import type { SearchCriteria } from "@/lib/search/types";

/**
 * Returns the search-bar criteria, hydrated from localStorage on mount.
 *
 * - SSR renders default criteria (so the markup is stable).
 * - On mount, the persisted criteria (if any) replace defaults.
 * - `setCriteria` persists immediately under `wheels.lastSearch`.
 * - `hasPersisted` flips true once a stored value is loaded — used to show
 *   the "Pick up where you left off?" chip on the home hero (01_home.md).
 */
export function useLastSearch(): {
  criteria: SearchCriteria;
  setCriteria: (next: SearchCriteria | ((prev: SearchCriteria) => SearchCriteria)) => void;
  hasPersisted: boolean;
} {
  const [criteria, setCriteriaState] = React.useState<SearchCriteria>(() =>
    defaultSearchCriteria(),
  );
  const [hasPersisted, setHasPersisted] = React.useState(false);

  // Hydration-safe: SSR uses defaults, client overlays persisted value.
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    const stored = readLastSearch();
    if (stored) {
      setCriteriaState(stored);
      setHasPersisted(true);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const setCriteria = React.useCallback(
    (next: SearchCriteria | ((prev: SearchCriteria) => SearchCriteria)) => {
      setCriteriaState((prev) => {
        const value = typeof next === "function" ? next(prev) : next;
        writeLastSearch(value);
        return value;
      });
    },
    [],
  );

  return { criteria, setCriteria, hasPersisted };
}
