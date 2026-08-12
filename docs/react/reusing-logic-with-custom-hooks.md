---
title: '커스텀 Hook으로 로직 재사용하기'
---

<Intro>

React에는 `useState`, `useContext`, `useEffect` 같은 내장 Hook이 있습니다. 때때로 더 구체적인 목적을 위한 Hook이 있었으면 좋겠다고 생각할 수 있습니다. 예를 들어, 데이터를 가져오거나, 사용자가 온라인인지 추적하거나, 채팅방에 연결하는 것 등입니다. React에서 이런 Hook을 찾지 못할 수도 있지만, 애플리케이션의 필요에 맞게 직접 Hook을 만들 수 있습니다.

</Intro>

<YouWillLearn>

- 커스텀 Hook이 무엇이고, 직접 작성하는 방법
- 컴포넌트 간에 로직을 재사용하는 방법
- 커스텀 Hook의 이름 짓기와 구조화 방법
- 커스텀 Hook을 추출해야 하는 시점과 이유

</YouWillLearn>

## 커스텀 Hook: 컴포넌트 간 로직 공유 {/_custom-hooks-sharing-logic-between-components_/}

네트워크에 크게 의존하는 앱을 개발하고 있다고 상상해 보세요(대부분의 앱이 그렇습니다). 사용자가 앱을 사용하는 동안 네트워크 연결이 실수로 끊어지면 경고하고 싶습니다. 어떻게 하시겠습니까? 컴포넌트에 두 가지가 필요한 것 같습니다:

