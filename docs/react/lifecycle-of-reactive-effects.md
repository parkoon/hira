---
title: '반응형 Effect의 생명주기'
---

<Intro>

Effect는 컴포넌트와 다른 생명주기(lifecycle)를 가집니다. 컴포넌트는 마운트, 업데이트, 언마운트할 수 있습니다. Effect는 동기화를 시작하고, 나중에 동기화를 중지하는 두 가지만 할 수 있습니다. Effect가 시간이 지남에 따라 변경되는 props나 state에 의존하면, 이 사이클은 여러 번 발생할 수 있습니다. React는 Effect의 의존성을 올바르게 지정했는지 확인하는 린터(linter) 규칙을 제공합니다. 이를 통해 Effect가 최신 props와 state에 동기화된 상태를 유지합니다.

</Intro>

<YouWillLearn>

- Effect의 생명주기가 컴포넌트의 생명주기와 어떻게 다른지
- 각 개별 Effect를 독립적으로 생각하는 방법
- Effect가 재동기화해야 하는 시점과 그 이유
- Effect의 의존성이 어떻게 결정되는지
- 값이 반응형(reactive)이라는 것의 의미
- 빈 의존성 배열의 의미
- React가 린터로 의존성이 올바른지 검증하는 방법
- 린터와 의견이 다를 때 어떻게 해야 하는지

</YouWillLearn>

## Effect의 생명주기 {/_the-lifecycle-of-an-effect_/}

모든 React 컴포넌트는 같은 생명주기를 거칩니다:

- 컴포넌트가 화면에 추가되면 _마운트(mount)_ 됩니다.
- 새로운 props나 state를 받으면 _업데이트(update)_ 됩니다. 보통 상호작용에 대한 응답으로 발생합니다.
- 컴포넌트가 화면에서 제거되면 _언마운트(unmount)_ 됩니다.

**이것은 컴포넌트를 생각하는 좋은 방법이지만, Effect에 대해서는 _그렇지 않습니다_.** 대신, 각 Effect를 컴포넌트의 생명주기와 독립적으로 생각해 보세요. Effect는 현재 props와 state에 [외부 시스템을 동기화](/learn/synchronizing-with-effects)하는 방법을 설명합니다. 코드가 변경됨에 따라 동기화가 더 자주 또는 덜 자주 필요할 수 있습니다.

이 점을 설명하기 위해, 컴포넌트를 채팅 서버에 연결하는 Effect를 살펴보겠습니다:

```js
const serverUrl = 'https://localhost:1234'

function ChatRoom({ roomId }) {
  useEffect(() => {
    const connection = createConnection(serverUrl, roomId)
    connection.connect()
    return () => {
      connection.disconnect()
    }
  }, [roomId])
  // ...
}
```

Effect의 본문은 **동기화를 시작하는** 방법을 지정합니다:

```js {2-3}
// ...
const connection = createConnection(serverUrl, roomId)
connection.connect()
return () => {
  connection.disconnect()
}
// ...
```

Effect가 반환하는 정리 함수(cleanup function)는 **동기화를 중지하는** 방법을 지정합니다:

```js {5}
// ...
const connection = createConnection(serverUrl, roomId)
connection.connect()
return () => {
  connection.disconnect()
}
// ...
```

직관적으로 React가 컴포넌트가 마운트될 때 **동기화를 시작**하고 언마운트될 때 **동기화를 중지**할 것이라고 생각할 수 있습니다. 하지만 이것이 전부가 아닙니다! 때로는 컴포넌트가 마운트된 상태에서 **동기화를 여러 번 시작하고 중지**해야 할 수도 있습니다.

이것이 _왜_ 필요하고, _언제_ 발생하며, _어떻게_ 이 동작을 제어할 수 있는지 살펴보겠습니다.

<Note>

