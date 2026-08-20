'use client'

import { useRouter } from 'next/navigation'
import { ErrorMessage } from '@/components/ui/ErrorMessage'

export interface FeaturedErrorProps {
  message: string
}

export function FeaturedError({ message }: FeaturedErrorProps) {
  const router = useRouter()

  return <ErrorMessage message={message} onRetry={() => router.refresh()} />
}
