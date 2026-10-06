import { useState } from "react";

/**
 * Shows a "not found" alert once per empty result.
 *
 * Pass a key that names the empty result (e.g. `samples:<id>`) once loading
 * has finished and nothing came back, or null otherwise. The alert shows until
 * dismissed, and shows again only when a different key turns up empty.
 */
export function useNotFoundAlert(key: string | null) {
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  return {
    visible: key !== null && key !== dismissedKey,
    dismiss: () => setDismissedKey(key),
  };
}
