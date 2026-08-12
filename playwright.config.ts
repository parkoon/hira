import { defineConfig, devices } from '@playwright/test'

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000'

export default defineConfig({
  // e2e/ 폴더 안의 테스트만 실행 (vitest와 분리)
  testDir: './e2e',

  // 모든 테스트를 병렬 실행
  fullyParallel: true,

  // CI에서 test.only가 코드에 남아있으면 빌드 실패 처리
  forbidOnly: !!process.env.CI,

  // CI에서는 flaky 테스트를 위해 1회 재시도, 로컬은 재시도 없음
  retries: process.env.CI ? 1 : 0,

  // CI에서는 순차 실행 (리소스 제한), 로컬은 CPU 코어 수에 맞게 자동
  workers: process.env.CI ? 1 : undefined,

  // 리포터: CI는 GitHub Actions 어노테이션, 로컬은 HTML 리포트
  reporter: process.env.CI ? 'github' : [['html', { open: 'never' }]],

  // 로그인 후 세션을 저장하는 setup 프로젝트 정의
  // globalSetup 대신 'setup' 프로젝트를 사용하는 것이 최신 권장 방식
  // → 테스트처럼 디버깅 가능하고, 실패 시 에러 위치가 명확함
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // setup 프로젝트가 저장한 쿠키·세션을 모든 테스트에서 재사용
        storageState: 'e2e/.auth/session.json',
      },
      // 반드시 setup이 먼저 실행되어야 함
      dependencies: ['setup'],
    },
  ],

  use: {
    baseURL: BASE_URL,

    // 실패한 테스트의 첫 번째 재시도에서 trace 수집
    // → playwright show-report 명령으로 네트워크·스냅샷·콘솔 로그 확인 가능
    trace: 'on-first-retry',

    // 실패 시에만 스크린샷 저장
    screenshot: 'only-on-failure',

    // 실패 시에만 영상 저장 (항상 켜면 디스크 사용량이 큼)
    video: 'retain-on-failure',
  },

  // 테스트 실행 전 vite dev 서버를 자동으로 기동/종료
  webServer: {
    command: 'pnpm dev',
    url: BASE_URL,
    // 로컬에서는 이미 켜져 있는 서버 재사용, CI에서는 항상 새로 기동
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
