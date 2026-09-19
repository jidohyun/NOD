# Damien Hirst — Worldview Timeline 스크롤 UI 리버스 엔지니어링

- 대상: https://hirst-fame-argorithm.vercel.app/
- 분석일: 2026-09-13
- 분석 방법: 프로덕션 번들 정적 분석 + 런타임 DOM 계측 (소스맵 없음, minified 코드 역추적)
- 번들: `/assets/index-BNMeBhTO.js` (760,058 bytes, 단일 청크), `/assets/index-Bj908sFG.css`

---

## 0. 한 줄 요약

**GSAP 없이** `Lenis(관성 스크롤)` + `framer-motion의 useScroll/useTransform(값 매핑)` + `CSS position:sticky(핀 고정)` 세 가지만으로 전체 스크롤 연출을 구성한다.
"스크롤 진행도(0~1)를 뽑아 → 아무 CSS 속성/`video.currentTime`/색상값에 선형 매핑" 이라는 단일 패턴의 반복이다.

---

## 1. 스택 판별

| 항목 | 판별 결과 | 근거 |
|---|---|---|
| 빌드 | Vite | `/assets/index-<hash>.js` 단일 엔트리, `<script type=module>` 1개 |
| 프레임워크 | React 18 + StrictMode | `createRoot(document.getElementById("root")).render(<StrictMode>…)` |
| UI 라이브러리 | MUI (Emotion) | `MuiBox-root css-xxxx` 클래스, `ThemeProvider`/`CssBaseline`/`useMediaQuery`/`useTheme` |
| 애니메이션 | motion (framer-motion v11+) | `useScroll`, `useTransform`, `useMotionValue`, `useMotionValueEvent`, `AnimatePresence`, `motion.div` |
| 스무스 스크롤 | **Lenis 1.3.23** | `window.lenisVersion === "1.3.23"` (런타임 확인) |
| 차트 | **직접 구현** (라이브러리 없음) | d3/recharts 미탐지, 자체 Catmull-Rom → 베지어 변환 함수 |
| i18n | **직접 구현** (i18next 아님) | `localStorage("rosko-locale")` + `?lang=` + `navigator.language` 폴백 |
| 3D | 없음 | THREE/WebGL/canvas 2D 컨텍스트 미사용 |

번들 내 키워드 카운트(정적 grep):

```
framer-motion  0   (패키지명 문자열은 트리셰이킹돼 사라짐, API 시그니처로 식별)
gsap           0
ScrollTrigger  0
lenis         26
IntersectionObserver 5
scrollYProgress 4
d3 / recharts  0
```

### 런타임 문서 계측 (뷰포트 3087×2088 기준)

```
document.scrollHeight  24,383px   (약 11.7 화면분)
<section> 높이 목록    6264 / 447 / 3943 / 745 / 745 / 773 / 773 / 295 / 12088 / 2088
position:sticky 요소   2개 (둘 다 height 2088 = 100dvh, top:0)
<img> 85개, <video> 5개
```

→ 6264px, 12088px 섹션이 각각 **핀 고정(pin) 구간**이다. 이 "비정상적으로 긴 섹션 + 내부 sticky" 조합이 이 사이트 스크롤 연출의 뼈대다.

---

## 2. 전역 스무스 스크롤: Lenis

앱 루트에서 훅 하나로 초기화하고 rAF 루프를 직접 돌린다 (`autoRaf` 미사용).

```js
function useLenis() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // exponential-out
      smoothWheel: true,
      smoothTouch: false,        // 모바일은 네이티브 스크롤 유지
    });
    let id;
    const raf = time => { lenis.raf(time); id = requestAnimationFrame(raf); };
    id = requestAnimationFrame(raf);
    return () => { cancelAnimationFrame(id); lenis.destroy(); };
  }, []);
}

function App() {
  useLenis();
  return (
    <I18nProvider>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <TimelineRoot worksData={…} eventsData={…} bioData={…} trendData={…} />
      </ThemeProvider>
    </I18nProvider>
  );
}
```

포인트

- `duration: 1.1` + expo-out 이징 = 휠 한 번에 부드럽게 감속하는 "무거운 관성" 감각. Lenis 기본값(`duration: 1.2`, 유사 expo)에서 살짝 조인 값.
- `smoothTouch: false`는 iOS 관성과 충돌/지연을 피하는 관례적 세팅.
- Lenis는 **스크롤 위치를 실제 `window.scrollY`에 반영**하기 때문에, framer-motion의 `useScroll`이나 `getBoundingClientRect` 기반 계산이 별도 연동 없이 그대로 동작한다. (GSAP ScrollTrigger처럼 `scrollerProxy` 연결이 필요 없음)
- `wheelMultiplier: 1`, `touchMultiplier: 1` (기본값 유지).

---

## 3. 핵심 패턴 A — sticky pin + 세로 스크롤 → 가로 이동

가로 스크롤 섹션의 실제 구현 (변수명은 가독성 있게 복원).

