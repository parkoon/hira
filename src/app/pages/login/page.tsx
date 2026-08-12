import { useState } from 'react'
import { useNavigate } from 'react-router'

import { useSignInMutation } from '@/features/users/api/sign-in'
import {
  DEMO_PASSWORD,
  QUICK_LOGIN_ACCOUNTS,
  type QuickLoginAccount,
} from '@/features/users/constants/demo-accounts'
import { USER_ROLE_META } from '@/features/users/constants/metadata'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Field, FieldError } from '@/shared/components/ui/field'
import { Input } from '@/shared/components/ui/input'
import { NameAvatar } from '@/shared/components/ui/name-avatar'
import { Spinner } from '@/shared/components/ui/spinner'
import { paths } from '@/shared/config/paths'

/**
 * 화면 1 — 사내 SSO 연동 전까지 쓰는 테스트 로그인 (스펙 §6-1).
 * 서비스개발실 팀원은 본인 사번으로 들어오고, 팀 밖 역할은 버튼으로 바로 들어간다.
 * 비밀번호는 테스트 계정 공통값이라 화면에서 받지 않는다.
 */
function LoginPage() {
  const navigate = useNavigate()
  const signIn = useSignInMutation()
  const [loginId, setLoginId] = useState('')

  const login = (id: string) =>
    signIn.mutate(
      { loginId: id, password: DEMO_PASSWORD },
      { onSuccess: () => void navigate(paths.app.issues.root.getHref()) }
    )

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (loginId.trim().length === 0) return
    login(loginId.trim())
  }

  return (
    <div className="bg-muted/40 flex min-h-svh items-center justify-center p-4">
      <Card className="w-90">
        <CardContent className="p-9">
          <div className="mb-6 text-center">
            <span className="bg-primary text-primary-foreground mx-auto mb-2.5 flex size-10 items-center justify-center rounded text-lg font-bold">
              W
            </span>
            <h1 className="text-base font-semibold">HIRA</h1>
            <p className="text-muted-foreground mt-0.5 text-xs">사번으로 로그인</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-3"
          >
            <Field>
              <Input
                id="login-id"
                autoComplete="username"
                inputMode="numeric"
                aria-label="사번"
                placeholder="사번 입력 (예: 900003)"
                value={loginId}
                onChange={(event) => setLoginId(event.target.value)}
              />
              {signIn.isError && <FieldError>사번을 확인해 주세요.</FieldError>}
            </Field>
            <Button
              type="submit"
              className="w-full"
              disabled={signIn.isPending || loginId.trim().length === 0}
            >
              {signIn.isPending && <Spinner />}
              계속
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <span className="bg-border h-px flex-1" />
            <span className="text-muted-foreground text-[11px]">또는 이 계정으로 계속</span>
            <span className="bg-border h-px flex-1" />
          </div>

          <div className="space-y-2">
            {QUICK_LOGIN_ACCOUNTS.map((account: QuickLoginAccount) => (
              <Button
                key={account.loginId}
                type="button"
                variant="outline"
                className="w-full justify-start gap-2.5"
                disabled={signIn.isPending}
                onClick={() => login(account.loginId)}
              >
                <NameAvatar name={account.name} />
                <span className="flex-1 text-left">
                  {USER_ROLE_META[account.role].label} · {account.name}
                </span>
                <span className="text-muted-foreground text-[11px]">{account.loginId}</span>
              </Button>
            ))}
          </div>

          <p className="text-muted-foreground mt-4 text-center text-[11px]">
            테스트 환경입니다. 비밀번호 없이 사번만으로 로그인합니다
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export { LoginPage as Component }
