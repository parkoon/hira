---
title: 'Effect가 필요하지 않을 수도 있습니다'
---

<Intro>

Effect는 React 패러다임에서 벗어나는 탈출구(escape hatch)입니다. Effect를 사용하면 React "밖으로 나가서" 비-React 위젯, 네트워크, 브라우저 DOM 같은 외부 시스템과 컴포넌트를 동기화할 수 있습니다. 외부 시스템이 관여하지 않는 경우(예: props나 state가 변경될 때 컴포넌트의 state를 업데이트하고 싶은 경우)에는 Effect가 필요하지 않습니다. 불필요한 Effect를 제거하면 코드가 이해하기 쉽고, 실행 속도가 빠르며, 오류가 줄어듭니다.

</Intro>

<YouWillLearn>

- 컴포넌트에서 불필요한 Effect를 제거하는 이유와 방법
- Effect 없이 비용이 큰 계산을 캐싱하는 방법
- Effect 없이 컴포넌트 state를 초기화하고 조정하는 방법
- 이벤트 핸들러 간에 로직을 공유하는 방법
- 어떤 로직을 이벤트 핸들러로 옮겨야 하는지
- 부모 컴포넌트에 변경 사항을 알리는 방법

</YouWillLearn>

## 불필요한 Effect를 제거하는 방법 {/_how-to-remove-unnecessary-effects_/}

Effect가 필요하지 않은 흔한 두 가지 경우가 있습니다:

- **렌더링을 위한 데이터 변환에는 Effect가 필요 없습니다.** 예를 들어, 목록을 표시하기 전에 필터링하고 싶다고 합시다. 목록이 변경될 때 state 변수를 업데이트하는 Effect를 작성하고 싶을 수 있습니다. 하지만 이는 비효율적입니다. state를 업데이트하면 React는 먼저 컴포넌트 함수를 호출하여 화면에 무엇이 표시되어야 하는지 계산합니다. 그다음 React가 이 변경 사항을 DOM에 ["커밋"](/learn/render-and-commit)하여 화면을 업데이트합니다. 그런 다음 React가 Effect를 실행합니다. Effect가 _또_ 즉시 state를 업데이트하면 이 전체 과정이 처음부터 다시 시작됩니다! 불필요한 렌더링 패스를 피하려면, 컴포넌트의 최상위 레벨에서 모든 데이터를 변환하세요. 그 코드는 props나 state가 변경될 때마다 자동으로 다시 실행됩니다.
- **사용자 이벤트를 처리하는 데 Effect가 필요 없습니다.** 예를 들어, 사용자가 제품을 구매할 때 `/api/buy` POST 요청을 보내고 알림을 표시하고 싶다고 합시다. 구매 버튼 클릭 이벤트 핸들러에서는 정확히 무슨 일이 일어났는지 알 수 있습니다. Effect가 실행될 때는 사용자가 _무엇을_ 했는지(예: 어떤 버튼을 클릭했는지) 알 수 없습니다. 그래서 보통 해당 이벤트 핸들러에서 사용자 이벤트를 처리합니다.

