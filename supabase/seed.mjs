/**
 * 계정 시드 — 로그인에 필요한 인증 계정과 프로필만 만든다.
 *
 * 작업·하위작업·증적·감사로그 같은 업무 데이터는 넣지 않는다. 그건 화면에서 직접
 * 만들어야 실제로 쓰이는 흐름이 검증되고, 더미가 섞이면 무엇이 내가 만든 것인지 알 수 없다.
 *
 * 그래서 이 스크립트는 업무 데이터를 지우지 않는다 — 여러 번 돌려도 안전하다.
 *
 *   pnpm supabase:seed   # .env의 SUPABASE_PROJECT_REF / SUPABASE_ACCESS_TOKEN을 읽는다
 *
 * 프로젝트 secret 키는 Management API로 그때그때 받아온다 — 저장소에 두지 않는다.
 */
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

import { createClient } from '@supabase/supabase-js'

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * 데모 계정 공통 비밀번호. 로그인은 사번(loginId)으로 한다.
 * `src/features/users/constants/demo-accounts.ts`의 값과 같아야 한다.
 */
const DEMO_PASSWORD = '123456'
const emailOf = (loginId) => `${loginId}@hira.demo`

/**
 * 명단 픽스처는 타입 import와 타입 주석 말고는 순수 JS라서,
 * 그 둘만 걷어내면 TS 런타임 없이 그대로 import할 수 있다.
 */
async function loadFixture(relativePath, exportName) {
  const source = (await readFile(resolve(ROOT, relativePath), 'utf8'))
    .replace(/^import type .*$/gm, '')
    .replace(/^export const (\w+): [^=]+=/gm, 'export const $1 =')
    .replace(/ as const/g, '')

  const module = await import(
    `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
  )
  const value = module[exportName]
  if (value === undefined) throw new Error(`${relativePath}에 ${exportName} export가 없습니다`)
  return value
}

function must(condition, message) {
  if (!condition) throw new Error(message)
}

async function main() {
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN
  must(accessToken, 'SUPABASE_ACCESS_TOKEN 환경변수가 필요합니다')
  must(PROJECT_REF, 'SUPABASE_PROJECT_REF 환경변수가 필요합니다')

  const keysResponse = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/api-keys?reveal=true`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  must(keysResponse.ok, `API 키 조회 실패: ${keysResponse.status}`)
  const keys = await keysResponse.json()
  const secretKey = keys.find((key) => key.type === 'secret')?.api_key
  must(secretKey, 'secret 키를 찾지 못했습니다')

  const supabase = createClient(`https://${PROJECT_REF}.supabase.co`, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const USERS = await loadFixture('src/features/users/data/users.ts', 'USERS')

  // ---------------------------------------------------------- 1. 인증 계정

  const existing = new Map()
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    data.users.forEach((user) => existing.set(user.email, user.id))
    if (data.users.length < 200) break
  }

  const profileIdByName = new Map()

  for (const user of USERS) {
    const email = emailOf(user.loginId)
    let id = existing.get(email)

    if (!id) {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: {
          login_id: user.loginId,
          name: user.name,
          dept: user.dept,
          contact: user.contact,
        },
      })
      if (error) throw new Error(`${user.name}(${email}) 계정 생성 실패: ${error.message}`)
      id = data.user.id
    }

    profileIdByName.set(user.name, id)
  }

  // ---------------------------------------------------------- 2. 프로필

  // 트리거가 만든 프로필에 역할 등 업무 속성을 채운다
  const { error: profileError } = await supabase.from('profiles').upsert(
    USERS.map((user) => ({
      id: profileIdByName.get(user.name),
      login_id: user.loginId,
      name: user.name,
      dept: user.dept,
      role: user.role,
      contact: user.contact,
      external: user.external,
      role_changed_at: user.roleChangedAt,
      role_changed_by: user.roleChangedBy,
    }))
  )
  if (profileError) throw profileError

  // ---------------------------------------------------------- 3. 이전 계정 정리

  // 사번이 바뀌면 이메일도 바뀌어 예전 계정이 남는다. 픽스처에 없는 계정은
  // 지워서 이 파일이 계정 목록의 유일한 기준이 되게 한다 (프로필은 cascade).
  const wanted = new Set(USERS.map((user) => emailOf(user.loginId)))
  const stale = [...existing].filter(([email]) => !wanted.has(email))
  const kept = []

  for (const [email, id] of stale) {
    const { error } = await supabase.auth.admin.deleteUser(id)
    // 그 사람이 등록한 작업이 남아 있으면 프로필이 잡혀 있어 지울 수 없다.
    // 업무 데이터를 건드리지 않는 것이 우선이므로 넘어가고 무엇이 남았는지만 알린다.
    if (error) kept.push(email)
  }

  console.log(`계정/프로필 ${USERS.length}건`)
  if (stale.length > kept.length) console.log(`이전 계정 ${stale.length - kept.length}건 정리`)
  if (kept.length > 0) {
    console.log(`남긴 계정 ${kept.length}건 (등록한 작업이 있어 삭제 불가): ${kept.join(', ')}`)
  }
  console.log('\n계정 시드 완료 — 업무 데이터는 화면에서 직접 만드세요')
}

await main()
