'use client'

import { useRouter } from 'next/navigation'
import { ErrorMessage } from '@/components/ui/ErrorMessage'

export interface ResultsErrorProps {
  message: string
}

export function ResultsError({ message }: ResultsErrorProps) {
  const router = useRouter()

  return <ErrorMessage message={message} onRetry={() => router.refresh()} />
}
