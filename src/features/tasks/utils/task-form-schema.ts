import { format } from 'date-fns'
import { z } from 'zod'

import { PRIORITIES } from '@/features/tasks/constants/metadata'

export const taskFormSchema = z.object({
  title: z.string().trim().min(1, '요청제목을 입력해 주세요'),
  dueDate: z
    .string()
    .min(1, '목표일을 선택해 주세요')
    // 오늘 이전 날짜는 선택할 수 없다 (스펙 §4.1)
    .refine(
      (value) => value >= format(new Date(), 'yyyy-MM-dd'),
      '오늘 이전 날짜는 선택할 수 없어요'
    ),
  priority: z.enum(PRIORITIES),
  // 등록 전에 누구와 협의했는지 — 이름이 아니라 profiles.id로 받는다
  consultantId: z.string().min(1, '사전협의자를 선택해 주세요'),
  description: z.string().trim().min(1, '상세내용을 입력해 주세요'),
  // 용량·확장자 제한은 고를 때 `validateAttachment`가 막으므로 여기선 담아만 둔다 (스펙 §4.2)
  attachments: z.array(z.instanceof(File)),
  // 이미 붙어 있던 첨부 중 뗄 것들(attachments.id) — 저장을 눌러야 실제로 지워진다
  removedAttachmentIds: z.array(z.number()),
  // Step 2 — 컴플라이언스 확인. 미응답 시 제출 불가 (스펙 §4.1)
  handlesPersonalData: z.enum(['YES', 'NO'], { message: '개인정보 취급 여부를 선택해 주세요' }),
  consumerProtectionTarget: z.enum(['YES', 'NO'], {
    message: '소비자보호 승인 대상 여부를 선택해 주세요',
  }),
  darkPatternChecked: z.boolean().refine((checked) => checked, '다크패턴이 없음을 확인해 주세요'),
})

export type TaskFormValues = z.infer<typeof taskFormSchema>

export const TASK_CONTENT_FIELDS = [
  'title',
  'dueDate',
  'priority',
  'consultantId',
  'description',
] as const satisfies readonly (keyof TaskFormValues)[]