```jsx
function HorizontalScroll({ gap, bgColor, onProgress, children }) {
  const sectionRef = useRef(null);
  const trackRef   = useRef(null);
  const [scrollable, setScrollable] = useState(0);   // 가로로 밀어야 할 px

  // 트랙 실제 폭 - 뷰포트 폭
  useEffect(() => {
    const measure = () => {
      const trackW = trackRef.current.scrollWidth;
      const viewW  = window.innerWidth;
      setScrollable(Math.max(0, trackW - viewW));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [children, gap]);

  // 섹션 총 높이 = 뷰포트 높이 + 가로 이동량
  const sectionHeight =
    (window.visualViewport?.height ?? window.innerHeight) + scrollable;

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],   // 섹션 상단이 뷰포트 상단에 붙는 순간 0, 섹션 하단이 뷰포트 하단에 닿는 순간 1
  });
  useMotionValueEvent(scrollYProgress, "change", v => onProgress?.(v));

  const x = useTransform(scrollYProgress, [0, 1], [0, -scrollable]);

  return (
    <Box component="section" ref={sectionRef}
         sx={{ height: sectionHeight, position: "relative" }}>
      <Box sx={{ position: "sticky", top: 0, left: 0,
                 width: "100vw", height: "100dvh",
                 overflow: "hidden", backgroundColor: bgColor }}>
        <motion.div ref={trackRef}
                    style={{ x, display: "flex", width: "max-content", gap }}>
          {children}
        </motion.div>
      </Box>
    </Box>
  );
}
```

핵심 아이디어 3가지

1. **"세로로 남겨둔 길이 = 가로로 밀 픽셀"**. 섹션 높이를 `100dvh + scrollable`로 만들면, sticky 자식이 화면에 붙어 있는 동안 소비되는 세로 스크롤 양이 정확히 `scrollable`이 된다. → 진행도 0→1과 x: 0→-scrollable이 1:1 대응.
2. **`offset: ["start start", "end end"]`**: sticky가 붙기 시작하는 시점과 떨어지는 시점을 진행도 0/1에 정확히 맞추는 offset 조합. (등장 연출용으로는 `["start end", "end start"]`를 따로 씀 — 4절 참고)
3. **`width: "max-content"`**: 트랙 폭을 콘텐츠가 결정하게 두고, JS는 측정만 한다.

실제 DOM에서 확인된 두 pin 섹션:

| 섹션 | 높이 | 소비 스크롤 | 용도 |
|---|---|---|---|
| `css-79elbk` | 6,264px | ≈ 4,176px | 챕터 카드(DEATH / PRICE / GRID / BURN / INDEX) 가로 슬라이드 |
| `css-10ym0qz` | 12,088px | ≈ 10,000px | 1986–2025 트렌드 타임라인 그래프 |

---

## 4. 핵심 패턴 B — 스크롤 진행도의 두 가지 계산 방식

이 사이트는 **motion의 `useScroll`** 과 **직접 만든 rAF 루프** 두 가지를 상황에 따라 병용한다.

### 4-1. motion `useScroll` (선언적, 대부분의 경우)

```js
const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
// start end : 요소 상단이 뷰포트 하단에 닿을 때 0   (요소가 막 등장)
// end start : 요소 하단이 뷰포트 상단에 닿을 때 1   (요소가 막 퇴장)
```

번들에 존재하는 offset 조합은 딱 두 종류다.

- `["start start", "end end"]` — pin 구간 진행도 (가로 스크롤 / 타임라인)
- `["start end", "end start"]` — 등장~퇴장 전 구간 진행도 (패럴럭스 / 색상 전환)

### 4-2. 커스텀 rAF 진행도 (비디오 스크러빙 등 고빈도 갱신용)

`useScroll`은 motion value 구독 기반이라 프레임당 여러 번 호출될 수 있는데, 비디오 시킹은 그보다 낮은 주기로 충분하다. 그래서 **16ms 스로틀 rAF 루프**를 따로 돌린다.

```js
useEffect(() => {
  if (motionProgress) return;              // motion value가 주어지면 이 경로는 사용 안 함
  const el = videoRef.current;
  if (!el || !isInView) return;            // 화면 밖이면 루프 자체를 안 돎

  let rafId = null, last = 0;
  const THROTTLE = 16;                      // ≈60fps 상한

  const tick = () => {
    const now = Date.now();
    if (now - last < THROTTLE) { rafId = requestAnimationFrame(tick); return; }
    last = now;

    let p = 0;
    const target = containerRef?.current ?? el;
    const scrollY = window.scrollY || window.pageYOffset;
    const top     = target.getBoundingClientRect().top + scrollY;
    const h       = Math.max(1, target.offsetHeight);
    p = (scrollY - top) / h;

    const { start, end } = scrollRange;     // 부분 구간만 쓰고 싶을 때
    p = (p - start) / (end - start);

    seek(p);
    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);
  const onScroll = () => { if (!rafId) rafId = requestAnimationFrame(tick); };
  window.addEventListener("scroll", onScroll, { passive: true });

  return () => {
    window.removeEventListener("scroll", onScroll);
    rafId && cancelAnimationFrame(rafId);
  };
}, [isInView, containerRef, motionProgress, scrollRange, seek]);
```

가시성 게이트는 IntersectionObserver로 별도 관리:

```js
useEffect(() => {
  const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.1 });
  io.observe(videoRef.current);
  return () => io.disconnect();
}, []);
```

> 참고: 앱 코드에서 framer-motion의 `whileInView`는 쓰지 않는다. 번들의 `whileInView` 문자열은 전부 라이브러리 내부 코드다. 등장 판별은 전부 `IntersectionObserver` 직접 사용 (섹션 진입 판정은 `threshold: 0.05`).

