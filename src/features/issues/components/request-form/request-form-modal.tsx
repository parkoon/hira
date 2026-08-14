import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react'
import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import type { Attachment } from '@/features/issues/api/types'
import {
  REQUEST_CONTENT_FIELDS,
  requestFormSchema,
  type RequestFormValues,
} from '@/features/issues/utils/request-form-schema'
import { Modal } from '@/shared/components/ui/modal'

import { ComplianceStep } from './compliance-step'
import { RequestContentStep } from './request-content-step'
import { RequestMetaAside } from './request-meta-aside'
import { WizardStepIndicator } from './wizard-step-indicator'

type RequestFormModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  submitLabel: string
  /** 수정처럼 기존 값에서 시작할 때 */
  defaultValues?: Partial<RequestFormValues>
  /**
   * 첨부 입력 노출 여부. 등록·수정 모두 켠다 —
   * 첨부 가능 조건이 수정 가능 조건과 같아 한 폼에 두면 규칙이 갈라질 자리가 없다.
   */
  withAttachments?: boolean
  /** 이미 붙어 있는 첨부 — 목록으로만 보여준다. 본문을 보관하지 않아 폼 값으로 되살릴 수 없다 */
  existingAttachments?: Attachment[]
  /** 저장 진행 중 — 재클릭을 막는다 */
  pending?: boolean
  /**
   * 저장 후 닫는 것은 호출 측 몫이다 — 실패했는데 모달이 닫히면
   * 2단계까지 채운 입력을 되찾을 길이 없다
   */
  onSubmit: (values: RequestFormValues) => void
}

/** 화면 3·4 — 이슈 내용 2단계 위저드 (스펙 §4.1). 등록·수정이 같은 폼을 쓴다 */
export function RequestFormModal({
  open,
  onOpenChange,
  title,
  submitLabel,
  defaultValues,
  withAttachments = false,
  existingAttachments,
  pending = false,
  onSubmit,
}: RequestFormModalProps) {
  const [step, setStep] = useState(1)

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      dueDate: defaultValues?.dueDate ?? '',
      priority: defaultValues?.priority ?? 'NORMAL',
      description: defaultValues?.description ?? '',
      handlesPersonalData: defaultValues?.handlesPersonalData,
      consumerProtectionTarget: defaultValues?.consumerProtectionTarget,
      // File은 다시 만들어낼 수 없으므로 시작값으로 받지 않는다
      attachments: [],
      removedAttachmentIds: [],
      darkPatternChecked: defaultValues?.darkPatternChecked ?? false,
    },
  })

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
    if (!next) {
      form.reset()
      setStep(1)
    }
  }

  const goToComplianceStep = async () => {
    const valid = await form.trigger(REQUEST_CONTENT_FIELDS)
    if (valid) setStep(2)
  }

  const handleSave = form.handleSubmit((values) => onSubmit(values))

  return (
    // Portal은 React 트리 컨텍스트를 유지하므로 body/aside 양쪽 필드가 같은 폼을 공유한다
    <FormProvider {...form}>
      <Modal
        open={open}
        onOpenChange={handleOpenChange}
        title={title}
        className="sm:max-w-4xl"
        aside={<RequestMetaAside />}
        secondaryAction={
          step === 2
            ? {
                label: (
                  <>
                    <ArrowLeftIcon />
                    이전
                  </>
                ),
                onClick: () => setStep(1),
              }
            : undefined
        }
        primaryAction={
          step === 1
            ? {
                label: (
                  <>
                    다음
                    <ArrowRightIcon />
                  </>
                ),
                onClick: () => void goToComplianceStep(),
              }
            : {
                label: submitLabel,
                disabled: pending,
                onClick: () => void handleSave(),
              }
        }
      >
        <WizardStepIndicator currentStep={step} />

        {/* 스텝 1은 hidden으로 유지해 리치 텍스트·첨부 입력 상태를 잃지 않는다 */}
        <div hidden={step !== 1}>
          <RequestContentStep
            withAttachments={withAttachments}
            existingAttachments={existingAttachments}
          />
        </div>
        {step === 2 && <ComplianceStep />}
      </Modal>
    </FormProvider>
  )
}