외부 시스템과 [동기화](/learn/synchronizing-with-effects#what-are-effects-and-how-are-they-different-from-events)하려면 Effect가 _필요합니다_. 예를 들어, jQuery 위젯을 React state와 동기화하는 Effect를 작성할 수 있습니다. Effect로 데이터를 가져올 수도 있습니다. 예를 들어, 현재 검색 쿼리와 검색 결과를 동기화할 수 있습니다. 다만 최신 [프레임워크](/learn/creating-a-react-app#full-stack-frameworks)는 컴포넌트에서 직접 Effect를 작성하는 것보다 더 효율적인 내장 데이터 페칭(data fetching) 메커니즘을 제공한다는 점을 기억하세요.

올바른 직관을 기르기 위해, 몇 가지 구체적인 예제를 살펴보겠습니다!

### props나 state를 기반으로 state 업데이트하기 {/_updating-state-based-on-props-or-state_/}

`firstName`과 `lastName` 두 개의 state 변수가 있는 컴포넌트가 있다고 합시다. 이 둘을 연결하여 `fullName`을 계산하고 싶습니다. 또한 `firstName`이나 `lastName`이 변경될 때마다 `fullName`이 업데이트되기를 원합니다. 가장 먼저 떠오르는 방법은 `fullName` state 변수를 추가하고 Effect에서 업데이트하는 것입니다:

```js {expectedErrors: {'react-compiler': [8]}} {5-9}
function Form() {
  const [firstName, setFirstName] = useState('Taylor')
  const [lastName, setLastName] = useState('Swift')

  // 🔴 피하세요: 중복 state와 불필요한 Effect
  const [fullName, setFullName] = useState('')
  useEffect(() => {
    setFullName(firstName + ' ' + lastName)
  }, [firstName, lastName])
  // ...
}
```

이 방법은 필요 이상으로 복잡합니다. 또한 비효율적입니다: `fullName`의 오래된 값으로 전체 렌더링 패스를 수행한 다음, 업데이트된 값으로 즉시 다시 렌더링합니다. state 변수와 Effect를 제거하세요:

```js {4-5}
function Form() {
  const [firstName, setFirstName] = useState('Taylor')
  const [lastName, setLastName] = useState('Swift')
  // ✅ 좋습니다: 렌더링 중에 계산
  const fullName = firstName + ' ' + lastName
  // ...
}
```

**기존 props나 state에서 계산할 수 있는 것은 [state에 넣지 마세요.](/learn/choosing-the-state-structure#avoid-redundant-state) 대신 렌더링 중에 계산하세요.** 이렇게 하면 코드가 더 빠르고(추가적인 "연쇄" 업데이트를 피함), 더 간단하며(코드량 감소), 오류가 적어집니다(서로 다른 state 변수가 동기화되지 않아 발생하는 버그를 피함). 이 접근 방식이 낯설다면, [React로 사고하기](/learn/thinking-in-react#step-3-find-the-minimal-but-complete-representation-of-ui-state)에서 무엇을 state에 넣어야 하는지 설명합니다.

### 비용이 큰 계산 캐싱하기 {/_caching-expensive-calculations_/}

이 컴포넌트는 props로 받은 `todos`를 `filter` prop에 따라 필터링하여 `visibleTodos`를 계산합니다. 결과를 state에 저장하고 Effect에서 업데이트하고 싶을 수 있습니다:

```js {expectedErrors: {'react-compiler': [7]}} {4-8}
function TodoList({ todos, filter }) {
  const [newTodo, setNewTodo] = useState('')

  // 🔴 피하세요: 중복 state와 불필요한 Effect
  const [visibleTodos, setVisibleTodos] = useState([])
  useEffect(() => {
    setVisibleTodos(getFilteredTodos(todos, filter))
  }, [todos, filter])

  // ...
}
```

앞선 예제와 마찬가지로, 이 방법은 불필요하고 비효율적입니다. 먼저 state와 Effect를 제거하세요:

```js {3-4}
function TodoList({ todos, filter }) {
  const [newTodo, setNewTodo] = useState('')
  // ✅ getFilteredTodos()가 느리지 않다면 괜찮습니다.
  const visibleTodos = getFilteredTodos(todos, filter)
  // ...
}
```

보통 이 코드면 충분합니다! 하지만 `getFilteredTodos()`가 느리거나 `todos`가 매우 많을 수 있습니다. 그런 경우 `newTodo` 같은 관련 없는 state 변수가 변경되었을 때 `getFilteredTodos()`를 다시 계산하고 싶지 않습니다.

[`useMemo`](/reference/react/useMemo) Hook으로 감싸서 비용이 큰 계산을 캐싱(또는 ["메모이제이션(memoize)"](https://en.wikipedia.org/wiki/Memoization))할 수 있습니다:

<Note>

[React Compiler](/learn/react-compiler)는 비용이 큰 계산을 자동으로 메모이제이션할 수 있어, 많은 경우 수동으로 `useMemo`를 사용할 필요가 없습니다.

</Note>

```js {5-8}
import { useMemo, useState } from 'react'

function TodoList({ todos, filter }) {
  const [newTodo, setNewTodo] = useState('')
  const visibleTodos = useMemo(() => {
    // ✅ todos나 filter가 변경되지 않으면 다시 실행되지 않습니다
    return getFilteredTodos(todos, filter)
  }, [todos, filter])
  // ...
}
```

한 줄로 작성하면:

```js {5-6}
import { useMemo, useState } from 'react'

function TodoList({ todos, filter }) {
  const [newTodo, setNewTodo] = useState('')
  // ✅ todos나 filter가 변경되지 않으면 getFilteredTodos()를 다시 실행하지 않습니다
  const visibleTodos = useMemo(() => getFilteredTodos(todos, filter), [todos, filter])
  // ...
}
```

**이것은 `todos`나 `filter`가 변경되지 않는 한 내부 함수를 다시 실행하지 않도록 React에 지시합니다.** React는 초기 렌더링 중에 `getFilteredTodos()`의 반환값을 기억합니다. 다음 렌더링에서 `todos`나 `filter`가 다른지 확인합니다. 지난번과 같다면 `useMemo`는 마지막으로 저장한 결과를 반환합니다. 다르다면 React가 내부 함수를 다시 호출합니다(그리고 그 결과를 저장합니다).

[`useMemo`](/reference/react/useMemo)로 감싼 함수는 렌더링 중에 실행되므로, [순수한 계산](/learn/keeping-components-pure)에만 사용할 수 있습니다.

<DeepDive>

#### 계산이 비싼지 어떻게 알 수 있나요? {/_how-to-tell-if-a-calculation-is-expensive_/}

일반적으로 수천 개의 객체를 생성하거나 순회하지 않는다면 비싸지 않을 가능성이 높습니다. 더 확실히 하고 싶다면 콘솔 로그를 추가하여 코드 조각에 소요되는 시간을 측정할 수 있습니다:

```js {1,3}
console.time('filter array')
const visibleTodos = getFilteredTodos(todos, filter)
console.timeEnd('filter array')
```

측정하려는 상호작용을 수행하세요(예: 입력 필드에 타이핑). 그러면 콘솔에 `filter array: 0.15ms` 같은 로그가 나타납니다. 전체 로그 시간이 상당한 양(예: `1ms` 이상)에 달한다면 해당 계산을 메모이제이션하는 것이 합리적입니다. 실험으로 `useMemo`로 감싸서 해당 상호작용에 대해 전체 로그 시간이 감소했는지 확인할 수 있습니다:

```js
console.time('filter array')
const visibleTodos = useMemo(() => {
  return getFilteredTodos(todos, filter) // todos와 filter가 변경되지 않으면 건너뜁니다
}, [todos, filter])
console.timeEnd('filter array')
```

`useMemo`는 _첫 번째_ 렌더링을 빠르게 만들지 않습니다. 업데이트 시 불필요한 작업을 건너뛰는 데만 도움이 됩니다.

여러분의 컴퓨터가 사용자 것보다 빠를 수 있으므로 인위적인 속도 저하로 성능을 테스트하는 것이 좋습니다. 예를 들어, Chrome은 [CPU 쓰로틀링(CPU Throttling)](https://developer.chrome.com/blog/new-in-devtools-61/#throttling) 옵션을 제공합니다.

또한 개발 환경에서의 성능 측정은 가장 정확한 결과를 제공하지 않습니다. (예를 들어, [Strict Mode](/reference/react/StrictMode)가 켜져 있으면 각 컴포넌트가 한 번이 아닌 두 번 렌더링됩니다.) 가장 정확한 타이밍을 얻으려면 프로덕션용으로 앱을 빌드하고 사용자와 같은 기기에서 테스트하세요.

</DeepDive>

### prop이 변경될 때 모든 state 초기화하기 {/_resetting-all-state-when-a-prop-changes_/}

이 `ProfilePage` 컴포넌트는 `userId` prop을 받습니다. 페이지에 댓글 입력이 있고, `comment` state 변수로 값을 관리합니다. 어느 날 문제를 발견합니다: 한 프로필에서 다른 프로필로 이동할 때 `comment` state가 초기화되지 않습니다. 그 결과 실수로 다른 사용자의 프로필에 댓글을 게시하기 쉽습니다. 이 문제를 해결하기 위해 `userId`가 변경될 때마다 `comment` state를 비우고 싶습니다:

```js {expectedErrors: {'react-compiler': [6]}} {4-7}
export default function ProfilePage({ userId }) {
  const [comment, setComment] = useState('')

  // 🔴 피하세요: Effect에서 prop 변경 시 state 초기화
  useEffect(() => {
    setComment('')
  }, [userId])
  // ...
}
```

이 방법은 비효율적입니다. `ProfilePage`와 그 자식들이 먼저 오래된 값으로 렌더링한 다음 다시 렌더링하기 때문입니다. 또한 `ProfilePage` 안에 state가 있는 _모든_ 컴포넌트에서 이 작업을 해야 하므로 복잡합니다. 예를 들어, 댓글 UI가 중첩되어 있다면 중첩된 댓글 state도 비워야 합니다.

대신, 명시적인 key를 부여하여 각 사용자의 프로필이 개념적으로 _다른_ 프로필임을 React에 알릴 수 있습니다. 컴포넌트를 둘로 나누고 외부 컴포넌트에서 내부 컴포넌트로 `key` 속성을 전달하세요:

```js {5,11-12}
export default function ProfilePage({ userId }) {
  return (
    <Profile
      userId={userId}
      key={userId}
    />
  )
}

function Profile({ userId }) {
  // ✅ 이 state와 아래의 모든 state가 key 변경 시 자동으로 초기화됩니다
  const [comment, setComment] = useState('')
  // ...
}
```

보통 React는 같은 컴포넌트가 같은 위치에 렌더링되면 state를 보존합니다. **`Profile` 컴포넌트에 `userId`를 `key`로 전달하면, 서로 다른 `userId`를 가진 두 `Profile` 컴포넌트를 state를 공유하지 않는 별개의 컴포넌트로 취급하도록 React에 요청하는 것입니다.** key(`userId`로 설정한)가 변경될 때마다 React는 DOM을 다시 생성하고 `Profile` 컴포넌트와 모든 자식의 [state를 초기화](/learn/preserving-and-resetting-state#option-2-resetting-state-with-a-key)합니다. 이제 프로필 간 이동 시 `comment` 필드가 자동으로 비워집니다.

이 예제에서는 외부 `ProfilePage` 컴포넌트만 export되어 프로젝트의 다른 파일에 노출됩니다. `ProfilePage`를 렌더링하는 컴포넌트는 key를 전달할 필요가 없습니다. 일반 prop으로 `userId`를 전달하면 됩니다. `ProfilePage`가 내부 `Profile` 컴포넌트에 `key`로 전달하는 것은 구현 세부사항입니다.

### prop이 변경될 때 일부 state만 조정하기 {/_adjusting-some-state-when-a-prop-changes_/}

때로는 prop이 변경될 때 state의 전부가 아닌 일부만 초기화하거나 조정하고 싶을 수 있습니다.

이 `List` 컴포넌트는 `items`를 prop으로 받고, `selection` state 변수로 선택된 항목을 관리합니다. `items` prop이 다른 배열을 받을 때마다 `selection`을 `null`로 초기화하고 싶습니다:

```js {expectedErrors: {'react-compiler': [7]}} {5-8}
function List({ items }) {
  const [isReverse, setIsReverse] = useState(false)
  const [selection, setSelection] = useState(null)

  // 🔴 피하세요: Effect에서 prop 변경 시 state 조정
  useEffect(() => {
    setSelection(null)
  }, [items])
  // ...
}
```

이 방법도 이상적이지 않습니다. `items`가 변경될 때마다 `List`와 자식 컴포넌트들이 먼저 오래된 `selection` 값으로 렌더링합니다. 그다음 React가 DOM을 업데이트하고 Effect를 실행합니다. 마지막으로 `setSelection(null)` 호출이 `List`와 자식 컴포넌트의 또 다른 리렌더링을 일으키며, 이 전체 과정이 다시 시작됩니다.

Effect를 삭제하고 대신 렌더링 중에 직접 state를 조정하세요:

```js {5-11}
function List({ items }) {
  const [isReverse, setIsReverse] = useState(false)
  const [selection, setSelection] = useState(null)

  // 더 나은 방법: 렌더링 중에 state 조정
  const [prevItems, setPrevItems] = useState(items)
  if (items !== prevItems) {
    setPrevItems(items)
    setSelection(null)
  }
  // ...
}
```

이처럼 [이전 렌더링의 정보를 저장](/reference/react/useState#storing-information-from-previous-renders)하는 것은 이해하기 어려울 수 있지만, Effect에서 같은 state를 업데이트하는 것보다 낫습니다. 위 예제에서 `setSelection`은 렌더링 중에 직접 호출됩니다. React는 `return` 문으로 종료된 _직후_ `List`를 다시 렌더링합니다. React가 아직 `List` 자식들을 렌더링하거나 DOM을 업데이트하지 않았으므로, `List` 자식들은 오래된 `selection` 값의 렌더링을 건너뛸 수 있습니다.

렌더링 중에 컴포넌트를 업데이트하면 React는 반환된 JSX를 버리고 즉시 렌더링을 재시도합니다. 매우 느린 연쇄 재시도를 피하기 위해, React는 렌더링 중에 _같은_ 컴포넌트의 state만 업데이트할 수 있도록 합니다. 렌더링 중에 다른 컴포넌트의 state를 업데이트하면 에러가 발생합니다. 루프를 피하려면 `items !== prevItems` 같은 조건이 필요합니다. 이런 방식으로 state를 조정할 수 있지만, 다른 부수 효과(side effect)(DOM 변경이나 타임아웃 설정 등)는 [컴포넌트의 순수성을 유지하기 위해](/learn/keeping-components-pure) 이벤트 핸들러나 Effect에 두어야 합니다.

**이 패턴이 Effect보다 효율적이지만, 대부분의 컴포넌트에서는 이것도 필요하지 않습니다.** 어떤 방법을 사용하든 props나 다른 state를 기반으로 state를 조정하면 데이터 흐름을 이해하고 디버그하기 어려워집니다. 항상 [key로 모든 state를 초기화](#resetting-all-state-when-a-prop-changes)하거나 [렌더링 중에 모두 계산](#updating-state-based-on-props-or-state)할 수 있는지 확인하세요. 예를 들어, 선택된 *항목*을 저장(및 초기화)하는 대신, 선택된 *항목 ID*를 저장할 수 있습니다:

```js {3-5}
function List({ items }) {
  const [isReverse, setIsReverse] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  // ✅ 가장 좋습니다: 렌더링 중에 모든 것을 계산
  const selection = items.find((item) => item.id === selectedId) ?? null
  // ...
}
```

이제 state를 "조정"할 필요가 전혀 없습니다. 선택된 ID의 항목이 목록에 있으면 선택이 유지됩니다. 없으면 렌더링 중에 계산된 `selection`은 일치하는 항목이 없으므로 `null`이 됩니다. 이 동작은 다르지만, `items`에 대한 대부분의 변경이 선택을 유지하므로 더 나은 방법이라고 볼 수 있습니다.

### 이벤트 핸들러 간 로직 공유하기 {/_sharing-logic-between-event-handlers_/}

구매(Buy)와 결제(Checkout) 두 개의 버튼이 있는 제품 페이지가 있다고 합시다. 두 버튼 모두 해당 제품을 구매할 수 있습니다. 사용자가 제품을 장바구니에 넣을 때마다 알림을 표시하고 싶습니다. 두 버튼의 클릭 핸들러에서 `showNotification()`을 호출하는 것이 반복적으로 느껴져서 이 로직을 Effect에 넣고 싶을 수 있습니다:

```js {2-7}
function ProductPage({ product, addToCart }) {
  // 🔴 피하세요: Effect 안에 이벤트 특정 로직
  useEffect(() => {
    if (product.isInCart) {
      showNotification(`Added ${product.name} to the shopping cart!`)
    }
  }, [product])

  function handleBuyClick() {
    addToCart(product)
  }

  function handleCheckoutClick() {
    addToCart(product)
    navigateTo('/checkout')
  }
  // ...
}
```

이 Effect는 불필요합니다. 또한 버그를 유발할 가능성이 높습니다. 예를 들어, 앱이 페이지 새로고침 사이에 장바구니를 "기억"한다고 합시다. 제품을 장바구니에 한 번 추가하고 페이지를 새로고침하면 알림이 다시 나타납니다. 해당 제품 페이지를 새로고침할 때마다 계속 나타납니다. `product.isInCart`가 페이지 로드 시 이미 `true`이므로 위의 Effect가 `showNotification()`을 호출하기 때문입니다.

**어떤 코드가 Effect에 있어야 하는지 이벤트 핸들러에 있어야 하는지 확실하지 않다면, _왜_ 이 코드가 실행되어야 하는지 스스로에게 물어보세요. 컴포넌트가 사용자에게 _표시되었기 때문에_ 실행되어야 하는 코드에만 Effect를 사용하세요.** 이 예제에서 알림은 페이지가 표시되었기 때문이 아니라 사용자가 _버튼을 눌렀기 때문에_ 나타나야 합니다! Effect를 삭제하고 두 이벤트 핸들러에서 호출하는 함수에 공유 로직을 넣으세요:

```js {2-6,9,13}
function ProductPage({ product, addToCart }) {
  // ✅ 좋습니다: 이벤트 특정 로직은 이벤트 핸들러에서 호출
  function buyProduct() {
    addToCart(product)
    showNotification(`Added ${product.name} to the shopping cart!`)
  }

  function handleBuyClick() {
    buyProduct()
  }

  function handleCheckoutClick() {
    buyProduct()
    navigateTo('/checkout')
  }
  // ...
}
```

이렇게 하면 불필요한 Effect도 제거되고 버그도 수정됩니다.

### POST 요청 보내기 {/_sending-a-post-request_/}

이 `Form` 컴포넌트는 두 종류의 POST 요청을 보냅니다. 마운트될 때 분석(analytics) 이벤트를 보냅니다. 폼을 작성하고 제출 버튼을 클릭하면 `/api/register` 엔드포인트에 POST 요청을 보냅니다:

```js {5-8,10-16}
function Form() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  // ✅ 좋습니다: 이 로직은 컴포넌트가 표시되었기 때문에 실행되어야 합니다
  useEffect(() => {
    post('/analytics/event', { eventName: 'visit_form' })
  }, [])

  // 🔴 피하세요: Effect 안에 이벤트 특정 로직
  const [jsonToSubmit, setJsonToSubmit] = useState(null)
  useEffect(() => {
    if (jsonToSubmit !== null) {
      post('/api/register', jsonToSubmit)
    }
  }, [jsonToSubmit])

  function handleSubmit(e) {
    e.preventDefault()
    setJsonToSubmit({ firstName, lastName })
  }
  // ...
}
```

앞선 예제와 같은 기준을 적용해 봅시다.

분석 POST 요청은 Effect에 남아야 합니다. 분석 이벤트를 보내는 *이유*가 폼이 표시되었기 때문이기 때문입니다. (개발 환경에서 두 번 실행되지만, [여기](/learn/synchronizing-with-effects#sending-analytics)에서 처리 방법을 확인하세요.)

하지만 `/api/register` POST 요청은 폼이 _표시되는_ 것으로 인해 발생하는 것이 아닙니다. 특정 시점, 즉 사용자가 버튼을 눌렀을 때만 요청을 보내고 싶습니다. 이것은 _그 특정 상호작용에서만_ 발생해야 합니다. 두 번째 Effect를 삭제하고 해당 POST 요청을 이벤트 핸들러로 옮기세요:

```js {12-13}
function Form() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  // ✅ 좋습니다: 이 로직은 컴포넌트가 표시되었기 때문에 실행됩니다
  useEffect(() => {
    post('/analytics/event', { eventName: 'visit_form' })
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    // ✅ 좋습니다: 이벤트 특정 로직은 이벤트 핸들러에 있습니다
    post('/api/register', { firstName, lastName })
  }
  // ...
}
```

어떤 로직을 이벤트 핸들러에 넣을지 Effect에 넣을지 결정할 때, 핵심 질문은 사용자 관점에서 *어떤 종류의 로직*인지 입니다. 특정 상호작용에 의해 발생하는 로직이라면 이벤트 핸들러에 유지하세요. 사용자가 화면에서 컴포넌트를 *보는 것*에 의해 발생하는 로직이라면 Effect에 유지하세요.

### 연쇄 계산 {/_chains-of-computations_/}

다른 state를 기반으로 각각의 state를 조정하는 Effect를 연쇄적으로 사용하고 싶을 때가 있습니다:

```js {7-29}
function Game() {
  const [card, setCard] = useState(null);
  const [goldCardCount, setGoldCardCount] = useState(0);
  const [round, setRound] = useState(1);
  const [isGameOver, setIsGameOver] = useState(false);

  // 🔴 피하세요: 서로를 트리거하기 위해서만 state를 조정하는 Effect 체인
  useEffect(() => {
    if (card !== null && card.gold) {
      setGoldCardCount(c => c + 1);
    }
  }, [card]);

  useEffect(() => {
    if (goldCardCount > 3) {
      setRound(r => r + 1)
      setGoldCardCount(0);
    }
  }, [goldCardCount]);

  useEffect(() => {
    if (round > 5) {
      setIsGameOver(true);
    }
  }, [round]);

  useEffect(() => {
    alert('Good game!');
  }, [isGameOver]);

  function handlePlaceCard(nextCard) {
    if (isGameOver) {
      throw Error('Game already ended.');
    } else {
      setCard(nextCard);
    }
  }

  // ...
```

이 코드에는 두 가지 문제가 있습니다.

첫 번째 문제는 매우 비효율적이라는 것입니다: 체인의 각 `set` 호출 사이에 컴포넌트(와 자식들)가 리렌더링해야 합니다. 위 예제에서 최악의 경우(`setCard` → 렌더링 → `setGoldCardCount` → 렌더링 → `setRound` → 렌더링 → `setIsGameOver` → 렌더링) 하위 트리의 불필요한 리렌더링이 세 번 발생합니다.

두 번째 문제는 느리지 않더라도, 코드가 발전하면서 작성한 "체인"이 새로운 요구사항에 맞지 않는 경우가 생긴다는 것입니다. 게임 이동 히스토리를 탐색하는 기능을 추가한다고 상상해 보세요. 각 state 변수를 과거의 값으로 업데이트하면 됩니다. 하지만 `card` state를 과거 값으로 설정하면 Effect 체인이 다시 트리거되어 표시하고 있는 데이터가 변경됩니다. 이런 코드는 종종 경직되고 취약합니다.

이 경우, 렌더링 중에 계산할 수 있는 것은 계산하고, 이벤트 핸들러에서 state를 조정하는 것이 낫습니다:

```js {6-7,14-26}
function Game() {
  const [card, setCard] = useState(null);
  const [goldCardCount, setGoldCardCount] = useState(0);
  const [round, setRound] = useState(1);

  // ✅ 렌더링 중에 계산할 수 있는 것은 계산
  const isGameOver = round > 5;

  function handlePlaceCard(nextCard) {
    if (isGameOver) {
      throw Error('Game already ended.');
    }

    // ✅ 이벤트 핸들러에서 다음 state를 모두 계산
    setCard(nextCard);
    if (nextCard.gold) {
      if (goldCardCount < 3) {
        setGoldCardCount(goldCardCount + 1);
      } else {
        setGoldCardCount(0);
        setRound(round + 1);
        if (round === 5) {
          alert('Good game!');
        }
      }
    }
  }

  // ...
```

훨씬 효율적입니다. 또한 게임 히스토리를 보는 기능을 구현하면, 모든 다른 값을 조정하는 Effect 체인을 트리거하지 않고도 각 state 변수를 과거의 이동으로 설정할 수 있습니다. 여러 이벤트 핸들러 간에 로직을 재사용해야 한다면 [함수를 추출](#sharing-logic-between-event-handlers)하여 핸들러에서 호출할 수 있습니다.

이벤트 핸들러 안에서 [state는 스냅샷처럼 동작합니다.](/learn/state-as-a-snapshot) 예를 들어, `setRound(round + 1)`을 호출한 후에도 `round` 변수는 사용자가 버튼을 클릭한 시점의 값을 반영합니다. 계산에 다음 값을 사용해야 한다면 `const nextRound = round + 1`처럼 수동으로 정의하세요.

이벤트 핸들러에서 직접 다음 state를 계산할 수 _없는_ 경우도 있습니다. 예를 들어, 여러 드롭다운이 있는 폼에서 다음 드롭다운의 옵션이 이전 드롭다운의 선택값에 따라 달라지는 경우입니다. 그런 경우에는 네트워크와 동기화하는 것이므로 Effect 체인이 적절합니다.

### 애플리케이션 초기화 {/_initializing-the-application_/}

일부 로직은 앱이 로드될 때 한 번만 실행되어야 합니다.

최상위 컴포넌트의 Effect에 넣고 싶을 수 있습니다:

```js {2-6}
function App() {
  // 🔴 피하세요: 한 번만 실행되어야 하는 로직이 있는 Effect
  useEffect(() => {
    loadDataFromLocalStorage()
    checkAuthToken()
  }, [])
  // ...
}
```

하지만 개발 환경에서 [두 번 실행된다는 것](/learn/synchronizing-with-effects#how-to-handle-the-effect-firing-twice-in-development)을 금방 발견하게 됩니다. 이로 인해 문제가 발생할 수 있습니다. 예를 들어, 함수가 두 번 호출되도록 설계되지 않아서 인증 토큰이 무효화될 수 있습니다. 일반적으로 컴포넌트는 다시 마운트(remount)되어도 문제없이 동작해야 합니다. 최상위 `App` 컴포넌트도 마찬가지입니다.

프로덕션에서 실제로 다시 마운트되지 않더라도, 모든 컴포넌트에서 동일한 제약을 따르면 코드를 이동하고 재사용하기가 쉬워집니다. 일부 로직이 *컴포넌트 마운트당 한 번*이 아니라 _앱 로드당 한 번_ 실행되어야 한다면, 이미 실행되었는지 추적하는 최상위 변수를 추가하세요:

```js {1,5-6,10}
let didInit = false

function App() {
  useEffect(() => {
    if (!didInit) {
      didInit = true
      // ✅ 앱 로드당 한 번만 실행
      loadDataFromLocalStorage()
      checkAuthToken()
    }
  }, [])
  // ...
}
```

모듈 초기화 중에, 앱이 렌더링되기 전에 실행할 수도 있습니다:

```js {1,5}
if (typeof window !== 'undefined') {
  // 브라우저에서 실행 중인지 확인
  // ✅ 앱 로드당 한 번만 실행
  checkAuthToken()
  loadDataFromLocalStorage()
}

function App() {
  // ...
}
```

최상위 레벨의 코드는 컴포넌트가 import될 때 한 번 실행됩니다. 렌더링되지 않더라도요. 임의의 컴포넌트를 import할 때 속도 저하나 예상치 못한 동작을 피하려면 이 패턴을 남용하지 마세요. 앱 전체 초기화 로직은 `App.js` 같은 루트 컴포넌트 모듈이나 애플리케이션의 진입점(entry point)에 두세요.

### 부모 컴포넌트에 state 변경 알리기 {/_notifying-parent-components-about-state-changes_/}

`true` 또는 `false`가 될 수 있는 내부 `isOn` state를 가진 `Toggle` 컴포넌트를 작성하고 있다고 합시다. 토글하는 방법은 여러 가지입니다(클릭이나 드래그). `Toggle`의 내부 state가 변경될 때마다 부모 컴포넌트에 알리고 싶어서 `onChange` 이벤트를 노출하고 Effect에서 호출합니다:

```js {4-7}
function Toggle({ onChange }) {
  const [isOn, setIsOn] = useState(false)

  // 🔴 피하세요: onChange 핸들러가 너무 늦게 실행됩니다
  useEffect(() => {
    onChange(isOn)
  }, [isOn, onChange])

  function handleClick() {
    setIsOn(!isOn)
  }

  function handleDragEnd(e) {
    if (isCloserToRightEdge(e)) {
      setIsOn(true)
    } else {
      setIsOn(false)
    }
  }

  // ...
}
```

앞서와 마찬가지로 이 방법은 이상적이지 않습니다. `Toggle`이 먼저 state를 업데이트하고 React가 화면을 업데이트합니다. 그런 다음 React가 Effect를 실행하여 부모 컴포넌트에서 전달된 `onChange` 함수를 호출합니다. 이제 부모 컴포넌트가 자체 state를 업데이트하여 또 다른 렌더링 패스가 시작됩니다. 모든 것을 단일 패스에서 처리하는 것이 더 좋습니다.

Effect를 삭제하고 대신 같은 이벤트 핸들러에서 _두_ 컴포넌트의 state를 업데이트하세요:

```js {5-7,11,16,18}
function Toggle({ onChange }) {
  const [isOn, setIsOn] = useState(false)

  function updateToggle(nextIsOn) {
    // ✅ 좋습니다: 이벤트를 유발한 시점에 모든 업데이트를 수행
    setIsOn(nextIsOn)
    onChange(nextIsOn)
  }

  function handleClick() {
    updateToggle(!isOn)
  }

  function handleDragEnd(e) {
    if (isCloserToRightEdge(e)) {
      updateToggle(true)
    } else {
      updateToggle(false)
    }
  }

  // ...
}
```

이 접근 방식에서는 `Toggle` 컴포넌트와 부모 컴포넌트 모두 이벤트 중에 state를 업데이트합니다. React는 서로 다른 컴포넌트의 업데이트를 [일괄 처리(batch)](/learn/queueing-a-series-of-state-updates)하므로 렌더링 패스가 한 번만 발생합니다.

아예 state를 제거하고 대신 부모 컴포넌트에서 `isOn`을 받을 수도 있습니다:

```js {1,2}
// ✅ 이것도 좋습니다: 컴포넌트가 부모에 의해 완전히 제어됩니다
function Toggle({ isOn, onChange }) {
  function handleClick() {
    onChange(!isOn)
  }

  function handleDragEnd(e) {
    if (isCloserToRightEdge(e)) {
      onChange(true)
    } else {
      onChange(false)
    }
  }

  // ...
}
```

["state 끌어올리기(lifting state up)"](/learn/sharing-state-between-components)는 부모 컴포넌트가 자체 state를 토글하여 `Toggle`을 완전히 제어할 수 있게 합니다. 부모 컴포넌트에 더 많은 로직이 포함되어야 하지만, 전체적으로 걱정해야 할 state가 줄어듭니다. 두 개의 서로 다른 state 변수를 동기화하려고 할 때마다 state 끌어올리기를 시도해 보세요!

### 부모에게 데이터 전달하기 {/_passing-data-to-the-parent_/}

이 `Child` 컴포넌트는 데이터를 가져온 다음 Effect에서 `Parent` 컴포넌트에 전달합니다:

```js {9-14}
function Parent() {
  const [data, setData] = useState(null)
  // ...
  return <Child onFetched={setData} />
}

function Child({ onFetched }) {
  const data = useSomeAPI()
  // 🔴 피하세요: Effect에서 부모에게 데이터 전달
  useEffect(() => {
    if (data) {
      onFetched(data)
    }
  }, [onFetched, data])
  // ...
}
```

React에서 데이터는 부모 컴포넌트에서 자식으로 흐릅니다. 화면에서 무언가 잘못된 것을 볼 때, 어떤 컴포넌트가 잘못된 prop을 전달하거나 잘못된 state를 가지고 있는지 컴포넌트 체인을 올라가며 정보의 출처를 추적할 수 있습니다. 자식 컴포넌트가 Effect에서 부모의 state를 업데이트하면 데이터 흐름을 추적하기가 매우 어려워집니다. 자식과 부모 모두 같은 데이터가 필요하므로, 부모 컴포넌트가 데이터를 가져와서 자식에게 *전달*하게 하세요:

```js {4-5}
function Parent() {
  const data = useSomeAPI()
  // ...
  // ✅ 좋습니다: 자식에게 데이터를 내려보내기
  return <Child data={data} />
}

function Child({ data }) {
  // ...
}
```

이 방법이 더 단순하고 데이터 흐름을 예측 가능하게 유지합니다: 데이터가 부모에서 자식으로 흐릅니다.

### 외부 저장소 구독하기 {/_subscribing-to-an-external-store_/}

때로는 컴포넌트가 React state 외부의 데이터를 구독해야 할 수 있습니다. 서드파티 라이브러리나 내장 브라우저 API의 데이터일 수 있습니다. 이 데이터는 React가 모르는 사이에 변경될 수 있으므로, 수동으로 컴포넌트를 구독해야 합니다. 이것은 종종 Effect로 수행됩니다. 예를 들어:

```js {2-17}
function useOnlineStatus() {
  // 이상적이지 않음: Effect에서 수동 저장소 구독
  const [isOnline, setIsOnline] = useState(true)
  useEffect(() => {
    function updateState() {
      setIsOnline(navigator.onLine)
    }

    updateState()

    window.addEventListener('online', updateState)
    window.addEventListener('offline', updateState)
    return () => {
      window.removeEventListener('online', updateState)
      window.removeEventListener('offline', updateState)
    }
  }, [])
  return isOnline
}

function ChatIndicator() {
  const isOnline = useOnlineStatus()
  // ...
}
```

여기서 컴포넌트는 외부 데이터 저장소(이 경우 브라우저 `navigator.onLine` API)에 구독합니다. 이 API는 서버에 존재하지 않으므로(초기 HTML에 사용할 수 없음) 처음에 state가 `true`로 설정됩니다. 브라우저에서 데이터 저장소의 값이 변경될 때마다 컴포넌트가 state를 업데이트합니다.

Effect로 이 작업을 하는 것이 일반적이지만, React에는 외부 저장소를 구독하기 위한 전용 Hook이 있으며 이를 사용하는 것이 더 좋습니다. Effect를 삭제하고 [`useSyncExternalStore`](/reference/react/useSyncExternalStore) 호출로 대체하세요:

```js {11-16}
function subscribe(callback) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

function useOnlineStatus() {
  // ✅ 좋습니다: 내장 Hook으로 외부 저장소 구독
  return useSyncExternalStore(
    subscribe, // 같은 함수를 전달하는 한 React는 재구독하지 않습니다
    () => navigator.onLine, // 클라이언트에서 값을 가져오는 방법
    () => true // 서버에서 값을 가져오는 방법
  )
}

function ChatIndicator() {
  const isOnline = useOnlineStatus()
  // ...
}
```

이 접근 방식은 Effect로 가변 데이터(mutable data)를 수동으로 React state와 동기화하는 것보다 오류가 적습니다. 일반적으로 위의 `useOnlineStatus()`처럼 커스텀 Hook을 작성하여 개별 컴포넌트에서 이 코드를 반복할 필요가 없도록 합니다. [React 컴포넌트에서 외부 저장소 구독하기](/reference/react/useSyncExternalStore)에서 더 자세히 읽어보세요.

### 데이터 가져오기 {/_fetching-data_/}

많은 앱이 Effect로 데이터 가져오기(data fetching)를 시작합니다. 다음과 같은 데이터 가져오기 Effect를 작성하는 것이 꽤 일반적입니다:

```js {5-10}
function SearchResults({ query }) {
  const [results, setResults] = useState([])
  const [page, setPage] = useState(1)

  useEffect(() => {
    // 🔴 피하세요: 정리 로직 없이 데이터 가져오기
    fetchResults(query, page).then((json) => {
      setResults(json)
    })
  }, [query, page])

  function handleNextPageClick() {
    setPage(page + 1)
  }
  // ...
}
```

이 fetch를 이벤트 핸들러로 옮길 필요는 _없습니다_.

이것이 앞선 예제들에서 이벤트 핸들러에 로직을 넣어야 했던 것과 모순되는 것처럼 보일 수 있습니다. 하지만 *타이핑 이벤트*가 데이터를 가져오는 주된 이유가 아니라는 점을 고려하세요. 검색 입력은 종종 URL에서 미리 채워지며, 사용자는 입력을 건드리지 않고도 뒤로/앞으로 탐색할 수 있습니다.

`page`와 `query`가 어디서 오는지는 중요하지 않습니다. 이 컴포넌트가 보이는 동안, 현재 `page`와 `query`에 대한 네트워크 데이터와 `results`를 [동기화](/learn/synchronizing-with-effects) 상태로 유지하고 싶습니다. 이것이 Effect인 이유입니다.

하지만 위 코드에는 버그가 있습니다. `"hello"`를 빠르게 입력한다고 상상해 보세요. `query`가 `"h"`, `"he"`, `"hel"`, `"hell"`, `"hello"`로 변경됩니다. 이것은 별도의 fetch를 시작하지만, 응답이 어떤 순서로 도착할지 보장이 없습니다. 예를 들어, `"hell"` 응답이 `"hello"` 응답 _이후에_ 도착할 수 있습니다. 마지막에 `setResults()`를 호출하므로 잘못된 검색 결과가 표시됩니다. 이를 ["경쟁 조건(race condition)"](https://en.wikipedia.org/wiki/Race_condition)이라고 합니다: 두 개의 다른 요청이 서로 "경쟁"하여 예상과 다른 순서로 도착한 것입니다.

**경쟁 조건을 수정하려면, 오래된 응답을 무시하는 [정리 함수(cleanup function)를 추가](/learn/synchronizing-with-effects#fetching-data)해야 합니다:**

```js {5,7,9,11-13}
function SearchResults({ query }) {
  const [results, setResults] = useState([])
  const [page, setPage] = useState(1)
  useEffect(() => {
    let ignore = false
    fetchResults(query, page).then((json) => {
      if (!ignore) {
        setResults(json)
      }
    })
    return () => {
      ignore = true
    }
  }, [query, page])

  function handleNextPageClick() {
    setPage(page + 1)
  }
  // ...
}
```

이렇게 하면 Effect가 데이터를 가져올 때 마지막으로 요청한 응답을 제외한 모든 응답이 무시됩니다.

경쟁 조건 처리만이 데이터 가져오기 구현의 유일한 어려움은 아닙니다. 응답 캐싱(사용자가 뒤로 가기를 눌러 이전 화면을 즉시 볼 수 있도록), 서버에서 데이터를 가져오는 방법(초기 서버 렌더링 HTML에 스피너 대신 가져온 콘텐츠가 포함되도록), 네트워크 폭포(waterfall) 방지(모든 부모를 기다리지 않고 자식이 데이터를 가져올 수 있도록) 등도 고려해야 합니다.

**이러한 문제는 React뿐만 아니라 모든 UI 라이브러리에 적용됩니다. 이 문제들을 해결하는 것은 쉽지 않으므로, 최신 [프레임워크](/learn/creating-a-react-app#full-stack-frameworks)는 Effect에서 직접 데이터를 가져오는 것보다 더 효율적인 내장 데이터 가져오기 메커니즘을 제공합니다.**

프레임워크를 사용하지 않지만(직접 만들고 싶지도 않지만) Effect에서의 데이터 가져오기를 더 편리하게 만들고 싶다면, 다음 예제처럼 가져오기 로직을 커스텀 Hook으로 추출하는 것을 고려하세요:

```js {4}
function SearchResults({ query }) {
  const [page, setPage] = useState(1)
  const params = new URLSearchParams({ query, page })
  const results = useData(`/api/search?${params}`)

  function handleNextPageClick() {
    setPage(page + 1)
  }
  // ...
}

function useData(url) {
  const [data, setData] = useState(null)
  useEffect(() => {
    let ignore = false
    fetch(url)
      .then((response) => response.json())
      .then((json) => {
        if (!ignore) {
          setData(json)
        }
      })
    return () => {
      ignore = true
    }
  }, [url])
  return data
}
```

에러 처리와 콘텐츠 로딩 여부 추적을 위한 로직도 추가하고 싶을 것입니다. 이런 Hook을 직접 만들거나 React 생태계에서 이미 사용 가능한 여러 솔루션 중 하나를 사용할 수 있습니다. **이것만으로는 프레임워크의 내장 데이터 가져오기 메커니즘만큼 효율적이지는 않지만, 데이터 가져오기 로직을 커스텀 Hook으로 옮기면 나중에 효율적인 데이터 가져오기 전략을 도입하기가 쉬워집니다.**

일반적으로 Effect를 작성해야 할 때마다, 위의 `useData`처럼 더 선언적이고 목적에 맞는 API를 가진 커스텀 Hook으로 기능을 추출할 수 있는지 살펴보세요. 컴포넌트에서 직접 `useEffect` 호출이 적을수록 애플리케이션을 유지보수하기가 쉬워집니다.

<Recap>

- 렌더링 중에 계산할 수 있다면 Effect가 필요 없습니다.
- 비용이 큰 계산을 캐싱하려면 `useEffect` 대신 `useMemo`를 사용하세요.
- 전체 컴포넌트 트리의 state를 초기화하려면 다른 `key`를 전달하세요.
- prop 변경에 대응하여 특정 state를 초기화하려면 렌더링 중에 설정하세요.
- 컴포넌트가 _표시되었기 때문에_ 실행되는 코드는 Effect에, 나머지는 이벤트에 두세요.
- 여러 컴포넌트의 state를 업데이트해야 한다면 단일 이벤트 중에 하는 것이 좋습니다.
- 서로 다른 컴포넌트의 state 변수를 동기화하려 할 때마다 state 끌어올리기를 고려하세요.
- Effect로 데이터를 가져올 수 있지만, 경쟁 조건을 피하기 위해 정리 함수를 구현해야 합니다.

</Recap>
