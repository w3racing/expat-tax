import { Navigate } from 'react-router-dom'

/** @deprecated Combined into Tax Position — keep route for bookmarks. */
export function TaxSummaryPage() {
  return <Navigate replace to="/position" />
}