---

## 5. 히어로: 스크롤 스크러빙 비디오

가장 눈에 띄는 연출. 스크롤이 곧 비디오 타임라인이다.

### 5-1. 히어로 섹션 구조

```jsx
function Hero({ onHeroProgress, onVideoReady, onVideoLoadProgress }) {
  const ref = useRef(null);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const src = isMobile ? "/assets/hirst-scrub-mobile-CnT12oDC.mp4"
                       : "/assets/hirst-scrub-graded-BzCsXnNj.mp4";

  const { scrollY } = useScroll();

  // scrollY -> 섹션 자체 진행도 0~1 (getBoundingClientRect 직접 계산)
  const progress = useTransform(scrollY, () => {
    const el = ref.current; if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const travel = el.offsetHeight - window.innerHeight;
    return travel <= 0 ? 0 : clamp01(-rect.top / travel);
  });

  const textY  = useTransform(progress, [0, .5, 1], ["0vh", "75vh", "75vh"]);
  const scaleD = useTransform(progress, [0, .5, 1], [0.7, 1, 1]);
  const scale  = isMobile ? 1 : scaleD;   // 모바일은 스케일 연출 생략

  useEffect(() => { onHeroProgress?.(progress); }, [progress]);

  return (
    <Box component="section" ref={ref} sx={{ position: "relative" }}>
      {/* SVG 필터 정의 (아래 5-3) */}
      <svg width="0" height="0" style={{ position: "absolute" }}>…</svg>

      {/* 레이어 1: 고정 비디오 */}
      <Box sx={{ position: "sticky", top: 0, width: "100%", height: "100dvh",
                 zIndex: 0, overflow: "hidden" }}>
        <motion.div style={{ position: "absolute", inset: 0, scale,
                             transformOrigin: "center center",
                             willChange: "transform", isolation: "isolate" }}>
          <VideoScrubbing src={src} progress={progress}
                          onReady={onVideoReady} onLoadProgress={onVideoLoadProgress} />
        </motion.div>
      </Box>

      {/* 레이어 2: 텍스트 — 음수 마진으로 비디오 위에 겹침 */}
      <Box sx={{ position: "relative", height: "100dvh",
                 marginTop: "-100dvh", zIndex: 1, pointerEvents: "none" }}>
        <motion.div style={{ y: textY }}>…</motion.div>
      </Box>
    </Box>
  );
}
```

- `marginTop: "-100dvh"` — sticky 레이어 위에 텍스트 레이어를 정확히 포개는 고전 기법. absolute 대신 이걸 쓰면 문서 흐름을 유지한 채 겹칠 수 있다.
- `progress` 전반 0→0.5 구간에서 비디오가 `scale 0.7 → 1`로 확대되고, 텍스트는 `0vh → 75vh`로 밀려 내려간다. 0.5 이후엔 두 값 모두 고정(홀드).
- `pointerEvents: "none"`로 텍스트 레이어가 아래 비디오/인터랙션을 가리지 않게 함.

### 5-2. VideoScrubbing 컴포넌트

```jsx
const IS_IN_APP_BROWSER =
  /FBAN|FBAV|FBIOS|Instagram|Barcelona|Line\//i.test(navigator.userAgent);

const VideoScrubbing = ({ src, containerRef = null, sx = {}, progress = null,
                          scrollRange = { start: 0, end: 1 },
                          onProgressChange, onReady, onLoadProgress, ...rest }) => {
  const videoRef = useRef(null);
  const [inView, setInView]   = useState(false);
  const [ready, setReady]     = useState(false);
  const [objUrl, setObjUrl]   = useState(null);

  // (1) 스트리밍 fetch → 진행률 콜백 → Blob URL
  useEffect(() => {
    let aborted = false, url = null;
    if (IS_IN_APP_BROWSER) {                 // 인앱 브라우저는 blob 재생 이슈 → 원본 src 직행
      setObjUrl(src); onLoadProgress?.(1); return;
    }
    (async () => {
      try {
        const res = await fetch(src);
        if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
        const total  = Number(res.headers.get("Content-Length")) || 0;
        const reader = res.body.getReader();
        const chunks = []; let received = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done || aborted) break;
          chunks.push(value); received += value.length;
          if (total) onLoadProgress?.(Math.min(1, received / total));
        }
        if (aborted) return;
        url = URL.createObjectURL(new Blob(chunks, { type: "video/mp4" }));
        setObjUrl(url); onLoadProgress?.(1);
      } catch (e) {
        console.warn("VideoScrubbing: fetch failed, falling back to direct src.", e);
        setObjUrl(src); onLoadProgress?.(1);          // 폴백
      }
    })();
    return () => { aborted = true; url && URL.revokeObjectURL(url); };
  }, [src]);

  // (2) 준비 완료 판정 + 10초 타임아웃 폴백
  useEffect(() => {
    const el = videoRef.current; if (!objUrl || !el) return;
    let done = false;
    const ok = () => { if (!done) { done = true; setReady(true); onReady?.(); } };
    const fail = () => {
      if (done) return;
      if (objUrl.startsWith("blob:")) { URL.revokeObjectURL(objUrl); setObjUrl(src); }
      else ok();
    };
    el.addEventListener("loadeddata", ok);
    el.addEventListener("loadedmetadata", ok);
    el.addEventListener("canplay", ok);
    el.addEventListener("error", fail);
    if (el.readyState >= 2) ok();
    el.load();
    const timer = setTimeout(fail, 10_000);
    return () => { /* cleanup */ };
  }, [objUrl, src, onReady]);

  // (3) 진행도 → currentTime
  const seek = useCallback(p => {
    const el = videoRef.current;
    if (!el || !Number.isFinite(p)) return;
    const c = clamp01(p);
    onProgressChange?.(c);
    if (el.duration) {
      const t = el.duration * c;
      if (Math.abs(el.currentTime - t) > 0.033) el.currentTime = t;  // 1프레임(30fps) 이내면 무시
    }
  }, [onProgressChange]);

  useEffect(() => { if (progress?.on) { seek(progress.get()); return progress.on("change", seek); } },
            [progress, seek]);

  return (
    <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
      <Box component="video" ref={videoRef} src={objUrl ?? undefined}
           muted playsInline preload="auto"
           sx={{ width: "100%", height: "auto", display: "block",
                 position: "relative", zIndex: 0,
                 opacity: ready ? 1 : 0, transition: "opacity 600ms ease", ...sx }}
           {...rest} />
    </Box>
  );
};
```

