// HTTP Method 타입
type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

// Operation 추출: paths['/api/v1/members/me']['get']
type Operation<Paths, Path extends keyof Paths, Method extends HttpMethod> =
  Paths[Path] extends Record<Method, infer Op> ? Op : never

type SuccessResponse<T> = T extends { responses: { 200: infer R } }
  ? R
  : T extends { responses: { 201: infer R } }
    ? R
    : never

type WildcardResponseData<T> = T extends { content: { '*/*': infer R } } ? R : never
type UnwrapEnvelope<T> = T extends { data: infer D } ? D : T

// Request Body 추론
export type InferBody<Paths, Path extends keyof Paths, Method extends HttpMethod> =
  Operation<Paths, Path, Method> extends {
    requestBody: { content: { 'application/json': infer B } }
  }
    ? B
    : never

// Response 추론 (200 | 201) — API 응답 envelope의 `data` 필드를 추출
export type InferResponse<
  Paths,
  Path extends keyof Paths,
  Method extends HttpMethod,
> = UnwrapEnvelope<WildcardResponseData<SuccessResponse<Operation<Paths, Path, Method>>>>

// Path Params 추론
export type InferPathParams<Paths, Path extends keyof Paths, Method extends HttpMethod> =
  Operation<Paths, Path, Method> extends {
    parameters: { path: infer P }
  }
    ? P
    : never

// Query Params 추론
export type InferQueryParams<Paths, Path extends keyof Paths, Method extends HttpMethod> =
  Operation<Paths, Path, Method> extends {
    parameters: { query?: infer Q }
  }
    ? Q
    : never
