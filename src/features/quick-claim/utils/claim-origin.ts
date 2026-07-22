import { useSearchParams } from 'react-router-dom'

/** When Quick Claim opens a destination workspace, keep back-navigation in the claim flow. */
export function useClaimOrigin() {
  const [searchParams] = useSearchParams()
  const fromClaim = searchParams.get('from') === 'claim'

  return {
    fromClaim,
    /** Append to overnight destination routes so claim origin is preserved. */
    claimQuery: fromClaim ? '?from=claim' : '',
    destinationsBackTo: fromClaim ? '/claim/destinations' : '/overnight',
    destinationsBackLabel: fromClaim ? 'Destinations' : 'Planner',
  }
}

export function withClaimOrigin(path: string, fromClaim: boolean): string {
  if (!fromClaim) return path
  const join = path.includes('?') ? '&' : '?'
  return `${path}${join}from=claim`
}
