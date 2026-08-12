---
title: 'ref로 값 참조하기'
---

<Intro>

컴포넌트가 어떤 정보를 "기억"하되, 그 정보가 [새로운 렌더링을 트리거](/learn/render-and-commit)하지 않기를 원할 때 _ref_ 를 사용할 수 있습니다.

</Intro>

<YouWillLearn>

- 컴포넌트에 ref를 추가하는 방법
- ref의 값을 업데이트하는 방법
- ref와 state의 차이점
- ref를 안전하게 사용하는 방법

</YouWillLearn>

## 컴포넌트에 ref 추가하기 {/_adding-a-ref-to-your-component_/}

React에서 `useRef` Hook을 import하면 컴포넌트에 ref를 추가할 수 있습니다:

```js
import { useRef } from 'react'
```

컴포넌트 내부에서 `useRef` Hook을 호출하고, 참조하고 싶은 초기값을 유일한 인자로 전달합니다. 예를 들어, 값 `0`에 대한 ref는 이렇게 만듭니다:

```js
const ref = useRef(0)
```

`useRef`는 다음과 같은 객체를 반환합니다:

```js
{
  current: 0 // useRef에 전달한 값
}
```

<Illustration src="/images/docs/illustrations/i_ref.png" alt="'current'라고 쓰인 화살표가 'ref'라고 쓰인 주머니에 들어있는 모습." />

`ref.current` 프로퍼티를 통해 해당 ref의 현재 값에 접근할 수 있습니다. 이 값은 의도적으로 변경 가능(mutable)하게 설계되어 있어서, 읽기와 쓰기 모두 가능합니다. React가 추적하지 않는 컴포넌트의 비밀 주머니라고 생각하면 됩니다. (이것이 React의 단방향 데이터 흐름에서 벗어나는 "탈출구(escape hatch)"가 되는 이유입니다. 아래에서 더 자세히 다룹니다!)

아래 예제에서 버튼을 클릭할 때마다 `ref.current`가 증가합니다:

<Sandpack>

```js
import { useRef } from 'react'

export default function Counter() {
  let ref = useRef(0)

  function handleClick() {
    ref.current = ref.current + 1
    alert('You clicked ' + ref.current + ' times!')
  }

  return <button onClick={handleClick}>Click me!</button>
}
```

</Sandpack>

ref는 숫자를 가리키고 있지만, [state](/learn/state-a-components-memory)와 마찬가지로 문자열, 객체, 심지어 함수 등 무엇이든 가리킬 수 있습니다. state와 달리 ref는 읽고 수정할 수 있는 `current` 프로퍼티를 가진 순수한 JavaScript 객체입니다.

**컴포넌트가 매 증가마다 리렌더링되지 않는다는 점**에 주목하세요. state와 마찬가지로 ref도 React에 의해 리렌더링 사이에 유지됩니다. 하지만 state를 설정하면 컴포넌트가 리렌더링됩니다. ref를 변경하면 리렌더링되지 않습니다!

## 예제: 스톱워치 만들기 {/_example-building-a-stopwatch_/}

ref와 state를 하나의 컴포넌트에서 함께 사용할 수 있습니다. 예를 들어, 사용자가 버튼을 눌러 시작하거나 멈출 수 있는 스톱워치를 만들어 봅시다. 사용자가 "Start"를 누른 후 얼마나 시간이 지났는지 표시하려면, Start 버튼을 누른 시점과 현재 시간을 추적해야 합니다. **이 정보는 렌더링에 사용되므로 state에 보관합니다:**

```js
const [startTime, setStartTime] = useState(null)
const [now, setNow] = useState(null)
```

