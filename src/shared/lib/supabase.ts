import { createClient } from '@supabase/supabase-js'

import { env } from '@/shared/config/env'
import type { Database } from '@/shared/types/database'

/** 단일 Supabase 클라이언트. 직접 생성하지 않고 이것을 가져다 쓴다. */
export const supabase = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)
