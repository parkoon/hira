export type paths = {
  '/api/v1/posts': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** 게시글 목록 조회 */
    get: operations['getPosts']
    put?: never
    /** 게시글 생성 */
    post: operations['createPost']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/v1/posts/{id}': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** 게시글 상세 조회 */
    get: operations['getPost']
    put?: never
    post?: never
    /** 게시글 삭제 */
    delete: operations['deletePost']
    options?: never
    head?: never
    /** 게시글 수정 */
    patch: operations['updatePost']
    trace?: never
  }
  '/api/v1/members/me': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** 내 정보 조회 */
    get: operations['getMemberMe']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
}
export type webhooks = Record<string, never>
export type components = {
  schemas: {
    /** @enum {string} */
    PostStatus: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
    Post: {
      id: number
      title: string
      content: string
      author: string
      status: components['schemas']['PostStatus']
      /** Format: date-time */
      createdAt: string
      /** Format: date-time */
      updatedAt: string
    }
    PostListResponse: {
      items: components['schemas']['Post'][]
      totalCount: number
    }
    CreatePostRequest: {
      title: string
      content: string
    }
    UpdatePostRequest: {
      title?: string
      content?: string
      status?: components['schemas']['PostStatus']
    }
    MemberMeResponse: {
      empNo: string
      empName: string
      deptName: string
      hasPosition: boolean
      isAdmin: boolean
    }
    FieldError: {
      field: string
      message: string
    }
    ApiError: {
      code: string
      message: string
      fields?: components['schemas']['FieldError'][]
    }
    ApiResponse: {
      success: boolean
      data: unknown
      error: components['schemas']['ApiError']
    }
  }
  responses: never
  parameters: never
  requestBodies: never
  headers: never
  pathItems: never
}
export type $defs = Record<string, never>
export type operations = {
  getPosts: {
    parameters: {
      query?: {
        page?: number
        size?: number
        status?: components['schemas']['PostStatus']
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description 성공 */
      200: {
        headers: Record<string, unknown>
        content: {
          '*/*': {
            /** @example true */
            success: boolean
            data: components['schemas']['PostListResponse']
            /** @example null */
            error: unknown
          }
        }
      }
    }
  }
  createPost: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['CreatePostRequest']
      }
    }
    responses: {
      /** @description 생성 성공 */
      201: {
        headers: Record<string, unknown>
        content: {
          '*/*': {
            /** @example true */
            success: boolean
            data: components['schemas']['Post']
            /** @example null */
            error: unknown
          }
        }
      }
    }
  }
  getPost: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: number
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description 성공 */
      200: {
        headers: Record<string, unknown>
        content: {
          '*/*': {
            /** @example true */
            success: boolean
            data: components['schemas']['Post']
            /** @example null */
            error: unknown
          }
        }
      }
    }
  }
  deletePost: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: number
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description 성공 */
      200: {
        headers: Record<string, unknown>
        content: {
          '*/*': {
            /** @example true */
            success: boolean
            /** @example null */
            data: unknown
            /** @example null */
            error: unknown
          }
        }
      }
    }
  }
  updatePost: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: number
      }
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['UpdatePostRequest']
      }
    }
    responses: {
      /** @description 성공 */
      200: {
        headers: Record<string, unknown>
        content: {
          '*/*': {
            /** @example true */
            success: boolean
            data: components['schemas']['Post']
            /** @example null */
            error: unknown
          }
        }
      }
    }
  }
  getMemberMe: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description 성공 */
      200: {
        headers: Record<string, unknown>
        content: {
          '*/*': {
            /** @example true */
            success: boolean
            data: components['schemas']['MemberMeResponse']
            /** @example null */
            error: unknown
          }
        }
      }
    }
  }
}
