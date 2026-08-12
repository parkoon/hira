---
title: 'Effect와 동기화하기'
---

<Intro>

일부 컴포넌트는 외부 시스템(external system)과 동기화해야 합니다. 예를 들어, React state에 따라 비-React 컴포넌트를 제어하거나, 서버 연결을 설정하거나, 컴포넌트가 화면에 나타날 때 분석 로그를 보내고 싶을 수 있습니다. _Effect_ 를 사용하면 렌더링 후에 코드를 실행하여 React 외부의 시스템과 컴포넌트를 동기화할 수 있습니다.

</Intro>

<YouWillLearn>

- Effect가 무엇인지
- Effect가 이벤트와 어떻게 다른지
- 컴포넌트에서 Effect를 선언하는 방법
- 불필요하게 Effect를 다시 실행하지 않는 방법
- 개발 환경에서 Effect가 두 번 실행되는 이유와 해결 방법

</YouWillLearn>

## Effect란 무엇이고 이벤트와 어떻게 다른가? {/_what-are-effects-and-how-are-they-different-from-events_/}

Effect에 들어가기 전에 React 컴포넌트 내부의 두 가지 로직 유형을 알아야 합니다:

- **렌더링 코드(rendering code)**([UI 설명하기](/learn/describing-the-ui)에서 소개)는 컴포넌트의 최상위 레벨에 있습니다. props와 state를 가져와 변환하고 화면에 표시할 JSX를 반환하는 곳입니다. [렌더링 코드는 순수해야 합니다.](/learn/keeping-components-pure) 수학 공식처럼 결과를 _계산_ 만 해야 하며, 다른 것은 하지 않아야 합니다.

- **이벤트 핸들러(event handler)**([상호작용 추가하기](/learn/adding-interactivity)에서 소개)는 컴포넌트 내부의 중첩 함수로, 단순히 계산하는 것이 아니라 실제로 무언가를 _합니다_. 이벤트 핸들러는 입력 필드를 업데이트하거나, HTTP POST 요청을 보내 제품을 구매하거나, 사용자를 다른 화면으로 이동시킬 수 있습니다. 이벤트 핸들러에는 특정 사용자 액션(예: 버튼 클릭이나 타이핑)으로 인한 ["부수 효과(side effect)"](<https://en.wikipedia.org/wiki/Side_effect_(computer_science)>)(프로그램의 상태를 변경하는 것)가 포함됩니다.

때로는 이것만으로는 충분하지 않습니다. 화면에 보일 때마다 채팅 서버에 연결해야 하는 `ChatRoom` 컴포넌트를 생각해 보세요. 서버에 연결하는 것은 순수한 계산이 아니라 부수 효과이므로 렌더링 중에는 할 수 없습니다. 하지만 `ChatRoom`이 표시되게 하는 클릭 같은 특정 이벤트는 없습니다.

**_Effect_ 를 사용하면 특정 이벤트가 아닌 렌더링 자체로 인한 부수 효과를 지정할 수 있습니다.** 채팅에서 메시지를 보내는 것은 사용자가 특정 버튼을 클릭하여 직접 발생하므로 _이벤트_ 입니다. 하지만 서버 연결을 설정하는 것은 어떤 상호작용이 컴포넌트를 나타나게 했든 상관없이 발생해야 하므로 _Effect_ 입니다. Effect는 화면이 업데이트된 후 [커밋](/learn/render-and-commit)의 끝에서 실행됩니다. 이 시점이 React 컴포넌트를 외부 시스템(네트워크나 서드파티 라이브러리 등)과 동기화하기 좋은 때입니다.

<Note>

이 문서와 이후 텍스트에서 대문자로 시작하는 "Effect"는 위의 React 전용 정의, 즉 렌더링으로 인한 부수 효과를 의미합니다. 더 넓은 프로그래밍 개념을 가리킬 때는 "부수 효과(side effect)"라고 합니다.

</Note>

## Effect가 필요 없을 수도 있습니다 {/_you-might-not-need-an-effect_/}

**컴포넌트에 Effect를 서둘러 추가하지 마세요.** Effect는 일반적으로 React 코드에서 "밖으로 나가서" _외부_ 시스템과 동기화하는 데 사용된다는 점을 기억하세요. 여기에는 브라우저 API, 서드파티 위젯, 네트워크 등이 포함됩니다. Effect가 다른 state에 기반하여 state만 조정한다면, [Effect가 필요 없을 수도 있습니다.](/learn/you-might-not-need-an-effect)

## Effect 작성 방법 {/_how-to-write-an-effect_/}

Effect를 작성하려면 다음 세 단계를 따르세요:

1. **Effect를 선언합니다.** 기본적으로 Effect는 모든 [커밋](/learn/render-and-commit) 후에 실행됩니다.
2. **Effect의 의존성(dependency)을 지정합니다.** 대부분의 Effect는 매 렌더링 후가 아니라 _필요할 때만_ 다시 실행되어야 합니다. 예를 들어, 페이드인 애니메이션은 컴포넌트가 나타날 때만 트리거되어야 합니다. 채팅방 연결과 해제는 컴포넌트가 나타나고 사라질 때, 또는 채팅방이 변경될 때만 발생해야 합니다. _의존성_ 을 지정하여 이를 제어하는 방법을 배웁니다.
3. **필요하면 정리(cleanup)를 추가합니다.** 일부 Effect는 수행하던 작업을 중지, 취소, 또는 정리하는 방법을 지정해야 합니다. 예를 들어, "연결"에는 "연결 해제"가, "구독"에는 "구독 해제"가, "가져오기(fetch)"에는 "취소"나 "무시"가 필요합니다. _정리 함수(cleanup function)_ 를 반환하여 이를 수행하는 방법을 배웁니다.

각 단계를 자세히 살펴보겠습니다.

### 1단계: Effect 선언하기 {/_step-1-declare-an-effect_/}

컴포넌트에서 Effect를 선언하려면 React에서 [`useEffect` Hook](/reference/react/useEffect)을 import합니다:

```js
import { useEffect } from 'react'
```

그런 다음 컴포넌트의 최상위 레벨에서 호출하고 Effect 내부에 코드를 넣습니다:

```js {2-4}
function MyComponent() {
  useEffect(() => {
    // 여기의 코드는 *모든* 렌더링 후에 실행됩니다
  })
  return <div />
}
```

컴포넌트가 렌더링될 때마다 React는 화면을 업데이트한 _다음_ `useEffect` 내부의 코드를 실행합니다. 즉, **`useEffect`는 해당 렌더링이 화면에 반영될 때까지 코드 실행을 "지연"시킵니다.**

Effect를 사용하여 외부 시스템과 동기화하는 방법을 살펴보겠습니다. `<VideoPlayer>` React 컴포넌트를 생각해 보세요. `isPlaying` prop을 전달하여 재생 중인지 일시정지 중인지 제어할 수 있으면 좋겠습니다:

```js
<VideoPlayer isPlaying={isPlaying} />
```

커스텀 `VideoPlayer` 컴포넌트는 내장 브라우저 [`<video>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video) 태그를 렌더링합니다:

```js
function VideoPlayer({ src, isPlaying }) {
  // TODO: isPlaying으로 무언가를 합니다
  return <video src={src} />
}
```

하지만 브라우저 `<video>` 태그에는 `isPlaying` prop이 없습니다. 이를 제어하는 유일한 방법은 DOM 요소에서 [`play()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play)와 [`pause()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/pause) 메서드를 수동으로 호출하는 것입니다. **비디오가 현재 재생 _중이어야_ 하는지를 알려주는 `isPlaying` prop의 값을 `play()`와 `pause()` 같은 호출과 동기화해야 합니다.**

먼저 `<video>` DOM 노드에 대한 [ref를 가져와야](/learn/manipulating-the-dom-with-refs) 합니다.

렌더링 중에 `play()`나 `pause()`를 호출하고 싶을 수 있지만, 이는 올바르지 않습니다:

<Sandpack>

```js {expectedErrors: {'react-compiler': [7, 9]}}
import { useState, useRef, useEffect } from 'react'

function VideoPlayer({ src, isPlaying }) {
  const ref = useRef(null)

  if (isPlaying) {
    ref.current.play() // 렌더링 중에 호출하는 것은 허용되지 않습니다.
  } else {
    ref.current.pause() // 또한 이것은 크래시를 발생시킵니다.
  }

  return (
    <video
      ref={ref}
      src={src}
      loop
      playsInline
    />
  )
}

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false)
  return (
    <>
      <button onClick={() => setIsPlaying(!isPlaying)}>{isPlaying ? 'Pause' : 'Play'}</button>
      <VideoPlayer
        isPlaying={isPlaying}
        src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
      />
    </>
  )
}
```

```css
button {
  display: block;
  margin-bottom: 20px;
}
video {
  width: 250px;
}
```

</Sandpack>

이 코드가 올바르지 않은 이유는 렌더링 중에 DOM 노드로 무언가를 하려고 하기 때문입니다. React에서 [렌더링은 JSX의 순수한 계산](/learn/keeping-components-pure)이어야 하며 DOM 수정 같은 부수 효과를 포함해서는 안 됩니다.

게다가 `VideoPlayer`가 처음 호출될 때는 DOM이 아직 존재하지 않습니다! JSX를 반환하기 전까지 React는 어떤 DOM을 생성해야 할지 모르기 때문에 `play()`나 `pause()`를 호출할 DOM 노드가 아직 없습니다.

해결책은 **부수 효과를 `useEffect`로 감싸서 렌더링 계산 밖으로 이동시키는 것**입니다:

```js {6,12}
import { useEffect, useRef } from 'react'

