---
title: 'Effect 의존성 제거하기'
---

<Intro>

Effect를 작성할 때, 린터(linter)는 Effect가 읽는 모든 반응형 값(props와 state 등)이 Effect의 의존성 목록에 포함되어 있는지 확인합니다. 이를 통해 Effect가 컴포넌트의 최신 props와 state에 동기화된 상태를 유지합니다. 불필요한 의존성은 Effect가 너무 자주 실행되거나 무한 루프를 만들 수 있습니다. 이 가이드를 따라 Effect에서 불필요한 의존성을 검토하고 제거하세요.

</Intro>

<YouWillLearn>

- 무한 Effect 의존성 루프를 수정하는 방법
- 의존성을 제거하고 싶을 때 어떻게 해야 하는지
- Effect에서 값을 "반응"하지 않고 읽는 방법
- 객체와 함수 의존성을 피하는 방법과 이유
- 의존성 린터를 억제하는 것이 위험한 이유와 대안

</YouWillLearn>

## 의존성은 코드와 일치해야 합니다 {/_dependencies-should-match-the-code_/}

Effect를 작성할 때, 먼저 Effect가 수행할 작업을 [시작하고 중지](/learn/lifecycle-of-reactive-effects#the-lifecycle-of-an-effect)하는 방법을 지정합니다:

```js {5-7}
const serverUrl = 'https://localhost:1234';

function ChatRoom({ roomId }) {
  useEffect(() => {
    const connection = createConnection(serverUrl, roomId);
    connection.connect();
    return () => connection.disconnect();
  	// ...
}
```

그런 다음 Effect 의존성을 비워두면(`[]`), 린터가 올바른 의존성을 제안합니다:

<Sandpack>

```js
import { useState, useEffect } from 'react'
import { createConnection } from './chat.js'

const serverUrl = 'https://localhost:1234'

function ChatRoom({ roomId }) {
  useEffect(() => {
    const connection = createConnection(serverUrl, roomId)
    connection.connect()
    return () => connection.disconnect()
  }, []) // <-- 여기의 실수를 고치세요!
  return <h1>Welcome to the {roomId} room!</h1>
}

export default function App() {
  const [roomId, setRoomId] = useState('general')
  return (
    <>
      <label>
        Choose the chat room:{' '}
        <select
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        >
          <option value="general">general</option>
          <option value="travel">travel</option>
          <option value="music">music</option>
        </select>
      </label>
      <hr />
      <ChatRoom roomId={roomId} />
    </>
  )
}
```

```js src/chat.js
export function createConnection(serverUrl, roomId) {
  // 실제 구현은 서버에 실제로 연결할 것입니다
  return {
    connect() {
      console.log('✅ Connecting to "' + roomId + '" room at ' + serverUrl + '...')
    },
    disconnect() {
      console.log('❌ Disconnected from "' + roomId + '" room at ' + serverUrl)
    },
  }
}
```

```css
input {
  display: block;
  margin-bottom: 20px;
}
button {
  margin-left: 10px;
}
```

</Sandpack>

린터가 말하는 대로 채우세요:

```js {6}
function ChatRoom({ roomId }) {
  useEffect(() => {
    const connection = createConnection(serverUrl, roomId)
    connection.connect()
    return () => connection.disconnect()
  }, [roomId]) // ✅ 모든 의존성이 선언됨
  // ...
}
```

[Effect는 반응형 값에 "반응"합니다.](/learn/lifecycle-of-reactive-effects#effects-react-to-reactive-values) `roomId`는 반응형 값이므로(리렌더링으로 인해 변경될 수 있음), 린터가 의존성으로 지정했는지 확인합니다. `roomId`가 다른 값을 받으면 React가 Effect를 재동기화합니다. 이를 통해 채팅이 선택된 방에 연결된 상태를 유지하고 드롭다운에 "반응"합니다:

<Sandpack>

```js
import { useState, useEffect } from 'react'
import { createConnection } from './chat.js'

const serverUrl = 'https://localhost:1234'

function ChatRoom({ roomId }) {
  useEffect(() => {
    const connection = createConnection(serverUrl, roomId)
    connection.connect()
    return () => connection.disconnect()
  }, [roomId])
  return <h1>Welcome to the {roomId} room!</h1>
}

export default function App() {
  const [roomId, setRoomId] = useState('general')
  return (
    <>
      <label>
        Choose the chat room:{' '}
        <select
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        >
          <option value="general">general</option>
          <option value="travel">travel</option>
          <option value="music">music</option>
        </select>
      </label>
      <hr />
      <ChatRoom roomId={roomId} />
    </>
  )
}
```

```js src/chat.js
export function createConnection(serverUrl, roomId) {
  // 실제 구현은 서버에 실제로 연결할 것입니다
  return {
    connect() {
      console.log('✅ Connecting to "' + roomId + '" room at ' + serverUrl + '...')
    },
    disconnect() {
      console.log('❌ Disconnected from "' + roomId + '" room at ' + serverUrl)
    },
  }
}
```

```css
input {
  display: block;
  margin-bottom: 20px;
}
button {
  margin-left: 10px;
}
```

</Sandpack>

### 의존성을 제거하려면, 의존성이 아님을 증명하세요 {/_to-remove-a-dependency-prove-that-its-not-a-dependency_/}

Effect의 의존성을 "선택"할 수 없다는 점에 주목하세요. Effect의 코드에서 사용하는 모든 <CodeStep step={2}>반응형 값</CodeStep>은 의존성 목록에 선언해야 합니다. 의존성 목록은 주변 코드에 의해 결정됩니다:

```js [[2, 3, "roomId"], [2, 5, "roomId"], [2, 8, "roomId"]]
const serverUrl = 'https://localhost:1234'

function ChatRoom({ roomId }) {
  // 이것은 반응형 값입니다
  useEffect(() => {
    const connection = createConnection(serverUrl, roomId) // 이 Effect는 해당 반응형 값을 읽습니다
    connection.connect()
    return () => connection.disconnect()
  }, [roomId]) // ✅ 따라서 해당 반응형 값을 Effect의 의존성으로 지정해야 합니다
  // ...
}
```

[반응형 값](/learn/lifecycle-of-reactive-effects#all-variables-declared-in-the-component-body-are-reactive)에는 props와 컴포넌트 안에서 직접 선언된 모든 변수와 함수가 포함됩니다. `roomId`는 반응형 값이므로 의존성 목록에서 제거할 수 없습니다. 린터가 허용하지 않습니다:

```js {8}
const serverUrl = 'https://localhost:1234'

function ChatRoom({ roomId }) {
  useEffect(() => {
    const connection = createConnection(serverUrl, roomId)
    connection.connect()
    return () => connection.disconnect()
  }, []) // 🔴 React Hook useEffect has a missing dependency: 'roomId'
  // ...
}
```

린터가 맞습니다! `roomId`는 시간이 지남에 따라 변경될 수 있으므로, 이것은 코드에 버그를 만듭니다.

**의존성을 제거하려면, 린터에게 의존성이 *될 필요가 없다*는 것을 "증명"하세요.** 예를 들어, `roomId`를 컴포넌트 밖으로 이동하여 반응형이 아니고 리렌더링 시 변경되지 않는다는 것을 증명할 수 있습니다:

```js {2,9}
const serverUrl = 'https://localhost:1234'
const roomId = 'music' // 더 이상 반응형 값이 아닙니다

function ChatRoom() {
  useEffect(() => {
    const connection = createConnection(serverUrl, roomId)
    connection.connect()
    return () => connection.disconnect()
  }, []) // ✅ 모든 의존성이 선언됨
  // ...
}
```

이제 `roomId`가 반응형 값이 아니고(리렌더링 시 변경될 수 없으므로) 의존성이 될 필요가 없습니다:

<Sandpack>

```js
import { useState, useEffect } from 'react'
import { createConnection } from './chat.js'

const serverUrl = 'https://localhost:1234'
const roomId = 'music'

export default function ChatRoom() {
  useEffect(() => {
    const connection = createConnection(serverUrl, roomId)
    connection.connect()
    return () => connection.disconnect()
  }, [])
  return <h1>Welcome to the {roomId} room!</h1>
}
```

```js src/chat.js
export function createConnection(serverUrl, roomId) {
  // 실제 구현은 서버에 실제로 연결할 것입니다
  return {
    connect() {
      console.log('✅ Connecting to "' + roomId + '" room at ' + serverUrl + '...')
    },
    disconnect() {
      console.log('❌ Disconnected from "' + roomId + '" room at ' + serverUrl)
    },
  }
}
```

```css
input {
  display: block;
  margin-bottom: 20px;
}
button {
  margin-left: 10px;
}
```

</Sandpack>

이제 [빈(`[]`) 의존성 목록](/learn/lifecycle-of-reactive-effects#what-an-effect-with-empty-dependencies-means)을 지정할 수 있습니다. Effect가 더 이상 어떤 반응형 값에도 의존하지 _않으므로_, 컴포넌트의 props나 state가 변경되어도 다시 실행될 필요가 _정말_ 없습니다.

### 의존성을 변경하려면, 코드를 변경하세요 {/_to-change-the-dependencies-change-the-code_/}

작업 흐름에서 다음과 같은 패턴을 발견했을 수 있습니다:

1. 먼저 Effect의 코드나 반응형 값의 선언 방식을 **변경합니다.**
2. 그런 다음 린터를 따라 **변경한 코드에 맞게** 의존성을 조정합니다.
3. 의존성 목록이 마음에 들지 않으면, **첫 번째 단계로 돌아갑니다** (그리고 코드를 다시 변경합니다).

마지막 부분이 중요합니다. **의존성을 변경하고 싶다면, 먼저 주변 코드를 변경하세요.** 의존성 목록을 [Effect 코드에서 사용하는 모든 반응형 값의 목록](/learn/lifecycle-of-reactive-effects#react-verifies-that-you-specified-every-reactive-value-as-a-dependency)이라고 생각할 수 있습니다. 목록에 무엇을 넣을지 *선택*하는 것이 아닙니다. 목록이 코드를 *설명*합니다. 의존성 목록을 변경하려면 코드를 변경하세요.

이것은 방정식을 푸는 것과 비슷할 수 있습니다. 목표(예: 의존성 제거)에서 시작하고, 그 목표에 맞는 코드를 "찾아야" 합니다. 방정식 풀기를 모든 사람이 재미있어 하지는 않으며, Effect 작성도 마찬가지입니다! 다행히 아래에 시도할 수 있는 일반적인 레시피 목록이 있습니다.

<Pitfall>

기존 코드베이스에 다음과 같이 린터를 억제하는 Effect가 있을 수 있습니다:

```js {3-4}
useEffect(() => {
  // ...
  // 🔴 이렇게 린터를 억제하지 마세요:
  // eslint-ignore-next-line react-hooks/exhaustive-deps
}, [])
```

**의존성이 코드와 일치하지 않으면 버그가 발생할 위험이 매우 높습니다.** 린터를 억제하면, Effect가 의존하는 값에 대해 React에 "거짓말"을 하는 것입니다.

대신, 아래의 기법들을 사용하세요.

</Pitfall>

<DeepDive>

#### 의존성 린터를 억제하는 것이 왜 위험한가요? {/_why-is-suppressing-the-dependency-linter-so-dangerous_/}

린터를 억제하면 찾고 수정하기 어려운 매우 직관적이지 않은 버그가 발생합니다. 예를 들어:

<Sandpack>

```js {expectedErrors: {'react-compiler': [14]}}
import { useState, useEffect } from 'react'

export default function Timer() {
  const [count, setCount] = useState(0)
  const [increment, setIncrement] = useState(1)

  function onTick() {
    setCount(count + increment)
  }

  useEffect(() => {
    const id = setInterval(onTick, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <h1>
        Counter: {count}
        <button onClick={() => setCount(0)}>Reset</button>
      </h1>
      <hr />
      <p>
        Every second, increment by:
        <button
          disabled={increment === 0}
          onClick={() => {
            setIncrement((i) => i - 1)
          }}
        >
          –
        </button>
        <b>{increment}</b>
        <button
          onClick={() => {
            setIncrement((i) => i + 1)
          }}
        >
          +
        </button>
      </p>
    </>
  )
}
```

```css
button {
  margin: 10px;
}
```

</Sandpack>

Effect를 "마운트 시에만" 실행하고 싶었다고 합시다. [빈(`[]`) 의존성](/learn/lifecycle-of-reactive-effects#what-an-effect-with-empty-dependencies-means)이 그렇게 한다고 읽었으므로, 린터를 무시하고 강제로 `[]`를 의존성으로 지정했습니다.

이 카운터는 두 버튼으로 구성할 수 있는 양만큼 매초 증가해야 했습니다. 하지만 이 Effect가 아무것에도 의존하지 않는다고 React에 "거짓말"했으므로, React는 영원히 초기 렌더링의 `onTick` 함수를 사용합니다. [그 렌더링에서](/learn/state-as-a-snapshot#rendering-takes-a-snapshot-in-time) `count`는 `0`이고 `increment`는 `1`이었습니다. 그래서 그 렌더링의 `onTick`은 항상 매초 `setCount(0 + 1)`을 호출하고, 항상 `1`만 보입니다. 이런 버그는 여러 컴포넌트에 퍼져 있을 때 수정하기가 더 어렵습니다.

린터를 무시하는 것보다 항상 더 나은 해결책이 있습니다! 이 코드를 수정하려면 `onTick`을 의존성 목록에 추가해야 합니다. (interval이 한 번만 설정되도록 하려면 [`onTick`을 Effect Event로 만드세요.](/learn/separating-events-from-effects#reading-latest-props-and-state-with-effect-events))

**의존성 린트 에러를 컴파일 에러로 취급하는 것을 권장합니다. 억제하지 않으면, 이런 버그를 절대 보지 않을 것입니다.** 이 페이지의 나머지는 이 경우와 다른 경우에 대한 대안을 문서화합니다.

</DeepDive>

## 불필요한 의존성 제거하기 {/_removing-unnecessary-dependencies_/}

코드를 반영하여 Effect의 의존성을 조정할 때마다, 의존성 목록을 살펴보세요. 이 의존성 중 하나가 변경될 때 Effect가 다시 실행되는 것이 합리적인가요? 때로는 답이 "아니오"입니다:

- 다른 조건에서 Effect의 *다른 부분*을 다시 실행하고 싶을 수 있습니다.
- 일부 의존성의 변경에 "반응"하지 않고 *최신 값*만 읽고 싶을 수 있습니다.
- 객체나 함수이기 때문에 의존성이 _의도치 않게_ 너무 자주 변경될 수 있습니다.

올바른 해결책을 찾으려면, Effect에 대한 몇 가지 질문에 답해야 합니다. 하나씩 살펴보겠습니다.

### 이 코드를 이벤트 핸들러로 옮겨야 하나요? {/_should-this-code-move-to-an-event-handler_/}

가장 먼저 생각해야 할 것은 이 코드가 Effect여야 하는지 여부입니다.

폼을 상상해 보세요. 제출 시 `submitted` state 변수를 `true`로 설정합니다. POST 요청을 보내고 알림을 표시해야 합니다. 이 로직을 `submitted`가 `true`인 것에 "반응"하는 Effect 안에 넣었습니다:

```js {6-8}
function Form() {
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (submitted) {
      // 🔴 피하세요: Effect 안에 이벤트 특정 로직
      post('/api/register')
      showNotification('Successfully registered!')
    }
  }, [submitted])

  function handleSubmit() {
    setSubmitted(true)
  }

  // ...
}
```

나중에 현재 테마에 따라 알림 메시지를 스타일링하고 싶어서 현재 테마를 읽습니다. `theme`가 컴포넌트 본문에 선언되어 있으므로 반응형 값이고, 의존성으로 추가합니다:

```js {3,9,11}
function Form() {
  const [submitted, setSubmitted] = useState(false)
  const theme = useContext(ThemeContext)

  useEffect(() => {
    if (submitted) {
      // 🔴 피하세요: Effect 안에 이벤트 특정 로직
      post('/api/register')
      showNotification('Successfully registered!', theme)
    }
  }, [submitted, theme]) // ✅ 모든 의존성이 선언됨

  function handleSubmit() {
    setSubmitted(true)
  }

  // ...
}
```

이렇게 하면 버그가 발생합니다. 폼을 먼저 제출한 다음 다크와 라이트 테마를 전환한다고 상상해 보세요. `theme`가 변경되고 Effect가 다시 실행되어 같은 알림이 다시 표시됩니다!

**여기서 문제는 이것이 애초에 Effect가 아니어야 한다는 것입니다.** 특정 상호작용인 *폼 제출*에 대한 응답으로 이 POST 요청을 보내고 알림을 표시하고 싶습니다. 특정 상호작용에 대한 응답으로 코드를 실행하려면, 해당 로직을 이벤트 핸들러에 직접 넣으세요:

```js {6-7}
function Form() {
  const theme = useContext(ThemeContext)

  function handleSubmit() {
    // ✅ 좋습니다: 이벤트 특정 로직은 이벤트 핸들러에서 호출
    post('/api/register')
    showNotification('Successfully registered!', theme)
  }

  // ...
}
```

이제 코드가 이벤트 핸들러에 있으므로 반응형이 아닙니다. 사용자가 폼을 제출할 때만 실행됩니다. [이벤트 핸들러와 Effect 간의 선택](/learn/separating-events-from-effects#reactive-values-and-reactive-logic)과 [불필요한 Effect를 삭제하는 방법](/learn/you-might-not-need-an-effect)에 대해 더 읽어보세요.

### Effect가 관련 없는 여러 가지를 수행하고 있나요? {/_is-your-effect-doing-several-unrelated-things_/}

다음으로 스스로에게 물어봐야 할 질문은 Effect가 관련 없는 여러 가지를 수행하고 있는지입니다.

사용자가 도시와 지역을 선택해야 하는 배송 폼을 만들고 있다고 상상해 보세요. 선택된 `country`에 따라 서버에서 `cities` 목록을 가져와 드롭다운에 표시합니다:

```js
function ShippingForm({ country }) {
  const [cities, setCities] = useState(null);
  const [city, setCity] = useState(null);

  useEffect(() => {
    let ignore = false;
    fetch(`/api/cities?country=${country}`)
      .then(response => response.json())
      .then(json => {
        if (!ignore) {
          setCities(json);
        }
      });
    return () => {
      ignore = true;
    };
  }, [country]); // ✅ 모든 의존성이 선언됨

  // ...
```

[Effect에서 데이터를 가져오는](/learn/you-might-not-need-an-effect#fetching-data) 좋은 예입니다. `country` prop에 따라 `cities` state를 네트워크와 동기화하고 있습니다. `ShippingForm`이 표시되자마자 그리고 `country`가 변경될 때마다(어떤 상호작용이 원인이든) 가져와야 하므로 이벤트 핸들러에서는 할 수 없습니다.

이제 현재 선택된 `city`에 대한 `areas`를 가져오는 두 번째 셀렉트 박스를 추가한다고 합시다. 같은 Effect 안에 지역 목록에 대한 두 번째 `fetch` 호출을 추가하는 것으로 시작할 수 있습니다:

```js {15-24,28}
function ShippingForm({ country }) {
  const [cities, setCities] = useState(null);
  const [city, setCity] = useState(null);
  const [areas, setAreas] = useState(null);

  useEffect(() => {
    let ignore = false;
    fetch(`/api/cities?country=${country}`)
      .then(response => response.json())
      .then(json => {
        if (!ignore) {
          setCities(json);
        }
      });
    // 🔴 피하세요: 하나의 Effect가 두 개의 독립적인 프로세스를 동기화
    if (city) {
      fetch(`/api/areas?city=${city}`)
        .then(response => response.json())
        .then(json => {
          if (!ignore) {
            setAreas(json);
          }
        });
    }
    return () => {
      ignore = true;
    };
  }, [country, city]); // ✅ 모든 의존성이 선언됨

  // ...
```

하지만 Effect가 이제 `city` state 변수를 사용하므로, 의존성 목록에 `city`를 추가해야 했습니다. 이로 인해 문제가 발생합니다: 사용자가 다른 도시를 선택하면 Effect가 다시 실행되어 `fetchCities(country)`를 호출합니다. 결과적으로 도시 목록을 불필요하게 여러 번 다시 가져옵니다.

**이 코드의 문제는 관련 없는 두 가지를 동기화하고 있다는 것입니다:**

1. `country` prop을 기반으로 `cities` state를 네트워크와 동기화하고 싶습니다.
1. `city` state를 기반으로 `areas` state를 네트워크와 동기화하고 싶습니다.

로직을 두 개의 Effect로 분리하고, 각각이 동기화해야 하는 prop에 반응하게 하세요:

```js {19-33}
function ShippingForm({ country }) {
  const [cities, setCities] = useState(null);
  useEffect(() => {
    let ignore = false;
    fetch(`/api/cities?country=${country}`)
      .then(response => response.json())
      .then(json => {
        if (!ignore) {
          setCities(json);
        }
      });
    return () => {
      ignore = true;
    };
  }, [country]); // ✅ 모든 의존성이 선언됨

  const [city, setCity] = useState(null);
  const [areas, setAreas] = useState(null);
  useEffect(() => {
    if (city) {
      let ignore = false;
      fetch(`/api/areas?city=${city}`)
        .then(response => response.json())
        .then(json => {
          if (!ignore) {
            setAreas(json);
          }
        });
      return () => {
        ignore = true;
      };
    }
  }, [city]); // ✅ 모든 의존성이 선언됨

  // ...
```

이제 첫 번째 Effect는 `country`가 변경될 때만 다시 실행되고, 두 번째 Effect는 `city`가 변경될 때 다시 실행됩니다. 목적별로 분리했습니다: 두 개의 서로 다른 것이 두 개의 별도 Effect에 의해 동기화됩니다. 두 개의 별도 Effect는 두 개의 별도 의존성 목록을 가지므로 서로를 의도치 않게 트리거하지 않습니다.

최종 코드는 원본보다 길지만, 이 Effect들을 분리하는 것이 여전히 올바릅니다. [각 Effect는 독립적인 동기화 프로세스를 나타내야 합니다.](/learn/lifecycle-of-reactive-effects#each-effect-represents-a-separate-synchronization-process) 이 예제에서 하나의 Effect를 삭제해도 다른 Effect의 로직이 깨지지 않습니다. 이것은 *서로 다른 것을 동기화*하고 있으며 분리하는 것이 좋다는 의미입니다. 중복이 걱정된다면, [반복되는 로직을 커스텀 Hook으로 추출](/learn/reusing-logic-with-custom-hooks#when-to-use-custom-hooks)하여 이 코드를 개선할 수 있습니다.

### 다음 state를 계산하기 위해 state를 읽고 있나요? {/_are-you-reading-some-state-to-calculate-the-next-state_/}

이 Effect는 새 메시지가 도착할 때마다 새로 생성된 배열로 `messages` state 변수를 업데이트합니다:

```js {2,6-8}
function ChatRoom({ roomId }) {
  const [messages, setMessages] = useState([]);
  useEffect(() => {
    const connection = createConnection();
    connection.connect();
    connection.on('message', (receivedMessage) => {
      setMessages([...messages, receivedMessage]);
    });
    // ...
```

기존의 모든 메시지에서 시작하는 [새 배열을 생성](/learn/updating-arrays-in-state)하고 새 메시지를 끝에 추가하기 위해 `messages` 변수를 사용합니다. 하지만 `messages`는 Effect가 읽는 반응형 값이므로 의존성이어야 합니다:

```js {7,10}
function ChatRoom({ roomId }) {
  const [messages, setMessages] = useState([]);
  useEffect(() => {
    const connection = createConnection();
    connection.connect();
    connection.on('message', (receivedMessage) => {
      setMessages([...messages, receivedMessage]);
    });
    return () => connection.disconnect();
  }, [roomId, messages]); // ✅ 모든 의존성이 선언됨
  // ...
```

`messages`를 의존성으로 만들면 문제가 생깁니다.

메시지를 받을 때마다, `setMessages()`가 수신된 메시지를 포함하는 새 `messages` 배열로 컴포넌트를 리렌더링합니다. 하지만 이 Effect가 이제 `messages`에 의존하므로 Effect도 *재동기화*됩니다. 따라서 새 메시지마다 채팅이 다시 연결됩니다. 사용자가 좋아하지 않을 것입니다!

이 문제를 해결하려면 Effect 안에서 `messages`를 읽지 마세요. 대신, `setMessages`에 [업데이터 함수(updater function)](/reference/react/useState#updating-state-based-on-the-previous-state)를 전달하세요:

```js {7,10}
function ChatRoom({ roomId }) {
  const [messages, setMessages] = useState([]);
  useEffect(() => {
    const connection = createConnection();
    connection.connect();
    connection.on('message', (receivedMessage) => {
      setMessages(msgs => [...msgs, receivedMessage]);
    });
    return () => connection.disconnect();
  }, [roomId]); // ✅ 모든 의존성이 선언됨
  // ...
```

**이제 Effect가 `messages` 변수를 전혀 읽지 않는 것에 주목하세요.** `msgs => [...msgs, receivedMessage]` 같은 업데이터 함수만 전달하면 됩니다. React는 [업데이터 함수를 큐에 넣고](/learn/queueing-a-series-of-state-updates) 다음 렌더링 중에 `msgs` 인자를 제공합니다. 이것이 Effect 자체가 더 이상 `messages`에 의존할 필요가 없는 이유입니다. 이 수정의 결과로, 채팅 메시지를 받아도 더 이상 채팅이 다시 연결되지 않습니다.

### 변경에 "반응"하지 않고 값을 읽고 싶나요? {/_do-you-want-to-read-a-value-without-reacting-to-its-changes_/}

`isMuted`가 `true`가 아닌 한 사용자가 새 메시지를 받을 때 소리를 재생하고 싶다고 합시다:

```js {3,10-12}
function ChatRoom({ roomId }) {
  const [messages, setMessages] = useState([]);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const connection = createConnection();
    connection.connect();
    connection.on('message', (receivedMessage) => {
      setMessages(msgs => [...msgs, receivedMessage]);
      if (!isMuted) {
        playSound();
      }
    });
    // ...
```

Effect가 이제 코드에서 `isMuted`를 사용하므로 의존성에 추가해야 합니다:

```js {10,15}
function ChatRoom({ roomId }) {
  const [messages, setMessages] = useState([]);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const connection = createConnection();
    connection.connect();
    connection.on('message', (receivedMessage) => {
      setMessages(msgs => [...msgs, receivedMessage]);
      if (!isMuted) {
        playSound();
      }
    });
    return () => connection.disconnect();
  }, [roomId, isMuted]); // ✅ 모든 의존성이 선언됨
  // ...
```

문제는 `isMuted`가 변경될 때마다(예: 사용자가 "Muted" 토글을 누를 때) Effect가 재동기화되어 채팅에 다시 연결된다는 것입니다. 이것은 원하는 사용자 경험이 아닙니다! (이 예제에서는 린터를 비활성화해도 작동하지 않습니다. 그렇게 하면 `isMuted`가 이전 값에 "고정"됩니다.)

이 문제를 해결하려면 반응형이어서는 안 되는 로직을 Effect에서 추출해야 합니다. 이 Effect가 `isMuted`의 변경에 "반응"하기를 원하지 않습니다. [이 비반응형 로직 조각을 Effect Event로 옮기세요:](/learn/separating-events-from-effects#declaring-an-effect-event)

```js {1,7-12,18,21}
import { useState, useEffect, useEffectEvent } from 'react';

function ChatRoom({ roomId }) {
  const [messages, setMessages] = useState([]);
  const [isMuted, setIsMuted] = useState(false);

  const onMessage = useEffectEvent(receivedMessage => {
    setMessages(msgs => [...msgs, receivedMessage]);
    if (!isMuted) {
      playSound();
    }
  });

  useEffect(() => {
    const connection = createConnection();
    connection.connect();
    connection.on('message', (receivedMessage) => {
      onMessage(receivedMessage);
    });
    return () => connection.disconnect();
  }, [roomId]); // ✅ 모든 의존성이 선언됨
  // ...
```

Effect Event를 사용하면 Effect를 반응형 부분(`roomId` 같은 반응형 값과 그 변경에 "반응"해야 하는 부분)과 비반응형 부분(`onMessage`가 `isMuted`를 읽는 것처럼 최신 값만 읽는 부분)으로 나눌 수 있습니다. **이제 Effect Event 안에서 `isMuted`를 읽으므로 Effect의 의존성이 될 필요가 없습니다.** 결과적으로 "Muted" 설정을 켜고 끌 때 채팅이 다시 연결되지 않아, 원래 문제가 해결됩니다!

#### props에서 받은 이벤트 핸들러 감싸기 {/_wrapping-an-event-handler-from-the-props_/}

컴포넌트가 이벤트 핸들러를 prop으로 받을 때 비슷한 문제에 부딪힐 수 있습니다:

```js {1,8,11}
function ChatRoom({ roomId, onReceiveMessage }) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const connection = createConnection();
    connection.connect();
    connection.on('message', (receivedMessage) => {
      onReceiveMessage(receivedMessage);
    });
    return () => connection.disconnect();
  }, [roomId, onReceiveMessage]); // ✅ 모든 의존성이 선언됨
  // ...
```

부모 컴포넌트가 매 렌더링마다 _다른_ `onReceiveMessage` 함수를 전달한다고 합시다:

```js {3-5}
<ChatRoom
  roomId={roomId}
  onReceiveMessage={(receivedMessage) => {
    // ...
  }}
/>
```

`onReceiveMessage`가 의존성이므로, 부모가 리렌더링될 때마다 Effect가 재동기화됩니다. 이로 인해 채팅에 다시 연결됩니다. 이를 해결하려면 호출을 Effect Event로 감싸세요:

```js {4-6,12,15}
function ChatRoom({ roomId, onReceiveMessage }) {
  const [messages, setMessages] = useState([]);

  const onMessage = useEffectEvent(receivedMessage => {
    onReceiveMessage(receivedMessage);
  });

  useEffect(() => {
    const connection = createConnection();
    connection.connect();
    connection.on('message', (receivedMessage) => {
      onMessage(receivedMessage);
    });
    return () => connection.disconnect();
  }, [roomId]); // ✅ 모든 의존성이 선언됨
  // ...
```

Effect Event는 반응형이 아니므로 의존성으로 지정할 필요가 없습니다. 결과적으로 부모 컴포넌트가 매 리렌더링마다 다른 함수를 전달하더라도 채팅이 더 이상 다시 연결되지 않습니다.

#### 반응형 코드와 비반응형 코드 분리하기 {/_separating-reactive-and-non-reactive-code_/}

이 예제에서 `roomId`가 변경될 때마다 방문을 기록하고 싶습니다. 모든 로그에 현재 `notificationCount`를 포함하고 싶지만, `notificationCount`의 변경이 로그 이벤트를 트리거하는 것은 원하지 _않습니다_.

해결책은 역시 비반응형 코드를 Effect Event로 분리하는 것입니다:

```js {2-4,7}
function Chat({ roomId, notificationCount }) {
  const onVisit = useEffectEvent((visitedRoomId) => {
    logVisit(visitedRoomId, notificationCount)
  })

  useEffect(() => {
    onVisit(roomId)
  }, [roomId]) // ✅ 모든 의존성이 선언됨
  // ...
}
```

`roomId`에 대해 로직이 반응형이기를 원하므로 Effect 안에서 `roomId`를 읽습니다. 하지만 `notificationCount`의 변경이 추가 방문을 기록하는 것은 원하지 않으므로 Effect Event 안에서 `notificationCount`를 읽습니다. [Effect Event를 사용하여 Effect에서 최신 props와 state를 읽는 방법](/learn/separating-events-from-effects#reading-latest-props-and-state-with-effect-events)에 대해 더 알아보세요.

### 반응형 값이 의도치 않게 변경되나요? {/_does-some-reactive-value-change-unintentionally_/}

때로는 Effect가 특정 값에 "반응"하기를 _원하지만_, 그 값이 사용자 관점에서 실제 변경이 아닌데도 원하는 것보다 더 자주 변경됩니다. 예를 들어, 컴포넌트 본문에서 `options` 객체를 생성하고 Effect 안에서 읽는다고 합시다:

```js {3-6,9}
function ChatRoom({ roomId }) {
  // ...
  const options = {
    serverUrl: serverUrl,
    roomId: roomId
  };

  useEffect(() => {
    const connection = createConnection(options);
    connection.connect();
    // ...
```

이 객체는 컴포넌트 본문에 선언되어 있으므로 [반응형 값](/learn/lifecycle-of-reactive-effects#effects-react-to-reactive-values)입니다. Effect 안에서 이런 반응형 값을 읽으면 의존성으로 선언합니다. 이를 통해 Effect가 변경에 "반응"합니다:

```js {3,6}
// ...
useEffect(() => {
  const connection = createConnection(options)
  connection.connect()
  return () => connection.disconnect()
}, [options]) // ✅ 모든 의존성이 선언됨
// ...
```

의존성으로 선언하는 것이 중요합니다! 예를 들어, `roomId`가 변경되면 Effect가 새 `options`로 채팅에 다시 연결합니다. 하지만 위 코드에는 문제도 있습니다. 아래 샌드박스에서 입력에 타이핑하고 콘솔에서 무슨 일이 일어나는지 확인해 보세요:

<Sandpack>

```js {expectedErrors: {'react-compiler': [10]}}
import { useState, useEffect } from 'react'
import { createConnection } from './chat.js'

const serverUrl = 'https://localhost:1234'

function ChatRoom({ roomId }) {
  const [message, setMessage] = useState('')

  // 문제를 보여주기 위해 일시적으로 린터 비활성화
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const options = {
    serverUrl: serverUrl,
    roomId: roomId,
  }

  useEffect(() => {
    const connection = createConnection(options)
    connection.connect()
    return () => connection.disconnect()
  }, [options])

  return (
    <>
      <h1>Welcome to the {roomId} room!</h1>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
    </>
  )
}

export default function App() {
  const [roomId, setRoomId] = useState('general')
  return (
    <>
      <label>
        Choose the chat room:{' '}
        <select
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        >
          <option value="general">general</option>
          <option value="travel">travel</option>
          <option value="music">music</option>
        </select>
      </label>
      <hr />
      <ChatRoom roomId={roomId} />
    </>
  )
}
```

```js src/chat.js
export function createConnection({ serverUrl, roomId }) {
  // 실제 구현은 서버에 실제로 연결할 것입니다
  return {
    connect() {
      console.log('✅ Connecting to "' + roomId + '" room at ' + serverUrl + '...')
    },
    disconnect() {
      console.log('❌ Disconnected from "' + roomId + '" room at ' + serverUrl)
    },
  }
}
```

```css
input {
  display: block;
  margin-bottom: 20px;
}
button {
  margin-left: 10px;
}
```

</Sandpack>

위 샌드박스에서 입력은 `message` state 변수만 업데이트합니다. 사용자 관점에서, 이것은 채팅 연결에 영향을 미쳐서는 안 됩니다. 하지만 `message`를 업데이트할 때마다 컴포넌트가 리렌더링됩니다. 컴포넌트가 리렌더링되면 안의 코드가 처음부터 다시 실행됩니다.

`ChatRoom` 컴포넌트의 매 리렌더링마다 새 `options` 객체가 처음부터 생성됩니다. React는 `options` 객체가 마지막 렌더링에서 생성된 `options` 객체와 *다른 객체*임을 봅니다. 따라서 (`options`에 의존하는) Effect를 재동기화하고, 타이핑할 때마다 채팅이 다시 연결됩니다.

**이 문제는 객체와 함수에만 영향을 미칩니다. JavaScript에서 새로 생성된 각 객체와 함수는 다른 모든 것과 구별되는 것으로 간주됩니다. 안의 내용이 같을 수 있어도 상관없습니다!**

```js {7-8}
// 첫 번째 렌더링 중
const options1 = { serverUrl: 'https://localhost:1234', roomId: 'music' }

// 다음 렌더링 중
const options2 = { serverUrl: 'https://localhost:1234', roomId: 'music' }

// 이것들은 두 개의 다른 객체입니다!
console.log(Object.is(options1, options2)) // false
```

**객체와 함수 의존성은 Effect가 필요 이상으로 자주 재동기화되게 만들 수 있습니다.**

이것이 가능한 한 객체와 함수를 Effect의 의존성으로 사용하는 것을 피해야 하는 이유입니다. 대신, 컴포넌트 밖으로, Effect 안으로 이동하거나, 원시 값(primitive values)을 추출해 보세요.

#### 정적 객체와 함수를 컴포넌트 밖으로 이동하기 {/_move-static-objects-and-functions-outside-your-component_/}

객체가 props나 state에 의존하지 않는다면, 컴포넌트 밖으로 이동할 수 있습니다:

```js {1-4,13}
const options = {
  serverUrl: 'https://localhost:1234',
  roomId: 'music'
};

function ChatRoom() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const connection = createConnection(options);
    connection.connect();
    return () => connection.disconnect();
  }, []); // ✅ 모든 의존성이 선언됨
  // ...
```

이렇게 하면 린터에게 반응형이 아님을 *증명*합니다. 리렌더링의 결과로 변경될 수 없으므로 의존성이 될 필요가 없습니다. 이제 `ChatRoom`이 리렌더링되어도 Effect가 재동기화되지 않습니다.

함수에도 마찬가지입니다:

```js {1-6,12}
function createOptions() {
  return {
    serverUrl: 'https://localhost:1234',
    roomId: 'music'
  };
}

function ChatRoom() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const options = createOptions();
    const connection = createConnection(options);
    connection.connect();
    return () => connection.disconnect();
  }, []); // ✅ 모든 의존성이 선언됨
  // ...
```

`createOptions`가 컴포넌트 밖에 선언되어 있으므로 반응형 값이 아닙니다. Effect의 의존성에 지정할 필요가 없고, Effect를 재동기화하지 않습니다.

#### 동적 객체와 함수를 Effect 안으로 이동하기 {/_move-dynamic-objects-and-functions-inside-your-effect_/}

객체가 `roomId` prop처럼 리렌더링의 결과로 변경될 수 있는 반응형 값에 의존한다면, 컴포넌트 _밖으로_ 꺼낼 수 없습니다. 하지만 Effect 코드 _안으로_ 이동할 수 있습니다:

```js {7-10,11,14}
const serverUrl = 'https://localhost:1234';

function ChatRoom({ roomId }) {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const options = {
      serverUrl: serverUrl,
      roomId: roomId
    };
    const connection = createConnection(options);
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]); // ✅ 모든 의존성이 선언됨
  // ...
```

이제 `options`가 Effect 안에 선언되어 있으므로 더 이상 Effect의 의존성이 아닙니다. 대신, Effect가 사용하는 유일한 반응형 값은 `roomId`입니다. `roomId`는 객체나 함수가 아니므로, _의도치 않게_ 달라지지 않는다는 것을 확신할 수 있습니다. JavaScript에서 숫자와 문자열은 내용으로 비교됩니다:

```js {7-8}
// 첫 번째 렌더링 중
const roomId1 = 'music'

// 다음 렌더링 중
const roomId2 = 'music'

// 이 두 문자열은 같습니다!
console.log(Object.is(roomId1, roomId2)) // true
```

이 수정 덕분에 입력을 편집해도 채팅이 더 이상 다시 연결되지 않습니다:

<Sandpack>

```js
import { useState, useEffect } from 'react'
import { createConnection } from './chat.js'

const serverUrl = 'https://localhost:1234'

function ChatRoom({ roomId }) {
  const [message, setMessage] = useState('')

  useEffect(() => {
    const options = {
      serverUrl: serverUrl,
      roomId: roomId,
    }
    const connection = createConnection(options)
    connection.connect()
    return () => connection.disconnect()
  }, [roomId])

  return (
    <>
      <h1>Welcome to the {roomId} room!</h1>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
    </>
  )
}

export default function App() {
  const [roomId, setRoomId] = useState('general')
  return (
    <>
      <label>
        Choose the chat room:{' '}
        <select
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        >
          <option value="general">general</option>
          <option value="travel">travel</option>
          <option value="music">music</option>
        </select>
      </label>
      <hr />
      <ChatRoom roomId={roomId} />
    </>
  )
}
```

```js src/chat.js
export function createConnection({ serverUrl, roomId }) {
  // 실제 구현은 서버에 실제로 연결할 것입니다
  return {
    connect() {
      console.log('✅ Connecting to "' + roomId + '" room at ' + serverUrl + '...')
    },
    disconnect() {
      console.log('❌ Disconnected from "' + roomId + '" room at ' + serverUrl)
    },
  }
}
```

```css
input {
  display: block;
  margin-bottom: 20px;
}
button {
  margin-left: 10px;
}
```

</Sandpack>

하지만 `roomId` 드롭다운을 변경하면 예상대로 _다시_ 연결됩니다.

함수에도 마찬가지입니다:

```js {7-12,14}
const serverUrl = 'https://localhost:1234';

function ChatRoom({ roomId }) {
  const [message, setMessage] = useState('');

  useEffect(() => {
    function createOptions() {
      return {
        serverUrl: serverUrl,
        roomId: roomId
      };
    }

    const options = createOptions();
    const connection = createConnection(options);
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]); // ✅ 모든 의존성이 선언됨
  // ...
```

Effect 안에서 로직 조각을 그룹화하는 자체 함수를 작성할 수 있습니다. Effect _안에서_ 선언하는 한, 반응형 값이 아니므로 Effect의 의존성이 될 필요가 없습니다.

#### 객체에서 원시 값 읽기 {/_read-primitive-values-from-objects_/}

때로는 props에서 객체를 받을 수 있습니다:

```js {1,5,8}
function ChatRoom({ options }) {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const connection = createConnection(options);
    connection.connect();
    return () => connection.disconnect();
  }, [options]); // ✅ 모든 의존성이 선언됨
  // ...
```

여기서 위험은 부모 컴포넌트가 렌더링 중에 객체를 생성하는 것입니다:

```js {3-6}
<ChatRoom
  roomId={roomId}
  options={{
    serverUrl: serverUrl,
    roomId: roomId,
  }}
/>
```

이로 인해 부모 컴포넌트가 리렌더링될 때마다 Effect가 다시 연결됩니다. 이를 수정하려면 Effect _밖에서_ 객체의 정보를 읽고, 객체와 함수 의존성을 피하세요:

```js {4,7-8,12}
function ChatRoom({ options }) {
  const [message, setMessage] = useState('');

  const { roomId, serverUrl } = options;
  useEffect(() => {
    const connection = createConnection({
      roomId: roomId,
      serverUrl: serverUrl
    });
    connection.connect();
    return () => connection.disconnect();
  }, [roomId, serverUrl]); // ✅ 모든 의존성이 선언됨
  // ...
```

로직이 약간 반복적이지만(Effect 밖에서 객체의 값을 읽고, 같은 값으로 Effect 안에서 객체를 만듦), Effect가 _실제로_ 어떤 정보에 의존하는지 매우 명확하게 만듭니다. 부모 컴포넌트가 의도치 않게 객체를 다시 생성하더라도 채팅이 다시 연결되지 않습니다. 하지만 `options.roomId`나 `options.serverUrl`이 정말 다르다면 채팅이 다시 연결됩니다.

#### 함수에서 원시 값 계산하기 {/_calculate-primitive-values-from-functions_/}

함수에도 같은 접근 방식이 적용됩니다. 예를 들어, 부모 컴포넌트가 함수를 전달한다고 합시다:

```js {3-8}
<ChatRoom
  roomId={roomId}
  getOptions={() => {
    return {
      serverUrl: serverUrl,
      roomId: roomId,
    }
  }}
/>
```

의존성으로 만드는 것을 피하려면(리렌더링 시 다시 연결되는 것을 방지) Effect 밖에서 호출하세요. 그러면 객체가 아닌 `roomId`와 `serverUrl` 값을 얻고, Effect 안에서 읽을 수 있습니다:

```js {1,4}
function ChatRoom({ getOptions }) {
  const [message, setMessage] = useState('');

  const { roomId, serverUrl } = getOptions();
  useEffect(() => {
    const connection = createConnection({
      roomId: roomId,
      serverUrl: serverUrl
    });
    connection.connect();
    return () => connection.disconnect();
  }, [roomId, serverUrl]); // ✅ 모든 의존성이 선언됨
  // ...
```

이것은 [순수한](/learn/keeping-components-pure) 함수에만 작동합니다. 렌더링 중에 호출하는 것이 안전하기 때문입니다. 함수가 이벤트 핸들러이지만 변경이 Effect를 재동기화하는 것을 원하지 않는다면, [대신 Effect Event로 감싸세요.](#do-you-want-to-read-a-value-without-reacting-to-its-changes)

<Recap>

- 의존성은 항상 코드와 일치해야 합니다.
- 의존성이 마음에 들지 않으면, 편집해야 할 것은 코드입니다.
- 린터를 억제하면 매우 혼란스러운 버그가 발생하므로, 항상 피해야 합니다.
- 의존성을 제거하려면, 린터에게 필요하지 않다는 것을 "증명"해야 합니다.
- 특정 상호작용에 대한 응답으로 실행되어야 하는 코드는 이벤트 핸들러로 옮기세요.
- Effect의 다른 부분이 다른 이유로 다시 실행되어야 한다면, 여러 Effect로 분리하세요.
- 이전 state를 기반으로 state를 업데이트하고 싶다면, 업데이터 함수를 전달하세요.
- 최신 값을 "반응"하지 않고 읽고 싶다면, Effect에서 Effect Event를 추출하세요.
- JavaScript에서 객체와 함수는 다른 시점에 생성되면 다른 것으로 간주됩니다.
- 객체와 함수 의존성을 피하세요. 컴포넌트 밖이나 Effect 안으로 이동하세요.

</Recap>
