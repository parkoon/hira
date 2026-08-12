---
title: '이벤트와 Effect 분리하기'
---

<Intro>

이벤트 핸들러는 같은 상호작용을 다시 수행해야만 다시 실행됩니다. 이벤트 핸들러와 달리 Effect는 읽는 값(prop이나 state 변수)이 마지막 렌더링과 다르면 재동기화합니다. 때로는 두 동작의 혼합이 필요합니다: 일부 값에는 반응하지만 다른 값에는 반응하지 않는 Effect입니다. 이 페이지에서 그 방법을 배웁니다.

</Intro>

<YouWillLearn>

- 이벤트 핸들러와 Effect 중 선택하는 방법
- Effect가 반응형이고 이벤트 핸들러가 반응형이 아닌 이유
- Effect 코드의 일부를 비반응형으로 만들고 싶을 때 어떻게 하는지
- Effect Event가 무엇이고, Effect에서 추출하는 방법
- Effect Event를 사용하여 Effect에서 최신 props와 state를 읽는 방법

</YouWillLearn>

## 이벤트 핸들러와 Effect 중 선택하기 {/_choosing-between-event-handlers-and-effects_/}

먼저, 이벤트 핸들러와 Effect의 차이를 복습해 봅시다.

채팅방 컴포넌트를 구현한다고 상상해 보세요. 요구사항은 다음과 같습니다:

1. 컴포넌트가 선택된 채팅방에 자동으로 연결되어야 합니다.
1. "Send" 버튼을 클릭하면 채팅에 메시지를 보내야 합니다.

