import * as z from 'zod'

const createEnv = () => {
  const EnvSchema = z.object({
    SUPABASE_URL: z.url(),
    SUPABASE_ANON_KEY: z.string().min(1),
    /** ag-grid Enterprise 라이선스 키. 없으면 평가판으로 뜬다 — 기능은 같고 워터마크만 붙는다 */
    AG_GRID_LICENSE_KEY: z.string().optional(),
  })

  const envVars = Object.entries(import.meta.env).reduce<Record<string, string>>(
    (acc, [key, value]) => {
      if (key.startsWith('VITE_APP_')) {
        acc[key.replace('VITE_APP_', '')] = value
      }
      return acc
    },
    {}
  )

  const parsedEnv = EnvSchema.safeParse(envVars)

  if (!parsedEnv.success) {
    throw new Error(
      `환경변수 설정이 올바르지 않습니다.\n다음 환경변수를 확인해주세요:\n${Object.entries(
        z.flattenError(parsedEnv.error).fieldErrors
      )
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `- ${k}: ${v.join(', ')}`)
        .join('\n')}\n`
    )
  }

  return parsedEnv.data
}

export const env = createEnv()
