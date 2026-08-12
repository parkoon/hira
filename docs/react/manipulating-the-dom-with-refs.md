---
title: 'ref로 DOM 조작하기'
---

<Intro>

React는 렌더링 출력에 맞게 [DOM](https://developer.mozilla.org/docs/Web/API/Document_Object_Model/Introduction)을 자동으로 업데이트하므로, 컴포넌트가 직접 DOM을 조작할 일은 많지 않습니다. 하지만 때때로 React가 관리하는 DOM 요소에 접근해야 할 수 있습니다. 예를 들어, 노드에 포커스를 맞추거나, 스크롤하거나, 크기와 위치를 측정하는 경우입니다. React에는 이런 작업을 위한 내장 방법이 없으므로, DOM 노드에 대한 _ref_ 가 필요합니다.

</Intro>

<YouWillLearn>

- `ref` 속성으로 React가 관리하는 DOM 노드에 접근하는 방법
- `ref` JSX 속성이 `useRef` Hook과 어떤 관계인지
- 다른 컴포넌트의 DOM 노드에 접근하는 방법
- React가 관리하는 DOM을 수정해도 안전한 경우

</YouWillLearn>

## 노드에 대한 ref 가져오기 {/_getting-a-ref-to-the-node_/}

React가 관리하는 DOM 노드에 접근하려면, 먼저 `useRef` Hook을 import합니다:

```js
import { useRef } from 'react'
```

그런 다음 컴포넌트 안에서 ref를 선언합니다:

```js
const myRef = useRef(null)
```

마지막으로, DOM 노드를 가져오고 싶은 JSX 태그에 `ref` 속성으로 전달합니다:

```js
<div ref={myRef}>
```

`useRef` Hook은 `current`라는 단일 프로퍼티를 가진 객체를 반환합니다. 처음에 `myRef.current`는 `null`입니다. React가 이 `<div>`에 대한 DOM 노드를 생성하면, React는 이 노드에 대한 참조를 `myRef.current`에 넣습니다. 그러면 [이벤트 핸들러](/learn/responding-to-events)에서 이 DOM 노드에 접근하여 내장 [브라우저 API](https://developer.mozilla.org/docs/Web/API/Element)를 사용할 수 있습니다.

```js
// 어떤 브라우저 API든 사용할 수 있습니다. 예를 들어:
myRef.current.scrollIntoView()
```

### 예제: 텍스트 입력에 포커스 맞추기 {/_example-focusing-a-text-input_/}

이 예제에서 버튼을 클릭하면 input에 포커스가 맞춰집니다:

<Sandpack>

```js
import { useRef } from 'react'

export default function Form() {
  const inputRef = useRef(null)

  function handleClick() {
    inputRef.current.focus()
  }

  return (
    <>
      <input ref={inputRef} />
      <button onClick={handleClick}>Focus the input</button>
    </>
  )
}
```

</Sandpack>

구현 방법:

1. `useRef` Hook으로 `inputRef`를 선언합니다.
2. `<input ref={inputRef}>`로 전달합니다. 이렇게 하면 React에게 **이 `<input>`의 DOM 노드를 `inputRef.current`에 넣으라**고 지시합니다.
3. `handleClick` 함수에서 `inputRef.current`로 input DOM 노드를 읽고 `inputRef.current.focus()`로 [`focus()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus)를 호출합니다.
4. `handleClick` 이벤트 핸들러를 `<button>`의 `onClick`에 전달합니다.

DOM 조작이 ref의 가장 일반적인 사용 사례이지만, `useRef` Hook은 타이머 ID 같은 React 외부의 다른 것들을 저장하는 데도 사용할 수 있습니다. state와 마찬가지로 ref는 렌더링 사이에 유지됩니다. ref는 설정해도 리렌더링(re-render)을 트리거하지 않는 state 변수와 같습니다. ref에 대해 더 알아보려면 [ref로 값 참조하기](/learn/referencing-values-with-refs)를 읽어보세요.

### 예제: 요소로 스크롤하기 {/_example-scrolling-to-an-element_/}

하나의 컴포넌트에 여러 개의 ref를 가질 수 있습니다. 이 예제에는 세 개의 이미지로 구성된 캐러셀(carousel)이 있습니다. 각 버튼은 해당 DOM 노드에 대해 브라우저 [`scrollIntoView()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView) 메서드를 호출하여 이미지를 중앙에 위치시킵니다:

<Sandpack>

```js
import { useRef } from 'react'

export default function CatFriends() {
  const firstCatRef = useRef(null)
  const secondCatRef = useRef(null)
  const thirdCatRef = useRef(null)

  function handleScrollToFirstCat() {
    firstCatRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }

  function handleScrollToSecondCat() {
    secondCatRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }

  function handleScrollToThirdCat() {
    thirdCatRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }

  return (
    <>
      <nav>
        <button onClick={handleScrollToFirstCat}>Neo</button>
        <button onClick={handleScrollToSecondCat}>Millie</button>
        <button onClick={handleScrollToThirdCat}>Bella</button>
      </nav>
      <div>
        <ul>
          <li>
            <img
              src="https://placecats.com/neo/300/200"
              alt="Neo"
              ref={firstCatRef}
            />
          </li>
          <li>
            <img
              src="https://placecats.com/millie/200/200"
              alt="Millie"
              ref={secondCatRef}
            />
          </li>
          <li>
            <img
              src="https://placecats.com/bella/199/200"
              alt="Bella"
              ref={thirdCatRef}
            />
          </li>
        </ul>
      </div>
    </>
  )
}
```

```css
div {
  width: 100%;
  overflow: hidden;
}

nav {
  text-align: center;
}

button {
  margin: 0.25rem;
}

ul,
li {
  list-style: none;
  white-space: nowrap;
}

li {
  display: inline;
  padding: 0.5rem;
}
```

</Sandpack>

<DeepDive>

#### ref 콜백(callback)으로 ref 목록 관리하기 {/_how-to-manage-a-list-of-refs-using-a-ref-callback_/}

위 예제에서는 미리 정해진 수의 ref가 있었습니다. 하지만 때로는 목록의 각 항목에 ref가 필요하고, 몇 개가 될지 모르는 경우가 있습니다. 다음과 같은 코드는 **동작하지 않습니다**:

```js
<ul>
  {items.map((item) => {
    // 동작하지 않습니다!
    const ref = useRef(null)
    return <li ref={ref} />
  })}
</ul>
```

**Hook은 반드시 컴포넌트의 최상위 레벨에서만 호출해야 하기** 때문입니다. 반복문, 조건문, 또는 `map()` 호출 내부에서 `useRef`를 호출할 수 없습니다.

이를 해결하는 한 가지 방법은 부모 요소에 대한 단일 ref를 가져온 다음, [`querySelectorAll`](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelectorAll) 같은 DOM 조작 메서드를 사용하여 개별 자식 노드를 "찾는" 것입니다. 하지만 이 방법은 취약하며 DOM 구조가 변경되면 깨질 수 있습니다.

또 다른 해결책은 **`ref` 속성에 함수를 전달하는 것**입니다. 이를 [`ref` 콜백](/reference/react-dom/components/common#ref-callback)이라고 합니다. React는 ref를 설정할 때 DOM 노드와 함께 ref 콜백을 호출하고, 해제할 때는 콜백에서 반환된 정리(cleanup) 함수를 호출합니다. 이를 통해 자체 배열이나 [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)을 유지하고, 인덱스나 ID로 어떤 ref든 접근할 수 있습니다.

이 예제는 이 접근 방식을 사용하여 긴 목록에서 임의의 노드로 스크롤하는 방법을 보여줍니다:

<Sandpack>

```js
import { useRef, useState } from 'react'

export default function CatFriends() {
  const itemsRef = useRef(null)
  const [catList, setCatList] = useState(setupCatList)

  function scrollToCat(cat) {
    const map = getMap()
    const node = map.get(cat)
    node.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }

  function getMap() {
    if (!itemsRef.current) {
      // 첫 사용 시 Map을 초기화합니다.
      itemsRef.current = new Map()
    }
    return itemsRef.current
  }

  return (
    <>
      <nav>
        <button onClick={() => scrollToCat(catList[0])}>Neo</button>
        <button onClick={() => scrollToCat(catList[5])}>Millie</button>
        <button onClick={() => scrollToCat(catList[8])}>Bella</button>
      </nav>
      <div>
        <ul>
          {catList.map((cat) => (
            <li
              key={cat.id}
              ref={(node) => {
                const map = getMap()
                map.set(cat, node)

                return () => {
                  map.delete(cat)
                }
              }}
            >
              <img src={cat.imageUrl} />
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

function setupCatList() {
  const catCount = 10
  const catList = new Array(catCount)
  for (let i = 0; i < catCount; i++) {
    let imageUrl = ''
    if (i < 5) {
      imageUrl = 'https://placecats.com/neo/320/240'
    } else if (i < 8) {
      imageUrl = 'https://placecats.com/millie/320/240'
    } else {
      imageUrl = 'https://placecats.com/bella/320/240'
    }
    catList[i] = {
      id: i,
      imageUrl,
    }
  }
  return catList
}
```

```css
div {
  width: 100%;
  overflow: hidden;
}

nav {
  text-align: center;
}

button {
  margin: 0.25rem;
}

ul,
li {
  list-style: none;
  white-space: nowrap;
}

li {
  display: inline;
  padding: 0.5rem;
}
```

</Sandpack>

이 예제에서 `itemsRef`는 단일 DOM 노드를 보유하지 않습니다. 대신 항목 ID에서 DOM 노드로의 [Map](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Map)을 보유합니다. ([ref는 어떤 값이든 보유할 수 있습니다!](/learn/referencing-values-with-refs)) 모든 목록 항목의 [`ref` 콜백](/reference/react-dom/components/common#ref-callback)이 Map을 업데이트합니다:

```js
<li
  key={cat.id}
  ref={node => {
    const map = getMap();
    // Map에 추가
    map.set(cat, node);

    return () => {
      // Map에서 제거
      map.delete(cat);
    };
  }}
>
```

이렇게 하면 나중에 Map에서 개별 DOM 노드를 읽을 수 있습니다.

<Note>

Strict Mode가 활성화되어 있으면 개발 환경에서 ref 콜백이 두 번 실행됩니다.

콜백 ref에서 [이것이 버그를 찾는 데 어떻게 도움이 되는지](/reference/react/StrictMode#fixing-bugs-found-by-re-running-ref-callbacks-in-development) 자세히 읽어보세요.

</Note>

</DeepDive>

## 다른 컴포넌트의 DOM 노드에 접근하기 {/_accessing-another-components-dom-nodes_/}

<Pitfall>
ref는 탈출구(escape hatch)입니다. _다른_ 컴포넌트의 DOM 노드를 수동으로 조작하면 코드가 취약해질 수 있습니다.
</Pitfall>

부모 컴포넌트에서 자식 컴포넌트로 [다른 prop과 마찬가지로](/learn/passing-props-to-a-component) ref를 전달할 수 있습니다.

```js {3-4,9}
import { useRef } from 'react'

function MyInput({ ref }) {
  return <input ref={ref} />
}

function MyForm() {
  const inputRef = useRef(null)
  return <MyInput ref={inputRef} />
}
```

위 예제에서 부모 컴포넌트인 `MyForm`에서 ref가 생성되어 자식 컴포넌트인 `MyInput`으로 전달됩니다. `MyInput`은 이 ref를 `<input>`에 전달합니다. `<input>`은 [내장 컴포넌트](/reference/react-dom/components/common)이므로 React가 ref의 `.current` 프로퍼티를 `<input>` DOM 요소로 설정합니다.

`MyForm`에서 생성된 `inputRef`는 이제 `MyInput`이 반환하는 `<input>` DOM 요소를 가리킵니다. `MyForm`에서 생성된 클릭 핸들러는 `inputRef`에 접근하여 `focus()`를 호출하여 `<input>`에 포커스를 맞출 수 있습니다.

<Sandpack>

```js
import { useRef } from 'react'

function MyInput({ ref }) {
  return <input ref={ref} />
}

export default function MyForm() {
  const inputRef = useRef(null)

  function handleClick() {
    inputRef.current.focus()
  }

  return (
    <>
      <MyInput ref={inputRef} />
      <button onClick={handleClick}>Focus the input</button>
    </>
  )
}
```

</Sandpack>

<DeepDive>

#### 명령형 핸들(imperative handle)로 API의 일부만 노출하기 {/_exposing-a-subset-of-the-api-with-an-imperative-handle_/}

위 예제에서 `MyInput`에 전달된 ref는 원래 DOM input 요소로 전달됩니다. 이렇게 하면 부모 컴포넌트가 `focus()`를 호출할 수 있습니다. 하지만 이는 부모 컴포넌트가 다른 작업(예: CSS 스타일 변경)도 할 수 있게 합니다. 드문 경우에 노출되는 기능을 제한하고 싶을 수 있습니다. [`useImperativeHandle`](/reference/react/useImperativeHandle)을 사용하면 됩니다:

<Sandpack>

```js
import { useRef, useImperativeHandle } from 'react'

function MyInput({ ref }) {
  const realInputRef = useRef(null)
  useImperativeHandle(ref, () => ({
    // focus만 노출하고 다른 것은 노출하지 않습니다
    focus() {
      realInputRef.current.focus()
    },
  }))
  return <input ref={realInputRef} />
}

export default function Form() {
  const inputRef = useRef(null)

  function handleClick() {
    inputRef.current.focus()
  }

  return (
    <>
      <MyInput ref={inputRef} />
      <button onClick={handleClick}>Focus the input</button>
    </>
  )
}
```

</Sandpack>

여기서 `MyInput` 내부의 `realInputRef`는 실제 input DOM 노드를 보유합니다. 하지만 [`useImperativeHandle`](/reference/react/useImperativeHandle)은 React에게 부모 컴포넌트에 대한 ref의 값으로 여러분이 만든 특별한 객체를 제공하도록 지시합니다. 따라서 `Form` 컴포넌트 내부의 `inputRef.current`는 `focus` 메서드만 가지게 됩니다. 이 경우 ref "핸들(handle)"은 DOM 노드가 아니라 [`useImperativeHandle`](/reference/react/useImperativeHandle) 호출 내부에서 생성한 커스텀 객체입니다.

</DeepDive>

## React가 ref를 연결하는 시점 {/_when-react-attaches-the-refs_/}

React에서 모든 업데이트는 [두 단계](/learn/render-and-commit#step-3-react-commits-changes-to-the-dom)로 나뉩니다:

- **렌더링(render)** 단계에서 React는 컴포넌트를 호출하여 화면에 무엇이 표시되어야 하는지 파악합니다.
- **커밋(commit)** 단계에서 React는 변경 사항을 DOM에 적용합니다.

일반적으로 렌더링 중에는 ref에 접근하지 [않는 것이 좋습니다](/learn/referencing-values-with-refs#best-practices-for-refs). DOM 노드를 보유하는 ref도 마찬가지입니다. 첫 번째 렌더링에서는 DOM 노드가 아직 생성되지 않았으므로 `ref.current`는 `null`입니다. 업데이트 렌더링 중에는 DOM 노드가 아직 업데이트되지 않았습니다. 따라서 읽기에는 너무 이릅니다.

React는 커밋 중에 `ref.current`를 설정합니다. DOM을 업데이트하기 전에 React는 영향받는 `ref.current` 값을 `null`로 설정합니다. DOM을 업데이트한 후에는 즉시 해당 DOM 노드로 설정합니다.

**보통 이벤트 핸들러에서 ref에 접근합니다.** ref로 무언가를 하고 싶지만 적절한 이벤트가 없다면, Effect가 필요할 수 있습니다. 다음 페이지에서 Effect에 대해 다룹니다.

<DeepDive>

#### flushSync로 state 업데이트를 동기적으로 플러시(flush)하기 {/_flushing-state-updates-synchronously-with-flush-sync_/}

새로운 할 일을 추가하고 목록의 마지막 자식으로 화면을 스크롤하는 다음 코드를 생각해 보세요. 어떤 이유에서인지 항상 마지막으로 추가된 것 _바로 전_ 항목으로 스크롤됩니다:

<Sandpack>

```js
import { useState, useRef } from 'react'

export default function TodoList() {
  const listRef = useRef(null)
  const [text, setText] = useState('')
  const [todos, setTodos] = useState(initialTodos)

  function handleAdd() {
    const newTodo = { id: nextId++, text: text }
    setText('')
    setTodos([...todos, newTodo])
    listRef.current.lastChild.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    })
  }

  return (
    <>
      <button onClick={handleAdd}>Add</button>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <ul ref={listRef}>
        {todos.map((todo) => (
          <li key={todo.id}>{todo.text}</li>
        ))}
      </ul>
    </>
  )
}

let nextId = 0
let initialTodos = []
for (let i = 0; i < 20; i++) {
  initialTodos.push({
    id: nextId++,
    text: 'Todo #' + (i + 1),
  })
}
```

</Sandpack>

문제는 다음 두 줄에 있습니다:

```js
setTodos([...todos, newTodo])
listRef.current.lastChild.scrollIntoView()
```

React에서 [state 업데이트는 큐에 넣어집니다.](/learn/queueing-a-series-of-state-updates) 보통 이것이 원하는 동작입니다. 하지만 여기서는 `setTodos`가 DOM을 즉시 업데이트하지 않기 때문에 문제가 됩니다. 목록의 마지막 요소로 스크롤할 때 할 일이 아직 추가되지 않은 상태입니다. 이것이 스크롤이 항상 한 항목씩 "뒤처지는" 이유입니다.

이 문제를 해결하려면 React가 DOM을 동기적으로 업데이트("플러시(flush)")하도록 강제할 수 있습니다. `react-dom`에서 `flushSync`를 import하고 **state 업데이트를** `flushSync` 호출로 감싸면 됩니다:

```js
flushSync(() => {
  setTodos([...todos, newTodo])
})
listRef.current.lastChild.scrollIntoView()
```

이렇게 하면 `flushSync`로 감싼 코드가 실행된 직후에 React가 DOM을 동기적으로 업데이트합니다. 결과적으로 스크롤할 때 마지막 할 일이 이미 DOM에 있게 됩니다:

<Sandpack>

```js
import { useState, useRef } from 'react'
import { flushSync } from 'react-dom'

export default function TodoList() {
  const listRef = useRef(null)
  const [text, setText] = useState('')
  const [todos, setTodos] = useState(initialTodos)

  function handleAdd() {
    const newTodo = { id: nextId++, text: text }
    flushSync(() => {
      setText('')
      setTodos([...todos, newTodo])
    })
    listRef.current.lastChild.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    })
  }

  return (
    <>
      <button onClick={handleAdd}>Add</button>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <ul ref={listRef}>
        {todos.map((todo) => (
          <li key={todo.id}>{todo.text}</li>
        ))}
      </ul>
    </>
  )
}

let nextId = 0
let initialTodos = []
for (let i = 0; i < 20; i++) {
  initialTodos.push({
    id: nextId++,
    text: 'Todo #' + (i + 1),
  })
}
```

</Sandpack>

</DeepDive>

## ref를 사용한 DOM 조작 모범 사례 {/_best-practices-for-dom-manipulation-with-refs_/}

ref는 탈출구(escape hatch)입니다. "React 밖으로 나가야" 할 때만 사용해야 합니다. 일반적인 예로는 포커스 관리, 스크롤 위치, React가 노출하지 않는 브라우저 API 호출 등이 있습니다.

포커스나 스크롤 같은 비파괴적인 동작을 사용하면 문제가 없습니다. 하지만 DOM을 수동으로 **수정**하려고 하면 React가 만드는 변경 사항과 충돌할 위험이 있습니다.

이 문제를 설명하기 위해, 이 예제에는 환영 메시지와 두 개의 버튼이 있습니다. 첫 번째 버튼은 React에서 보통 하는 것처럼 [조건부 렌더링](/learn/conditional-rendering)과 [state](/learn/state-a-components-memory)를 사용하여 표시 여부를 토글합니다. 두 번째 버튼은 [`remove()` DOM API](https://developer.mozilla.org/en-US/docs/Web/API/Element/remove)를 사용하여 React의 제어 밖에서 강제로 DOM에서 제거합니다.

"Toggle with setState"를 몇 번 눌러보세요. 메시지가 사라졌다가 다시 나타납니다. 그런 다음 "Remove from the DOM"을 누르세요. 강제로 제거됩니다. 마지막으로 "Toggle with setState"를 누르면:

<Sandpack>

```js
import { useState, useRef } from 'react'

export default function Counter() {
  const [show, setShow] = useState(true)
  const ref = useRef(null)

  return (
    <div>
      <button
        onClick={() => {
          setShow(!show)
        }}
      >
        Toggle with setState
      </button>
      <button
        onClick={() => {
          ref.current.remove()
        }}
      >
        Remove from the DOM
      </button>
      {show && <p ref={ref}>Hello world</p>}
    </div>
  )
}
```

```css
p,
button {
  display: block;
  margin: 10px;
}
```

</Sandpack>

DOM 요소를 수동으로 제거한 후 `setState`로 다시 표시하려고 하면 크래시가 발생합니다. DOM을 변경했기 때문에 React가 올바르게 관리를 계속하는 방법을 모르기 때문입니다.

**React가 관리하는 DOM 노드를 변경하지 마세요.** React가 관리하는 요소의 자식을 수정, 추가, 제거하면 위와 같이 일관성 없는 시각적 결과나 크래시가 발생할 수 있습니다.

하지만 이것이 전혀 할 수 없다는 의미는 아닙니다. 주의가 필요합니다. **React가 업데이트할 _이유가 없는_ DOM 부분은 안전하게 수정할 수 있습니다.** 예를 들어, JSX에서 어떤 `<div>`가 항상 비어 있다면, React는 그 자식 목록을 건드릴 이유가 없습니다. 따라서 거기에 수동으로 요소를 추가하거나 제거하는 것은 안전합니다.

<Recap>

- ref는 일반적인 개념이지만, 대부분 DOM 요소를 보유하는 데 사용됩니다.
- `<div ref={myRef}>`를 전달하여 React에게 DOM 노드를 `myRef.current`에 넣으라고 지시합니다.
- 보통 포커스, 스크롤, DOM 요소 측정 같은 비파괴적인 동작에 ref를 사용합니다.
- 컴포넌트는 기본적으로 DOM 노드를 노출하지 않습니다. `ref` prop을 사용하여 DOM 노드 노출에 동의할 수 있습니다.
- React가 관리하는 DOM 노드를 변경하지 마세요.
- React가 관리하는 DOM 노드를 수정해야 한다면, React가 업데이트할 이유가 없는 부분을 수정하세요.

</Recap>