일부 Effect는 정리 함수를 전혀 반환하지 않습니다. [대부분의 경우](/learn/synchronizing-with-effects#how-to-handle-the-effect-firing-twice-in-development) 반환하는 것이 좋지만, 반환하지 않으면 React는 빈 정리 함수를 반환한 것처럼 동작합니다.

</Note>

### 동기화가 여러 번 필요한 이유 {/_why-synchronization-may-need-to-happen-more-than-once_/}

이 `ChatRoom` 컴포넌트가 사용자가 드롭다운에서 선택한 `roomId` prop을 받는다고 상상해 보세요. 처음에 사용자가 `"general"` 방을 `roomId`로 선택했다고 합시다. 앱이 `"general"` 채팅방을 표시합니다:

```js {3}
const serverUrl = 'https://localhost:1234'

function ChatRoom({ roomId /* "general" */ }) {
  // ...
  return <h1>Welcome to the {roomId} room!</h1>
}
```

UI가 표시된 후, React가 Effect를 실행하여 **동기화를 시작**합니다. `"general"` 방에 연결합니다:

```js {3,4}
function ChatRoom({ roomId /* "general" */ }) {
  useEffect(() => {
    const connection = createConnection(serverUrl, roomId); // "general" 방에 연결
    connection.connect();
    return () => {
      connection.disconnect(); // "general" 방에서 연결 해제
    };
  }, [roomId]);
  // ...
```

여기까지는 괜찮습니다.

나중에 사용자가 드롭다운에서 다른 방(예: `"travel"`)을 선택합니다. 먼저 React가 UI를 업데이트합니다:

```js {1}
function ChatRoom({ roomId /* "travel" */ }) {
  // ...
  return <h1>Welcome to the {roomId} room!</h1>
}
```

다음에 무슨 일이 일어나야 하는지 생각해 보세요. 사용자는 UI에서 `"travel"`이 선택된 채팅방인 것을 봅니다. 하지만 마지막에 실행된 Effect는 여전히 `"general"` 방에 연결되어 있습니다. **`roomId` prop이 변경되었으므로, 그때 Effect가 했던 일(`"general"` 방에 연결)은 더 이상 UI와 일치하지 않습니다.**

이 시점에서 React가 두 가지를 하길 원합니다:

1. 이전 `roomId`와 동기화 중지 (`"general"` 방에서 연결 해제)
2. 새로운 `roomId`와 동기화 시작 (`"travel"` 방에 연결)

**다행히 이미 React에게 이 두 가지를 어떻게 하는지 알려주었습니다!** Effect의 본문은 동기화를 시작하는 방법을, 정리 함수는 동기화를 중지하는 방법을 지정합니다. React가 해야 할 일은 올바른 순서로, 올바른 props와 state로 이들을 호출하는 것뿐입니다. 정확히 어떻게 되는지 살펴보겠습니다.

### React가 Effect를 재동기화하는 방법 {/_how-react-re-synchronizes-your-effect_/}

`ChatRoom` 컴포넌트가 `roomId` prop의 새로운 값을 받았다는 것을 떠올려 보세요. `"general"`이었다가 이제 `"travel"`입니다. React가 다른 방에 다시 연결하기 위해 Effect를 재동기화해야 합니다.

**동기화를 중지**하기 위해, React는 `"general"` 방에 연결한 후 Effect가 반환한 정리 함수를 호출합니다. `roomId`가 `"general"`이었으므로 정리 함수가 `"general"` 방에서 연결을 해제합니다:

```js {6}
function ChatRoom({ roomId /* "general" */ }) {
  useEffect(() => {
    const connection = createConnection(serverUrl, roomId); // "general" 방에 연결
    connection.connect();
    return () => {
      connection.disconnect(); // "general" 방에서 연결 해제
    };
    // ...
```

그런 다음 React는 이번 렌더링에서 제공한 Effect를 실행합니다. 이번에는 `roomId`가 `"travel"`이므로 `"travel"` 채팅방에 **동기화를 시작**합니다(정리 함수가 최종적으로 호출될 때까지):

```js {3,4}
function ChatRoom({ roomId /* "travel" */ }) {
  useEffect(() => {
    const connection = createConnection(serverUrl, roomId); // "travel" 방에 연결
    connection.connect();
    // ...
```

덕분에 이제 사용자가 UI에서 선택한 것과 같은 방에 연결됩니다. 문제가 해결되었습니다!

컴포넌트가 다른 `roomId`로 리렌더링될 때마다 Effect가 재동기화됩니다. 예를 들어, 사용자가 `roomId`를 `"travel"`에서 `"music"`으로 변경한다고 합시다. React는 다시 정리 함수를 호출하여 (`"travel"` 방에서 연결 해제) **동기화를 중지**합니다. 그런 다음 새로운 `roomId` prop으로 본문을 실행하여 (`"music"` 방에 연결) **동기화를 다시 시작**합니다.

마지막으로 사용자가 다른 화면으로 이동하면 `ChatRoom`이 언마운트됩니다. 이제 더 이상 연결을 유지할 필요가 없습니다. React는 마지막으로 **동기화를 중지**하고 `"music"` 채팅방에서 연결을 해제합니다.

### Effect의 관점에서 생각하기 {/_thinking-from-the-effects-perspective_/}

`ChatRoom` 컴포넌트의 관점에서 일어난 모든 일을 정리해 봅시다:

1. `ChatRoom`이 `roomId`가 `"general"`로 설정된 상태로 마운트됨
1. `ChatRoom`이 `roomId`가 `"travel"`로 설정된 상태로 업데이트됨
1. `ChatRoom`이 `roomId`가 `"music"`으로 설정된 상태로 업데이트됨
1. `ChatRoom`이 언마운트됨

컴포넌트 생명주기의 각 시점에서 Effect는 다른 일을 했습니다:

1. Effect가 `"general"` 방에 연결됨
1. Effect가 `"general"` 방에서 연결 해제되고 `"travel"` 방에 연결됨
1. Effect가 `"travel"` 방에서 연결 해제되고 `"music"` 방에 연결됨
1. Effect가 `"music"` 방에서 연결 해제됨

이제 Effect 자체의 관점에서 무슨 일이 일어났는지 생각해 봅시다:

```js
useEffect(() => {
  // Effect가 roomId로 지정된 방에 연결...
  const connection = createConnection(serverUrl, roomId)
  connection.connect()
  return () => {
    // ...연결 해제될 때까지
    connection.disconnect()
  }
}, [roomId])
```

이 코드의 구조를 보면 겹치지 않는 시간 구간의 연속으로 볼 수 있습니다:

1. Effect가 `"general"` 방에 연결됨 (연결 해제될 때까지)
1. Effect가 `"travel"` 방에 연결됨 (연결 해제될 때까지)
1. Effect가 `"music"` 방에 연결됨 (연결 해제될 때까지)

이전에는 컴포넌트의 관점에서 생각하고 있었습니다. 컴포넌트의 관점에서 보면, Effect를 "렌더링 후"나 "언마운트 전" 같은 특정 시점에 실행되는 "콜백"이나 "생명주기 이벤트"로 생각하고 싶어집니다. 이런 사고방식은 매우 빠르게 복잡해지므로 피하는 것이 좋습니다.

**대신, 항상 한 번에 하나의 시작/중지 사이클에 집중하세요. 컴포넌트가 마운트, 업데이트, 언마운트 중 어느 상태인지는 중요하지 않습니다. 동기화를 시작하는 방법과 중지하는 방법만 설명하면 됩니다. 이것만 잘하면, Effect는 필요한 만큼 여러 번 시작되고 중지되어도 탄력적으로 동작합니다.**

이것은 JSX를 생성하는 렌더링 로직을 작성할 때 컴포넌트가 마운트되는지 업데이트되는지 생각하지 않는 것과 비슷합니다. 화면에 무엇이 있어야 하는지 설명하면, React가 [나머지를 알아서 합니다.](/learn/reacting-to-input-with-state)

### React가 Effect의 재동기화 가능성을 검증하는 방법 {/_how-react-verifies-that-your-effect-can-re-synchronize_/}

여기 직접 사용해 볼 수 있는 예제가 있습니다. "Open chat"을 눌러 `ChatRoom` 컴포넌트를 마운트하세요:

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
  const [show, setShow] = useState(false)
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
      <button onClick={() => setShow(!show)}>{show ? 'Close chat' : 'Open chat'}</button>
      {show && <hr />}
      {show && <ChatRoom roomId={roomId} />}
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

컴포넌트가 처음 마운트될 때 세 개의 로그가 보입니다:

1. `✅ Connecting to "general" room at https://localhost:1234...` _(개발 환경 전용)_
1. `❌ Disconnected from "general" room at https://localhost:1234.` _(개발 환경 전용)_
1. `✅ Connecting to "general" room at https://localhost:1234...`

처음 두 개의 로그는 개발 환경에서만 나타납니다. 개발 환경에서 React는 항상 각 컴포넌트를 한 번 다시 마운트합니다.

**React는 개발 환경에서 Effect를 즉시 강제로 재동기화하여 Effect가 재동기화할 수 있는지 검증합니다.** 이것은 문 잠금이 작동하는지 확인하기 위해 문을 열었다가 한 번 더 닫아보는 것과 비슷합니다. React는 개발 환경에서 Effect를 한 번 더 시작하고 중지하여 [정리 함수를 잘 구현했는지](/learn/synchronizing-with-effects#how-to-handle-the-effect-firing-twice-in-development) 확인합니다.

실제로 Effect가 재동기화되는 주된 이유는 사용하는 데이터가 변경되었을 때입니다. 위 샌드박스에서 선택된 채팅방을 변경해 보세요. `roomId`가 변경될 때 Effect가 재동기화되는 것을 확인할 수 있습니다.

하지만 재동기화가 필요한 더 드문 경우도 있습니다. 예를 들어, 채팅이 열린 상태에서 위 샌드박스의 `serverUrl`을 편집해 보세요. 코드 편집에 대한 응답으로 Effect가 재동기화되는 것을 확인할 수 있습니다. 앞으로 React는 재동기화에 의존하는 더 많은 기능을 추가할 수 있습니다.

### React가 Effect를 재동기화해야 한다는 것을 아는 방법 {/_how-react-knows-that-it-needs-to-re-synchronize-the-effect_/}

`roomId`가 변경된 후 Effect가 재동기화해야 한다는 것을 React가 어떻게 아는지 궁금할 수 있습니다. 그것은 _여러분이 React에_ `roomId`를 [의존성 목록](/learn/synchronizing-with-effects#step-2-specify-the-effect-dependencies)에 포함하여 코드가 `roomId`에 의존한다고 알려주었기 때문입니다:

```js {1,3,8}
function ChatRoom({ roomId }) { // roomId prop은 시간이 지남에 따라 변경될 수 있습니다
  useEffect(() => {
    const connection = createConnection(serverUrl, roomId); // 이 Effect는 roomId를 읽습니다
    connection.connect();
    return () => {
      connection.disconnect();
    };
  }, [roomId]); // 따라서 React에 이 Effect가 roomId에 "의존한다"고 알려줍니다
  // ...
```

작동 방식은 다음과 같습니다:

1. `roomId`가 prop이므로 시간이 지남에 따라 변경될 수 있다는 것을 알고 있었습니다.
2. Effect가 `roomId`를 읽으므로(따라서 나중에 변경될 수 있는 값에 로직이 의존하므로) 이를 알고 있었습니다.
3. 그래서 Effect의 의존성으로 지정했습니다(`roomId`가 변경되면 재동기화되도록).

컴포넌트가 리렌더링될 때마다, React는 전달한 의존성 배열을 확인합니다. 배열의 값 중 이전 렌더링에서 같은 위치에 전달한 값과 다른 것이 있으면 React가 Effect를 재동기화합니다.

예를 들어, 초기 렌더링에서 `["general"]`을 전달하고 다음 렌더링에서 `["travel"]`을 전달했다면, React는 `"general"`과 `"travel"`을 비교합니다. 이들은 ([`Object.is`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is)로 비교하여) 다른 값이므로 React가 Effect를 재동기화합니다. 반면, 컴포넌트가 리렌더링되었지만 `roomId`가 변경되지 않았다면, Effect는 같은 방에 연결된 상태로 유지됩니다.

### 각 Effect는 별도의 동기화 프로세스를 나타냅니다 {/_each-effect-represents-a-separate-synchronization-process_/}

이미 작성한 Effect와 동시에 실행되어야 한다는 이유만으로 관련 없는 로직을 Effect에 추가하지 마세요. 예를 들어, 사용자가 방을 방문할 때 분석 이벤트를 보내고 싶다고 합시다. 이미 `roomId`에 의존하는 Effect가 있으므로, 거기에 분석 호출을 추가하고 싶을 수 있습니다:

```js {3}
function ChatRoom({ roomId }) {
  useEffect(() => {
    logVisit(roomId)
    const connection = createConnection(serverUrl, roomId)
    connection.connect()
    return () => {
      connection.disconnect()
    }
  }, [roomId])
  // ...
}
```

하지만 나중에 연결을 재설정해야 하는 다른 의존성을 이 Effect에 추가한다고 상상해 보세요. 이 Effect가 재동기화되면, 의도하지 않았던 같은 방에 대해서도 `logVisit(roomId)`를 호출합니다. 방문 로깅은 연결과 **별도의 프로세스**입니다. 두 개의 별도 Effect로 작성하세요:

```js {2-4}
function ChatRoom({ roomId }) {
  useEffect(() => {
    logVisit(roomId)
  }, [roomId])

  useEffect(() => {
    const connection = createConnection(serverUrl, roomId)
    // ...
  }, [roomId])
  // ...
}
```

**코드의 각 Effect는 별도의 독립적인 동기화 프로세스를 나타내야 합니다.**

위 예제에서 하나의 Effect를 삭제해도 다른 Effect의 로직이 깨지지 않습니다. 이것은 서로 다른 것을 동기화하고 있으며, 분리하는 것이 합리적이라는 좋은 표시입니다. 반면, 응집된 로직 조각을 별도의 Effect로 분리하면 코드가 "깔끔해" 보일 수 있지만 [유지보수하기가 더 어려워집니다.](/learn/you-might-not-need-an-effect#chains-of-computations) 그래서 코드가 깔끔해 보이는지가 아니라 프로세스가 같은지 별도인지를 기준으로 생각해야 합니다.

## Effect는 반응형 값에 "반응"합니다 {/_effects-react-to-reactive-values_/}

Effect가 두 개의 변수(`serverUrl`과 `roomId`)를 읽지만, 의존성으로는 `roomId`만 지정했습니다:

```js {5,10}
const serverUrl = 'https://localhost:1234'

function ChatRoom({ roomId }) {
  useEffect(() => {
    const connection = createConnection(serverUrl, roomId)
    connection.connect()
    return () => {
      connection.disconnect()
    }
  }, [roomId])
  // ...
}
```

`serverUrl`은 왜 의존성이 될 필요가 없을까요?

`serverUrl`은 리렌더링으로 인해 변경되지 않기 때문입니다. 컴포넌트가 몇 번이고 왜 리렌더링되든 항상 같은 값입니다. `serverUrl`은 절대 변경되지 않으므로 의존성으로 지정하는 것은 의미가 없습니다. 결국, 의존성은 시간이 지남에 따라 변경될 때만 무언가를 합니다!

반면, `roomId`는 리렌더링 시 다를 수 있습니다. **컴포넌트 안에 선언된 props, state, 그리고 기타 값들은 렌더링 중에 계산되고 React 데이터 흐름에 참여하기 때문에 _반응형(reactive)_ 입니다.**

`serverUrl`이 state 변수였다면 반응형이 됩니다. 반응형 값은 반드시 의존성에 포함해야 합니다:

```js {2,5,10}
function ChatRoom({ roomId }) {
  // Props는 시간이 지남에 따라 변경됩니다
  const [serverUrl, setServerUrl] = useState('https://localhost:1234') // State도 시간이 지남에 따라 변경될 수 있습니다

  useEffect(() => {
    const connection = createConnection(serverUrl, roomId) // Effect가 props와 state를 읽습니다
    connection.connect()
    return () => {
      connection.disconnect()
    }
  }, [roomId, serverUrl]) // 따라서 React에 이 Effect가 props와 state에 "의존한다"고 알려줍니다
  // ...
}
```

`serverUrl`을 의존성에 포함하면, 변경된 후에 Effect가 재동기화됩니다.

이 샌드박스에서 선택된 채팅방을 변경하거나 서버 URL을 편집해 보세요:

<Sandpack>

```js
import { useState, useEffect } from 'react'
import { createConnection } from './chat.js'

function ChatRoom({ roomId }) {
  const [serverUrl, setServerUrl] = useState('https://localhost:1234')

  useEffect(() => {
    const connection = createConnection(serverUrl, roomId)
    connection.connect()
    return () => connection.disconnect()
  }, [roomId, serverUrl])

  return (
    <>
      <label>
        Server URL:{' '}
        <input
          value={serverUrl}
          onChange={(e) => setServerUrl(e.target.value)}
        />
      </label>
      <h1>Welcome to the {roomId} room!</h1>
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

`roomId`나 `serverUrl` 같은 반응형 값을 변경할 때마다, Effect가 채팅 서버에 다시 연결됩니다.

### 빈 의존성 배열의 의미 {/_what-an-effect-with-empty-dependencies-means_/}

`serverUrl`과 `roomId`를 모두 컴포넌트 외부로 이동하면 어떻게 될까요?

```js {1,2}
const serverUrl = 'https://localhost:1234'
const roomId = 'general'

function ChatRoom() {
  useEffect(() => {
    const connection = createConnection(serverUrl, roomId)
    connection.connect()
    return () => {
      connection.disconnect()
    }
  }, []) // ✅ 모든 의존성이 선언됨
  // ...
}
```

이제 Effect의 코드가 반응형 값을 _전혀_ 사용하지 않으므로 의존성이 비어있을 수 있습니다(`[]`).

컴포넌트의 관점에서 보면, 빈 `[]` 의존성 배열은 이 Effect가 컴포넌트가 마운트될 때만 채팅방에 연결하고 언마운트될 때만 연결을 해제한다는 의미입니다. (React가 개발 환경에서 로직을 스트레스 테스트하기 위해 [한 번 더 재동기화](#how-react-verifies-that-your-effect-can-re-synchronize)한다는 점을 기억하세요.)

<Sandpack>

```js
import { useState, useEffect } from 'react'
import { createConnection } from './chat.js'

const serverUrl = 'https://localhost:1234'
const roomId = 'general'

function ChatRoom() {
  useEffect(() => {
    const connection = createConnection(serverUrl, roomId)
    connection.connect()
    return () => connection.disconnect()
  }, [])
  return <h1>Welcome to the {roomId} room!</h1>
}

export default function App() {
  const [show, setShow] = useState(false)
  return (
    <>
      <button onClick={() => setShow(!show)}>{show ? 'Close chat' : 'Open chat'}</button>
      {show && <hr />}
      {show && <ChatRoom />}
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

하지만 [Effect의 관점에서 생각하면,](#thinking-from-the-effects-perspective) 마운트와 언마운트에 대해 전혀 생각할 필요가 없습니다. 중요한 것은 Effect가 동기화를 시작하고 중지하는 방법을 지정했다는 것입니다. 현재는 반응형 의존성이 없습니다. 하지만 사용자가 시간이 지남에 따라 `roomId`나 `serverUrl`을 변경할 수 있게 하려면(반응형이 되면), Effect의 코드는 변경할 필요가 없습니다. 의존성에 추가하기만 하면 됩니다.

### 컴포넌트 본문에 선언된 모든 변수는 반응형입니다 {/_all-variables-declared-in-the-component-body-are-reactive_/}

props와 state만이 반응형 값은 아닙니다. 그것들로부터 계산하는 값들도 반응형입니다. props나 state가 변경되면 컴포넌트가 리렌더링되고, 그것들로부터 계산된 값들도 변경됩니다. 따라서 Effect가 사용하는 컴포넌트 본문의 모든 변수는 Effect 의존성 목록에 있어야 합니다.

사용자가 드롭다운에서 채팅 서버를 선택할 수 있지만 설정에서 기본 서버를 구성할 수도 있다고 합시다. 이미 설정 state를 [context](/learn/scaling-up-with-reducer-and-context)에 넣었다고 가정하고, 해당 context에서 `settings`를 읽습니다. 이제 props에서 선택된 서버와 기본 서버를 기반으로 `serverUrl`을 계산합니다:

```js {3,5,10}
function ChatRoom({ roomId, selectedServerUrl }) {
  // roomId는 반응형입니다
  const settings = useContext(SettingsContext) // settings는 반응형입니다
  const serverUrl = selectedServerUrl ?? settings.defaultServerUrl // serverUrl은 반응형입니다
  useEffect(() => {
    const connection = createConnection(serverUrl, roomId) // Effect가 roomId와 serverUrl을 읽습니다
    connection.connect()
    return () => {
      connection.disconnect()
    }
  }, [roomId, serverUrl]) // 따라서 둘 중 하나가 변경되면 재동기화해야 합니다!
  // ...
}
```

이 예제에서 `serverUrl`은 prop이나 state 변수가 아닙니다. 렌더링 중에 계산하는 일반 변수입니다. 하지만 렌더링 중에 계산되므로 리렌더링으로 인해 변경될 수 있습니다. 이것이 반응형인 이유입니다.

**컴포넌트 안의 모든 값(props, state, 컴포넌트 본문의 변수 포함)은 반응형입니다. 모든 반응형 값은 리렌더링 시 변경될 수 있으므로, Effect의 의존성에 포함해야 합니다.**

다시 말해, Effect는 컴포넌트 본문의 모든 값에 "반응"합니다.

<DeepDive>

#### 전역 변수나 가변 값이 의존성이 될 수 있나요? {/_can-global-or-mutable-values-be-dependencies_/}

가변(mutable) 값(전역 변수 포함)은 반응형이 아닙니다.

**[`location.pathname`](https://developer.mozilla.org/en-US/docs/Web/API/Location/pathname) 같은 가변 값은 의존성이 될 수 없습니다.** 가변이므로 React 렌더링 데이터 흐름 밖에서 언제든지 변경될 수 있습니다. 변경해도 컴포넌트의 리렌더링을 트리거하지 않습니다. 따라서 의존성에 지정하더라도 React는 값이 변경될 때 Effect를 재동기화해야 한다는 것을 _알 수 없습니다_. 또한 렌더링 중에(의존성을 계산할 때) 가변 데이터를 읽는 것은 [렌더링의 순수성](/learn/keeping-components-pure)을 깨뜨리므로 React의 규칙에 위배됩니다. 대신, [`useSyncExternalStore`](/learn/you-might-not-need-an-effect#subscribing-to-an-external-store)로 외부 가변 값을 읽고 구독해야 합니다.

**[`ref.current`](/reference/react/useRef#reference) 같은 가변 값이나 그것에서 읽는 것도 의존성이 될 수 없습니다.** `useRef`가 반환하는 ref 객체 자체는 의존성이 될 수 있지만, `current` 프로퍼티는 의도적으로 가변입니다. [리렌더링을 트리거하지 않고 무언가를 추적](/learn/referencing-values-with-refs)할 수 있게 해줍니다. 하지만 변경해도 리렌더링을 트리거하지 않으므로 반응형 값이 아니며, React는 값이 변경될 때 Effect를 다시 실행해야 한다는 것을 알 수 없습니다.

이 페이지에서 아래에 배우겠지만, 린터가 이러한 문제를 자동으로 확인합니다.

</DeepDive>

### React는 모든 반응형 값을 의존성으로 지정했는지 검증합니다 {/_react-verifies-that-you-specified-every-reactive-value-as-a-dependency_/}

린터가 [React용으로 구성](/learn/editor-setup#linting)되어 있다면, Effect의 코드에서 사용하는 모든 반응형 값이 의존성으로 선언되었는지 확인합니다. 예를 들어, `roomId`와 `serverUrl` 모두 반응형이므로 다음은 린트 에러입니다:

<Sandpack>

```js
import { useState, useEffect } from 'react'
import { createConnection } from './chat.js'

function ChatRoom({ roomId }) {
  // roomId는 반응형입니다
  const [serverUrl, setServerUrl] = useState('https://localhost:1234') // serverUrl은 반응형입니다

  useEffect(() => {
    const connection = createConnection(serverUrl, roomId)
    connection.connect()
    return () => connection.disconnect()
  }, []) // <-- 여기에 문제가 있습니다!

  return (
    <>
      <label>
        Server URL:{' '}
        <input
          value={serverUrl}
          onChange={(e) => setServerUrl(e.target.value)}
        />
      </label>
      <h1>Welcome to the {roomId} room!</h1>
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

React 에러처럼 보일 수 있지만, 실제로는 React가 코드의 버그를 지적하는 것입니다. `roomId`와 `serverUrl` 모두 시간이 지남에 따라 변경될 수 있지만, 변경될 때 Effect를 재동기화하는 것을 잊고 있습니다. 사용자가 UI에서 다른 값을 선택한 후에도 초기 `roomId`와 `serverUrl`에 연결된 상태로 남아 있을 것입니다.

버그를 수정하려면, 린터의 제안을 따라 `roomId`와 `serverUrl`을 Effect의 의존성으로 지정하세요:

```js {9}
function ChatRoom({ roomId }) {
  // roomId는 반응형입니다
  const [serverUrl, setServerUrl] = useState('https://localhost:1234') // serverUrl은 반응형입니다
  useEffect(() => {
    const connection = createConnection(serverUrl, roomId)
    connection.connect()
    return () => {
      connection.disconnect()
    }
  }, [serverUrl, roomId]) // ✅ 모든 의존성이 선언됨
  // ...
}
```

위 샌드박스에서 이 수정을 시도해 보세요. 린터 에러가 사라지고 채팅이 필요할 때 다시 연결되는지 확인하세요.

<Note>

일부 경우에 React는 값이 컴포넌트 안에 선언되었더라도 절대 변경되지 않는다는 것을 _압니다_. 예를 들어, `useState`에서 반환된 [`set` 함수](/reference/react/useState#setstate)와 [`useRef`](/reference/react/useRef)가 반환한 ref 객체는 _안정적(stable)_ 입니다. 리렌더링 시 변경되지 않는 것이 보장됩니다. 안정적인 값은 반응형이 아니므로 목록에서 생략할 수 있습니다. 포함해도 됩니다: 변경되지 않으므로 상관없습니다.

</Note>

### 재동기화하고 싶지 않을 때 어떻게 해야 하나요 {/_what-to-do-when-you-dont-want-to-re-synchronize_/}

이전 예제에서 `roomId`와 `serverUrl`을 의존성으로 나열하여 린트 에러를 수정했습니다.

**하지만 대신, 이 값들이 반응형 값이 아니라는 것을, 즉 리렌더링의 결과로 변경될 수 *없다*는 것을 린터에 "증명"할 수도 있습니다.** 예를 들어, `serverUrl`과 `roomId`가 렌더링에 의존하지 않고 항상 같은 값을 가진다면, 컴포넌트 밖으로 이동할 수 있습니다. 이제 의존성이 될 필요가 없습니다:

```js {1,2,11}
const serverUrl = 'https://localhost:1234' // serverUrl은 반응형이 아닙니다
const roomId = 'general' // roomId는 반응형이 아닙니다

function ChatRoom() {
  useEffect(() => {
    const connection = createConnection(serverUrl, roomId)
    connection.connect()
    return () => {
      connection.disconnect()
    }
  }, []) // ✅ 모든 의존성이 선언됨
  // ...
}
```

_Effect 안으로_ 이동할 수도 있습니다. 렌더링 중에 계산되지 않으므로 반응형이 아닙니다:

```js {3,4,10}
function ChatRoom() {
  useEffect(() => {
    const serverUrl = 'https://localhost:1234' // serverUrl은 반응형이 아닙니다
    const roomId = 'general' // roomId는 반응형이 아닙니다
    const connection = createConnection(serverUrl, roomId)
    connection.connect()
    return () => {
      connection.disconnect()
    }
  }, []) // ✅ 모든 의존성이 선언됨
  // ...
}
```

**Effect는 반응형 코드 블록입니다.** 안에서 읽는 값이 변경되면 재동기화됩니다. 상호작용당 한 번만 실행되는 이벤트 핸들러와 달리, Effect는 동기화가 필요할 때마다 실행됩니다.

**의존성을 "선택"할 수 없습니다.** 의존성에는 Effect에서 읽는 모든 [반응형 값](#all-variables-declared-in-the-component-body-are-reactive)이 포함되어야 합니다. 린터가 이를 강제합니다. 때로는 무한 루프나 Effect가 너무 자주 재동기화되는 문제가 발생할 수 있습니다. 이러한 문제를 린터를 억제하여 해결하지 마세요! 대신 시도할 것들:

- **Effect가 독립적인 동기화 프로세스를 나타내는지 확인하세요.** Effect가 아무것도 동기화하지 않는다면 [불필요할 수 있습니다.](/learn/you-might-not-need-an-effect) 여러 독립적인 것을 동기화한다면 [분리하세요.](#each-effect-represents-a-separate-synchronization-process)

- **props나 state의 최신 값을 "반응"하지 않고 읽고 싶다면,** Effect를 반응형 부분(Effect에 유지)과 비반응형 부분(*Effect Event*로 추출)으로 나눌 수 있습니다. [이벤트와 Effect를 분리하는 방법](/learn/separating-events-from-effects)에 대해 읽어보세요.

- **객체와 함수를 의존성으로 사용하는 것을 피하세요.** 렌더링 중에 객체와 함수를 생성한 다음 Effect에서 읽으면, 매 렌더링마다 다릅니다. 이로 인해 Effect가 매번 재동기화됩니다. [Effect에서 불필요한 의존성을 제거하는 방법](/learn/removing-effect-dependencies)에 대해 더 읽어보세요.

<Pitfall>

린터는 여러분의 도우미이지만, 능력에 한계가 있습니다. 린터는 의존성이 _잘못되었을_ 때만 알 수 있습니다. 각 경우를 해결하는 _최선의_ 방법은 알지 못합니다. 린터가 의존성을 제안하지만 추가하면 루프가 발생한다면, 린터를 무시해야 한다는 의미가 아닙니다. Effect 안(또는 밖)의 코드를 변경하여 해당 값이 반응형이 아니게 만들고 의존성이 _될 필요가 없도록_ 해야 합니다.

기존 코드베이스에 다음과 같이 린터를 억제하는 Effect가 있을 수 있습니다:

```js {3-4}
useEffect(() => {
  // ...
  // 🔴 이렇게 린터를 억제하지 마세요:
  // eslint-ignore-next-line react-hooks/exhaustive-deps
}, [])
```

[다음](/learn/separating-events-from-effects) [페이지들](/learn/removing-effect-dependencies)에서 규칙을 깨뜨리지 않고 이 코드를 수정하는 방법을 배웁니다. 수정할 가치가 항상 있습니다!

</Pitfall>

<Recap>

- 컴포넌트는 마운트, 업데이트, 언마운트할 수 있습니다.
- 각 Effect는 주변 컴포넌트와 별도의 생명주기를 가집니다.
- 각 Effect는 *시작*하고 *중지*할 수 있는 별도의 동기화 프로세스를 설명합니다.
- Effect를 작성하고 읽을 때, 컴포넌트의 관점(마운트, 업데이트, 언마운트 방법)이 아닌 각 개별 Effect의 관점(동기화를 시작하고 중지하는 방법)에서 생각하세요.
- 컴포넌트 본문 안에 선언된 값은 "반응형"입니다.
- 반응형 값은 시간이 지남에 따라 변경될 수 있으므로 Effect를 재동기화해야 합니다.
- 린터는 Effect 안에서 사용되는 모든 반응형 값이 의존성으로 지정되었는지 검증합니다.
- 린터가 표시하는 모든 에러는 정당합니다. 규칙을 깨뜨리지 않고 코드를 수정하는 방법이 항상 있습니다.

</Recap>
