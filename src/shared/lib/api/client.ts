import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import axios from 'axios'

// OpenAPI 타입 추출 헬퍼
type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'
type Operation<Paths, Path extends keyof Paths, Method extends HttpMethod> =
  Paths[Path] extends Record<Method, infer Op> ? Op : never
type PathParams<T> = T extends { parameters: { path: infer P extends object } } ? P : object
type QueryParams<T> = T extends { parameters: { query?: infer Q } } ? Q : never
type RequestBody<T> = T extends {
  requestBody: { content: { 'application/json': infer B } }
}
  ? B
  : never
type SuccessResponse<T> = T extends { responses: { 200: infer R } }
  ? R
  : T extends { responses: { 201: infer R } }
    ? R
    : never
type RawResponseData<T> = SuccessResponse<T> extends { content: { '*/*': infer R } } ? R : never
type UnwrapEnvelope<T> = T extends { data: infer D } ? D : T
type ResponseData<T> = UnwrapEnvelope<RawResponseData<T>>
type OperationPathParams<Paths, Path extends keyof Paths, Method extends HttpMethod> = PathParams<
  Operation<Paths, Path, Method>
>
type OperationQueryParams<Paths, Path extends keyof Paths, Method extends HttpMethod> = QueryParams<
  Operation<Paths, Path, Method>
>
type OperationRequestBody<Paths, Path extends keyof Paths, Method extends HttpMethod> = RequestBody<
  Operation<Paths, Path, Method>
>
type OperationResponseData<
  Paths,
  Path extends keyof Paths,
  Method extends HttpMethod,
> = ResponseData<Operation<Paths, Path, Method>>

// HTTP 메서드가 있는 path만 추출
type PathsWithMethod<Paths, Method extends HttpMethod> = {
  [P in keyof Paths]: Paths[P] extends Record<Method, unknown> ? P : never
}[keyof Paths]

export function createApiClient<Paths>(baseURL: string, config?: AxiosRequestConfig) {
  const instance: AxiosInstance = axios.create({ baseURL, withCredentials: true, ...config })

  // path parameter 치환: /users/{id} → /users/123
  const replacePath = <Params extends object>(path: string, params?: Params): string => {
    if (!params) return path
    return Object.entries(params).reduce(
      (acc, [key, value]) => acc.replace(`{${key}}`, String(value)),
      path
    )
  }

  return {
    instance, // 인터셉터 설정용

    GET: <P extends PathsWithMethod<Paths, 'get'> & string>(
      path: P,
      options?: {
        path?: OperationPathParams<Paths, P, 'get'>
        query?: OperationQueryParams<Paths, P, 'get'>
        signal?: AbortSignal
      }
    ): Promise<OperationResponseData<Paths, P, 'get'>> => {
      const url = replacePath(path, options?.path)
      return instance
        .get<OperationResponseData<Paths, P, 'get'>>(url, {
          params: options?.query,
          signal: options?.signal,
        })
        .then((res) => res.data)
    },

    POST: <P extends PathsWithMethod<Paths, 'post'> & string>(
      path: P,
      body?: OperationRequestBody<Paths, P, 'post'>,
      options?: {
        path?: OperationPathParams<Paths, P, 'post'>
        query?: OperationQueryParams<Paths, P, 'post'>
        signal?: AbortSignal
      }
    ): Promise<OperationResponseData<Paths, P, 'post'>> => {
      const url = replacePath(path, options?.path)
      return instance
        .post<
          OperationResponseData<Paths, P, 'post'>,
          AxiosResponse<OperationResponseData<Paths, P, 'post'>>,
          OperationRequestBody<Paths, P, 'post'>
        >(url, body, { params: options?.query, signal: options?.signal })
        .then((res) => res.data)
    },

    PUT: <P extends PathsWithMethod<Paths, 'put'> & string>(
      path: P,
      body?: OperationRequestBody<Paths, P, 'put'>,
      options?: {
        path?: OperationPathParams<Paths, P, 'put'>
        query?: OperationQueryParams<Paths, P, 'put'>
        signal?: AbortSignal
      }
    ): Promise<OperationResponseData<Paths, P, 'put'>> => {
      const url = replacePath(path, options?.path)
      return instance
        .put<
          OperationResponseData<Paths, P, 'put'>,
          AxiosResponse<OperationResponseData<Paths, P, 'put'>>,
          OperationRequestBody<Paths, P, 'put'>
        >(url, body, { params: options?.query, signal: options?.signal })
        .then((res) => res.data)
    },

    PATCH: <P extends PathsWithMethod<Paths, 'patch'> & string>(
      path: P,
      body?: OperationRequestBody<Paths, P, 'patch'>,
      options?: {
        path?: OperationPathParams<Paths, P, 'patch'>
        query?: OperationQueryParams<Paths, P, 'patch'>
        signal?: AbortSignal
      }
    ): Promise<OperationResponseData<Paths, P, 'patch'>> => {
      const url = replacePath(path, options?.path)
      return instance
        .patch<
          OperationResponseData<Paths, P, 'patch'>,
          AxiosResponse<OperationResponseData<Paths, P, 'patch'>>,
          OperationRequestBody<Paths, P, 'patch'>
        >(url, body, { params: options?.query, signal: options?.signal })
        .then((res) => res.data)
    },

    DELETE: <P extends PathsWithMethod<Paths, 'delete'> & string>(
      path: P,
      options?: {
        path?: OperationPathParams<Paths, P, 'delete'>
        query?: OperationQueryParams<Paths, P, 'delete'>
        signal?: AbortSignal
      }
    ): Promise<OperationResponseData<Paths, P, 'delete'>> => {
      const url = replacePath(path, options?.path)
      return instance
        .delete<OperationResponseData<Paths, P, 'delete'>>(url, {
          params: options?.query,
          signal: options?.signal,
        })
        .then((res) => res.data)
    },
  }
}