이 컴포넌트가 잘 만든 부분

- **Blob 선다운로드**: `video.currentTime = t`를 스크롤마다 때리면 스트리밍(range request) 상태에선 버퍼 미스로 끊긴다. 통째로 받아 Blob URL로 붙이면 완전 랜덤 시킹이 매끄러워진다.
- **로딩 진행률 노출**: `Content-Length` 기반으로 0~1을 상위에 콜백 → 인트로 로더 진행바에 사용.
- **0.033초 데드존**: 프레임 하나 미만 차이는 시킹하지 않음. 불필요한 디코드 요청을 줄이는 표준 트릭.
- **3중 폴백**: 인앱 브라우저 감지 / fetch 실패 / 10초 타임아웃 → 전부 원본 `src` 직행.
- **모바일 전용 인코딩**: `hirst-scrub-mobile-*.mp4` 별도 제공, `objectFit`도 `contain`으로 전환.

### 5-3. SVG "먼지(dirt)" 필터

히어로 텍스트에 입자 노이즈를 얹는 필터를 인라인 `<svg width="0" height="0">`로 정의해두고 CSS `filter: url(#hero-dirt)`로 참조한다.

```jsx
<filter id="hero-dirt" x="-5%" y="-5%" width="110%" height="110%"
        colorInterpolationFilters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" seed="5" result="noise" />
  <feColorMatrix in="noise" type="matrix" result="whiteDots"
     values="0 0 0 0 1
             0 0 0 0 1
             0 0 0 0 1
             0.4 0.4 0.4 0 -1.05" />
  <feComposite in="whiteDots" in2="SourceGraphic" operator="in" result="dirtOnText" />
  <feMerge><feMergeNode in="SourceGraphic" /><feMergeNode in="dirtOnText" /></feMerge>
</filter>
```

`feTurbulence`로 프랙탈 노이즈 → `feColorMatrix` 알파 행에 큰 오프셋(-1.05)을 줘 대부분을 투명하게 깎고 상위 밝은 점만 남김 → `feComposite operator="in"`으로 글자 영역 안쪽만 마스킹 → 원본 위에 병합. 텍스처 이미지 없이 순수 필터로 "인쇄 잉크 번짐" 질감을 만든다.

---

## 6. 타임라인 차트 (12,088px pin 구간)

사이트의 하이라이트. 1986–2025 구글 트렌드 지수와 작품 노드를 하나의 초광폭 캔버스에 배치하고, 세로 스크롤로 가로 패닝한다.

### 6-1. 데이터

번들에 데이터셋이 **하드코딩**되어 있다 (API 없음).

```js
trendData = {
  source: "Google Trends Worldwide",
  unit:   "Search Index (max=100)",
  range:  { start: "2004-04", end: "2026-05", monthlyPoints: 266 },
  peaks: [
    { date: "2008-09", value: 100, trigger: "Sotheby's BIMHF",              eventId: "sotheby" },
    { date: "2007-06", value:  75, trigger: "For the Love of God 공개",      eventId: "skull"   },
    { date: "2012-04", value:  73, trigger: "Tate Modern 회고전",            eventId: "tate"    },
    { date: "2017-04", value:  27, trigger: "베니스 〈Treasures from the Wreck〉", eventId: "venice" },
    { date: "2021-09", value:  23, trigger: "〈The Currency〉 NFT",           eventId: "currency"},
  ],
  series: [["2004-04",25],["2004-05",28], … 266개],
}
```

부가 데이터셋: `careerStages`(6단계), `preTrendEvents`(2004년 이전 사건), `events`, `specimens`/`aquaticSpecimens`(생물 표본 검증 데이터), `sources`(출처 목록, `verified` 플래그 포함), `caveats`(수치 반박/한계 명시), `footerInsights`.
데이터 신뢰도 메타(`asOfDate`, `noOfficialAggregate`, `unverifiedMillions` 등)를 코드에 같이 넣어둔 게 특이점.

### 6-2. 라인 생성 — 자체 Catmull-Rom 스무딩

