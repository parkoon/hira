export const paths = {
  home: {
    path: '/',
    getHref: () => '/',
  },
  login: {
    path: '/login',
    getHref: () => '/login',
  },

  app: {
    root: {
      path: '/app',
      getHref: () => '/app',
    },
    myWork: {
      path: 'my-work',
      getHref: () => '/app/my-work',
    },
    tasks: {
      root: {
        path: 'tasks',
        getHref: () => '/app/tasks',
      },
      detail: {
        path: 'tasks/:taskNo',
        getHref: (taskNo: string) => `/app/tasks/${taskNo}`,
      },
      subtask: {
        path: 'tasks/:taskNo/subtasks/:subtaskNo',
        getHref: (taskNo: string, subtaskNo: string) =>
          `/app/tasks/${taskNo}/subtasks/${subtaskNo}`,
      },
    },
    approvals: {
      path: 'approvals',
      getHref: () => '/app/approvals',
    },
    reports: {
      path: 'reports',
      getHref: () => '/app/reports',
    },
    users: {
      path: 'users',
      getHref: () => '/app/users',
    },
    auditLogs: {
      path: 'audit-logs',
      getHref: () => '/app/audit-logs',
    },
  },
} as const
