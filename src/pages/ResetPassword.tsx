import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { trpc } from '@/providers/trpc'
import { useLanguage } from '@/i18n/LanguageContext'

export default function ResetPassword() {
  const { d } = useLanguage()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const reset = trpc.guest.resetPassword.useMutation({
    onSuccess: () => setDone(true),
    onError: (e) =>
      setError(e.message === 'invalid_token' ? d.account.resetInvalid : e.message),
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError(d.account.passwordTooShort)
      return
    }
    if (password !== confirm) {
      setError(d.account.passwordMismatch)
      return
    }
    reset.mutate({ token, password })
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="mb-6 flex items-center justify-center gap-2">
            <img src="/images/logo.png" alt="Vila Santa Rosa" className="h-9 w-auto" />
            <span className="font-serif-display text-xl font-semibold">Vila Santa Rosa</span>
          </div>

          {done ? (
            <div className="text-center">
              <p className="text-4xl">✅</p>
              <h1 className="mt-3 font-serif-display text-2xl font-semibold">
                {d.account.resetDoneTitle}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">{d.account.resetDoneText}</p>
              <Button asChild className="mt-6 w-full bg-primary text-primary-foreground">
                <Link to="/conta">{d.account.backToLogin}</Link>
              </Button>
            </div>
          ) : !token ? (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{d.account.resetInvalid}</p>
              <Button asChild variant="outline" className="mt-6 w-full">
                <Link to="/conta">{d.account.backToLogin}</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <h1 className="text-center font-serif-display text-2xl font-semibold">
                {d.account.resetTitle}
              </h1>
              <div className="space-y-2">
                <Label htmlFor="pw1">{d.account.newPassword}</Label>
                <Input
                  id="pw1"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pw2">{d.account.confirmPassword}</Label>
                <Input
                  id="pw2"
                  type="password"
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground"
                disabled={reset.isPending}
              >
                {d.account.resetSubmit}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
