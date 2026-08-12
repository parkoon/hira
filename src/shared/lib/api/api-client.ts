import { env } from '@/shared/config/env'
import { createApiClient, setupApiInterceptors } from '@/shared/lib/api'
import type { paths } from '@/shared/types/api'

export const apiClient = createApiClient<paths>(env.API_URL ?? '')

setupApiInterceptors(apiClient.instance)