function VideoPlayer({ src, isPlaying }) {
  const ref = useRef(null)

  useEffect(() => {
    if (isPlaying) {
      ref.current.play()
    } else {
      ref.current.pause()
    }
  })

  return (
    <video
      ref={ref}
      src={src}
      loop
      playsInline
    />
  )
}
```

DOM 업데이트를 Effect로 감싸면 React가 먼저 화면을 업데이트하고 그 다음에 Effect를 실행합니다.

`VideoPlayer` 컴포넌트가 렌더링될 때(처음이든 리렌더링이든), 몇 가지 일이 일어납니다. 먼저 React가 화면을 업데이트하여 올바른 props로 `<video>` 태그가 DOM에 있도록 합니다. 그 다음 React가 Effect를 실행합니다. 마지막으로 Effect가 `isPlaying`의 값에 따라 `play()`나 `pause()`를 호출합니다.

Play/Pause를 여러 번 눌러보고 비디오 플레이어가 `isPlaying` 값과 동기화되는지 확인하세요:

<Sandpack>

```js
import { useState, useRef, useEffect } from 'react'

function VideoPlayer({ src, isPlaying }) {
  const ref = useRef(null)

  useEffect(() => {
    if (isPlaying) {
      ref.current.play()
    } else {
      ref.current.pause()
    }
  })

  return (
    <video
      ref={ref}
      src={src}
      loop
      playsInline
    />
  )
}

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false)
  return (
    <>
      <button onClick={() => setIsPlaying(!isPlaying)}>{isPlaying ? 'Pause' : 'Play'}</button>
      <VideoPlayer
        isPlaying={isPlaying}
        src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
      />
    </>
  )
}
```

```css
button {
  display: block;
  margin-bottom: 20px;
}
video {
  width: 250px;
}
```

</Sandpack>

이 예제에서 React state에 동기화한 "외부 시스템"은 브라우저 미디어 API였습니다. 비슷한 접근 방식으로 레거시 비-React 코드(예: jQuery 플러그인)를 선언적인 React 컴포넌트로 감쌀 수 있습니다.

실제로 비디오 플레이어를 제어하는 것은 훨씬 복잡합니다. `play()` 호출이 실패할 수 있고, 사용자가 내장 브라우저 컨트롤을 사용하여 재생하거나 일시정지할 수도 있습니다. 이 예제는 매우 간소화되고 불완전합니다.

<Pitfall>

기본적으로 Effect는 _모든_ 렌더링 후에 실행됩니다. 이것이 다음과 같은 코드가 **무한 루프(infinite loop)를 만드는** 이유입니다:

```js
const [count, setCount] = useState(0)
useEffect(() => {
  setCount(count + 1)
})
```

Effect는 렌더링의 _결과_ 로 실행됩니다. state를 설정하면 렌더링이 _트리거_ 됩니다. Effect에서 즉시 state를 설정하는 것은 전원 콘센트를 자기 자신에 꽂는 것과 같습니다. Effect가 실행되고, state를 설정하고, 이것이 리렌더링을 발생시키고, Effect가 다시 실행되고, 다시 state를 설정하고, 또 리렌더링을 발생시키고, 계속 반복됩니다.

Effect는 보통 컴포넌트를 _외부_ 시스템과 동기화해야 합니다. 외부 시스템이 없고 다른 state에 기반하여 state만 조정하고 싶다면, [Effect가 필요 없을 수도 있습니다.](/learn/you-might-not-need-an-effect)

</Pitfall>

### 2단계: Effect의 의존성 지정하기 {/_step-2-specify-the-effect-dependencies_/}

기본적으로 Effect는 _모든_ 렌더링 후에 실행됩니다. 이것이 **원하는 동작이 아닌** 경우가 많습니다:

- 때로는 느립니다. 외부 시스템과의 동기화가 항상 즉각적인 것은 아니므로, 필요하지 않다면 건너뛰고 싶을 수 있습니다. 예를 들어, 매 키 입력마다 채팅 서버에 다시 연결하고 싶지는 않습니다.
- 때로는 잘못됩니다. 예를 들어, 매 키 입력마다 컴포넌트 페이드인 애니메이션을 트리거하고 싶지는 않습니다. 애니메이션은 컴포넌트가 처음 나타날 때 한 번만 재생되어야 합니다.

문제를 보여주기 위해, 이전 예제에 몇 개의 `console.log` 호출과 부모 컴포넌트의 state를 업데이트하는 텍스트 입력을 추가했습니다. 타이핑하면 Effect가 다시 실행되는 것을 확인하세요:

<Sandpack>

```js
import { useState, useRef, useEffect } from 'react'