사용자가 "Start"를 누르면, [`setInterval`](https://developer.mozilla.org/docs/Web/API/setInterval)을 사용하여 10밀리초마다 시간을 업데이트합니다:

<Sandpack>

```js
import { useState } from 'react'

export default function Stopwatch() {
  const [startTime, setStartTime] = useState(null)
  const [now, setNow] = useState(null)

  function handleStart() {
    // 카운팅 시작
    setStartTime(Date.now())
    setNow(Date.now())

    setInterval(() => {
      // 10ms마다 현재 시간 업데이트
      setNow(Date.now())
    }, 10)
  }

  let secondsPassed = 0
  if (startTime != null && now != null) {
    secondsPassed = (now - startTime) / 1000
  }

  return (
    <>
      <h1>Time passed: {secondsPassed.toFixed(3)}</h1>
      <button onClick={handleStart}>Start</button>
    </>
  )
}
```

</Sandpack>

"Stop" 버튼을 누르면 `now` state 변수 업데이트를 멈추기 위해 기존 interval을 취소해야 합니다. [`clearInterval`](https://developer.mozilla.org/en-US/docs/Web/API/clearInterval)을 호출하면 되는데, 사용자가 Start를 눌렀을 때 `setInterval`이 반환한 interval ID가 필요합니다. interval ID를 어딘가에 보관해야 합니다. **interval ID는 렌더링에 사용되지 않으므로 ref에 보관할 수 있습니다:**

<Sandpack>

```js
import { useState, useRef } from 'react'

export default function Stopwatch() {
  const [startTime, setStartTime] = useState(null)
  const [now, setNow] = useState(null)
  const intervalRef = useRef(null)

  function handleStart() {
    setStartTime(Date.now())
    setNow(Date.now())

    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setNow(Date.now())
    }, 10)
  }

  function handleStop() {
    clearInterval(intervalRef.current)
  }

  let secondsPassed = 0
  if (startTime != null && now != null) {
    secondsPassed = (now - startTime) / 1000
  }

  return (
    <>
      <h1>Time passed: {secondsPassed.toFixed(3)}</h1>
      <button onClick={handleStart}>Start</button>
      <button onClick={handleStop}>Stop</button>
    </>
  )
}
```

</Sandpack>

어떤 정보가 렌더링에 사용된다면 state에 보관하세요. 어떤 정보가 이벤트 핸들러에서만 필요하고 변경해도 리렌더링이 필요하지 않다면, ref를 사용하는 것이 더 효율적일 수 있습니다.

## ref와 state의 차이점 {/_differences-between-refs-and-state_/}

ref가 state보다 덜 "엄격"하다고 느낄 수 있습니다. 예를 들어, state 설정 함수를 항상 사용하는 대신 직접 변경(mutate)할 수 있으니까요. 하지만 대부분의 경우 state를 사용하게 됩니다. ref는 자주 필요하지 않은 "탈출구(escape hatch)"입니다. state와 ref를 비교하면 다음과 같습니다:

| ref                                                                                      | state                                                                                                                 |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `useRef(initialValue)`는 `{ current: initialValue }`를 반환                              | `useState(initialValue)`는 state 변수의 현재 값과 setter 함수를 반환 (`[value, setValue]`)                            |
| 변경해도 리렌더링을 트리거하지 않음                                                      | 변경하면 리렌더링을 트리거함                                                                                          |
| 변경 가능(Mutable) — 렌더링 프로세스 외부에서 `current` 값을 수정하고 업데이트할 수 있음 | "불변(Immutable)" — state 변수를 수정하려면 반드시 state 설정 함수를 사용하여 리렌더링을 큐에 넣어야 함               |
| 렌더링 중에 `current` 값을 읽거나 쓰면 안 됨                                             | 언제든 state를 읽을 수 있음. 단, 각 렌더링은 변경되지 않는 자체적인 state [스냅샷](/learn/state-as-a-snapshot)을 가짐 |

다음은 state로 구현한 카운터 버튼입니다:

<Sandpack>

```js
import { useState } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)

  function handleClick() {
    setCount(count + 1)
  }

  return <button onClick={handleClick}>You clicked {count} times</button>
}
```

</Sandpack>

`count` 값이 화면에 표시되므로 state 값을 사용하는 것이 적절합니다. 카운터 값이 `setCount()`로 설정되면 React가 컴포넌트를 리렌더링하고 화면이 새 카운트를 반영하여 업데이트됩니다.

이것을 ref로 구현하려고 하면, React가 컴포넌트를 리렌더링하지 않으므로 카운트가 변경되는 것을 볼 수 없습니다! 이 버튼을 클릭해도 **텍스트가 업데이트되지 않는** 것을 확인해 보세요:

<Sandpack>

```js {expectedErrors: {'react-compiler': [13]}}
import { useRef } from 'react'

export default function Counter() {
  let countRef = useRef(0)

  function handleClick() {
    // 이것은 컴포넌트를 리렌더링하지 않습니다!
    countRef.current = countRef.current + 1
  }

  return <button onClick={handleClick}>You clicked {countRef.current} times</button>
}
```

</Sandpack>

이것이 렌더링 중에 `ref.current`를 읽으면 신뢰할 수 없는 코드가 되는 이유입니다. 렌더링에 필요한 값이라면 state를 사용하세요.

<DeepDive>

#### useRef는 내부적으로 어떻게 동작할까? {/_how-does-use-ref-work-inside_/}

`useState`와 `useRef` 모두 React가 제공하지만, 원칙적으로 `useRef`는 `useState` _위에_ 구현될 수 있습니다. React 내부에서 `useRef`가 다음과 같이 구현되어 있다고 상상할 수 있습니다:

```js
// React 내부
function useRef(initialValue) {
  const [ref, unused] = useState({ current: initialValue })
  return ref
}
```

첫 번째 렌더링에서 `useRef`는 `{ current: initialValue }`를 반환합니다. 이 객체는 React에 의해 저장되므로 다음 렌더링에서도 같은 객체가 반환됩니다. 이 예제에서 state setter가 사용되지 않는 것에 주목하세요. `useRef`는 항상 같은 객체를 반환해야 하므로 불필요합니다!

React는 실제로 충분히 자주 사용되기 때문에 `useRef`의 내장 버전을 제공합니다. 하지만 setter가 없는 일반적인 state 변수라고 생각할 수 있습니다. 객체지향 프로그래밍에 익숙하다면, ref가 인스턴스 필드를 떠올리게 할 수 있습니다. `this.something` 대신 `somethingRef.current`라고 쓴다는 점만 다릅니다.

</DeepDive>

## ref를 사용해야 할 때 {/_when-to-use-refs_/}

일반적으로 컴포넌트가 React "밖으로 나가서" 외부 API와 통신해야 할 때 ref를 사용합니다. 주로 컴포넌트의 외관에 영향을 주지 않는 브라우저 API를 다룰 때입니다. 다음은 이런 드문 상황의 몇 가지 예입니다:

- [timeout ID](https://developer.mozilla.org/docs/Web/API/setTimeout) 저장
- [DOM 요소](https://developer.mozilla.org/docs/Web/API/Element) 저장 및 조작 — [다음 페이지](/learn/manipulating-the-dom-with-refs)에서 다룹니다
- JSX를 계산하는 데 필요하지 않은 다른 객체 저장

컴포넌트가 어떤 값을 저장해야 하지만 렌더링 로직에 영향을 주지 않는다면, ref를 선택하세요.

## ref 사용 모범 사례 {/_best-practices-for-refs_/}

다음 원칙을 따르면 컴포넌트가 더 예측 가능해집니다:

- **ref를 탈출구(escape hatch)로 취급하세요.** ref는 외부 시스템이나 브라우저 API를 다룰 때 유용합니다. 애플리케이션 로직과 데이터 흐름의 상당 부분이 ref에 의존한다면, 접근 방식을 다시 생각해 보는 것이 좋습니다.
- **렌더링 중에 `ref.current`를 읽거나 쓰지 마세요.** 렌더링 중에 정보가 필요하다면 [state](/learn/state-a-components-memory)를 대신 사용하세요. `ref.current`가 언제 변경되는지 React가 모르기 때문에, 렌더링 중에 읽기만 해도 컴포넌트의 동작을 예측하기 어렵게 만듭니다. (유일한 예외는 첫 번째 렌더링에서만 ref를 설정하는 `if (!ref.current) ref.current = new Thing()` 같은 코드입니다.)

React state의 제한사항은 ref에 적용되지 않습니다. 예를 들어, state는 [매 렌더링의 스냅샷](/learn/state-as-a-snapshot)처럼 동작하며 [동기적으로 업데이트되지 않습니다.](/learn/queueing-a-series-of-state-updates) 하지만 ref의 현재 값을 변경하면 즉시 변경됩니다:

```js
ref.current = 5
console.log(ref.current) // 5
```

이는 **ref 자체가 일반 JavaScript 객체**이고, 그렇게 동작하기 때문입니다.

또한 ref를 다룰 때는 [변경을 피하는 것](/learn/updating-objects-in-state)에 대해 걱정할 필요가 없습니다. 변경하는 객체가 렌더링에 사용되지 않는 한, React는 ref나 그 내용에 대해 어떤 작업을 하든 신경 쓰지 않습니다.

## ref와 DOM {/_refs-and-the-dom_/}

ref는 어떤 값이든 가리킬 수 있습니다. 하지만 ref의 가장 일반적인 사용 사례는 DOM 요소에 접근하는 것입니다. 예를 들어, 프로그래밍 방식으로 input에 포커스를 맞추고 싶을 때 유용합니다. `<div ref={myRef}>`처럼 JSX의 `ref` 속성에 ref를 전달하면, React가 해당 DOM 요소를 `myRef.current`에 넣습니다. 요소가 DOM에서 제거되면 React가 `myRef.current`를 `null`로 업데이트합니다. 이에 대한 자세한 내용은 [ref로 DOM 조작하기](/learn/manipulating-the-dom-with-refs)에서 확인할 수 있습니다.

<Recap>

- ref는 렌더링에 사용되지 않는 값을 유지하기 위한 탈출구(escape hatch)입니다. 자주 필요하지는 않습니다.
- ref는 읽거나 설정할 수 있는 `current`라는 단일 프로퍼티를 가진 순수한 JavaScript 객체입니다.
- `useRef` Hook을 호출하여 React에 ref를 요청할 수 있습니다.
- state와 마찬가지로 ref는 컴포넌트의 리렌더링 사이에 정보를 유지할 수 있게 해줍니다.
- state와 달리 ref의 `current` 값을 설정해도 리렌더링을 트리거하지 않습니다.
- 렌더링 중에 `ref.current`를 읽거나 쓰지 마세요. 컴포넌트를 예측하기 어렵게 만듭니다.

</Recap>
