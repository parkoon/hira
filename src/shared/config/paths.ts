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
    issues: {
      root: {
        path: 'issues',
        getHref: () => '/app/issues',
      },
      detail: {
        path: 'issues/:issueNo',
        getHref: (issueNo: string) => `/app/issues/${issueNo}`,
      },
      subtask: {
        path: 'issues/:issueNo/subtasks/:subtaskNo',
        getHref: (issueNo: string, subtaskNo: string) =>
          `/app/issues/${issueNo}/subtasks/${subtaskNo}`,
      },
    },
    myTasks: {
      path: 'my-tasks',
      getHref: () => '/app/my-tasks',
    },
    approvals: {
      path: 'approvals',
      getHref: () => '/app/approvals',
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
