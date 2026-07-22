import { Navigate, useParams } from 'react-router-dom'
import { getClaimFormConfig } from '@/features/quick-claim/config/claim-catalog'
import { ClaimFormView } from '@/features/quick-claim/components/claim-form-view'

type ClaimFormPageProps = {
  /** When set, ignore route params (used for /claim/work). */
  formKey?: string
}

export function ClaimFormPage({ formKey }: ClaimFormPageProps) {
  const params = useParams<{ category?: string; type?: string }>()
  const key =
    formKey ??
    (params.category && params.type
      ? `${params.category}/${params.type}`
      : params.category ?? '')

  const config = getClaimFormConfig(key)
  if (!config) {
    return <Navigate replace to="/claim" />
  }

  return <ClaimFormView config={config} />
}
