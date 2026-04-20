import { useSearchParams } from "react-router-dom";

/**
 * Returns the `viewAs` user id from the URL when an admin is impersonating
 * another account. Returns undefined when not in viewAs mode.
 *
 * Edge functions accept this as `viewAsUserId` in the request body and will
 * attribute credit usage / writes to the target account when the caller is
 * an admin.
 */
export function useViewAsUserId(): string | undefined {
  const [searchParams] = useSearchParams();
  return searchParams.get("viewAs") || undefined;
}