```js
const TENSION = 1 / 6;

function smoothPath(points) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0][0]} ${points[0][1]}`;
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) * TENSION;
    const c1y = p1[1] + (p2[1] - p0[1]) * TENSION;
    const c2x = p2[0] - (p3[0] - p1[0]) * TENSION;
    const c2y = p2[1] - (p3[1] - p1[1]) * TENSION;
    d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}
```

좌표 매핑:

```js
const HEAD_ROOM = 200;                    // 값 100일 때 위쪽 여백
const plotH = axisY - HEAD_ROOM;
const toX = ym => { const [y, m] = ym.split("-").map(Number); return yearToX(y + (m - 1) / 12); };
const toY = v  => axisY - (v / 100) * plotH;
const pts = series.map(([ym, v]) => [toX(ym), toY(v)]);
// 첫 점 1년 앞에 바닥 앵커를 추가해 라인이 축에서 솟아오르게 함
const withAnchor = [[yearToX(firstYear - 1), axisY], ...pts];
const d = smoothPath(withAnchor);
```

### 6-3. **SVG 윈도잉 트릭** (가장 영리한 부분)

전체 트랙 폭(수만 px) 크기의 `<svg>`를 만들면 래스터화 비용이 폭증한다. 그래서:

```jsx
const max = Math.max(0, totalWidth - viewportW);
const F = useTransform(p, v =>  v * max);   // 바깥 컨테이너를 오른쪽으로
const R = useTransform(p, v => -v * max);   // 안쪽 <g>를 왼쪽으로 (상쇄)

const layer = { position: "absolute", top: 0, left: 0,
                width: viewportW,            // ← SVG는 딱 뷰포트 폭만
                pointerEvents: "none", willChange: "transform" };

<motion.div style={{ ...layer, height: axisY + 1, zIndex: 0, x: F }} aria-hidden>
  <svg width={viewportW} height={axisY + 1} style={{ overflow: "hidden", display: "block" }}>
    <motion.g style={{ x: R }}>
      <path d={d} fill="none" stroke={strokeColor}
            strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </motion.g>
  </svg>
</motion.div>
```

- 바깥 `motion.div`는 `x: +v*max`로 스크롤을 따라 오른쪽으로 이동 → **항상 화면에 머문다**.
- 안쪽 `<g>`는 `x: -v*max`로 반대로 이동 → **콘텐츠는 정상적으로 왼쪽으로 흐른다.**
- 결과적으로 SVG 뷰포트는 화면 크기 그대로 유지되면서, 내용만 패닝된다. 사실상 **수동 가상화(virtualization)**.
- 같은 트릭을 피크 마커 레이어에도 한 번 더 적용(`height: axisY + 200`, `zIndex: 50`)해서 라벨이 라인 위에 오도록 레이어를 분리했다.

### 6-4. 피크 마커 인터랙션

```jsx
{peaks.map(pk => {
  const isMax = pk.value >= 100;
  const r     = isMax ? 14 : 10;
  const color = isMax ? "#E63946" : "rgba(255,255,255,0.92)";
  const labelY = Math.max(pk.py - 56 - 8, 12);
  const HIT_W  = 180;
  return (
    <g onMouseEnter={…} onMouseLeave={…} onClick={…}
       style={{ cursor: "pointer", pointerEvents: "auto" }}>
      {/* 투명 히트박스: 얇은 선/작은 원 대신 넓은 rect로 hover 안정화 */}
      <rect x={pk.px - HIT_W / 2} y={labelY - 14} width={HIT_W} height={…} fill="transparent" />
      <line x1={pk.px} y1={pk.py - r - 4} x2={pk.px} y2={pk.py - 56 + 4}
            stroke={color} strokeWidth={1} opacity={0.65} />
      <circle cx={pk.px} cy={pk.py} r={r} fill={color} stroke={bgPage} strokeWidth={1.5} />
      <text x={pk.px} y={labelY} fill={…} fontSize={12} fontWeight={600}
            textAnchor="middle" letterSpacing="0.02em">{pk.trigger}</text>
    </g>
  );
})}
```

- 부모 레이어는 `pointerEvents: "none"`, 인터랙션이 필요한 `<g>`만 `"auto"`로 되살리는 패턴.
- 넓은 투명 `rect` 히트박스로 얇은 SVG 요소의 hover 난이도를 해결.
- 2008년(값 100)만 빨강 `#E63946`으로 강조.

### 6-5. 미니맵 내비게이터

```jsx
const MINIMAP_W = 180;

function Minimap({ totalWidth, viewportWidth, scrollProgress, onNavigate }) {
  const ref = useRef(null);
  const thumbW = Math.max(12, (viewportWidth / totalWidth) * MINIMAP_W);
  const thumbX = useTransform(scrollProgress, [0, 1], [0, MINIMAP_W - thumbW]);

  const handleClick = e => {
    const rect = ref.current.getBoundingClientRect();
    onNavigate(clamp01((e.clientX - rect.left) / MINIMAP_W));
  };

  return (
    <Box ref={ref} onClick={handleClick}
         sx={{ position: "fixed", top: 56, right: 16, zIndex: 1100,
               width: MINIMAP_W, height: … }}>
      …
    </Box>
  );
}
```

클릭 시 비율 → 해당 위치로 스크롤 점프 (Lenis `scrollTo` 경유).

### 6-6. 축 요소

