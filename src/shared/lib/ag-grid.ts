import { AG_GRID_LOCALE_KR } from '@ag-grid-community/locale'
import { AllCommunityModule, type ColDef, themeQuartz } from 'ag-grid-community'
import { LicenseManager, RowGroupingModule, TreeDataModule } from 'ag-grid-enterprise'

import { env } from '@/shared/config/env'

// 키가 없으면 평가판으로 뜬다 — 기능은 그대로고 워터마크와 콘솔 경고만 붙는다.
if (env.AG_GRID_LICENSE_KEY) {
  LicenseManager.setLicenseKey(env.AG_GRID_LICENSE_KEY)
}

// 전체 번들(AllEnterpriseModule) 대신 쓰는 모듈만 골라 등록한다.
//  * RowGrouping — 평평한 목록을 컬럼 값으로 묶는 뷰 옵션 (내 하위작업)
//  * TreeData — 부모가 자기 값을 가진 계층을 그대로 그린다 (계층 조회).
//    둘은 쓰임이 다르다. 부모가 실체인 화면에 RowGrouping을 쓰면 부모가 합성 그룹 행이 되어
//    data가 비고, 하위 0건 부모는 아예 사라진다.
export const AG_GRID_MODULES = [AllCommunityModule, RowGroupingModule, TreeDataModule]

/**
 * 공식 한국어 로케일 + 페이지네이션 문구 보정.
 * 기본 번역은 to='에서' / of='의'라 "1 에서 9 의 9"처럼 읽히므로 기호로 대체한다.
 */
export const AG_GRID_LOCALE = {
  ...AG_GRID_LOCALE_KR,
  to: '~',
  of: '/',
  pageSizeSelectorLabel: '페이지당',
}

/**
 * Jira 테이블 룩앤필에 맞춘 ag-grid 테마.
 * 색은 앱 테마 토큰을 그대로 참조해 라이트/다크 모드를 함께 따라간다.
 */
export const agGridTheme = themeQuartz.withParams({
  backgroundColor: 'var(--color-background)',
  foregroundColor: 'var(--color-foreground)',
  borderColor: 'var(--color-border)',
  headerBackgroundColor: 'var(--color-background)',
  headerTextColor: 'var(--color-muted-foreground)',
  headerFontSize: 13,
  headerHeight: 34,
  rowHeight: 40,
  fontSize: 13,
  fontFamily: 'inherit',
  oddRowBackgroundColor: 'transparent',
  rowHoverColor: 'var(--color-muted)',
  selectedRowBackgroundColor: 'var(--color-accent)',
  cellHorizontalPadding: 10,
  wrapperBorderRadius: 0,
  // 4면 테두리를 모두 끄고, 상단 구분선만 래퍼 div의 border-t로 되살린다.
  wrapperBorder: false,
  accentColor: 'var(--color-foreground)',
})

export const AG_GRID_DEFAULT_COL_DEF: ColDef = {
  sortable: true,
  resizable: true,
  suppressMovable: true,
}