코드는 이미 구현했지만, 어디에 넣어야 할지 확신이 없다고 합시다. 이벤트 핸들러를 사용해야 할까요, Effect를 사용해야 할까요? 이 질문에 답해야 할 때마다, [_왜_ 이 코드가 실행되어야 하는지](/learn/synchronizing-with-effects#what-are-effects-and-how-are-they-different-from-events) 생각하세요.

### 이벤트 핸들러는 특정 상호작용에 대한 응답으로 실행됩니다 {/_event-handlers-run-in-response-to-specific-interactions_/}

사용자 관점에서, 메시지 전송은 특정 "Send" 버튼이 클릭*되었기 때문에* 발생해야 합니다. 다른 시점이나 다른 이유로 메시지가 전송되면 사용자는 상당히 불쾌할 것입니다. 이것이 메시지 전송이 이벤트 핸들러여야 하는 이유입니다. 이벤트 핸들러를 사용하면 특정 상호작용을 처리할 수 있습니다:

```js {4-6}
function ChatRoom({ roomId }) {
  const [message, setMessage] = useState('')
  // ...
  function handleSendClick() {
    sendMessage(message)
  }
  // ...
  return (
    <>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={handleSendClick}>Send</button>
    </>
  )
}
```

이벤트 핸들러를 사용하면, `sendMessage(message)`가 사용자가 버튼을 눌렀을 때*만* 실행된다는 것을 확신할 수 있습니다.

### Effect는 동기화가 필요할 때마다 실행됩니다 {/_effects-run-whenever-synchronization-is-needed_/}

컴포넌트를 채팅방에 연결된 상태로 유지해야 한다는 것도 기억하세요. 그 코드는 어디에 넣어야 할까요?

이 코드를 실행하는 *이유*는 특정 상호작용이 아닙니다. 사용자가 왜, 어떻게 채팅방 화면으로 이동했는지는 중요하지 않습니다. 이제 사용자가 그것을 보고 있고 상호작용할 수 있으므로, 컴포넌트는 선택된 채팅 서버에 연결된 상태를 유지해야 합니다. 채팅방 컴포넌트가 앱의 초기 화면이고 사용자가 아무 상호작용도 하지 않았더라도, _여전히_ 연결해야 합니다. 이것이 Effect인 이유입니다:

```js {3-9}
function ChatRoom({ roomId }) {
  // ...
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

이 코드를 사용하면, 사용자가 수행한 특정 상호작용과 _관계없이_ 현재 선택된 채팅 서버에 항상 활성 연결이 있다는 것을 확신할 수 있습니다. 사용자가 앱을 열었든, 다른 방을 선택했든, 다른 화면으로 이동했다가 돌아왔든, Effect는 컴포넌트가 현재 선택된 방과 *동기화된 상태를 유지*하고, [필요할 때마다 재연결](/learn/lifecycle-of-reactive-effects#why-synchronization-may-need-to-happen-more-than-once)합니다.

<Sandpack>

```js
import { useState, useEffect } from 'react'
import { createConnection, sendMessage } from './chat.js'

const serverUrl = 'https://localhost:1234'

function ChatRoom({ roomId }) {
  const [message, setMessage] = useState('')

  useEffect(() => {
    const connection = createConnection(serverUrl, roomId)
    connection.connect()
    return () => connection.disconnect()
  }, [roomId])

  function handleSendClick() {
    sendMessage(message)
  }

  return (
    <>
      <h1>Welcome to the {roomId} room!</h1>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={handleSendClick}>Send</button>
    </>
  )
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
export function sendMessage(message) {
  console.log('🔵 You sent: ' + message)
}

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
input,
select {
  margin-right: 20px;
}
```

</Sandpack>

## 반응형 값과 반응형 로직 {/_reactive-values-and-reactive-logic_/}

직관적으로 말하면, 이벤트 핸들러는 항상 "수동으로" 트리거됩니다(예: 버튼 클릭). 반면 Effect는 "자동"입니다: 동기화된 상태를 유지하기 위해 필요한 만큼 실행되고 다시 실행됩니다.

이것을 더 정확하게 생각하는 방법이 있습니다.

컴포넌트 본문 안에 선언된 props, state, 그리고 변수를 <CodeStep step={2}>반응형 값(reactive values)</CodeStep>이라고 합니다. 이 예제에서 `serverUrl`은 반응형 값이 아니지만, `roomId`와 `message`는 반응형 값입니다. 이들은 렌더링 데이터 흐름에 참여합니다:

```js [[2, 3, "roomId"], [2, 4, "message"]]
const serverUrl = 'https://localhost:1234'

function ChatRoom({ roomId }) {
  const [message, setMessage] = useState('')

  // ...
}
```

이런 반응형 값들은 리렌더링으로 인해 변경될 수 있습니다. 예를 들어, 사용자가 `message`를 편집하거나 드롭다운에서 다른 `roomId`를 선택할 수 있습니다. 이벤트 핸들러와 Effect는 변경에 대해 다르게 응답합니다:

- **이벤트 핸들러 안의 로직은 _반응형이 아닙니다._** 사용자가 같은 상호작용(예: 클릭)을 다시 수행하지 않는 한 다시 실행되지 않습니다. 이벤트 핸들러는 변경에 "반응"하지 않고 반응형 값을 읽을 수 있습니다.
- **Effect 안의 로직은 _반응형입니다._** Effect가 반응형 값을 읽는다면, [의존성으로 지정해야 합니다.](/learn/lifecycle-of-reactive-effects#effects-react-to-reactive-values) 그러면 리렌더링으로 인해 해당 값이 변경될 때 React가 새로운 값으로 Effect의 로직을 다시 실행합니다.

이전 예제를 다시 살펴보며 이 차이를 설명하겠습니다.

### 이벤트 핸들러 안의 로직은 반응형이 아닙니다 {/_logic-inside-event-handlers-is-not-reactive_/}

다음 코드 줄을 보세요. 이 로직은 반응형이어야 할까요, 아닐까요?

```js [[2, 2, "message"]]
// ...
sendMessage(message)
// ...
```

사용자 관점에서, **`message`의 변경이 메시지를 보내고 싶다는 것을 의미하지 _않습니다._** 사용자가 타이핑 중이라는 것만 의미합니다. 즉, 메시지를 보내는 로직은 반응형이어서는 안 됩니다. <CodeStep step={2}>반응형 값</CodeStep>이 변경되었다는 이유만으로 다시 실행되어서는 안 됩니다. 그래서 이벤트 핸들러에 속합니다:

```js {2}
function handleSendClick() {
  sendMessage(message)
}
```

이벤트 핸들러는 반응형이 아니므로, `sendMessage(message)`는 사용자가 Send 버튼을 클릭할 때만 실행됩니다.

### Effect 안의 로직은 반응형입니다 {/_logic-inside-effects-is-reactive_/}

이제 다음 줄로 돌아와 봅시다:

```js [[2, 2, "roomId"]]
// ...
const connection = createConnection(serverUrl, roomId)
connection.connect()
// ...
```

사용자 관점에서, **`roomId`의 변경은 다른 방에 연결하고 싶다는 것을 _의미합니다._** 즉, 방에 연결하는 로직은 반응형이어야 합니다. 이 코드 줄들이 <CodeStep step={2}>반응형 값</CodeStep>을 "따라가며", 값이 다르면 다시 실행되기를 _원합니다_. 그래서 Effect에 속합니다:

```js {2-3}
useEffect(() => {
  const connection = createConnection(serverUrl, roomId)
  connection.connect()
  return () => {
    connection.disconnect()
  }
}, [roomId])
```

Effect는 반응형이므로, `createConnection(serverUrl, roomId)`와 `connection.connect()`는 `roomId`의 모든 고유한 값에 대해 실행됩니다. Effect가 채팅 연결을 현재 선택된 방에 동기화합니다.

## Effect에서 비반응형 로직 추출하기 {/_extracting-non-reactive-logic-out-of-effects_/}

반응형 로직과 비반응형 로직을 혼합하고 싶을 때 상황이 더 까다로워집니다.

예를 들어, 사용자가 채팅에 연결될 때 알림을 표시하고 싶다고 상상해 보세요. props에서 현재 테마(다크 또는 라이트)를 읽어서 올바른 색상으로 알림을 표시합니다:

```js {1,4-6}
function ChatRoom({ roomId, theme }) {
  useEffect(() => {
    const connection = createConnection(serverUrl, roomId);
    connection.on('connected', () => {
      showNotification('Connected!', theme);
    });
    connection.connect();
    // ...
```

하지만 `theme`는 반응형 값이고(리렌더링의 결과로 변경될 수 있음), [Effect가 읽는 모든 반응형 값은 의존성으로 선언해야 합니다.](/learn/lifecycle-of-reactive-effects#react-verifies-that-you-specified-every-reactive-value-as-a-dependency) 이제 `theme`를 Effect의 의존성으로 지정해야 합니다:

```js {5,11}
function ChatRoom({ roomId, theme }) {
  useEffect(() => {
    const connection = createConnection(serverUrl, roomId);
    connection.on('connected', () => {
      showNotification('Connected!', theme);
    });
    connection.connect();
    return () => {
      connection.disconnect()
    };
  }, [roomId, theme]); // ✅ 모든 의존성이 선언됨
  // ...
```

이 예제를 사용해 보고 사용자 경험에 어떤 문제가 있는지 찾아보세요:

<Sandpack>

```json package.json hidden
{
  "dependencies": {
    "react": "latest",
    "react-dom": "latest",
    "react-scripts": "latest",
    "toastify-js": "1.12.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test --env=jsdom",
    "eject": "react-scripts eject"
  }
}
```

```js
import { useState, useEffect } from 'react'
import { createConnection, sendMessage } from './chat.js'
import { showNotification } from './notifications.js'

const serverUrl = 'https://localhost:1234'

function ChatRoom({ roomId, theme }) {
  useEffect(() => {
    const connection = createConnection(serverUrl, roomId)
    connection.on('connected', () => {
      showNotification('Connected!', theme)
    })
    connection.connect()
    return () => connection.disconnect()
  }, [roomId, theme])

  return <h1>Welcome to the {roomId} room!</h1>
}

export default function App() {
  const [roomId, setRoomId] = useState('general')
  const [isDark, setIsDark] = useState(false)
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
      <label>
        <input
          type="checkbox"
          checked={isDark}
          onChange={(e) => setIsDark(e.target.checked)}
        />
        Use dark theme
      </label>
      <hr />
      <ChatRoom
        roomId={roomId}
        theme={isDark ? 'dark' : 'light'}
      />
    </>
  )
}
```

```js src/chat.js
export function createConnection(serverUrl, roomId) {
  // 실제 구현은 서버에 실제로 연결할 것입니다
  let connectedCallback
  let timeout
  return {
    connect() {
      timeout = setTimeout(() => {
        if (connectedCallback) {
          connectedCallback()
        }
      }, 100)
    },
    on(event, callback) {
      if (connectedCallback) {
        throw Error('Cannot add the handler twice.')
      }
      if (event !== 'connected') {
        throw Error('Only "connected" event is supported.')
      }
      connectedCallback = callback
    },
    disconnect() {
      clearTimeout(timeout)
    },
  }
}
```

```js src/notifications.js
import Toastify from 'toastify-js'
import 'toastify-js/src/toastify.css'

export function showNotification(message, theme) {
  Toastify({
    text: message,
    duration: 2000,
    gravity: 'top',
    position: 'right',
    style: {
      background: theme === 'dark' ? 'black' : 'white',
      color: theme === 'dark' ? 'white' : 'black',
    },
  }).showToast()
}
```

```css
label {
  display: block;
  margin-top: 10px;
}
```

</Sandpack>

`roomId`가 변경되면 예상대로 채팅이 다시 연결됩니다. 하지만 `theme`도 의존성이므로, 다크 테마와 라이트 테마를 전환할 때마다 채팅도 _다시_ 연결됩니다. 이것은 좋지 않습니다!

다시 말해, Effect(반응형) 안에 있지만, 이 줄이 반응형이기를 원하지 _않습니다_:

```js
// ...
showNotification('Connected!', theme)
// ...
```

이 비반응형 로직을 주변의 반응형 Effect에서 분리할 방법이 필요합니다.

### Effect Event 선언하기 {/_declaring-an-effect-event_/}

[`useEffectEvent`](/reference/react/useEffectEvent)라는 특별한 Hook을 사용하여 이 비반응형 로직을 Effect에서 추출합니다:

```js {1,4-6}
import { useEffect, useEffectEvent } from 'react';

function ChatRoom({ roomId, theme }) {
  const onConnected = useEffectEvent(() => {
    showNotification('Connected!', theme);
  });
  // ...
```

여기서 `onConnected`는 *Effect Event*라고 불립니다. Effect 로직의 일부이지만, 이벤트 핸들러와 훨씬 비슷하게 동작합니다. 안의 로직은 반응형이 아니며, 항상 props와 state의 최신 값을 "봅니다".

이제 Effect 안에서 `onConnected` Effect Event를 호출할 수 있습니다:

```js {2-4,9,13}
function ChatRoom({ roomId, theme }) {
  const onConnected = useEffectEvent(() => {
    showNotification('Connected!', theme);
  });

  useEffect(() => {
    const connection = createConnection(serverUrl, roomId);
    connection.on('connected', () => {
      onConnected();
    });
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]); // ✅ 모든 의존성이 선언됨
  // ...
```

이렇게 하면 문제가 해결됩니다. `theme`를 Effect의 의존성 목록에서 *제거*해야 했다는 점에 유의하세요. 더 이상 Effect에서 사용되지 않기 때문입니다. **Effect Event는 반응형이 아니며 의존성에서 생략해야 하므로** `onConnected`를 의존성에 *추가*할 필요도 없습니다.

새로운 동작이 예상대로 작동하는지 확인하세요:

<Sandpack>

```json package.json hidden
{
  "dependencies": {
    "react": "latest",
    "react-dom": "latest",
    "react-scripts": "latest",
    "toastify-js": "1.12.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test --env=jsdom",
    "eject": "react-scripts eject"
  }
}
```

```js
import { useState, useEffect } from 'react'
import { useEffectEvent } from 'react'
import { createConnection, sendMessage } from './chat.js'
import { showNotification } from './notifications.js'

const serverUrl = 'https://localhost:1234'

function ChatRoom({ roomId, theme }) {
  const onConnected = useEffectEvent(() => {
    showNotification('Connected!', theme)
  })

  useEffect(() => {
    const connection = createConnection(serverUrl, roomId)
    connection.on('connected', () => {
      onConnected()
    })
    connection.connect()
    return () => connection.disconnect()
  }, [roomId])

  return <h1>Welcome to the {roomId} room!</h1>
}

export default function App() {
  const [roomId, setRoomId] = useState('general')
  const [isDark, setIsDark] = useState(false)
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
      <label>
        <input
          type="checkbox"
          checked={isDark}
          onChange={(e) => setIsDark(e.target.checked)}
        />
        Use dark theme
      </label>
      <hr />
      <ChatRoom
        roomId={roomId}
        theme={isDark ? 'dark' : 'light'}
      />
    </>
  )
}
```

```js src/chat.js
export function createConnection(serverUrl, roomId) {
  // 실제 구현은 서버에 실제로 연결할 것입니다
  let connectedCallback
  let timeout
  return {
    connect() {
      timeout = setTimeout(() => {
        if (connectedCallback) {
          connectedCallback()
        }
      }, 100)
    },
    on(event, callback) {
      if (connectedCallback) {
        throw Error('Cannot add the handler twice.')
      }
      if (event !== 'connected') {
        throw Error('Only "connected" event is supported.')
      }
      connectedCallback = callback
    },
    disconnect() {
      clearTimeout(timeout)
    },
  }
}
```

```js src/notifications.js hidden
import Toastify from 'toastify-js'
import 'toastify-js/src/toastify.css'

export function showNotification(message, theme) {
  Toastify({
    text: message,
    duration: 2000,
    gravity: 'top',
    position: 'right',
    style: {
      background: theme === 'dark' ? 'black' : 'white',
      color: theme === 'dark' ? 'white' : 'black',
    },
  }).showToast()
}
```

```css
label {
  display: block;
  margin-top: 10px;
}
```

</Sandpack>

Effect Event는 이벤트 핸들러와 매우 유사합니다. 주요 차이점은 이벤트 핸들러는 사용자 상호작용에 대한 응답으로 실행되는 반면, Effect Event는 Effect에서 여러분이 트리거한다는 것입니다. Effect Event를 사용하면 Effect의 반응성과 반응형이어서는 안 되는 코드 사이의 "연결 고리를 끊을" 수 있습니다.

### Effect Event로 최신 props와 state 읽기 {/_reading-latest-props-and-state-with-effect-events_/}

Effect Event를 사용하면 의존성 린터를 억제하고 싶을 수 있는 많은 패턴을 수정할 수 있습니다.

예를 들어, 페이지 방문을 기록하는 Effect가 있다고 합시다:

```js
function Page() {
  useEffect(() => {
    logVisit()
  }, [])
  // ...
}
```

나중에 사이트에 여러 라우트를 추가합니다. 이제 `Page` 컴포넌트가 현재 경로가 담긴 `url` prop을 받습니다. `logVisit` 호출에 `url`을 전달하고 싶지만, 의존성 린터가 불만을 표시합니다:

```js {1,3}
function Page({ url }) {
  useEffect(() => {
    logVisit(url)
  }, []) // 🔴 React Hook useEffect has a missing dependency: 'url'
  // ...
}
```

코드가 무엇을 하길 원하는지 생각해 보세요. 각 URL이 다른 페이지를 나타내므로, 서로 다른 URL에 대해 별도의 방문을 기록하고 _싶습니다_. 즉, 이 `logVisit` 호출은 `url`에 대해 반응형이어야 _합니다_. 이 경우 의존성 린터를 따라 `url`을 의존성으로 추가하는 것이 합리적입니다:

```js {4}
function Page({ url }) {
  useEffect(() => {
    logVisit(url)
  }, [url]) // ✅ 모든 의존성이 선언됨
  // ...
}
```

이제 모든 페이지 방문에 장바구니의 항목 수를 포함하고 싶다고 합시다:

```js {2-3,6}
function Page({ url }) {
  const { items } = useContext(ShoppingCartContext)
  const numberOfItems = items.length

  useEffect(() => {
    logVisit(url, numberOfItems)
  }, [url]) // 🔴 React Hook useEffect has a missing dependency: 'numberOfItems'
  // ...
}
```

Effect 안에서 `numberOfItems`를 사용했으므로, 린터가 의존성으로 추가하라고 요청합니다. 하지만 `logVisit` 호출이 `numberOfItems`에 대해 반응형이기를 원하지 _않습니다_. 사용자가 장바구니에 무언가를 넣어서 `numberOfItems`가 변경되더라도, 이것이 사용자가 페이지를 다시 방문했다는 것을 _의미하지 않습니다_. 다시 말해, *페이지 방문*은 어떤 의미에서 "이벤트"입니다. 정확한 시점에 발생합니다.

코드를 두 부분으로 나누세요:

```js {5-7,10}
function Page({ url }) {
  const { items } = useContext(ShoppingCartContext)
  const numberOfItems = items.length

  const onVisit = useEffectEvent((visitedUrl) => {
    logVisit(visitedUrl, numberOfItems)
  })

  useEffect(() => {
    onVisit(url)
  }, [url]) // ✅ 모든 의존성이 선언됨
  // ...
}
```

여기서 `onVisit`은 Effect Event입니다. 안의 코드는 반응형이 아닙니다. 따라서 `numberOfItems`(또는 다른 반응형 값!)를 사용해도 주변 코드가 변경에 따라 다시 실행될 것을 걱정하지 않아도 됩니다.

반면, Effect 자체는 반응형으로 유지됩니다. Effect 안의 코드는 `url` prop을 사용하므로, 다른 `url`로 리렌더링될 때마다 Effect가 다시 실행됩니다. 이는 차례로 `onVisit` Effect Event를 호출합니다.

결과적으로 `url`이 변경될 때마다 `logVisit`이 호출되고, 항상 최신 `numberOfItems`를 읽습니다. 하지만 `numberOfItems`가 단독으로 변경되면 어떤 코드도 다시 실행되지 않습니다.

<Note>

인자 없이 `onVisit()`을 호출하고 안에서 `url`을 읽을 수 있지 않을까 궁금할 수 있습니다:

```js {2,6}
const onVisit = useEffectEvent(() => {
  logVisit(url, numberOfItems)
})

useEffect(() => {
  onVisit()
}, [url])
```

이것도 작동하지만, `url`을 Effect Event에 명시적으로 전달하는 것이 더 좋습니다. **`url`을 Effect Event의 인자로 전달함으로써, 다른 `url`로의 페이지 방문이 사용자 관점에서 별도의 "이벤트"라고 말하는 것입니다.** `visitedUrl`은 발생한 "이벤트"의 *일부*입니다:

```js {1-2,6}
const onVisit = useEffectEvent((visitedUrl) => {
  logVisit(visitedUrl, numberOfItems)
})

useEffect(() => {
  onVisit(url)
}, [url])
```

Effect Event가 `visitedUrl`을 명시적으로 "요청"하므로, 실수로 Effect의 의존성에서 `url`을 제거할 수 없습니다. `url` 의존성을 제거하면(별개의 페이지 방문이 하나로 카운트되게 됨) 린터가 경고합니다. `onVisit`이 `url`에 대해 반응형이기를 원하므로, 안에서 `url`을 읽는 대신(반응형이 아닌 곳에서), Effect에서 _전달합니다_.

이것은 Effect 안에 비동기 로직이 있을 때 특히 중요해집니다:

```js {6,8}
const onVisit = useEffectEvent((visitedUrl) => {
  logVisit(visitedUrl, numberOfItems)
})

useEffect(() => {
  setTimeout(() => {
    onVisit(url)
  }, 5000) // 방문 로깅 지연
}, [url])
```

여기서 `onVisit` 안의 `url`은 _최신_ `url`에 해당하지만(이미 변경되었을 수 있음), `visitedUrl`은 이 Effect(와 이 `onVisit` 호출)를 원래 유발한 `url`에 해당합니다.

</Note>

<DeepDive>

#### 대신 의존성 린터를 억제해도 되나요? {/_is-it-okay-to-suppress-the-dependency-linter-instead_/}

기존 코드베이스에서 린트 규칙이 다음과 같이 억제된 것을 볼 수 있습니다:

```js {expectedErrors: {'react-compiler': [8]}} {7-9}
function Page({ url }) {
  const { items } = useContext(ShoppingCartContext)
  const numberOfItems = items.length

  useEffect(() => {
    logVisit(url, numberOfItems)
    // 🔴 이렇게 린터를 억제하지 마세요:
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])
  // ...
}
```

**린터를 절대 억제하지 않는 것**을 권장합니다.

규칙을 억제하면 첫 번째 단점은, 코드에 새로운 반응형 의존성을 도입했을 때 Effect가 그것에 "반응"해야 한다는 경고를 React가 더 이상 보여주지 않는다는 것입니다. 앞선 예제에서 React가 알려주었기 _때문에_ 의존성에 `url`을 추가했습니다. 린터를 비활성화하면 해당 Effect에 대한 향후 편집에 대해 더 이상 그런 알림을 받지 못합니다. 이것은 버그로 이어집니다.

여기 린터를 억제해서 발생하는 혼란스러운 버그의 예가 있습니다. 이 예제에서 `handleMove` 함수는 현재 `canMove` state 변수 값을 읽어서 점이 커서를 따라가야 하는지 결정해야 합니다. 하지만 `handleMove` 안에서 `canMove`는 항상 `true`입니다.

왜 그런지 알 수 있나요?

<Sandpack>

```js {expectedErrors: {'react-compiler': [16]}}
import { useState, useEffect } from 'react'

export default function App() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [canMove, setCanMove] = useState(true)

  function handleMove(e) {
    if (canMove) {
      setPosition({ x: e.clientX, y: e.clientY })
    }
  }

  useEffect(() => {
    window.addEventListener('pointermove', handleMove)
    return () => window.removeEventListener('pointermove', handleMove)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <label>
        <input
          type="checkbox"
          checked={canMove}
          onChange={(e) => setCanMove(e.target.checked)}
        />
        The dot is allowed to move
      </label>
      <hr />
      <div
        style={{
          position: 'absolute',
          backgroundColor: 'pink',
          borderRadius: '50%',
          opacity: 0.6,
          transform: `translate(${position.x}px, ${position.y}px)`,
          pointerEvents: 'none',
          left: -20,
          top: -20,
          width: 40,
          height: 40,
        }}
      />
    </>
  )
}
```

```css
body {
  height: 200px;
}
```

</Sandpack>

이 코드의 문제는 의존성 린터를 억제한 것입니다. 억제를 제거하면, 이 Effect가 `handleMove` 함수에 의존해야 한다는 것을 알 수 있습니다. 이것은 타당합니다: `handleMove`는 컴포넌트 본문 안에 선언되어 있으므로 반응형 값입니다. 모든 반응형 값은 의존성으로 지정해야 하며, 그렇지 않으면 시간이 지남에 따라 오래된 값이 될 수 있습니다!

원래 코드의 작성자가 Effect가 어떤 반응형 값에도 의존하지 않는다고(`[]`) React에 "거짓말"을 한 것입니다. 이것이 `canMove`가 변경된 후(그리고 `handleMove`도 함께) React가 Effect를 재동기화하지 않은 이유입니다. React가 Effect를 재동기화하지 않았으므로, 리스너로 연결된 `handleMove`는 초기 렌더링 중에 생성된 `handleMove` 함수입니다. 초기 렌더링 중에 `canMove`는 `true`였으므로, 초기 렌더링의 `handleMove`는 영원히 그 값을 봅니다.

**린터를 절대 억제하지 않으면, 오래된 값으로 인한 문제를 절대 겪지 않습니다.**

`useEffectEvent`를 사용하면, 린터에 "거짓말"할 필요가 없으며 코드가 예상대로 작동합니다:

<Sandpack>

```js
import { useState, useEffect } from 'react'
import { useEffectEvent } from 'react'

export default function App() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [canMove, setCanMove] = useState(true)

  const onMove = useEffectEvent((e) => {
    if (canMove) {
      setPosition({ x: e.clientX, y: e.clientY })
    }
  })

  useEffect(() => {
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  return (
    <>
      <label>
        <input
          type="checkbox"
          checked={canMove}
          onChange={(e) => setCanMove(e.target.checked)}
        />
        The dot is allowed to move
      </label>
      <hr />
      <div
        style={{
          position: 'absolute',
          backgroundColor: 'pink',
          borderRadius: '50%',
          opacity: 0.6,
          transform: `translate(${position.x}px, ${position.y}px)`,
          pointerEvents: 'none',
          left: -20,
          top: -20,
          width: 40,
          height: 40,
        }}
      />
    </>
  )
}
```

```css
body {
  height: 200px;
}
```

</Sandpack>

이것이 `useEffectEvent`가 _항상_ 올바른 해결책이라는 의미는 아닙니다. 반응형이기를 원하지 않는 코드 줄에만 적용해야 합니다. 위 샌드박스에서 Effect의 코드가 `canMove`에 대해 반응형이기를 원하지 않았습니다. 그래서 Effect Event를 추출하는 것이 합리적이었습니다.

린터를 억제하는 다른 올바른 대안에 대해서는 [Effect 의존성 제거하기](/learn/removing-effect-dependencies)를 읽어보세요.

</DeepDive>

### Effect Event의 제한사항 {/_limitations-of-effect-events_/}

Effect Event는 사용 방법에 제한이 있습니다:

- **Effect 안에서만 호출하세요.**
- **다른 컴포넌트나 Hook에 절대 전달하지 마세요.**

예를 들어, 다음과 같이 Effect Event를 선언하고 전달하지 마세요:

```js {4-6,8}
function Timer() {
  const [count, setCount] = useState(0)

  const onTick = useEffectEvent(() => {
    setCount(count + 1)
  })

  useTimer(onTick, 1000) // 🔴 피하세요: Effect Event 전달

  return <h1>{count}</h1>
}

function useTimer(callback, delay) {
  useEffect(() => {
    const id = setInterval(() => {
      callback()
    }, delay)
    return () => {
      clearInterval(id)
    }
  }, [delay, callback]) // "callback"을 의존성에 지정해야 함
}
```

대신, Effect Event를 사용하는 Effect 바로 옆에 항상 선언하세요:

```js {10-12,16,21}
function Timer() {
  const [count, setCount] = useState(0)
  useTimer(() => {
    setCount(count + 1)
  }, 1000)
  return <h1>{count}</h1>
}

function useTimer(callback, delay) {
  const onTick = useEffectEvent(() => {
    callback()
  })

  useEffect(() => {
    const id = setInterval(() => {
      onTick() // ✅ 좋습니다: Effect 안에서 로컬로만 호출
    }, delay)
    return () => {
      clearInterval(id)
    }
  }, [delay]) // "onTick"(Effect Event)을 의존성으로 지정할 필요 없음
}
```

Effect Event는 Effect 코드의 비반응형 "조각"입니다. 이를 사용하는 Effect 옆에 있어야 합니다.

<Recap>

- 이벤트 핸들러는 특정 상호작용에 대한 응답으로 실행됩니다.
- Effect는 동기화가 필요할 때마다 실행됩니다.
- 이벤트 핸들러 안의 로직은 반응형이 아닙니다.
- Effect 안의 로직은 반응형입니다.
- 비반응형 로직을 Effect에서 Effect Event로 옮길 수 있습니다.
- Effect Event는 Effect 안에서만 호출하세요.
- Effect Event를 다른 컴포넌트나 Hook에 전달하지 마세요.

</Recap>