function VideoPlayer({ src, isPlaying }) {
  const ref = useRef(null)

  useEffect(() => {
    if (isPlaying) {
      console.log('Calling video.play()')
      ref.current.play()
    } else {
      console.log('Calling video.pause()')
      ref.current.pause()
    }
  })

  return (
    <video
      ref={ref}
      src={src}
      loop
      playsInline
    />
  )
}

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [text, setText] = useState('')
  return (
    <>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button onClick={() => setIsPlaying(!isPlaying)}>{isPlaying ? 'Pause' : 'Play'}</button>
      <VideoPlayer
        isPlaying={isPlaying}
        src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
      />
    </>
  )
}
```

```css
input,
button {
  display: block;
  margin-bottom: 20px;
}
video {
  width: 250px;
}
```

</Sandpack>

`useEffect` 호출의 두 번째 인자로 _의존성_ 배열을 지정하면 React에게 **불필요하게 Effect를 다시 실행하지 않도록** 할 수 있습니다. 위 예제의 14번째 줄에 빈 `[]` 배열을 추가해 보세요:

```js {3}
useEffect(() => {
  // ...
}, [])
```

`React Hook useEffect has a missing dependency: 'isPlaying'`이라는 에러가 표시될 것입니다:

<Sandpack>

```js
import { useState, useRef, useEffect } from 'react'

function VideoPlayer({ src, isPlaying }) {
  const ref = useRef(null)

  useEffect(() => {
    if (isPlaying) {
      console.log('Calling video.play()')
      ref.current.play()
    } else {
      console.log('Calling video.pause()')
      ref.current.pause()
    }
  }, []) // 이것은 에러를 발생시킵니다

  return (
    <video
      ref={ref}
      src={src}
      loop
      playsInline
    />
  )
}

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [text, setText] = useState('')
  return (
    <>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button onClick={() => setIsPlaying(!isPlaying)}>{isPlaying ? 'Pause' : 'Play'}</button>
      <VideoPlayer
        isPlaying={isPlaying}
        src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
      />
    </>
  )
}
```

```css
input,
button {
  display: block;
  margin-bottom: 20px;
}
video {
  width: 250px;
}
```

</Sandpack>

문제는 Effect 내부의 코드가 무엇을 할지 결정하기 위해 `isPlaying` prop에 _의존_ 하지만, 이 의존성이 명시적으로 선언되지 않았다는 것입니다. 이 문제를 해결하려면 의존성 배열에 `isPlaying`을 추가하세요:

```js {2,7}
useEffect(() => {
  if (isPlaying) {
    // 여기서 사용됩니다...
    // ...
  } else {
    // ...
  }
}, [isPlaying]) // ...그러므로 여기서 선언해야 합니다!
```

이제 모든 의존성이 선언되었으므로 에러가 없습니다. `[isPlaying]`을 의존성 배열로 지정하면 `isPlaying`이 이전 렌더링과 같으면 Effect 재실행을 건너뛰라고 React에 알려줍니다. 이 변경으로 입력에 타이핑해도 Effect가 재실행되지 않지만, Play/Pause를 누르면 실행됩니다:

<Sandpack>

```js
import { useState, useRef, useEffect } from 'react'

function VideoPlayer({ src, isPlaying }) {
  const ref = useRef(null)

  useEffect(() => {
    if (isPlaying) {
      console.log('Calling video.play()')
      ref.current.play()
    } else {
      console.log('Calling video.pause()')
      ref.current.pause()
    }
  }, [isPlaying])

  return (
    <video
      ref={ref}
      src={src}
      loop
      playsInline
    />
  )
}

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [text, setText] = useState('')
  return (
    <>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button onClick={() => setIsPlaying(!isPlaying)}>{isPlaying ? 'Pause' : 'Play'}</button>
      <VideoPlayer
        isPlaying={isPlaying}
        src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
      />
    </>
  )
}
```

```css
input,
button {
  display: block;
  margin-bottom: 20px;
}
video {
  width: 250px;
}
```

</Sandpack>

의존성 배열에는 여러 의존성을 포함할 수 있습니다. React는 지정한 _모든_ 의존성이 이전 렌더링과 정확히 같은 값을 가질 때만 Effect 재실행을 건너뜁니다. React는 [`Object.is`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is) 비교를 사용하여 의존성 값을 비교합니다. 자세한 내용은 [`useEffect` 레퍼런스](/reference/react/useEffect#reference)를 참조하세요.

**의존성을 "선택"할 수 없습니다.** 지정한 의존성이 Effect 내부 코드에 기반하여 React가 예상하는 것과 일치하지 않으면 린트 에러가 발생합니다. 이는 코드의 많은 버그를 잡는 데 도움이 됩니다. 일부 코드가 재실행되지 않게 하려면, [해당 의존성을 "필요로 하지" 않도록 _Effect 코드 자체를 편집_ 하세요.](/learn/lifecycle-of-reactive-effects#what-to-do-when-you-dont-want-to-re-synchronize)

<Pitfall>

의존성 배열이 없는 것과 _빈_ `[]` 의존성 배열의 동작은 다릅니다:

```js {3,7,11}
useEffect(() => {
  // 모든 렌더링 후에 실행됩니다
})

useEffect(() => {
  // 마운트 시에만 실행됩니다 (컴포넌트가 나타날 때)
}, [])

