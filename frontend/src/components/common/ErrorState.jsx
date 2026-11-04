import { AlertCircle, RotateCw } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/shadcnui/alert'
import { Button } from '@/components/shadcnui/button'

export function ErrorState({ error, onRetry, title = 'Veriler yüklenemedi' }) {
  return (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p>{error?.message ?? 'Beklenmeyen bir hata oluştu.'}</p>
        {onRetry && (
          <Button variant="outline" size="sm" className="mt-2 text-foreground" onClick={onRetry}>
            <RotateCw />
            Tekrar dene
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
