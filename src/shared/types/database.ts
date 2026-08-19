export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.15'
  }
  public: {
    Tables: {
      approvals: {
        Row: {
          approved_at: string
          approved_by: string
          id: number
          kind: Database['public']['Enums']['approval_kind']
          subtask_no: string | null
          task_no: string | null
        }
        Insert: {
          approved_at?: string
          approved_by: string
          id?: never
          kind: Database['public']['Enums']['approval_kind']
          subtask_no?: string | null
          task_no?: string | null
        }
        Update: {
          approved_at?: string
          approved_by?: string
          id?: never
          kind?: Database['public']['Enums']['approval_kind']
          subtask_no?: string | null
          task_no?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'approvals_subtask_no_fkey'
            columns: ['subtask_no']
            isOneToOne: false
            referencedRelation: 'subtasks'
            referencedColumns: ['subtask_no']
          },
          {
            foreignKeyName: 'approvals_task_no_fkey'
            columns: ['task_no']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['task_no']
          },
        ]
      }
      attachments: {
        Row: {
          evidence_id: number | null
          file_name: string
          id: number
          size: number
          task_no: string | null
        }
        Insert: {
          evidence_id?: number | null
          file_name: string
          id?: never
          size?: number
          task_no?: string | null
        }
        Update: {
          evidence_id?: number | null
          file_name?: string
          id?: never
          size?: number
          task_no?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'attachments_evidence_id_fkey'
            columns: ['evidence_id']
            isOneToOne: false
            referencedRelation: 'evidences'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'attachments_task_no_fkey'
            columns: ['task_no']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['task_no']
          },
        ]
      }
      audit_logs: {
        Row: {
          actor_name: string
          detail: string | null
          event_type: Database['public']['Enums']['audit_event_type']
          id: number
          ip_address: string
          occurred_at: string
          target_label: string | null
          target_task_no: string | null
        }
        Insert: {
          actor_name: string
          detail?: string | null
          event_type: Database['public']['Enums']['audit_event_type']
          id?: never
          ip_address?: string
          occurred_at?: string
          target_label?: string | null
          target_task_no?: string | null
        }
        Update: {
          actor_name?: string
          detail?: string | null
          event_type?: Database['public']['Enums']['audit_event_type']
          id?: never
          ip_address?: string
          occurred_at?: string
          target_label?: string | null
          target_task_no?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: number
          subtask_no: string | null
          task_no: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: never
          subtask_no?: string | null
          task_no?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: never
          subtask_no?: string | null
          task_no?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'comments_author_id_fkey'
            columns: ['author_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'comments_subtask_no_fkey'
            columns: ['subtask_no']
            isOneToOne: false
            referencedRelation: 'subtasks'
            referencedColumns: ['subtask_no']
          },
          {
            foreignKeyName: 'comments_task_no_fkey'
            columns: ['task_no']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['task_no']
          },
        ]
      }
      evidences: {
        Row: {
          id: number
          memo: string
          recorded_at: string
          recorded_by: string
          subtask_no: string | null
          subtask_status: Database['public']['Enums']['subtask_status'] | null
          task_no: string | null
          task_status: Database['public']['Enums']['task_status'] | null
        }
        Insert: {
          id?: never
          memo?: string
          recorded_at?: string
          recorded_by: string
          subtask_no?: string | null
          subtask_status?: Database['public']['Enums']['subtask_status'] | null
          task_no?: string | null
          task_status?: Database['public']['Enums']['task_status'] | null
        }
        Update: {
          id?: never
          memo?: string
          recorded_at?: string
          recorded_by?: string
          subtask_no?: string | null
          subtask_status?: Database['public']['Enums']['subtask_status'] | null
          task_no?: string | null
          task_status?: Database['public']['Enums']['task_status'] | null
        }
        Relationships: [
          {
            foreignKeyName: 'evidences_subtask_no_fkey'
            columns: ['subtask_no']
            isOneToOne: false
            referencedRelation: 'subtasks'
            referencedColumns: ['subtask_no']
          },
          {
            foreignKeyName: 'evidences_task_no_fkey'
            columns: ['task_no']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['task_no']
          },
        ]
      }
      profiles: {
        Row: {
          contact: string
          dept: string
          external: boolean
          id: string
          login_id: string
          name: string
          role: Database['public']['Enums']['user_role']
          role_changed_at: string | null
          role_changed_by: string | null
        }
        Insert: {
          contact?: string
          dept: string
          external?: boolean
          id: string
          login_id: string
          name: string
          role?: Database['public']['Enums']['user_role']
          role_changed_at?: string | null
          role_changed_by?: string | null
        }
        Update: {
          contact?: string
          dept?: string
          external?: boolean
          id?: string
          login_id?: string
          name?: string
          role?: Database['public']['Enums']['user_role']
          role_changed_at?: string | null
          role_changed_by?: string | null
        }
        Relationships: []
      }
      reference_links: {
        Row: {
          evidence_id: number
          id: number
          position: number
          url: string
        }
        Insert: {
          evidence_id: number
          id?: never
          position?: number
          url: string
        }
        Update: {
          evidence_id?: number
          id?: never
          position?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: 'reference_links_evidence_id_fkey'
            columns: ['evidence_id']
            isOneToOne: false
            referencedRelation: 'evidences'
            referencedColumns: ['id']
          },
        ]
      }
      status_history: {
        Row: {
          actor_name: string
          from_status: string | null
          id: number
          occurred_at: string
          reason: string | null
          subtask_no: string | null
          task_no: string | null
          to_status: string
          via: Database['public']['Enums']['history_via']
        }
        Insert: {
          actor_name: string
          from_status?: string | null
          id?: never
          occurred_at?: string
          reason?: string | null
          subtask_no?: string | null
          task_no?: string | null
          to_status: string
          via?: Database['public']['Enums']['history_via']
        }
        Update: {
          actor_name?: string
          from_status?: string | null
          id?: never
          occurred_at?: string
          reason?: string | null
          subtask_no?: string | null
          task_no?: string | null
          to_status?: string
          via?: Database['public']['Enums']['history_via']
        }
        Relationships: [
          {
            foreignKeyName: 'status_history_subtask_no_fkey'
            columns: ['subtask_no']
            isOneToOne: false
            referencedRelation: 'subtasks'
            referencedColumns: ['subtask_no']
          },
          {
            foreignKeyName: 'status_history_task_no_fkey'
            columns: ['task_no']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['task_no']
          },
        ]
      }
      subtask_branches: {
        Row: {
          branch_name: string
          branch_url: string
          created_at: string
          created_by: string
          id: number
          repo_full_name: string
          subtask_no: string
        }
        Insert: {
          branch_name: string
          branch_url: string
          created_at?: string
          created_by: string
          id?: never
          repo_full_name: string
          subtask_no: string
        }
        Update: {
          branch_name?: string
          branch_url?: string
          created_at?: string
          created_by?: string
          id?: never
          repo_full_name?: string
          subtask_no?: string
        }
        Relationships: [
          {
            foreignKeyName: 'subtask_branches_subtask_no_fkey'
            columns: ['subtask_no']
            isOneToOne: true
            referencedRelation: 'subtasks'
            referencedColumns: ['subtask_no']
          },
        ]
      }
      subtasks: {
        Row: {
          assignee_id: string | null
          completed_at: string | null
          created_at: string
          dba_verification_request: string | null
          description: string
          due_date: string | null
          parent_task_no: string
          status: Database['public']['Enums']['subtask_status']
          subtask_no: string
          title: string
          type: Database['public']['Enums']['subtask_type']
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          dba_verification_request?: string | null
          description?: string
          due_date?: string | null
          parent_task_no: string
          status?: Database['public']['Enums']['subtask_status']
          subtask_no: string
          title: string
          type: Database['public']['Enums']['subtask_type']
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          dba_verification_request?: string | null
          description?: string
          due_date?: string | null
          parent_task_no?: string
          status?: Database['public']['Enums']['subtask_status']
          subtask_no?: string
          title?: string
          type?: Database['public']['Enums']['subtask_type']
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'subtasks_assignee_id_fkey'
            columns: ['assignee_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'subtasks_parent_task_no_fkey'
            columns: ['parent_task_no']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['task_no']
          },
        ]
      }
      tasks: {
        Row: {
          consultant_id: string | null
          consumer_protection_target: boolean
          created_at: string
          dark_pattern_checked: boolean
          description: string
          due_date: string
          handles_personal_data: boolean
          priority: Database['public']['Enums']['priority']
          requester_id: string
          status: Database['public']['Enums']['task_status']
          submitted_at: string | null
          task_no: string
          title: string
          updated_at: string
        }
        Insert: {
          consultant_id?: string | null
          consumer_protection_target?: boolean
          created_at?: string
          dark_pattern_checked?: boolean
          description?: string
          due_date: string
          handles_personal_data?: boolean
          priority?: Database['public']['Enums']['priority']
          requester_id: string
          status?: Database['public']['Enums']['task_status']
          submitted_at?: string | null
          task_no: string
          title: string
          updated_at?: string
        }
        Update: {
          consultant_id?: string | null
          consumer_protection_target?: boolean
          created_at?: string
          dark_pattern_checked?: boolean
          description?: string
          due_date?: string
          handles_personal_data?: boolean
          priority?: Database['public']['Enums']['priority']
          requester_id?: string
          status?: Database['public']['Enums']['task_status']
          submitted_at?: string | null
          task_no?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tasks_consultant_id_fkey'
            columns: ['consultant_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_requester_id_fkey'
            columns: ['requester_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_task_tree: {
        Args: {
          p_assignee_id?: string
          p_page?: number
          p_q?: string
          p_size?: number
          p_sort?: string
          p_status?: string[]
        }
        Returns: Json
      }
    }
    Enums: {
      approval_kind: 'COMPLIANCE' | 'CONSUMER_PROTECTION' | 'DBA'
      audit_event_type:
        | 'LOGIN_SUCCESS'
        | 'LOGIN_FAILURE'
        | 'LOGOUT'
        | 'TASK_SUBMIT'
        | 'TASK_APPROVE'
        | 'TASK_REJECT'
        | 'TASK_COMPLETE'
        | 'SUBTASK_CREATE'
        | 'SUBTASK_TRANSITION'
        | 'ROLE_CHANGE'
        | 'ATTACHMENT_UPLOAD'
        | 'ATTACHMENT_DOWNLOAD'
        | 'SUBTASK_UPDATE'
        | 'TASK_UPDATE'
        | 'ATTACHMENT_DELETE'
      history_via: 'MANUAL' | 'API'
      priority: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW'
      subtask_status:
        | 'TODO'
        | 'ANALYSIS'
        | 'DEVELOPMENT'
        | 'DBA_VERIFICATION'
        | 'THIRD_PARTY'
        | 'FUNCTIONAL_TEST'
        | 'ACCEPTANCE'
        | 'DEPLOY_WAITING'
        | 'POST_DEPLOY_CHECK'
        | 'IN_PROGRESS'
        | 'REVIEW'
        | 'DONE'
      subtask_type: 'DEPLOY' | 'NON_DEPLOY'
      task_status: 'DRAFT' | 'PENDING_APPROVAL' | 'IN_PROGRESS' | 'DONE' | 'REJECTED'
      user_role: 'REQUESTER' | 'WORKER' | 'LEAD' | 'ADMIN'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      approval_kind: ['COMPLIANCE', 'CONSUMER_PROTECTION', 'DBA'],
      audit_event_type: [
        'LOGIN_SUCCESS',
        'LOGIN_FAILURE',
        'LOGOUT',
        'TASK_SUBMIT',
        'TASK_APPROVE',
        'TASK_REJECT',
        'TASK_COMPLETE',
        'SUBTASK_CREATE',
        'SUBTASK_TRANSITION',
        'ROLE_CHANGE',
        'ATTACHMENT_UPLOAD',
        'ATTACHMENT_DOWNLOAD',
        'SUBTASK_UPDATE',
        'TASK_UPDATE',
        'ATTACHMENT_DELETE',
      ],
      history_via: ['MANUAL', 'API'],
      priority: ['URGENT', 'HIGH', 'NORMAL', 'LOW'],
      subtask_status: [
        'TODO',
        'ANALYSIS',
        'DEVELOPMENT',
        'DBA_VERIFICATION',
        'THIRD_PARTY',
        'FUNCTIONAL_TEST',
        'ACCEPTANCE',
        'DEPLOY_WAITING',
        'POST_DEPLOY_CHECK',
        'IN_PROGRESS',
        'REVIEW',
        'DONE',
      ],
      subtask_type: ['DEPLOY', 'NON_DEPLOY'],
      task_status: ['DRAFT', 'PENDING_APPROVAL', 'IN_PROGRESS', 'DONE', 'REJECTED'],
      user_role: ['REQUESTER', 'WORKER', 'LEAD', 'ADMIN'],
    },
  },
} as const
