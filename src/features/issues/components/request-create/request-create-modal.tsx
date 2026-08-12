import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react'
import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { useCreateRequestMutation } from '@/features/issues/api/create-request'
import {
  REQUEST_CONTENT_FIELDS,
  requestFormSchema,
  type RequestFormValues,
} from '@/features/issues/utils/request-form-schema'
import { useCurrentUser } from '@/features/users/hooks/use-current-user'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import { paths } from '@/shared/config/paths'

import { ComplianceStep } from './compliance-step'
import { RequestContentStep } from './request-content-step'
import { RequestMetaAside } from './request-meta-aside'
import { WizardStepIndicator } from './wizard-step-indicator'

/** 화면 3·4 — 이슈 등록 2단계 위저드 (스펙 §4.1) */
export function RequestCreateModal() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const navigate = useNavigate()
  const { user } = useCurrentUser()
  const createRequest = useCreateRequestMutation()

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      title: '',
      dueDate: '',
      priority: 'NORMAL',
      description: '',
      attachments: [],
      darkPatternChecked: false,
    },
  })

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      form.reset()
      setStep(1)
    }
  }

  const goToComplianceStep = async () => {
    const valid = await form.trigger(REQUEST_CONTENT_FIELDS)
    if (valid) setStep(2)
  }

  /**
   * 등록은 요청대기중까지만 만든다 — 제출은 상세에서 내용을 다시 보고 한다 (시나리오 1·2).
   * 컴플라이언스 응답은 제출 조건이라 스텝 2까지 통과해야 저장할 수 있다.
   */
  const handleSave = form.handleSubmit((values) => {
    createRequest.mutate(
      {
        draft: {
          title: values.title,
          description: values.description,
          priority: values.priority,
          dueDate: values.dueDate,
          handlesPersonalData: values.handlesPersonalData === 'YES',
          consumerProtectionTarget: values.consumerProtectionTarget === 'YES',
          darkPatternChecked: values.darkPatternChecked,
        },
        files: values.attachments,
        requesterId: user.id,
        requesterName: user.name,
      },
      {
        onSuccess: (issueNo) => {
          handleOpenChange(false)
          toast.success(`${issueNo} 이슈를 등록했습니다. 내용을 확인하고 제출해 주세요.`)
          void navigate(paths.app.issues.detail.getHref(issueNo))
        },
      }
    )
  })

  return (
    // Portal은 React 트리 컨텍스트를 유지하므로 body/aside 양쪽 필드가 같은 폼을 공유한다
    <FormProvider {...form}>
      <Modal
        open={open}
        onOpenChange={handleOpenChange}
        trigger={<Button>새 이슈</Button>}
        title="이슈 등록"
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
                label: '저장',
                // 채번이 연속번호라 두 번 눌리면 이슈가 두 건 생긴다
                disabled: createRequest.isPending,
                onClick: () => void handleSave(),
              }
        }
      >
        <WizardStepIndicator currentStep={step} />

        {/* 스텝 1은 hidden으로 유지해 리치 텍스트·첨부 입력 상태를 잃지 않는다 */}
        <div hidden={step !== 1}>
          <RequestContentStep />
        </div>
        {step === 2 && <ComplianceStep />}
      </Modal>
    </FormProvider>
  )
}
