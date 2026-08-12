import { format } from 'date-fns'
import { z } from 'zod'

export const requestFormSchema = z.object({
  title: z.string().trim().min(1, '요청제목을 입력해 주세요'),
  dueDate: z
    .string()
    .min(1, '완료요청일을 선택해 주세요')
    // 오늘 이전 날짜는 선택할 수 없다 (스펙 §4.1)
    .refine(
      (value) => value >= format(new Date(), 'yyyy-MM-dd'),
      '오늘 이전 날짜는 선택할 수 없어요'
    ),
  priority: z.enum(['URGENT', 'HIGH', 'NORMAL', 'LOW']),
  description: z.string().trim().min(1, '상세내용을 입력해 주세요'),
  // 개수·용량 제한은 고를 때 `validateAttachment`가 막으므로 여기선 담아만 둔다 (스펙 §4.2)
  attachments: z.array(z.instanceof(File)),
  // Step 2 — 컴플라이언스 확인. 미응답 시 제출 불가 (스펙 §4.1)
  handlesPersonalData: z.enum(['YES', 'NO'], { message: '개인정보 취급 여부를 선택해 주세요' }),
  consumerProtectionTarget: z.enum(['YES', 'NO'], {
    message: '소비자보호 승인 대상 여부를 선택해 주세요',
  }),
  darkPatternChecked: z.boolean().refine((checked) => checked, '다크패턴이 없음을 확인해 주세요'),
})

export type RequestFormValues = z.infer<typeof requestFormSchema>

export const REQUEST_CONTENT_FIELDS = [
  'title',
  'dueDate',
  'priority',
  'description',
] as const satisfies readonly (keyof RequestFormValues)[]
