import { AG_GRID_LOCALE_KR } from '@ag-grid-community/locale'
import { AllCommunityModule, type ColDef, themeQuartz } from 'ag-grid-community'

export const AG_GRID_MODULES = [AllCommunityModule]

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
