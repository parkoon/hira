import type { OrgNode } from '@/features/users/api/types'

/**
 * 사내 조직도 API 연동 전 임시 목데이터.
 * 구성원은 사번으로 가리킨다. 실제 조직도 연동 시 이 파일을 교체한다.
 */
export const ORG_TREE: OrgNode[] = [
  {
    id: 'div-it',
    name: 'IT본부',
    children: [
      {
        id: 'team-dev',
        name: '서비스개발실',
        memberLoginIds: [
          '900001',
          '900002',
          '900003',
          '900004',
          '900005',
          '900006',
          '900007',
          '900008',
          '900009',
        ],
      },
      { id: 'team-plan', name: 'IT기획팀', memberLoginIds: ['900010', '900011', '900012'] },
      { id: 'team-sec', name: '정보보호팀', memberLoginIds: ['900013', '900014'] },
    ],
  },
  {
    id: 'div-sales',
    name: '영업본부',
    children: [
      { id: 'team-sales-support', name: '영업지원팀', memberLoginIds: ['900015', '900016'] },
      { id: 'team-channel', name: '채널기획팀', memberLoginIds: ['900017', '900018'] },
    ],
  },
  {
    id: 'div-biz',
    name: '경영지원본부',
    children: [
      { id: 'team-insurance', name: '보험운영팀', memberLoginIds: ['900019', '900020'] },
      { id: 'team-credit', name: '여신관리팀', memberLoginIds: ['900021', '900022'] },
    ],
  },
]
