import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";

import { getMatches } from "../services/matches";

// Mirrors useMatches.js / backend's VERY_LIKELY_THRESHOLD.
const HIGH_CONFIDENCE_THRESHOLD = 80;

/**
 * The single best pending high-confidence match, if any — backs the
 * MatchAlertBanner on Home. Reuses `GET /api/matches` (no dedicated count
 * endpoint) and refetches on focus, same "cheap enough to just refetch"
 * choice HomeScreen's own item feed already makes.
 *
 * @returns {{title: string, subtitle: string} | null}
 */
export function useMatchAlert() {
  const [match, setMatch] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      getMatches({ status: "pending" })
        .then((result) => {
          if (cancelled) return;
          // Already sorted score desc by the backend — the first entry
          // (if any) is the strongest candidate.
          const best = result.items.find((m) => m.score >= HIGH_CONFIDENCE_THRESHOLD);
          setMatch(best || null);
        })
        .catch(() => {
          if (!cancelled) setMatch(null);
        });

      return () => {
        cancelled = true;
      };
    }, [])
  );

  if (!match) return null;

  const otherItem = match.role === "lost" ? match.foundItem : match.lostItem;

  return {
    title: "Possible match found",
    subtitle: otherItem?.title ? `Matches your report: "${otherItem.title}"` : "Tap to view your matches",
  };
}