- Y축(0/25/50/75/100)은 SVG가 아니라 **DOM 레이어**로 그리고, 동일한 `x: F` 상쇄 트랜스폼을 적용해 화면 왼쪽에 고정된 것처럼 보이게 한다 (`left: viewportWidth - 64`, `width: 56`).
- 연도 눈금, 시기 밴드(PEDAGOGY / NATURAL HISTORY / …), 감정 밴드(초월/시스템/의례/바니타스/죽음)는 별도 컴포넌트가 `scrollOffset`을 받아 같은 방식으로 이동.
- 작품 노드는 `viewportCenterX`와 `focusRadius`를 받아 **화면 중앙에 가까울수록 크게/선명하게** 렌더하고, 다른 노드 hover 시 `isDimmed`로 흐려진다.

```js
// 중앙 근접도 → 스케일/불투명도
const focus = useTransform(centerDistance, d => (d <= 0 ? 1 : d >= radius ? 0 : 1 - d / radius));
```

---

## 7. 텍스트 연출

### 7-1. 단어 단위 패럴럭스

```jsx
const DEPTHS = [10, 14, 12, 16, 13, 17, 11, 15];      // vh 단위, 순환 배정
const depthsFor = n => Array.from({ length: n }, (_, i) => DEPTHS[i % DEPTHS.length]);

function ParallaxWord({ progress, depth, children }) {
  const transform = useTransform(progress, [0, 1],
    ["translate3d(0, 0vh, 0)", `translate3d(0, -${depth}vh, 0)`]);
  return (
    <motion.span style={{ transform, display: "inline-block",
                          verticalAlign: "baseline", willChange: "transform" }}>
      {children}
    </motion.span>
  );
}

function ParallaxText({ text, scrollProgress, speed = 1, align = "center", padding = 4, color }) {
  const words  = text.split(" ");
  const depths = depthsFor(words.length).map(d => d * speed);
  …
}
```

- 단어마다 서로 다른 이동량(10~17vh)을 줘서 **문장 하나가 여러 깊이의 레이어처럼** 어긋나며 흐른다.
- `translate3d`를 문자열 보간으로 쓴 이유는 GPU 레이어 승격 + vh 단위 유지. `willChange: "transform"` 명시.
- 값 배열이 규칙적 증감이 아니라 `10,14,12,16,13,17,11,15`처럼 지그재그라 어긋남이 무작위처럼 보인다.

### 7-2. 텍스트 자동 맞춤 (TextFit)

폰트 크기를 컨테이너 폭에 맞춰 실시간 계산한다.

```jsx
function TextFit({ text, children, minSize, maxSize, fontFamily, fontWeight,
                   letterSpacing, wordSpacing, lineHeight }) {
  const boxRef  = useRef(null);
  const ghostRef = useRef(null);
  const [size, setSize] = useState(0);

  const recalc = useCallback(() => {
    const ghostW = ghostRef.current?.offsetWidth;      // 100px로 렌더한 폭
    const boxW   = boxRef.current?.offsetWidth;
    if (!ghostW) return;
    const next = 100 * (boxW * 0.98 / ghostW);         // 비례식 한 번으로 확정
    setSize(Math.min(Math.max(next, minSize), maxSize));
  }, [minSize, maxSize]);

  useEffect(() => {
    const ro = new ResizeObserver(recalc);
    ro.observe(boxRef.current); recalc();
    return () => ro.disconnect();
  }, [text, recalc]);

  return (
    <Box ref={boxRef} className="text-fit"
         sx={{ display: "flex", width: "100%", justifyContent: "center", alignItems: "center" }}>
      <Box component="span"
           sx={{ display: "block", fontFamily, lineHeight, fontWeight,
                 fontSize: `${size}px`, letterSpacing, wordSpacing,
                 whiteSpace: "nowrap", textAlign: "center",
                 transition: "font-size 0.1s ease-out" }}>
        {children ?? text}
      </Box>
      {/* 측정 전용 고스트: 화면 밖 + visibility:hidden */}
      <Box ref={ghostRef} component="span" aria-hidden="true"
           sx={{ position: "absolute", left: "-9999px", top: 0, visibility: "hidden",
                 whiteSpace: "nowrap", fontFamily, fontWeight, fontSize: "100px",
                 letterSpacing, wordSpacing, pointerEvents: "none" }}>
        {text}
      </Box>
    </Box>
  );
}
```

- 이분탐색 없이 **100px 기준 측정 → 비례 계산 한 번**으로 끝낸다. (letterSpacing이 px 고정이면 완전 선형은 아니지만 실용적으로 충분)
- `ResizeObserver`로 반응형 재계산, `transition: font-size 0.1s`로 리사이즈 중 계단 현상 완화.
- 고스트는 `left: -9999px` + `visibility: hidden` + `aria-hidden` 조합 (스크린리더 중복 방지).

### 7-3. 스크롤 연동 배경색 전환

```js
const mv = useMotionValue(0);
const [progress, setProgress] = useState(mv);
const background = useTransform(
  progress,
  isMobile ? [0.45, 0.5] : [0.95, 1],       // 모바일은 훨씬 이른 지점에서 전환
  [colors.bg.page, colors.text.onLight]      // 다크 → 라이트
);

<motion.div style={{ position: "relative", minHeight: "100dvh", background }}>
```