useEffect(() => {
  // 마운트 시, *그리고* 마지막 렌더링 이후 a 또는 b가 변경되었을 때 실행됩니다
}, [a, b])
```

다음 단계에서 "마운트(mount)"가 무엇을 의미하는지 자세히 살펴보겠습니다.

</Pitfall>

<DeepDive>

#### 의존성 배열에서 ref가 생략된 이유는? {/_why-was-the-ref-omitted-from-the-dependency-array_/}

이 Effect는 `ref`와 `isPlaying` _둘 다_ 사용하지만, `isPlaying`만 의존성으로 선언됩니다:

```js {9}
function VideoPlayer({ src, isPlaying }) {
  const ref = useRef(null);
  useEffect(() => {
    if (isPlaying) {
      ref.current.play();
    } else {
      ref.current.pause();
    }
  }, [isPlaying]);
```

이는 `ref` 객체가 _안정적인 정체성(stable identity)_ 을 가지기 때문입니다: React는 매 렌더링에서 같은 `useRef` 호출로부터 [항상 같은 객체를 반환](/reference/react/useRef#returns)하도록 보장합니다. 절대 변경되지 않으므로, 그 자체로는 Effect를 다시 실행시키지 않습니다. 따라서 포함하든 하지 않든 상관없습니다. 포함해도 괜찮습니다:

```js {9}
function VideoPlayer({ src, isPlaying }) {
  const ref = useRef(null);
  useEffect(() => {
    if (isPlaying) {
      ref.current.play();
    } else {
      ref.current.pause();
    }
  }, [isPlaying, ref]);
```

`useState`가 반환하는 [`set` 함수](/reference/react/useState#setstate)도 안정적인 정체성을 가지므로, 의존성에서 생략되는 것을 자주 볼 수 있습니다. 린터가 에러 없이 의존성을 생략할 수 있게 해준다면, 그렇게 해도 안전합니다.

항상 안정적인 의존성을 생략하는 것은 린터가 객체가 안정적이라는 것을 "볼 수 있을" 때만 가능합니다. 예를 들어, `ref`가 부모 컴포넌트에서 전달된 경우 의존성 배열에 지정해야 합니다. 부모 컴포넌트가 항상 같은 ref를 전달하는지, 여러 ref 중 하나를 조건부로 전달하는지 알 수 없기 때문입니다. 따라서 Effect는 어떤 ref가 전달되는지에 _따라 달라집니다_.

</DeepDive>

### 3단계: 필요하면 정리 추가하기 {/_step-3-add-cleanup-if-needed_/}

다른 예제를 생각해 보세요. 채팅 서버가 나타날 때 연결해야 하는 `ChatRoom` 컴포넌트를 작성하고 있습니다. `connect()`와 `disconnect()` 메서드를 가진 객체를 반환하는 `createConnection()` API가 주어집니다. 사용자에게 표시되는 동안 컴포넌트를 어떻게 연결 상태로 유지할까요?

Effect 로직을 작성하는 것부터 시작합니다:

```js
useEffect(() => {
  const connection = createConnection()
  connection.connect()
})
```

매 리렌더링 후에 채팅에 연결하는 것은 느릴 것이므로, 의존성 배열을 추가합니다:

```js {4}
useEffect(() => {
  const connection = createConnection()
  connection.connect()
}, [])
```

**Effect 내부의 코드는 어떤 props나 state도 사용하지 않으므로, 의존성 배열은 `[]`(빈 배열)입니다. 이는 React에게 컴포넌트가 "마운트(mount)"될 때, 즉 화면에 처음 나타날 때만 이 코드를 실행하라고 알려줍니다.**

이 코드를 실행해 봅시다:

<Sandpack>

```js
import { useEffect } from 'react'
import { createConnection } from './chat.js'

export default function ChatRoom() {
  useEffect(() => {
    const connection = createConnection()
    connection.connect()
  }, [])
  return <h1>Welcome to the chat!</h1>
}
```

```js src/chat.js
export function createConnection() {
  // 실제 구현에서는 서버에 실제로 연결할 것입니다
  return {
    connect() {
      console.log('✅ Connecting...')
    },
    disconnect() {
      console.log('❌ Disconnected.')
    },
  }
}
```

```css
input {
  display: block;
  margin-bottom: 20px;
}
```

</Sandpack>

이 Effect는 마운트 시에만 실행되므로, 콘솔에 `"✅ Connecting..."`이 한 번만 출력될 것이라고 예상할 수 있습니다. **하지만 콘솔을 확인하면 `"✅ Connecting..."`이 두 번 출력됩니다. 왜 그럴까요?**

`ChatRoom` 컴포넌트가 다양한 화면이 있는 큰 앱의 일부라고 상상해 보세요. 사용자가 `ChatRoom` 페이지에서 여정을 시작합니다. 컴포넌트가 마운트되고 `connection.connect()`를 호출합니다. 그런 다음 사용자가 다른 화면으로 이동합니다(예: 설정 페이지). `ChatRoom` 컴포넌트가 언마운트(unmount)됩니다. 마지막으로 사용자가 뒤로가기를 클릭하면 `ChatRoom`이 다시 마운트됩니다. 이렇게 되면 두 번째 연결이 설정되지만, 첫 번째 연결은 절대 해제되지 않았습니다! 사용자가 앱을 돌아다닐수록 연결이 계속 쌓이게 됩니다.

이런 버그는 광범위한 수동 테스트 없이는 놓치기 쉽습니다. 빠르게 발견할 수 있도록, 개발 환경에서 React는 초기 마운트 직후에 모든 컴포넌트를 한 번 다시 마운트합니다.

`"✅ Connecting..."` 로그가 두 번 나타나는 것은 실제 문제를 알아차리는 데 도움이 됩니다: 코드가 컴포넌트가 언마운트될 때 연결을 닫지 않는다는 것입니다.

문제를 해결하려면 Effect에서 _정리 함수(cleanup function)_ 를 반환하세요:

```js {4-6}
useEffect(() => {
  const connection = createConnection()
  connection.connect()
  return () => {
    connection.disconnect()
  }
}, [])
```

React는 Effect가 다시 실행되기 전에 매번, 그리고 컴포넌트가 언마운트(제거)될 때 마지막으로 한 번 정리 함수를 호출합니다. 정리 함수가 구현되면 어떻게 되는지 봅시다:

<Sandpack>

```js
import { useState, useEffect } from 'react'
import { createConnection } from './chat.js'

export default function ChatRoom() {
  useEffect(() => {
    const connection = createConnection()
    connection.connect()
    return () => connection.disconnect()
  }, [])
  return <h1>Welcome to the chat!</h1>
}
```

```js src/chat.js
export function createConnection() {
  // 실제 구현에서는 서버에 실제로 연결할 것입니다
  return {
    connect() {
      console.log('✅ Connecting...')
    },
    disconnect() {
      console.log('❌ Disconnected.')
    },
  }
}
```

```css
input {
  display: block;
  margin-bottom: 20px;
}
```

</Sandpack>

이제 개발 환경에서 세 개의 콘솔 로그가 표시됩니다:

1. `"✅ Connecting..."`
2. `"❌ Disconnected."`
3. `"✅ Connecting..."`

**이것이 개발 환경에서의 올바른 동작입니다.** 컴포넌트를 다시 마운트함으로써 React는 다른 곳으로 이동했다가 돌아와도 코드가 깨지지 않는지 확인합니다. 연결을 끊었다가 다시 연결하는 것이 정확히 일어나야 하는 일입니다! 정리를 잘 구현하면, Effect를 한 번 실행하는 것과 실행하고 정리한 다음 다시 실행하는 것 사이에 사용자가 볼 수 있는 차이가 없어야 합니다. 개발 환경에서 React가 코드의 버그를 탐색하기 때문에 추가적인 연결/해제 호출 쌍이 있습니다. 이것은 정상입니다. 없애려고 하지 마세요!

**프로덕션에서는 `"✅ Connecting..."`이 한 번만 출력됩니다.** 컴포넌트를 다시 마운트하는 것은 정리가 필요한 Effect를 찾는 데 도움을 주기 위해 개발 환경에서만 발생합니다. [Strict Mode](/reference/react/StrictMode)를 꺼서 개발 동작을 비활성화할 수 있지만, 켜두는 것을 권장합니다. 위와 같은 많은 버그를 찾을 수 있습니다.

## 개발 환경에서 Effect가 두 번 실행되는 것은 어떻게 처리하나요? {/_how-to-handle-the-effect-firing-twice-in-development_/}

React는 개발 환경에서 마지막 예제와 같은 버그를 찾기 위해 컴포넌트를 의도적으로 다시 마운트합니다. **올바른 질문은 "Effect를 한 번만 실행하는 방법"이 아니라, "다시 마운트한 후에도 동작하도록 Effect를 어떻게 수정할 것인가"입니다.**

보통 답은 정리 함수를 구현하는 것입니다. 정리 함수는 Effect가 하고 있던 것을 중지하거나 취소해야 합니다. 경험적 규칙은 사용자가 Effect가 한 번 실행되는 것(프로덕션에서처럼)과 _설정 → 정리 → 설정_ 시퀀스(개발 환경에서처럼)를 구별할 수 없어야 한다는 것입니다.

작성하게 될 대부분의 Effect는 아래의 일반적인 패턴 중 하나에 해당합니다.

<Pitfall>

#### Effect 실행을 방지하기 위해 ref를 사용하지 마세요 {/_dont-use-refs-to-prevent-effects-from-firing_/}

개발 환경에서 Effect가 두 번 실행되는 것을 방지하기 위한 일반적인 함정은 `ref`를 사용하여 Effect가 두 번 이상 실행되지 않도록 하는 것입니다. 예를 들어, 위의 버그를 `useRef`로 "고칠" 수 있습니다:

```js {1,3-4}
const connectionRef = useRef(null)
useEffect(() => {
  // 🚩 이것은 버그를 고치지 않습니다!!!
  if (!connectionRef.current) {
    connectionRef.current = createConnection()
    connectionRef.current.connect()
  }
}, [])
```

이렇게 하면 개발 환경에서 `"✅ Connecting..."`이 한 번만 보이지만, 버그를 고치지는 않습니다.

사용자가 다른 곳으로 이동할 때 연결이 여전히 닫히지 않고, 돌아오면 새로운 연결이 생성됩니다. 사용자가 앱을 돌아다닐수록 "수정" 전과 마찬가지로 연결이 계속 쌓이게 됩니다.

버그를 고치려면 Effect를 한 번만 실행하는 것으로는 충분하지 않습니다. Effect는 다시 마운트 후에도 동작해야 하므로, 위의 해결책처럼 연결을 정리해야 합니다.

아래 예제에서 일반적인 패턴을 처리하는 방법을 참조하세요.

</Pitfall>

### 비-React 위젯 제어하기 {/_controlling-non-react-widgets_/}

때로는 React로 작성되지 않은 UI 위젯을 추가해야 합니다. 예를 들어, 페이지에 지도 컴포넌트를 추가한다고 합시다. `setZoomLevel()` 메서드가 있고, React 코드의 `zoomLevel` state 변수와 줌 레벨을 동기화하고 싶습니다. Effect는 다음과 비슷할 것입니다:

```js
useEffect(() => {
  const map = mapRef.current
  map.setZoomLevel(zoomLevel)
}, [zoomLevel])
```

이 경우에는 정리가 필요 없습니다. 개발 환경에서 React가 Effect를 두 번 호출하지만, 같은 값으로 `setZoomLevel`을 두 번 호출해도 아무 일도 하지 않기 때문에 문제가 되지 않습니다. 약간 느릴 수 있지만, 프로덕션에서는 불필요하게 다시 마운트하지 않으므로 상관없습니다.

일부 API는 연속으로 두 번 호출할 수 없습니다. 예를 들어, 내장 [`<dialog>`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement) 요소의 [`showModal`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal) 메서드는 두 번 호출하면 에러를 던집니다. 정리 함수를 구현하여 대화상자를 닫으세요:

```js {4}
useEffect(() => {
  const dialog = dialogRef.current
  dialog.showModal()
  return () => dialog.close()
}, [])
```

개발 환경에서 Effect는 `showModal()`을 호출한 다음 즉시 `close()`를 호출하고, 다시 `showModal()`을 호출합니다. 이는 프로덕션에서 `showModal()`을 한 번 호출하는 것과 같은 사용자 가시적 동작을 합니다.

### 이벤트 구독하기 {/_subscribing-to-events_/}

Effect가 무언가를 구독하면, 정리 함수에서 구독을 해제해야 합니다:

```js {6}
useEffect(() => {
  function handleScroll(e) {
    console.log(window.scrollX, window.scrollY)
  }
  window.addEventListener('scroll', handleScroll)
  return () => window.removeEventListener('scroll', handleScroll)
}, [])
```

개발 환경에서 Effect는 `addEventListener()`를 호출한 다음 즉시 `removeEventListener()`를 호출하고, 같은 핸들러로 다시 `addEventListener()`를 호출합니다. 따라서 한 번에 하나의 활성 구독만 있습니다. 이는 프로덕션에서 `addEventListener()`를 한 번 호출하는 것과 같은 사용자 가시적 동작을 합니다.

### 애니메이션 트리거하기 {/_triggering-animations_/}

Effect가 무언가를 애니메이션하면, 정리 함수에서 애니메이션을 초기값으로 리셋해야 합니다:

```js {4-6}
useEffect(() => {
  const node = ref.current
  node.style.opacity = 1 // 애니메이션 트리거
  return () => {
    node.style.opacity = 0 // 초기값으로 리셋
  }
}, [])
```

개발 환경에서 opacity는 `1`로 설정된 다음 `0`으로, 다시 `1`로 설정됩니다. 이는 프로덕션에서 일어나는 것처럼 직접 `1`로 설정하는 것과 같은 사용자 가시적 동작을 합니다. 트위닝을 지원하는 서드파티 애니메이션 라이브러리를 사용한다면, 정리 함수에서 타임라인을 초기 상태로 리셋해야 합니다.

### 데이터 가져오기 {/_fetching-data_/}

Effect가 무언가를 가져온다면, 정리 함수에서 [fetch를 중단](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)하거나 결과를 무시해야 합니다:

```js {2,6,13-15}
useEffect(() => {
  let ignore = false

  async function startFetching() {
    const json = await fetchTodos(userId)
    if (!ignore) {
      setTodos(json)
    }
  }

  startFetching()

  return () => {
    ignore = true
  }
}, [userId])
```

이미 발생한 네트워크 요청을 "취소"할 수는 없지만, 정리 함수는 _더 이상 관련 없는_ fetch가 애플리케이션에 계속 영향을 미치지 않도록 해야 합니다. `userId`가 `'Alice'`에서 `'Bob'`으로 변경되면, 정리는 `'Alice'` 응답이 `'Bob'` 이후에 도착하더라도 무시되도록 합니다.

**개발 환경에서는 Network 탭에 두 개의 fetch가 보입니다.** 이것은 전혀 문제가 없습니다. 위의 접근 방식을 사용하면 첫 번째 Effect가 즉시 정리되어 `ignore` 변수의 사본이 `true`로 설정됩니다. 따라서 추가 요청이 있더라도 `if (!ignore)` 체크 덕분에 state에 영향을 미치지 않습니다.

**프로덕션에서는 하나의 요청만 있습니다.** 개발 환경의 두 번째 요청이 신경 쓰인다면, 요청을 중복 제거하고 컴포넌트 간에 응답을 캐시하는 솔루션을 사용하는 것이 가장 좋은 접근 방식입니다:

```js
function TodoList() {
  const todos = useSomeDataLibrary(`/api/user/${userId}/todos`);
  // ...
```

이렇게 하면 개발 경험뿐만 아니라 애플리케이션도 더 빠르게 느껴집니다. 예를 들어, 사용자가 뒤로가기 버튼을 누르면 캐시되어 있으므로 데이터가 다시 로드될 때까지 기다리지 않아도 됩니다. 이런 캐시를 직접 만들거나 Effect에서의 수동 fetching에 대한 많은 대안 중 하나를 사용할 수 있습니다.

<DeepDive>

#### Effect에서 데이터 가져오기의 좋은 대안은? {/_what-are-good-alternatives-to-data-fetching-in-effects_/}

Effect 내부에서 `fetch` 호출을 작성하는 것은 특히 완전한 클라이언트 사이드 앱에서 [데이터를 가져오는 인기 있는 방법](https://www.robinwieruch.de/react-hooks-fetch-data/)입니다. 하지만 이것은 매우 수동적인 접근 방식이며 상당한 단점이 있습니다:

- **Effect는 서버에서 실행되지 않습니다.** 이는 초기 서버 렌더링 HTML에 데이터 없이 로딩 상태만 포함된다는 것을 의미합니다. 클라이언트 컴퓨터는 모든 JavaScript를 다운로드하고 앱을 렌더링한 후에야 이제 데이터를 로드해야 한다는 것을 알게 됩니다. 매우 효율적이지 않습니다.
- **Effect에서 직접 가져오면 "네트워크 워터폴(waterfall)"을 만들기 쉽습니다.** 부모 컴포넌트를 렌더링하고, 데이터를 가져오고, 자식 컴포넌트를 렌더링하면, 그 다음에 자식 컴포넌트가 데이터를 가져오기 시작합니다. 네트워크가 빠르지 않다면, 모든 데이터를 병렬로 가져오는 것보다 상당히 느립니다.
- **Effect에서 직접 가져오면 보통 데이터를 미리 로드하거나 캐시하지 않습니다.** 예를 들어, 컴포넌트가 언마운트된 후 다시 마운트되면 데이터를 다시 가져와야 합니다.
- **인체공학적이지 않습니다.** [경쟁 조건(race condition)](https://maxrozen.com/race-conditions-fetching-data-react-with-useeffect) 같은 버그가 발생하지 않는 방식으로 `fetch` 호출을 작성하려면 상당한 보일러플레이트 코드가 필요합니다.

이 단점 목록은 React에만 해당되는 것이 아닙니다. 어떤 라이브러리든 마운트 시 데이터를 가져오는 데 적용됩니다. 라우팅과 마찬가지로 데이터 가져오기를 잘 하는 것은 간단하지 않으므로, 다음 접근 방식을 추천합니다:

- **[프레임워크](/learn/creating-a-react-app#full-stack-frameworks)를 사용한다면, 내장 데이터 가져오기 메커니즘을 사용하세요.** 현대 React 프레임워크는 위의 함정을 겪지 않는 효율적인 통합 데이터 가져오기 메커니즘을 갖추고 있습니다.
- **그렇지 않다면, 클라이언트 사이드 캐시를 사용하거나 구축하는 것을 고려하세요.** 인기 있는 오픈소스 솔루션으로 [TanStack Query](https://tanstack.com/query/latest), [useSWR](https://swr.vercel.app/), [React Router 6.4+](https://beta.reactrouter.com/en/main/start/overview)가 있습니다. 직접 솔루션을 구축할 수도 있는데, 내부적으로 Effect를 사용하되 요청 중복 제거, 응답 캐싱, 네트워크 워터폴 방지(데이터 미리 로드 또는 라우트에 데이터 요구사항 끌어올리기) 로직을 추가합니다.

이런 접근 방식이 맞지 않는다면 Effect에서 직접 데이터를 가져오는 것을 계속할 수 있습니다.

</DeepDive>

### 분석 보내기 {/_sending-analytics_/}

페이지 방문 시 분석 이벤트를 보내는 다음 코드를 생각해 보세요:

```js
useEffect(() => {
  logVisit(url) // POST 요청을 보냅니다
}, [url])
```

개발 환경에서 `logVisit`이 모든 URL에 대해 두 번 호출되므로 이를 수정하고 싶을 수 있습니다. **이 코드는 그대로 두는 것을 권장합니다.** 이전 예제와 마찬가지로 한 번 실행하는 것과 두 번 실행하는 것 사이에 _사용자가 볼 수 있는_ 동작 차이가 없습니다. 실용적인 관점에서 `logVisit`은 개발 환경에서 아무것도 하지 않아야 합니다. 개발 머신의 로그가 프로덕션 메트릭을 왜곡하지 않기를 원하기 때문입니다. 파일을 저장할 때마다 컴포넌트가 다시 마운트되므로 어차피 개발 환경에서 추가 방문이 기록됩니다.

**프로덕션에서는 중복 방문 로그가 없습니다.**

보내는 분석 이벤트를 디버그하려면 앱을 스테이징 환경(프로덕션 모드로 실행)에 배포하거나, 일시적으로 [Strict Mode](/reference/react/StrictMode)와 개발 전용 다시 마운트 검사를 비활성화할 수 있습니다. Effect 대신 라우트 변경 이벤트 핸들러에서 분석을 보낼 수도 있습니다. 더 정확한 분석을 위해 [intersection observer](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)를 사용하면 어떤 컴포넌트가 뷰포트에 있고 얼마나 오래 보이는지 추적할 수 있습니다.

### Effect가 아닌 것: 애플리케이션 초기화 {/_not-an-effect-initializing-the-application_/}

일부 로직은 애플리케이션이 시작될 때 한 번만 실행되어야 합니다. 컴포넌트 밖에 넣을 수 있습니다:

```js {2-3}
if (typeof window !== 'undefined') {
  // 브라우저에서 실행 중인지 확인합니다.
  checkAuthToken()
  loadDataFromLocalStorage()
}

function App() {
  // ...
}
```

이렇게 하면 브라우저가 페이지를 로드한 후 한 번만 실행됩니다.

### Effect가 아닌 것: 제품 구매 {/_not-an-effect-buying-a-product_/}

때로는 정리 함수를 작성하더라도 Effect를 두 번 실행하는 것의 사용자에게 보이는 결과를 방지할 방법이 없습니다. 예를 들어, Effect가 제품 구매와 같은 POST 요청을 보내는 경우:

```js {2-3}
useEffect(() => {
  // 🔴 잘못됨: 이 Effect는 개발 환경에서 두 번 실행되어 코드의 문제를 노출합니다.
  fetch('/api/buy', { method: 'POST' })
}, [])
```

제품을 두 번 구매하고 싶지 않을 것입니다. 하지만 이것이 바로 이 로직을 Effect에 넣으면 안 되는 이유이기도 합니다. 사용자가 다른 페이지로 갔다가 뒤로가기를 누르면 어떨까요? Effect가 다시 실행됩니다. 사용자가 페이지를 _방문할_ 때가 아니라 _구매 버튼을 클릭할_ 때 구매하고 싶은 것입니다.

구매는 렌더링으로 인한 것이 아니라 특정 상호작용으로 인한 것입니다. 사용자가 버튼을 누를 때만 실행되어야 합니다. **Effect를 삭제하고 `/api/buy` 요청을 구매 버튼 이벤트 핸들러로 이동하세요:**

```js {2-3}
function handleClick() {
  // ✅ 구매는 특정 상호작용으로 인해 발생하므로 이벤트입니다.
  fetch('/api/buy', { method: 'POST' })
}
```

**이것은 다시 마운트가 애플리케이션의 로직을 깨뜨린다면, 보통 기존 버그를 발견한 것임을 보여줍니다.** 사용자의 관점에서 페이지를 방문하는 것은 페이지를 방문하고, 링크를 클릭하고, 뒤로가기를 눌러 다시 페이지를 보는 것과 다르지 않아야 합니다. React는 개발 환경에서 컴포넌트를 한 번 다시 마운트하여 컴포넌트가 이 원칙을 준수하는지 확인합니다.

## 모두 합쳐보기 {/_putting-it-all-together_/}

이 플레이그라운드는 Effect가 실제로 어떻게 동작하는지 "감을 잡는" 데 도움이 됩니다.

이 예제는 [`setTimeout`](https://developer.mozilla.org/en-US/docs/Web/API/setTimeout)을 사용하여 Effect 실행 3초 후에 입력 텍스트가 포함된 콘솔 로그를 예약합니다. 정리 함수는 대기 중인 타임아웃을 취소합니다. "Mount the component"를 눌러 시작하세요:

<Sandpack>

```js
import { useState, useEffect } from 'react'

function Playground() {
  const [text, setText] = useState('a')

  useEffect(() => {
    function onTimeout() {
      console.log('⏰ ' + text)
    }

    console.log('🔵 Schedule "' + text + '" log')
    const timeoutId = setTimeout(onTimeout, 3000)

    return () => {
      console.log('🟡 Cancel "' + text + '" log')
      clearTimeout(timeoutId)
    }
  }, [text])

  return (
    <>
      <label>
        What to log:{' '}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </label>
      <h1>{text}</h1>
    </>
  )
}

export default function App() {
  const [show, setShow] = useState(false)
  return (
    <>
      <button onClick={() => setShow(!show)}>{show ? 'Unmount' : 'Mount'} the component</button>
      {show && <hr />}
      {show && <Playground />}
    </>
  )
}
```

</Sandpack>

처음에 세 개의 로그가 보입니다: `Schedule "a" log`, `Cancel "a" log`, 그리고 다시 `Schedule "a" log`. 3초 후에 `a`라는 로그도 보입니다. 앞서 배운 것처럼, 추가적인 예약/취소 쌍은 React가 정리를 잘 구현했는지 확인하기 위해 개발 환경에서 컴포넌트를 한 번 다시 마운트하기 때문입니다.

이제 입력을 `abc`로 편집해 보세요. 충분히 빠르게 하면 `Schedule "ab" log` 바로 다음에 `Cancel "ab" log`와 `Schedule "abc" log`가 보입니다. **React는 항상 다음 렌더링의 Effect 전에 이전 렌더링의 Effect를 정리합니다.** 이것이 입력에 빠르게 타이핑하더라도 한 번에 하나의 타임아웃만 예약되는 이유입니다. 입력을 몇 번 편집하고 콘솔을 보면서 Effect가 어떻게 정리되는지 감을 잡아보세요.

입력에 무언가를 타이핑한 다음 바로 "Unmount the component"를 누르세요. 언마운트가 마지막 렌더링의 Effect를 정리하는 것을 확인하세요. 여기서는 마지막 타임아웃이 실행되기 전에 지웁니다.

마지막으로, 위의 컴포넌트를 편집하고 정리 함수를 주석 처리하여 타임아웃이 취소되지 않도록 해보세요. `abcde`를 빠르게 타이핑해 보세요. 3초 후에 무엇이 일어날 것으로 예상하나요? 타임아웃 안의 `console.log(text)`가 _최신_ `text`를 출력하고 다섯 개의 `abcde` 로그를 생성할까요? 직감을 확인해 보세요!

3초 후에 다섯 개의 `abcde` 로그가 아니라 일련의 로그(`a`, `ab`, `abc`, `abcd`, `abcde`)가 보일 것입니다. **각 Effect는 해당 렌더링의 `text` 값을 "캡처"합니다.** `text` state가 변경되었는지는 상관없습니다: `text = 'ab'`인 렌더링의 Effect는 항상 `'ab'`를 봅니다. 즉, 각 렌더링의 Effect는 서로 격리되어 있습니다. 이것이 어떻게 작동하는지 궁금하다면 [클로저(closure)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures)에 대해 읽어볼 수 있습니다.

<DeepDive>

#### 각 렌더링에는 자체 Effect가 있습니다 {/_each-render-has-its-own-effects_/}

`useEffect`를 렌더링 출력에 동작의 한 조각을 "연결"하는 것으로 생각할 수 있습니다. 다음 Effect를 생각해 보세요:

```js
export default function ChatRoom({ roomId }) {
  useEffect(() => {
    const connection = createConnection(roomId)
    connection.connect()
    return () => connection.disconnect()
  }, [roomId])

  return <h1>Welcome to {roomId}!</h1>
}
```

사용자가 앱을 돌아다닐 때 정확히 무슨 일이 일어나는지 봅시다.

#### 초기 렌더링 {/_initial-render_/}

사용자가 `<ChatRoom roomId="general" />`을 방문합니다. `roomId`를 `'general'`로 [대체해 봅시다](/learn/state-as-a-snapshot#rendering-takes-a-snapshot-in-time):

```js
// 첫 번째 렌더링의 JSX (roomId = "general")
return <h1>Welcome to general!</h1>
```

**Effect도 렌더링 출력의 일부입니다.** 첫 번째 렌더링의 Effect:

```js
// 첫 번째 렌더링의 Effect (roomId = "general")
;(() => {
  const connection = createConnection('general')
  connection.connect()
  return () => connection.disconnect()
},
  // 첫 번째 렌더링의 의존성 (roomId = "general")
  ['general'])
```

React가 이 Effect를 실행하여 `'general'` 채팅방에 연결합니다.

#### 같은 의존성으로 리렌더링 {/_re-render-with-same-dependencies_/}

`<ChatRoom roomId="general" />`이 리렌더링된다고 합시다. JSX 출력은 같습니다:

```js
// 두 번째 렌더링의 JSX (roomId = "general")
return <h1>Welcome to general!</h1>
```

React는 렌더링 출력이 변경되지 않았으므로 DOM을 업데이트하지 않습니다.

두 번째 렌더링의 Effect:

```js
// 두 번째 렌더링의 Effect (roomId = "general")
;(() => {
  const connection = createConnection('general')
  connection.connect()
  return () => connection.disconnect()
},
  // 두 번째 렌더링의 의존성 (roomId = "general")
  ['general'])
```

React는 두 번째 렌더링의 `['general']`을 첫 번째 렌더링의 `['general']`과 비교합니다. **모든 의존성이 같으므로 React는 두 번째 렌더링의 Effect를 _무시_ 합니다.** 호출되지 않습니다.

#### 다른 의존성으로 리렌더링 {/_re-render-with-different-dependencies_/}

그 다음 사용자가 `<ChatRoom roomId="travel" />`을 방문합니다. 이번에는 컴포넌트가 다른 JSX를 반환합니다:

```js
// 세 번째 렌더링의 JSX (roomId = "travel")
return <h1>Welcome to travel!</h1>
```

React는 DOM을 업데이트하여 `"Welcome to general"`을 `"Welcome to travel"`로 변경합니다.

세 번째 렌더링의 Effect:

```js
// 세 번째 렌더링의 Effect (roomId = "travel")
;(() => {
  const connection = createConnection('travel')
  connection.connect()
  return () => connection.disconnect()
},
  // 세 번째 렌더링의 의존성 (roomId = "travel")
  ['travel'])
```

React는 세 번째 렌더링의 `['travel']`을 두 번째 렌더링의 `['general']`과 비교합니다. 하나의 의존성이 다릅니다: `Object.is('travel', 'general')`은 `false`입니다. Effect를 건너뛸 수 없습니다.

**React가 세 번째 렌더링의 Effect를 적용하기 전에, _실행된_ 마지막 Effect를 정리해야 합니다.** 두 번째 렌더링의 Effect는 건너뛰었으므로 React는 첫 번째 렌더링의 Effect를 정리해야 합니다. 첫 번째 렌더링으로 스크롤하면, 정리가 `createConnection('general')`로 생성된 연결에 대해 `disconnect()`를 호출하는 것을 볼 수 있습니다. 이것이 앱을 `'general'` 채팅방에서 연결 해제합니다.

그 후에 React는 세 번째 렌더링의 Effect를 실행합니다. `'travel'` 채팅방에 연결합니다.

#### 언마운트 {/_unmount_/}

마지막으로 사용자가 다른 곳으로 이동하고 `ChatRoom` 컴포넌트가 언마운트됩니다. React는 마지막 Effect의 정리 함수를 실행합니다. 마지막 Effect는 세 번째 렌더링의 것이었습니다. 세 번째 렌더링의 정리가 `createConnection('travel')` 연결을 파괴합니다. 따라서 앱이 `'travel'` 방에서 연결 해제됩니다.

#### 개발 전용 동작 {/_development-only-behaviors_/}

[Strict Mode](/reference/react/StrictMode)가 켜져 있으면 React는 마운트 후 모든 컴포넌트를 한 번 다시 마운트합니다(state와 DOM은 유지됩니다). 이것은 [정리가 필요한 Effect를 찾는 데 도움이 되고](#step-3-add-cleanup-if-needed) 경쟁 조건 같은 버그를 일찍 노출시킵니다. 또한 개발 환경에서 파일을 저장할 때마다 React가 Effect를 다시 마운트합니다. 이 두 가지 동작은 개발 전용입니다.

</DeepDive>

<Recap>

- 이벤트와 달리 Effect는 특정 상호작용이 아닌 렌더링 자체로 인해 발생합니다.
- Effect를 사용하면 컴포넌트를 외부 시스템(서드파티 API, 네트워크 등)과 동기화할 수 있습니다.
- 기본적으로 Effect는 모든 렌더링 후에(초기 렌더링 포함) 실행됩니다.
- 모든 의존성이 마지막 렌더링과 같은 값이면 React는 Effect를 건너뜁니다.
- 의존성을 "선택"할 수 없습니다. 의존성은 Effect 내부의 코드에 의해 결정됩니다.
- 빈 의존성 배열(`[]`)은 컴포넌트가 "마운트"되는 것, 즉 화면에 추가되는 것에 해당합니다.
- Strict Mode에서 React는 (개발 환경에서만!) Effect를 스트레스 테스트하기 위해 컴포넌트를 두 번 마운트합니다.
- 다시 마운트로 인해 Effect가 깨진다면, 정리 함수를 구현해야 합니다.
- React는 다음에 Effect가 실행되기 전과 언마운트 중에 정리 함수를 호출합니다.

</Recap>