1. 네트워크가 온라인인지 추적하는 state.
2. 전역 [`online`](https://developer.mozilla.org/en-US/docs/Web/API/Window/online_event) 및 [`offline`](https://developer.mozilla.org/en-US/docs/Web/API/Window/offline_event) 이벤트를 구독하고 해당 state를 업데이트하는 Effect.

이렇게 하면 컴포넌트가 네트워크 상태와 [동기화](/learn/synchronizing-with-effects)된 상태를 유지합니다. 다음과 같이 시작할 수 있습니다:

<Sandpack>

```js
import { useState, useEffect } from 'react'

export default function StatusBar() {
  const [isOnline, setIsOnline] = useState(true)
  useEffect(() => {
    function handleOnline() {
      setIsOnline(true)
    }
    function handleOffline() {
      setIsOnline(false)
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return <h1>{isOnline ? '✅ Online' : '❌ Disconnected'}</h1>
}
```

</Sandpack>

네트워크를 켜고 끄면서 이 `StatusBar`가 여러분의 동작에 반응하여 업데이트되는 것을 확인해 보세요.

이제 다른 컴포넌트에서도 같은 로직을 사용하고 싶다고 상상해 보세요. 네트워크가 꺼져 있는 동안 "Save" 대신 "Reconnecting..."을 표시하고 비활성화되는 저장 버튼을 구현하고 싶습니다.

시작으로, `isOnline` state와 Effect를 `SaveButton`에 복사하여 붙여넣을 수 있습니다:

<Sandpack>

```js
import { useState, useEffect } from 'react'

export default function SaveButton() {
  const [isOnline, setIsOnline] = useState(true)
  useEffect(() => {
    function handleOnline() {
      setIsOnline(true)
    }
    function handleOffline() {
      setIsOnline(false)
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  function handleSaveClick() {
    console.log('✅ Progress saved')
  }

  return (
    <button
      disabled={!isOnline}
      onClick={handleSaveClick}
    >
      {isOnline ? 'Save progress' : 'Reconnecting...'}
    </button>
  )
}
```

</Sandpack>

네트워크를 끄면 버튼의 외관이 변경되는지 확인해 보세요.

이 두 컴포넌트는 잘 작동하지만, 둘 사이의 로직 중복이 아쉽습니다. *시각적 외관*은 다르지만, 둘 사이의 로직을 재사용하고 싶습니다.

### 컴포넌트에서 커스텀 Hook 추출하기 {/_extracting-your-own-custom-hook-from-a-component_/}

[`useState`](/reference/react/useState)와 [`useEffect`](/reference/react/useEffect)처럼 내장 `useOnlineStatus` Hook이 있다고 잠시 상상해 보세요. 그러면 두 컴포넌트를 모두 단순화하고 둘 사이의 중복을 제거할 수 있습니다:

```js {2,7}
function StatusBar() {
  const isOnline = useOnlineStatus()
  return <h1>{isOnline ? '✅ Online' : '❌ Disconnected'}</h1>
}

function SaveButton() {
  const isOnline = useOnlineStatus()

  function handleSaveClick() {
    console.log('✅ Progress saved')
  }

  return (
    <button
      disabled={!isOnline}
      onClick={handleSaveClick}
    >
      {isOnline ? 'Save progress' : 'Reconnecting...'}
    </button>
  )
}
```

이런 내장 Hook은 없지만 직접 작성할 수 있습니다. `useOnlineStatus`라는 함수를 선언하고 앞서 작성한 컴포넌트들에서 중복된 모든 코드를 이 함수로 옮기세요:

```js {2-16}
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)
  useEffect(() => {
    function handleOnline() {
      setIsOnline(true)
    }
    function handleOffline() {
      setIsOnline(false)
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  return isOnline
}
```

함수 끝에서 `isOnline`을 반환합니다. 이렇게 하면 컴포넌트가 그 값을 읽을 수 있습니다:

<Sandpack>

```js
import { useOnlineStatus } from './useOnlineStatus.js'

function StatusBar() {
  const isOnline = useOnlineStatus()
  return <h1>{isOnline ? '✅ Online' : '❌ Disconnected'}</h1>
}

function SaveButton() {
  const isOnline = useOnlineStatus()

  function handleSaveClick() {
    console.log('✅ Progress saved')
  }

  return (
    <button
      disabled={!isOnline}
      onClick={handleSaveClick}
    >
      {isOnline ? 'Save progress' : 'Reconnecting...'}
    </button>
  )
}

export default function App() {
  return (
    <>
      <SaveButton />
      <StatusBar />
    </>
  )
}
```

```js src/useOnlineStatus.js
import { useState, useEffect } from 'react'

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)
  useEffect(() => {
    function handleOnline() {
      setIsOnline(true)
    }
    function handleOffline() {
      setIsOnline(false)
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  return isOnline
}
```

</Sandpack>

네트워크를 켜고 끄면 두 컴포넌트가 모두 업데이트되는지 확인하세요.

이제 컴포넌트에 반복적인 로직이 많지 않습니다. **더 중요한 것은, 내부의 코드가 _어떻게 하는지_(브라우저 이벤트를 구독하여)가 아니라 _무엇을 하고 싶은지_(온라인 상태를 사용!)를 설명한다는 것입니다.**

로직을 커스텀 Hook으로 추출하면, 외부 시스템이나 브라우저 API를 다루는 지저분한 세부사항을 숨길 수 있습니다. 컴포넌트의 코드는 구현이 아닌 의도를 표현합니다.

### Hook 이름은 항상 `use`로 시작합니다 {/_hook-names-always-start-with-use_/}

React 애플리케이션은 컴포넌트로 구성됩니다. 컴포넌트는 내장이든 커스텀이든 Hook으로 구성됩니다. 다른 사람이 만든 커스텀 Hook을 자주 사용하게 되지만, 가끔 직접 작성하기도 합니다!

다음 이름 규칙을 따라야 합니다:

1. **React 컴포넌트 이름은 대문자로 시작해야 합니다.** `StatusBar`나 `SaveButton`처럼요. React 컴포넌트는 JSX 조각처럼 React가 표시할 수 있는 것을 반환해야 합니다.
2. **Hook 이름은 `use`로 시작하고 그 뒤에 대문자가 와야 합니다.** [`useState`](/reference/react/useState)(내장) 또는 `useOnlineStatus`(커스텀, 앞서 본 것처럼)처럼요. Hook은 임의의 값을 반환할 수 있습니다.

이 규칙은 컴포넌트를 보고 state, Effect, 기타 React 기능이 어디에 "숨어" 있을 수 있는지 항상 알 수 있도록 보장합니다. 예를 들어, 컴포넌트 안에서 `getColor()` 함수 호출을 보면, 이름이 `use`로 시작하지 않으므로 안에 React state가 포함될 수 없다는 것을 확신할 수 있습니다. 하지만 `useOnlineStatus()` 같은 함수 호출은 내부에 다른 Hook 호출이 포함되어 있을 가능성이 높습니다!

<Note>

린터가 [React용으로 구성](/learn/editor-setup#linting)되어 있다면 이 이름 규칙을 강제합니다. 위 샌드박스로 스크롤하여 `useOnlineStatus`를 `getOnlineStatus`로 이름을 바꿔 보세요. 린터가 더 이상 안에서 `useState`나 `useEffect`를 호출할 수 없게 하는 것을 확인할 수 있습니다. Hook과 컴포넌트만 다른 Hook을 호출할 수 있습니다!

</Note>

<DeepDive>

#### 렌더링 중에 호출되는 모든 함수가 use 접두사로 시작해야 하나요? {/_should-all-functions-called-during-rendering-start-with-the-use-prefix_/}

아닙니다. Hook을 *호출*하지 않는 함수는 Hook이 _될_ 필요가 없습니다.

함수가 어떤 Hook도 호출하지 않는다면 `use` 접두사를 피하세요. 대신 `use` 접두사 _없이_ 일반 함수로 작성하세요. 예를 들어, 아래의 `useSorted`는 Hook을 호출하지 않으므로 `getSorted`로 부르세요:

```js
// 🔴 피하세요: Hook을 사용하지 않는 Hook
function useSorted(items) {
  return items.slice().sort()
}

// ✅ 좋습니다: Hook을 사용하지 않는 일반 함수
function getSorted(items) {
  return items.slice().sort()
}
```

이렇게 하면 조건문 안을 포함하여 어디서든 이 일반 함수를 호출할 수 있습니다:

```js
function List({ items, shouldSort }) {
  let displayedItems = items
  if (shouldSort) {
    // ✅ Hook이 아니므로 조건부로 getSorted()를 호출해도 괜찮습니다
    displayedItems = getSorted(items)
  }
  // ...
}
```

함수 안에서 하나 이상의 Hook을 사용한다면 `use` 접두사를 부여해야 합니다(즉, Hook으로 만들어야 합니다):

```js
// ✅ 좋습니다: 다른 Hook을 사용하는 Hook
function useAuth() {
  return useContext(Auth)
}
```

기술적으로, 이것은 React에 의해 강제되지 않습니다. 원칙적으로 다른 Hook을 호출하지 않는 Hook을 만들 수 있습니다. 이것은 종종 혼란스럽고 제한적이므로 그 패턴을 피하는 것이 좋습니다. 하지만 유용한 드문 경우가 있을 수 있습니다. 예를 들어, 함수가 지금은 Hook을 사용하지 않지만 나중에 Hook 호출을 추가할 계획이라면, `use` 접두사로 이름을 짓는 것이 합리적입니다:

```js {3-4}
// ✅ 좋습니다: 나중에 다른 Hook을 사용할 가능성이 있는 Hook
function useAuth() {
  // TODO: 인증이 구현되면 이 줄로 교체:
  // return useContext(Auth);
  return TEST_USER
}
```

그러면 컴포넌트가 조건부로 호출할 수 없게 됩니다. 이것은 실제로 안에 Hook 호출을 추가할 때 중요해집니다. 안에서 Hook을 사용할 계획이 없다면(지금이든 나중이든) Hook으로 만들지 마세요.

</DeepDive>

### 커스텀 Hook은 상태 유지 로직을 공유하지, state 자체를 공유하지 않습니다 {/_custom-hooks-let-you-share-stateful-logic-not-state-itself_/}

앞선 예제에서 네트워크를 켜고 끌 때 두 컴포넌트가 함께 업데이트되었습니다. 하지만 하나의 `isOnline` state 변수가 둘 사이에 공유된다고 생각하면 잘못입니다. 이 코드를 보세요:

```js {2,7}
function StatusBar() {
  const isOnline = useOnlineStatus()
  // ...
}

function SaveButton() {
  const isOnline = useOnlineStatus()
  // ...
}
```

중복을 추출하기 전과 같은 방식으로 작동합니다:

```js {2-5,10-13}
function StatusBar() {
  const [isOnline, setIsOnline] = useState(true)
  useEffect(() => {
    // ...
  }, [])
  // ...
}

function SaveButton() {
  const [isOnline, setIsOnline] = useState(true)
  useEffect(() => {
    // ...
  }, [])
  // ...
}
```

이들은 완전히 독립적인 두 개의 state 변수와 Effect입니다! 같은 외부 값(네트워크가 켜져 있는지)과 동기화했기 때문에 같은 시점에 같은 값을 가진 것뿐입니다.

더 잘 설명하기 위해 다른 예제가 필요합니다. 다음 `Form` 컴포넌트를 보세요:

<Sandpack>

```js
import { useState } from 'react'

export default function Form() {
  const [firstName, setFirstName] = useState('Mary')
  const [lastName, setLastName] = useState('Poppins')

  function handleFirstNameChange(e) {
    setFirstName(e.target.value)
  }

  function handleLastNameChange(e) {
    setLastName(e.target.value)
  }

  return (
    <>
      <label>
        First name:
        <input
          value={firstName}
          onChange={handleFirstNameChange}
        />
      </label>
      <label>
        Last name:
        <input
          value={lastName}
          onChange={handleLastNameChange}
        />
      </label>
      <p>
        <b>
          Good morning, {firstName} {lastName}.
        </b>
      </p>
    </>
  )
}
```

```css
label {
  display: block;
}
input {
  margin-left: 10px;
}
```

</Sandpack>

각 폼 필드에 반복적인 로직이 있습니다:

1. state 조각 (`firstName`과 `lastName`).
1. 변경 핸들러 (`handleFirstNameChange`와 `handleLastNameChange`).
1. 해당 입력의 `value`와 `onChange` 속성을 지정하는 JSX 조각.

반복적인 로직을 이 `useFormInput` 커스텀 Hook으로 추출할 수 있습니다:

<Sandpack>

```js
import { useFormInput } from './useFormInput.js'

export default function Form() {
  const firstNameProps = useFormInput('Mary')
  const lastNameProps = useFormInput('Poppins')

  return (
    <>
      <label>
        First name:
        <input {...firstNameProps} />
      </label>
      <label>
        Last name:
        <input {...lastNameProps} />
      </label>
      <p>
        <b>
          Good morning, {firstNameProps.value} {lastNameProps.value}.
        </b>
      </p>
    </>
  )
}
```

```js src/useFormInput.js active
import { useState } from 'react'

export function useFormInput(initialValue) {
  const [value, setValue] = useState(initialValue)

  function handleChange(e) {
    setValue(e.target.value)
  }

  const inputProps = {
    value: value,
    onChange: handleChange,
  }

  return inputProps
}
```

```css
label {
  display: block;
}
input {
  margin-left: 10px;
}
```

</Sandpack>

`value`라는 state 변수를 _하나만_ 선언하는 것에 주목하세요.

하지만 `Form` 컴포넌트는 `useFormInput`을 _두 번_ 호출합니다:

```js
function Form() {
  const firstNameProps = useFormInput('Mary');
  const lastNameProps = useFormInput('Poppins');
  // ...
```

이것이 두 개의 별도 state 변수를 선언한 것처럼 작동하는 이유입니다!

**커스텀 Hook은 _상태 유지 로직(stateful logic)_ 을 공유하지, *state 자체*를 공유하지 않습니다. Hook에 대한 각 호출은 같은 Hook에 대한 다른 모든 호출과 완전히 독립적입니다.** 이것이 위의 두 샌드박스가 완전히 동일한 이유입니다. 원한다면 위로 스크롤하여 비교해 보세요. 커스텀 Hook을 추출하기 전후의 동작은 동일합니다.

여러 컴포넌트 간에 state 자체를 공유해야 한다면, [끌어올리고 내려보내세요.](/learn/sharing-state-between-components)

## Hook 간에 반응형 값 전달하기 {/_passing-reactive-values-between-hooks_/}

커스텀 Hook 안의 코드는 컴포넌트가 리렌더링될 때마다 다시 실행됩니다. 이것이 컴포넌트처럼 커스텀 Hook도 [순수해야](/learn/keeping-components-pure) 하는 이유입니다. 커스텀 Hook의 코드를 컴포넌트 본문의 일부라고 생각하세요!

커스텀 Hook은 컴포넌트와 함께 리렌더링되므로, 항상 최신 props와 state를 받습니다. 이것이 무엇을 의미하는지 보려면 이 채팅방 예제를 살펴보세요. 서버 URL이나 채팅방을 변경해 보세요:

<Sandpack>

```js src/App.js
import { useState } from 'react'
import ChatRoom from './ChatRoom.js'

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

```js src/ChatRoom.js active
import { useState, useEffect } from 'react'
import { createConnection } from './chat.js'
import { showNotification } from './notifications.js'

export default function ChatRoom({ roomId }) {
  const [serverUrl, setServerUrl] = useState('https://localhost:1234')

  useEffect(() => {
    const options = {
      serverUrl: serverUrl,
      roomId: roomId,
    }
    const connection = createConnection(options)
    connection.on('message', (msg) => {
      showNotification('New message: ' + msg)
    })
    connection.connect()
    return () => connection.disconnect()
  }, [roomId, serverUrl])

  return (
    <>
      <label>
        Server URL:
        <input
          value={serverUrl}
          onChange={(e) => setServerUrl(e.target.value)}
        />
      </label>
      <h1>Welcome to the {roomId} room!</h1>
    </>
  )
}
```

```js src/chat.js
export function createConnection({ serverUrl, roomId }) {
  // 실제 구현은 서버에 실제로 연결할 것입니다
  if (typeof serverUrl !== 'string') {
    throw Error('Expected serverUrl to be a string. Received: ' + serverUrl)
  }
  if (typeof roomId !== 'string') {
    throw Error('Expected roomId to be a string. Received: ' + roomId)
  }
  let intervalId
  let messageCallback
  return {
    connect() {
      console.log('✅ Connecting to "' + roomId + '" room at ' + serverUrl + '...')
      clearInterval(intervalId)
      intervalId = setInterval(() => {
        if (messageCallback) {
          if (Math.random() > 0.5) {
            messageCallback('hey')
          } else {
            messageCallback('lol')
          }
        }
      }, 3000)
    },
    disconnect() {
      clearInterval(intervalId)
      messageCallback = null
      console.log('❌ Disconnected from "' + roomId + '" room at ' + serverUrl + '')
    },
    on(event, callback) {
      if (messageCallback) {
        throw Error('Cannot add the handler twice.')
      }
      if (event !== 'message') {
        throw Error('Only "message" event is supported.')
      }
      messageCallback = callback
    },
  }
}
```

```js src/notifications.js
import Toastify from 'toastify-js'
import 'toastify-js/src/toastify.css'

export function showNotification(message, theme = 'dark') {
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

`serverUrl`이나 `roomId`를 변경하면 Effect가 [변경에 "반응"하여](/learn/lifecycle-of-reactive-effects#effects-react-to-reactive-values) 재동기화합니다. Effect의 의존성을 변경할 때마다 채팅이 다시 연결되는 것을 콘솔 메시지에서 확인할 수 있습니다.

이제 Effect의 코드를 커스텀 Hook으로 옮기세요:

```js {2-13}
export function useChatRoom({ serverUrl, roomId }) {
  useEffect(() => {
    const options = {
      serverUrl: serverUrl,
      roomId: roomId,
    }
    const connection = createConnection(options)
    connection.connect()
    connection.on('message', (msg) => {
      showNotification('New message: ' + msg)
    })
    return () => connection.disconnect()
  }, [roomId, serverUrl])
}
```

이렇게 하면 `ChatRoom` 컴포넌트가 내부 작동 방식을 걱정하지 않고 커스텀 Hook을 호출할 수 있습니다:

```js {4-7}
export default function ChatRoom({ roomId }) {
  const [serverUrl, setServerUrl] = useState('https://localhost:1234')

  useChatRoom({
    roomId: roomId,
    serverUrl: serverUrl,
  })

  return (
    <>
      <label>
        Server URL:
        <input
          value={serverUrl}
          onChange={(e) => setServerUrl(e.target.value)}
        />
      </label>
      <h1>Welcome to the {roomId} room!</h1>
    </>
  )
}
```

훨씬 간단해 보입니다! (하지만 같은 일을 합니다.)

로직이 여전히 prop과 state 변경에 *반응*하는 것에 주목하세요. 서버 URL이나 선택된 방을 편집해 보세요:

<Sandpack>

```js src/App.js
import { useState } from 'react'
import ChatRoom from './ChatRoom.js'

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

```js src/ChatRoom.js active
import { useState } from 'react'
import { useChatRoom } from './useChatRoom.js'

export default function ChatRoom({ roomId }) {
  const [serverUrl, setServerUrl] = useState('https://localhost:1234')

  useChatRoom({
    roomId: roomId,
    serverUrl: serverUrl,
  })

  return (
    <>
      <label>
        Server URL:
        <input
          value={serverUrl}
          onChange={(e) => setServerUrl(e.target.value)}
        />
      </label>
      <h1>Welcome to the {roomId} room!</h1>
    </>
  )
}
```

```js src/useChatRoom.js
import { useEffect } from 'react'
import { createConnection } from './chat.js'
import { showNotification } from './notifications.js'

export function useChatRoom({ serverUrl, roomId }) {
  useEffect(() => {
    const options = {
      serverUrl: serverUrl,
      roomId: roomId,
    }
    const connection = createConnection(options)
    connection.connect()
    connection.on('message', (msg) => {
      showNotification('New message: ' + msg)
    })
    return () => connection.disconnect()
  }, [roomId, serverUrl])
}
```

```js src/chat.js
export function createConnection({ serverUrl, roomId }) {
  // 실제 구현은 서버에 실제로 연결할 것입니다
  if (typeof serverUrl !== 'string') {
    throw Error('Expected serverUrl to be a string. Received: ' + serverUrl)
  }
  if (typeof roomId !== 'string') {
    throw Error('Expected roomId to be a string. Received: ' + roomId)
  }
  let intervalId
  let messageCallback
  return {
    connect() {
      console.log('✅ Connecting to "' + roomId + '" room at ' + serverUrl + '...')
      clearInterval(intervalId)
      intervalId = setInterval(() => {
        if (messageCallback) {
          if (Math.random() > 0.5) {
            messageCallback('hey')
          } else {
            messageCallback('lol')
          }
        }
      }, 3000)
    },
    disconnect() {
      clearInterval(intervalId)
      messageCallback = null
      console.log('❌ Disconnected from "' + roomId + '" room at ' + serverUrl + '')
    },
    on(event, callback) {
      if (messageCallback) {
        throw Error('Cannot add the handler twice.')
      }
      if (event !== 'message') {
        throw Error('Only "message" event is supported.')
      }
      messageCallback = callback
    },
  }
}
```

```js src/notifications.js
import Toastify from 'toastify-js'
import 'toastify-js/src/toastify.css'

export function showNotification(message, theme = 'dark') {
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

하나의 Hook의 반환값을:

```js {2}
export default function ChatRoom({ roomId }) {
  const [serverUrl, setServerUrl] = useState('https://localhost:1234');

  useChatRoom({
    roomId: roomId,
    serverUrl: serverUrl
  });
  // ...
```

다른 Hook의 입력으로 전달하는 방식에 주목하세요:

```js {6}
export default function ChatRoom({ roomId }) {
  const [serverUrl, setServerUrl] = useState('https://localhost:1234');

  useChatRoom({
    roomId: roomId,
    serverUrl: serverUrl
  });
  // ...
```

`ChatRoom` 컴포넌트가 리렌더링될 때마다 최신 `roomId`와 `serverUrl`을 Hook에 전달합니다. 이것이 리렌더링 후 값이 다를 때마다 Effect가 채팅에 다시 연결하는 이유입니다. (오디오나 비디오 처리 소프트웨어를 다뤄본 적이 있다면, 이렇게 Hook을 체이닝하는 것이 시각 또는 오디오 이펙트를 체이닝하는 것을 떠올리게 할 수 있습니다. 마치 `useState`의 출력이 `useChatRoom`의 입력으로 "공급되는" 것과 같습니다.)

### 커스텀 Hook에 이벤트 핸들러 전달하기 {/_passing-event-handlers-to-custom-hooks_/}

`useChatRoom`을 더 많은 컴포넌트에서 사용하기 시작하면, 컴포넌트가 동작을 커스터마이징할 수 있도록 하고 싶을 수 있습니다. 예를 들어, 현재 메시지가 도착했을 때 무엇을 할지의 로직이 Hook 안에 하드코딩되어 있습니다:

```js {9-11}
export function useChatRoom({ serverUrl, roomId }) {
  useEffect(() => {
    const options = {
      serverUrl: serverUrl,
      roomId: roomId,
    }
    const connection = createConnection(options)
    connection.connect()
    connection.on('message', (msg) => {
      showNotification('New message: ' + msg)
    })
    return () => connection.disconnect()
  }, [roomId, serverUrl])
}
```

이 로직을 컴포넌트로 다시 옮기고 싶다고 합시다:

```js {7-9}
export default function ChatRoom({ roomId }) {
  const [serverUrl, setServerUrl] = useState('https://localhost:1234');

  useChatRoom({
    roomId: roomId,
    serverUrl: serverUrl,
    onReceiveMessage(msg) {
      showNotification('New message: ' + msg);
    }
  });
  // ...
```

이것이 작동하도록 하려면, 커스텀 Hook이 `onReceiveMessage`를 명명된 옵션 중 하나로 받도록 변경합니다:

```js {1,10,13}
export function useChatRoom({ serverUrl, roomId, onReceiveMessage }) {
  useEffect(() => {
    const options = {
      serverUrl: serverUrl,
      roomId: roomId,
    }
    const connection = createConnection(options)
    connection.connect()
    connection.on('message', (msg) => {
      onReceiveMessage(msg)
    })
    return () => connection.disconnect()
  }, [roomId, serverUrl, onReceiveMessage]) // ✅ 모든 의존성이 선언됨
}
```

이것은 작동하지만, 커스텀 Hook이 이벤트 핸들러를 받을 때 한 가지 더 개선할 수 있습니다.

`onReceiveMessage`에 대한 의존성을 추가하면 컴포넌트가 리렌더링될 때마다 채팅이 다시 연결되므로 이상적이지 않습니다. [이 이벤트 핸들러를 Effect Event로 감싸서 의존성에서 제거하세요:](/learn/removing-effect-dependencies#wrapping-an-event-handler-from-the-props)

```js {1,4,5,15,18}
import { useEffect, useEffectEvent } from 'react'
// ...

export function useChatRoom({ serverUrl, roomId, onReceiveMessage }) {
  const onMessage = useEffectEvent(onReceiveMessage)

  useEffect(() => {
    const options = {
      serverUrl: serverUrl,
      roomId: roomId,
    }
    const connection = createConnection(options)
    connection.connect()
    connection.on('message', (msg) => {
      onMessage(msg)
    })
    return () => connection.disconnect()
  }, [roomId, serverUrl]) // ✅ 모든 의존성이 선언됨
}
```

이제 `ChatRoom` 컴포넌트가 리렌더링될 때마다 채팅이 다시 연결되지 않습니다. 다음은 직접 실행해 볼 수 있는 커스텀 Hook에 이벤트 핸들러를 전달하는 완전히 작동하는 데모입니다:

<Sandpack>

```js src/App.js
import { useState } from 'react'
import ChatRoom from './ChatRoom.js'

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

```js src/ChatRoom.js active
import { useState } from 'react'
import { useChatRoom } from './useChatRoom.js'
import { showNotification } from './notifications.js'

export default function ChatRoom({ roomId }) {
  const [serverUrl, setServerUrl] = useState('https://localhost:1234')

  useChatRoom({
    roomId: roomId,
    serverUrl: serverUrl,
    onReceiveMessage(msg) {
      showNotification('New message: ' + msg)
    },
  })

  return (
    <>
      <label>
        Server URL:
        <input
          value={serverUrl}
          onChange={(e) => setServerUrl(e.target.value)}
        />
      </label>
      <h1>Welcome to the {roomId} room!</h1>
    </>
  )
}
```

```js src/useChatRoom.js
import { useEffect } from 'react'
import { useEffectEvent } from 'react'
import { createConnection } from './chat.js'

export function useChatRoom({ serverUrl, roomId, onReceiveMessage }) {
  const onMessage = useEffectEvent(onReceiveMessage)

  useEffect(() => {
    const options = {
      serverUrl: serverUrl,
      roomId: roomId,
    }
    const connection = createConnection(options)
    connection.connect()
    connection.on('message', (msg) => {
      onMessage(msg)
    })
    return () => connection.disconnect()
  }, [roomId, serverUrl])
}
```

```js src/chat.js
export function createConnection({ serverUrl, roomId }) {
  // 실제 구현은 서버에 실제로 연결할 것입니다
  if (typeof serverUrl !== 'string') {
    throw Error('Expected serverUrl to be a string. Received: ' + serverUrl)
  }
  if (typeof roomId !== 'string') {
    throw Error('Expected roomId to be a string. Received: ' + roomId)
  }
  let intervalId
  let messageCallback
  return {
    connect() {
      console.log('✅ Connecting to "' + roomId + '" room at ' + serverUrl + '...')
      clearInterval(intervalId)
      intervalId = setInterval(() => {
        if (messageCallback) {
          if (Math.random() > 0.5) {
            messageCallback('hey')
          } else {
            messageCallback('lol')
          }
        }
      }, 3000)
    },
    disconnect() {
      clearInterval(intervalId)
      messageCallback = null
      console.log('❌ Disconnected from "' + roomId + '" room at ' + serverUrl + '')
    },
    on(event, callback) {
      if (messageCallback) {
        throw Error('Cannot add the handler twice.')
      }
      if (event !== 'message') {
        throw Error('Only "message" event is supported.')
      }
      messageCallback = callback
    },
  }
}
```

```js src/notifications.js
import Toastify from 'toastify-js'
import 'toastify-js/src/toastify.css'

export function showNotification(message, theme = 'dark') {
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

`useChatRoom`이 _어떻게_ 작동하는지 알 필요 없이 사용할 수 있게 되었습니다. 다른 어떤 컴포넌트에든 추가하고, 다른 옵션을 전달해도 같은 방식으로 작동합니다. 이것이 커스텀 Hook의 힘입니다.

## 커스텀 Hook을 사용해야 할 때 {/_when-to-use-custom-hooks_/}

모든 작은 중복 코드에 대해 커스텀 Hook을 추출할 필요는 없습니다. 일부 중복은 괜찮습니다. 예를 들어, 앞서처럼 단일 `useState` 호출을 감싸는 `useFormInput` Hook을 추출하는 것은 아마 불필요합니다.

하지만 Effect를 작성할 때마다, 커스텀 Hook으로 감싸는 것이 더 명확할지 고려하세요. [Effect가 매우 자주 필요하지 않을 것이므로,](/learn/you-might-not-need-an-effect) Effect를 작성하고 있다면 외부 시스템과 동기화하거나 React에 내장 API가 없는 작업을 하기 위해 "React 밖으로 나가야" 한다는 의미입니다. 커스텀 Hook으로 감싸면 의도와 데이터 흐름을 정확하게 전달할 수 있습니다.

예를 들어, 두 개의 드롭다운을 표시하는 `ShippingForm` 컴포넌트를 생각해 보세요: 하나는 도시 목록, 다른 하나는 선택된 도시의 지역 목록입니다. 다음과 같은 코드로 시작할 수 있습니다:

```js {3-16,20-35}
function ShippingForm({ country }) {
  const [cities, setCities] = useState(null);
  // 이 Effect는 국가의 도시를 가져옵니다
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
  }, [country]);

  const [city, setCity] = useState(null);
  const [areas, setAreas] = useState(null);
  // 이 Effect는 선택된 도시의 지역을 가져옵니다
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
  }, [city]);

  // ...
```

이 코드는 꽤 반복적이지만, [이 Effect들을 서로 별도로 유지하는 것이 올바릅니다.](/learn/removing-effect-dependencies#is-your-effect-doing-several-unrelated-things) 서로 다른 두 가지를 동기화하므로 하나의 Effect로 합쳐서는 안 됩니다. 대신, 위의 `ShippingForm` 컴포넌트를 간소화하기 위해 공통 로직을 `useData` Hook으로 추출할 수 있습니다:

```js {2-18}
function useData(url) {
  const [data, setData] = useState(null)
  useEffect(() => {
    if (url) {
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
    }
  }, [url])
  return data
}
```

이제 `ShippingForm` 컴포넌트의 두 Effect를 `useData` 호출로 대체할 수 있습니다:

```js {2,4}
function ShippingForm({ country }) {
  const cities = useData(`/api/cities?country=${country}`);
  const [city, setCity] = useState(null);
  const areas = useData(city ? `/api/areas?city=${city}` : null);
  // ...
```

커스텀 Hook을 추출하면 데이터 흐름이 명시적이 됩니다. `url`을 넣으면 `data`를 얻습니다. Effect를 `useData` 안에 "숨김"으로써, `ShippingForm` 컴포넌트에서 작업하는 사람이 [불필요한 의존성](/learn/removing-effect-dependencies)을 추가하는 것도 방지합니다. 시간이 지남에 따라 앱의 Effect 대부분이 커스텀 Hook 안에 있게 될 것입니다.

<DeepDive>

#### 커스텀 Hook은 구체적인 고수준 사용 사례에 집중하세요 {/_keep-your-custom-hooks-focused-on-concrete-high-level-use-cases_/}

커스텀 Hook의 이름을 정하는 것부터 시작하세요. 명확한 이름을 고르기 어렵다면, Effect가 나머지 컴포넌트 로직에 너무 결합되어 있어 아직 추출할 준비가 되지 않았다는 의미일 수 있습니다.

이상적으로, 커스텀 Hook의 이름은 코드를 자주 작성하지 않는 사람도 커스텀 Hook이 무엇을 하고, 무엇을 받고, 무엇을 반환하는지 잘 추측할 수 있을 만큼 명확해야 합니다:

- ✅ `useData(url)`
- ✅ `useImpressionLog(eventName, extraData)`
- ✅ `useChatRoom(options)`

외부 시스템과 동기화할 때, 커스텀 Hook 이름이 더 기술적이고 해당 시스템에 특화된 전문 용어를 사용할 수 있습니다. 해당 시스템에 익숙한 사람에게 명확하다면 괜찮습니다:

- ✅ `useMediaQuery(query)`
- ✅ `useSocket(url)`
- ✅ `useIntersectionObserver(ref, options)`

**커스텀 Hook은 구체적인 고수준 사용 사례에 집중하세요.** `useEffect` API 자체의 대안이나 편의 래퍼(wrapper) 역할을 하는 커스텀 "생명주기" Hook을 만들고 사용하는 것을 피하세요:

- 🔴 `useMount(fn)`
- 🔴 `useEffectOnce(fn)`
- 🔴 `useUpdateEffect(fn)`

예를 들어, 이 `useMount` Hook은 코드가 "마운트 시에만" 실행되도록 하려 합니다:

```js {4-5,14-15}
function ChatRoom({ roomId }) {
  const [serverUrl, setServerUrl] = useState('https://localhost:1234')

  // 🔴 피하세요: 커스텀 "생명주기" Hook 사용
  useMount(() => {
    const connection = createConnection({ roomId, serverUrl })
    connection.connect()

    post('/analytics/event', { eventName: 'visit_chat' })
  })
  // ...
}

// 🔴 피하세요: 커스텀 "생명주기" Hook 생성
function useMount(fn) {
  useEffect(() => {
    fn()
  }, []) // 🔴 React Hook useEffect has a missing dependency: 'fn'
}
```

**`useMount` 같은 커스텀 "생명주기" Hook은 React 패러다임에 잘 맞지 않습니다.** 예를 들어, 이 코드 예제에는 실수가 있습니다(`roomId`나 `serverUrl` 변경에 "반응"하지 않음). 하지만 린터는 직접적인 `useEffect` 호출만 확인하기 때문에 경고하지 않습니다. 여러분의 Hook에 대해서는 알지 못합니다.

Effect를 작성한다면, React API를 직접 사용하는 것부터 시작하세요:

```js
function ChatRoom({ roomId }) {
  const [serverUrl, setServerUrl] = useState('https://localhost:1234')

  // ✅ 좋습니다: 목적별로 분리된 두 개의 원시 Effect

  useEffect(() => {
    const connection = createConnection({ serverUrl, roomId })
    connection.connect()
    return () => connection.disconnect()
  }, [serverUrl, roomId])

  useEffect(() => {
    post('/analytics/event', { eventName: 'visit_chat', roomId })
  }, [roomId])

  // ...
}
```

그런 다음, 다른 고수준 사용 사례를 위해 커스텀 Hook을 추출할 수 있습니다(필수는 아닙니다):

```js
function ChatRoom({ roomId }) {
  const [serverUrl, setServerUrl] = useState('https://localhost:1234')

  // ✅ 훌륭합니다: 목적에 맞게 이름 지어진 커스텀 Hook
  useChatRoom({ serverUrl, roomId })
  useImpressionLog('visit_chat', { roomId })
  // ...
}
```

**좋은 커스텀 Hook은 수행하는 작업을 제한하여 호출 코드를 더 선언적으로 만듭니다.** 예를 들어, `useChatRoom(options)`은 채팅방에 연결만 할 수 있고, `useImpressionLog(eventName, extraData)`는 분석에 노출 로그만 보낼 수 있습니다. 커스텀 Hook API가 사용 사례를 제한하지 않고 매우 추상적이라면, 장기적으로 해결하는 것보다 더 많은 문제를 만들 가능성이 높습니다.

</DeepDive>

### 커스텀 Hook은 더 나은 패턴으로 마이그레이션하는 데 도움이 됩니다 {/_custom-hooks-help-you-migrate-to-better-patterns_/}

Effect는 ["탈출구(escape hatch)"](/learn/escape-hatches)입니다: "React 밖으로 나가야" 하고 사용 사례에 더 나은 내장 솔루션이 없을 때 사용합니다. 시간이 지남에 따라 React 팀의 목표는 더 구체적인 문제에 대해 더 구체적인 솔루션을 제공하여 앱의 Effect 수를 최소로 줄이는 것입니다. Effect를 커스텀 Hook으로 감싸면 이러한 솔루션이 사용 가능해질 때 코드를 업그레이드하기가 더 쉽습니다.

이 예제로 돌아가 봅시다:

<Sandpack>

```js
import { useOnlineStatus } from './useOnlineStatus.js'

function StatusBar() {
  const isOnline = useOnlineStatus()
  return <h1>{isOnline ? '✅ Online' : '❌ Disconnected'}</h1>
}

function SaveButton() {
  const isOnline = useOnlineStatus()

  function handleSaveClick() {
    console.log('✅ Progress saved')
  }

  return (
    <button
      disabled={!isOnline}
      onClick={handleSaveClick}
    >
      {isOnline ? 'Save progress' : 'Reconnecting...'}
    </button>
  )
}

export default function App() {
  return (
    <>
      <SaveButton />
      <StatusBar />
    </>
  )
}
```

```js src/useOnlineStatus.js active
import { useState, useEffect } from 'react'

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)
  useEffect(() => {
    function handleOnline() {
      setIsOnline(true)
    }
    function handleOffline() {
      setIsOnline(false)
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  return isOnline
}
```

</Sandpack>

위 예제에서 `useOnlineStatus`는 [`useState`](/reference/react/useState)와 [`useEffect`](/reference/react/useEffect) 쌍으로 구현되어 있습니다. 하지만 이것은 최선의 솔루션이 아닙니다. 고려하지 않은 여러 에지 케이스가 있습니다. 예를 들어, 컴포넌트가 마운트될 때 `isOnline`이 이미 `true`라고 가정하지만, 네트워크가 이미 오프라인이었다면 이것은 틀립니다. 브라우저 [`navigator.onLine`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine) API를 사용하여 확인할 수 있지만, 초기 HTML을 생성하기 위한 서버에서는 직접 사용할 수 없습니다. 요컨대, 이 코드는 개선할 수 있습니다.

React에는 이 모든 문제를 처리하는 [`useSyncExternalStore`](/reference/react/useSyncExternalStore)라는 전용 API가 포함되어 있습니다. 다음은 이 새 API를 활용하여 다시 작성한 `useOnlineStatus` Hook입니다:

<Sandpack>

```js
import { useOnlineStatus } from './useOnlineStatus.js'

function StatusBar() {
  const isOnline = useOnlineStatus()
  return <h1>{isOnline ? '✅ Online' : '❌ Disconnected'}</h1>
}

function SaveButton() {
  const isOnline = useOnlineStatus()

  function handleSaveClick() {
    console.log('✅ Progress saved')
  }

  return (
    <button
      disabled={!isOnline}
      onClick={handleSaveClick}
    >
      {isOnline ? 'Save progress' : 'Reconnecting...'}
    </button>
  )
}

export default function App() {
  return (
    <>
      <SaveButton />
      <StatusBar />
    </>
  )
}
```

```js src/useOnlineStatus.js active
import { useSyncExternalStore } from 'react'

function subscribe(callback) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

export function useOnlineStatus() {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine, // 클라이언트에서 값을 가져오는 방법
    () => true // 서버에서 값을 가져오는 방법
  )
}
```

</Sandpack>

이 마이그레이션을 위해 **어떤 컴포넌트도 변경할 필요가 없었다는** 점에 주목하세요:

```js {2,7}
function StatusBar() {
  const isOnline = useOnlineStatus()
  // ...
}

function SaveButton() {
  const isOnline = useOnlineStatus()
  // ...
}
```

이것이 Effect를 커스텀 Hook으로 감싸는 것이 종종 유익한 또 다른 이유입니다:

1. Effect에 대한 데이터 흐름을 매우 명시적으로 만듭니다.
2. 컴포넌트가 Effect의 정확한 구현이 아닌 의도에 집중하게 합니다.
3. React가 새 기능을 추가할 때, 어떤 컴포넌트도 변경하지 않고 Effect를 제거할 수 있습니다.

[디자인 시스템](https://uxdesign.cc/everything-you-need-to-know-about-design-systems-54b109851969)과 유사하게, 앱의 컴포넌트에서 공통 관용구를 커스텀 Hook으로 추출하기 시작하는 것이 도움이 될 수 있습니다. 이렇게 하면 컴포넌트 코드가 의도에 집중하게 되고, 원시 Effect를 매우 자주 작성하는 것을 피할 수 있습니다. React 커뮤니티에서 많은 훌륭한 커스텀 Hook을 유지보수하고 있습니다.

<DeepDive>

#### React가 데이터 페칭을 위한 내장 솔루션을 제공하나요? {/_will-react-provide-any-built-in-solution-for-data-fetching_/}

현재 [`use`](/reference/react/use#streaming-data-from-server-to-client) API를 사용하면, [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)를 `use`에 전달하여 렌더링 중에 데이터를 읽을 수 있습니다:

```js {1,4,11}
import { use, Suspense } from 'react'

function Message({ messagePromise }) {
  const messageContent = use(messagePromise)
  return <p>Here is the message: {messageContent}</p>
}

export function MessageContainer({ messagePromise }) {
  return (
    <Suspense fallback={<p>⌛Downloading message...</p>}>
      <Message messagePromise={messagePromise} />
    </Suspense>
  )
}
```

아직 세부사항을 다듬고 있지만, 미래에는 데이터 페칭을 이렇게 작성하게 될 것으로 예상합니다:

```js {1,4,6}
import { use } from 'react';

function ShippingForm({ country }) {
  const cities = use(fetch(`/api/cities?country=${country}`));
  const [city, setCity] = useState(null);
  const areas = city ? use(fetch(`/api/areas?city=${city}`)) : null;
  // ...
```

앱에서 위의 `useData` 같은 커스텀 Hook을 사용한다면, 매 컴포넌트에서 수동으로 원시 Effect를 작성하는 것보다 최종적으로 권장되는 접근 방식으로 마이그레이션하는 데 더 적은 변경이 필요합니다. 하지만 이전 접근 방식도 여전히 잘 작동하므로, 원시 Effect를 작성하는 것이 편하다면 계속 그렇게 해도 됩니다.

</DeepDive>

### 하나 이상의 방법이 있습니다 {/_there-is-more-than-one-way-to-do-it_/}

브라우저 [`requestAnimationFrame`](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame) API를 사용하여 _처음부터_ 페이드인 애니메이션을 구현하고 싶다고 합시다. 애니메이션 루프를 설정하는 Effect로 시작할 수 있습니다. 애니메이션의 각 프레임에서 [ref에 보유한](/learn/manipulating-the-dom-with-refs) DOM 노드의 투명도를 `1`에 도달할 때까지 변경할 수 있습니다. 코드는 다음과 같이 시작할 수 있습니다:

<Sandpack>

```js
import { useState, useEffect, useRef } from 'react'

function Welcome() {
  const ref = useRef(null)

  useEffect(() => {
    const duration = 1000
    const node = ref.current

    let startTime = performance.now()
    let frameId = null

    function onFrame(now) {
      const timePassed = now - startTime
      const progress = Math.min(timePassed / duration, 1)
      onProgress(progress)
      if (progress < 1) {
        frameId = requestAnimationFrame(onFrame)
      }
    }

    function onProgress(progress) {
      node.style.opacity = progress
    }

    function start() {
      onProgress(0)
      startTime = performance.now()
      frameId = requestAnimationFrame(onFrame)
    }

    function stop() {
      cancelAnimationFrame(frameId)
      startTime = null
      frameId = null
    }

    start()
    return () => stop()
  }, [])

  return (
    <h1
      className="welcome"
      ref={ref}
    >
      Welcome
    </h1>
  )
}

export default function App() {
  const [show, setShow] = useState(false)
  return (
    <>
      <button onClick={() => setShow(!show)}>{show ? 'Remove' : 'Show'}</button>
      <hr />
      {show && <Welcome />}
    </>
  )
}
```

```css
label,
button {
  display: block;
  margin-bottom: 20px;
}
html,
body {
  min-height: 300px;
}
.welcome {
  opacity: 0;
  color: white;
  padding: 50px;
  text-align: center;
  font-size: 50px;
  background-image: radial-gradient(circle, rgba(63, 94, 251, 1) 0%, rgba(252, 70, 107, 1) 100%);
}
```

</Sandpack>

컴포넌트를 더 읽기 쉽게 만들기 위해, 로직을 `useFadeIn` 커스텀 Hook으로 추출할 수 있습니다:

<Sandpack>

```js
import { useState, useEffect, useRef } from 'react'
import { useFadeIn } from './useFadeIn.js'

function Welcome() {
  const ref = useRef(null)

  useFadeIn(ref, 1000)

  return (
    <h1
      className="welcome"
      ref={ref}
    >
      Welcome
    </h1>
  )
}

export default function App() {
  const [show, setShow] = useState(false)
  return (
    <>
      <button onClick={() => setShow(!show)}>{show ? 'Remove' : 'Show'}</button>
      <hr />
      {show && <Welcome />}
    </>
  )
}
```

```js src/useFadeIn.js
import { useEffect } from 'react'

export function useFadeIn(ref, duration) {
  useEffect(() => {
    const node = ref.current

    let startTime = performance.now()
    let frameId = null

    function onFrame(now) {
      const timePassed = now - startTime
      const progress = Math.min(timePassed / duration, 1)
      onProgress(progress)
      if (progress < 1) {
        frameId = requestAnimationFrame(onFrame)
      }
    }

    function onProgress(progress) {
      node.style.opacity = progress
    }

    function start() {
      onProgress(0)
      startTime = performance.now()
      frameId = requestAnimationFrame(onFrame)
    }

    function stop() {
      cancelAnimationFrame(frameId)
      startTime = null
      frameId = null
    }

    start()
    return () => stop()
  }, [ref, duration])
}
```

```css
label,
button {
  display: block;
  margin-bottom: 20px;
}
html,
body {
  min-height: 300px;
}
.welcome {
  opacity: 0;
  color: white;
  padding: 50px;
  text-align: center;
  font-size: 50px;
  background-image: radial-gradient(circle, rgba(63, 94, 251, 1) 0%, rgba(252, 70, 107, 1) 100%);
}
```

</Sandpack>

`useFadeIn` 코드를 그대로 유지할 수도 있지만, 더 리팩토링할 수도 있습니다. 예를 들어, 애니메이션 루프를 설정하는 로직을 `useFadeIn`에서 커스텀 `useAnimationLoop` Hook으로 추출할 수 있습니다:

<Sandpack>

```js
import { useState, useEffect, useRef } from 'react'
import { useFadeIn } from './useFadeIn.js'

function Welcome() {
  const ref = useRef(null)

  useFadeIn(ref, 1000)

  return (
    <h1
      className="welcome"
      ref={ref}
    >
      Welcome
    </h1>
  )
}

export default function App() {
  const [show, setShow] = useState(false)
  return (
    <>
      <button onClick={() => setShow(!show)}>{show ? 'Remove' : 'Show'}</button>
      <hr />
      {show && <Welcome />}
    </>
  )
}
```

```js src/useFadeIn.js active
import { useState, useEffect } from 'react'
import { useEffectEvent } from 'react'

export function useFadeIn(ref, duration) {
  const [isRunning, setIsRunning] = useState(true)

  useAnimationLoop(isRunning, (timePassed) => {
    const progress = Math.min(timePassed / duration, 1)
    ref.current.style.opacity = progress
    if (progress === 1) {
      setIsRunning(false)
    }
  })
}

function useAnimationLoop(isRunning, drawFrame) {
  const onFrame = useEffectEvent(drawFrame)

  useEffect(() => {
    if (!isRunning) {
      return
    }

    const startTime = performance.now()
    let frameId = null

    function tick(now) {
      const timePassed = now - startTime
      onFrame(timePassed)
      frameId = requestAnimationFrame(tick)
    }

    tick()
    return () => cancelAnimationFrame(frameId)
  }, [isRunning])
}
```

```css
label,
button {
  display: block;
  margin-bottom: 20px;
}
html,
body {
  min-height: 300px;
}
.welcome {
  opacity: 0;
  color: white;
  padding: 50px;
  text-align: center;
  font-size: 50px;
  background-image: radial-gradient(circle, rgba(63, 94, 251, 1) 0%, rgba(252, 70, 107, 1) 100%);
}
```

</Sandpack>

하지만 꼭 그렇게 할 _필요는_ 없습니다. 일반 함수와 마찬가지로, 궁극적으로 코드의 다른 부분 사이의 경계를 어디에 그을지는 여러분이 결정합니다. 매우 다른 접근 방식을 취할 수도 있습니다. Effect에 로직을 유지하는 대신, 대부분의 명령형 로직을 JavaScript [class](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes) 안으로 옮길 수 있습니다:

<Sandpack>

```js
import { useState, useEffect, useRef } from 'react'
import { useFadeIn } from './useFadeIn.js'

function Welcome() {
  const ref = useRef(null)

  useFadeIn(ref, 1000)

  return (
    <h1
      className="welcome"
      ref={ref}
    >
      Welcome
    </h1>
  )
}

export default function App() {
  const [show, setShow] = useState(false)
  return (
    <>
      <button onClick={() => setShow(!show)}>{show ? 'Remove' : 'Show'}</button>
      <hr />
      {show && <Welcome />}
    </>
  )
}
```

```js src/useFadeIn.js active
import { useState, useEffect } from 'react'
import { FadeInAnimation } from './animation.js'

export function useFadeIn(ref, duration) {
  useEffect(() => {
    const animation = new FadeInAnimation(ref.current)
    animation.start(duration)
    return () => {
      animation.stop()
    }
  }, [ref, duration])
}
```

```js src/animation.js
export class FadeInAnimation {
  constructor(node) {
    this.node = node
  }
  start(duration) {
    this.duration = duration
    this.onProgress(0)
    this.startTime = performance.now()
    this.frameId = requestAnimationFrame(() => this.onFrame())
  }
  onFrame() {
    const timePassed = performance.now() - this.startTime
    const progress = Math.min(timePassed / this.duration, 1)
    this.onProgress(progress)
    if (progress === 1) {
      this.stop()
    } else {
      this.frameId = requestAnimationFrame(() => this.onFrame())
    }
  }
  onProgress(progress) {
    this.node.style.opacity = progress
  }
  stop() {
    cancelAnimationFrame(this.frameId)
    this.startTime = null
    this.frameId = null
    this.duration = 0
  }
}
```

```css
label,
button {
  display: block;
  margin-bottom: 20px;
}
html,
body {
  min-height: 300px;
}
.welcome {
  opacity: 0;
  color: white;
  padding: 50px;
  text-align: center;
  font-size: 50px;
  background-image: radial-gradient(circle, rgba(63, 94, 251, 1) 0%, rgba(252, 70, 107, 1) 100%);
}
```

</Sandpack>

Effect를 사용하면 React를 외부 시스템에 연결할 수 있습니다. Effect 간에 더 많은 조정이 필요할수록(예: 여러 애니메이션을 체이닝하는 경우), 위 샌드박스처럼 Effect와 Hook에서 로직을 _완전히_ 추출하는 것이 더 합리적입니다. 그러면 추출한 코드가 "외부 시스템"이 _됩니다_. 이렇게 하면 React 밖으로 이동한 시스템에 메시지를 보내기만 하면 되므로 Effect가 단순해집니다.

위 예제들은 페이드인 로직이 JavaScript로 작성되어야 한다고 가정합니다. 하지만 이 특정 페이드인 애니메이션은 일반 [CSS 애니메이션](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations/Using_CSS_animations)으로 구현하는 것이 더 간단하고 훨씬 효율적입니다:

<Sandpack>

```js
import { useState, useEffect, useRef } from 'react'
import './welcome.css'

function Welcome() {
  return <h1 className="welcome">Welcome</h1>
}

export default function App() {
  const [show, setShow] = useState(false)
  return (
    <>
      <button onClick={() => setShow(!show)}>{show ? 'Remove' : 'Show'}</button>
      <hr />
      {show && <Welcome />}
    </>
  )
}
```

```css src/styles.css
label,
button {
  display: block;
  margin-bottom: 20px;
}
html,
body {
  min-height: 300px;
}
```

```css src/welcome.css active
.welcome {
  color: white;
  padding: 50px;
  text-align: center;
  font-size: 50px;
  background-image: radial-gradient(circle, rgba(63, 94, 251, 1) 0%, rgba(252, 70, 107, 1) 100%);

  animation: fadeIn 1000ms;
}

@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
```

</Sandpack>

때로는 Hook이 필요하지 않을 수도 있습니다!

<Recap>

- 커스텀 Hook을 사용하면 컴포넌트 간에 로직을 공유할 수 있습니다.
- 커스텀 Hook의 이름은 `use`로 시작하고 그 뒤에 대문자가 와야 합니다.
- 커스텀 Hook은 상태 유지 로직만 공유하고, state 자체는 공유하지 않습니다.
- 반응형 값을 한 Hook에서 다른 Hook으로 전달할 수 있으며, 최신 상태로 유지됩니다.
- 모든 Hook은 컴포넌트가 리렌더링될 때마다 다시 실행됩니다.
- 커스텀 Hook의 코드는 컴포넌트 코드처럼 순수해야 합니다.
- 커스텀 Hook이 받는 이벤트 핸들러를 Effect Event로 감싸세요.
- `useMount` 같은 커스텀 Hook을 만들지 마세요. 목적을 구체적으로 유지하세요.
- 코드의 경계를 어디에, 어떻게 그을지는 여러분이 결정합니다.

</Recap>