색상 문자열도 `useTransform`이 자동 보간한다. 브레이크포인트에 따라 전환 구간을 다르게 준 게 포인트(모바일은 스크롤 여유가 적어 일찍 시작).

---

## 8. 인트로 로더

```jsx
const PRELOAD_IMAGES = [ … ];
function preloadAll() {
  PRELOAD_IMAGES.forEach(src => { const img = new Image(); img.src = src; });
}

function IntroLoader({ visible, progress = 0 }) {
  const [i, setI] = useState(0);
  useEffect(() => { preloadAll(); }, []);
  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => setI(v => (v + 1) % PRELOAD_IMAGES.length), 1200);
    return () => clearInterval(id);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          style={{ position: "fixed", inset: 0, zIndex: 9999,
                   backgroundColor: colors.bg.page,
                   display: "flex", flexDirection: "column",
                   alignItems: "center", justifyContent: "center", gap: "4vh" }}>
          <Box sx={{ position: "relative", width: { xs: 200, md: 320, lg: 380 }, aspectRatio: "1 / 1" }}>
            <AnimatePresence mode="wait">
              <motion.img key={i} src={PRELOAD_IMAGES[i]} aria-hidden
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.06 }}
                transition={{ duration: 0.55, ease: "easeInOut" }}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: … }} />
            </AnimatePresence>
          </Box>
          {/* progress 바 — VideoScrubbing의 onLoadProgress가 흘려보낸 값 */}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- 로더는 단순 대기 화면이 아니라 **히어로 mp4의 실제 다운로드 진행률**을 보여준다 (`onLoadProgress` → `setState` → `IntroLoader progress`).
- 대기 중 1.2초 간격 이미지 크로스페이드(`AnimatePresence mode="wait"` + key 교체)로 지루함 상쇄 + 동시에 이미지 프리로드.
- `zIndex: 9999`, `pointerEvents: "auto"`로 로딩 중 스크롤/클릭 차단.

---

## 9. i18n (직접 구현)

```js
const LOCALES = ["ko", "en"];
const STORAGE_KEY = "rosko-locale";

function detectLocale() {
  if (typeof window === "undefined") return "ko";
  const q = new URL(location.href).searchParams.get("lang");
  if (q && LOCALES.includes(q)) { localStorage.setItem(STORAGE_KEY, q); return q; }
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && LOCALES.includes(saved)) return saved;
  const nav = navigator.language || navigator.userLanguage;
  return nav?.startsWith("ko") ? "ko" : "en";
}
```

우선순위: **URL 쿼리 `?lang=` → localStorage → navigator.language → 기본 ko**.
사전은 중첩 객체를 `t("axis.mortality")` 같은 점 경로로 접근하는 최소 구현. i18next 미사용 (번들 절감 목적으로 보임).

---

## 10. 성능 관련 설계 정리

| 기법 | 적용 위치 | 효과 |
|---|---|---|
| SVG 상쇄 트랜스폼 윈도잉 | 타임라인 그래프 | 수만 px SVG → 뷰포트 폭 SVG로 축소 |
| `will-change: transform` | 패럴럭스 단어, 차트 레이어, 히어로 스케일 | GPU 레이어 승격 |
| `transform`만 애니메이트 | 전 구간 (`x`, `y`, `scale`) | 레이아웃/페인트 회피, 컴포지트만 |
| IntersectionObserver 게이트 | 비디오(0.1), 섹션 진입(0.05) | 화면 밖 rAF 루프 완전 정지 |
| 16ms rAF 스로틀 | 비디오 스크러빙 진행도 | 계산 빈도 상한 |
| 0.033s 시킹 데드존 | `video.currentTime` | 불필요한 디코드 요청 제거 |
| Blob 선다운로드 | 히어로 mp4 | 랜덤 시킹 시 버퍼 스톨 제거 |
| 모바일 별도 인코딩 | `hirst-scrub-mobile.mp4` | 모바일 대역폭/디코드 절감 |
| `ResizeObserver` | TextFit, 가로 트랙 측정 | resize 이벤트 폴링 대신 정확한 시점 갱신 |
| `pointerEvents: none` + 부분 복구 | 텍스트 오버레이, SVG 레이어 | 히트테스트 비용/방해 제거 |
| `passive: true` 스크롤 리스너 | 커스텀 진행도 루프 | 스크롤 블로킹 방지 |
| `prefers-reduced-motion` | motion 내부 자동 처리 | 접근성 (앱 코드에서 별도 분기는 없음) |

---

## 11. 그대로 따라 할 수 있는 최소 레시피

### (1) 세로 → 가로 스크롤

```jsx
const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
const x = useTransform(scrollYProgress, [0, 1], [0, -(trackW - window.innerWidth)]);

<section ref={ref} style={{ height: window.innerHeight + (trackW - window.innerWidth) }}>
  <div style={{ position: "sticky", top: 0, height: "100dvh", overflow: "hidden" }}>
    <motion.div style={{ x, display: "flex", width: "max-content" }}>{cards}</motion.div>
  </div>
</section>
```

### (2) 스크롤 스크러빙 비디오

```jsx
const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
useMotionValueEvent(scrollYProgress, "change", p => {
  const v = videoRef.current;
  if (!v?.duration) return;
  const t = v.duration * p;
  if (Math.abs(v.currentTime - t) > 0.033) v.currentTime = t;
});
// + fetch → Blob URL 선다운로드는 필수에 가깝다
```

### (3) 초광폭 SVG 윈도잉

```jsx
const F = useTransform(p, v =>  v * (totalW - viewW));
const R = useTransform(p, v => -v * (totalW - viewW));
<motion.div style={{ position: "absolute", width: viewW, x: F }}>
  <svg width={viewW} height={h}><motion.g style={{ x: R }}>{content}</motion.g></svg>
</motion.div>
```

### (4) Lenis + framer-motion 조합

별도 연동 코드 없음. Lenis가 네이티브 `scrollY`를 갱신하므로 `useScroll`이 그대로 동작한다.
(GSAP ScrollTrigger를 쓸 경우엔 `lenis.on("scroll", ScrollTrigger.update)` 연결이 필요하지만, 이 사이트는 해당 없음)

---

## 12. 아쉽거나 특이한 점

- **소스맵 미배포** — 의도적인지 기본 설정인지 불명. 덕분에 역추적 난이도가 있었다.
- **760KB 단일 청크** — 코드 스플리팅 없음. 데이터셋(266포인트 시계열 + 작품/표본 메타 전량)이 번들에 인라인되어 있어 상당 부분을 차지한다. 데이터만 JSON으로 분리해도 초기 파싱 비용이 줄어들 여지.
- **`window.innerWidth` 기반 측정** — 리사이즈 이벤트로만 재계산하므로 모바일 주소창 접힘 같은 상황에서 미세한 어긋남 가능. (`visualViewport`는 히어로 높이 계산에만 사용)
- **`prefers-reduced-motion` 명시 분기 없음** — motion 라이브러리 기본 동작에 의존. 비디오 스크러빙/패럴럭스가 강한 사이트라 별도 축소 모드가 있으면 좋았을 것.
- **접근성** — 차트/작품 노드 상당수가 `aria-hidden` 처리된 시각 전용 레이어라, 데이터에 대한 텍스트 대체 경로는 제한적이다.
- **데이터 정직성은 인상적** — `caveats`, `sources[].verified`, `excludedFromStats` 같은 필드를 코드에 그대로 남겨, 어떤 수치를 채택하지 않았는지까지 밝혀 놓았다.

---

## 부록 A. 식별된 minified 심볼 매핑

| minified | 실제 |
|---|---|
| `te` | MUI `Box` |
| `le` | MUI `Typography` |
| `ct` | `motion` (`ct.div` = `motion.div`) |
| `S.jsx` / `S.jsxs` | `jsx` / `jsxs` runtime |
| `C` | `React` |
| `yp` | `useScroll` |
| `ei` | `useTransform` |
| `Qo` | `useMotionValue` |
| `am` | `useMotionValueEvent` |
| `Xo` | `AnimatePresence` |
| `bo` | `useTheme` |
| `vs` | `useMediaQuery` |
| `cn` | 자체 `useTranslation` |
| `T5` | `Lenis` 클래스 |
| `I9` | `VideoScrubbing` |
| `Y9` | `Hero` |
| `U9` | `IntroLoader` |
| `V9` | `ParallaxWord` |
| `tb` | `ParallaxText` |
| `H9` | `TextFit` |
| `n9` | `smoothPath` (Catmull-Rom) |
| `o9` | `TrendLineLayer` |
| `c9` | `TimelineCanvas` |
| `u9` | `Minimap` |
| `i9` / `JO` | 작품 노드 / 이벤트 노드 |
| `we` | 색상 토큰 객체 |
| `Zt` / `Te` | 디스플레이 / 본문 폰트 패밀리 |

## 부록 B. 에셋

```
/assets/index-BNMeBhTO.js            760 KB  단일 JS 청크
/assets/index-Bj908sFG.css                   스타일
/assets/hirst-scrub-graded-BzCsXnNj.mp4      히어로 스크러빙 (데스크톱, 컬러그레이딩)
/assets/hirst-scrub-mobile-CnT12oDC.mp4      히어로 스크러빙 (모바일)
/images/hirst/grotesque-motion/motion-morality.mp4
/images/hirst/grotesque-motion/motion-vanitas.mp4
/images/hirst/grotesque-motion/motion-system.mp4
/images/hirst/grotesque-motion/motion-ritual.mp4
```

폰트: Google Fonts — `Cinzel(500/700/900)`, `IM Fell English SC`, `IM Fell English`, `Inter(400~700)`, `display=swap`.
런타임 DOM: `<img> 85개`, `<video> 5개`.

## 부록 C. 검증 방법 재현

```js
// 1) 번들 받기
const js = await (await fetch("https://hirst-fame-argorithm.vercel.app/assets/index-BNMeBhTO.js")).text();

// 2) 라이브러리 판별
["gsap","ScrollTrigger","lenis","scrollYProgress","d3","recharts"].forEach(k =>
  console.log(k, js.split(k).length - 1));

// 3) 런타임 계측
await page.evaluate(() => ({
  lenisVersion: window.lenisVersion,
  sticky: [...document.querySelectorAll("*")]
    .filter(e => getComputedStyle(e).position === "sticky")
    .map(e => ({ h: e.getBoundingClientRect().height, top: getComputedStyle(e).top })),
  sections: [...document.querySelectorAll("section")]
    .map(s => Math.round(s.getBoundingClientRect().height)),
  scrollHeight: document.documentElement.scrollHeight,
}));
```
