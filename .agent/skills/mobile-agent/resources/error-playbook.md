# Mobile Agent - Error Recovery Playbook

When you encounter a failure, find the matching scenario and follow the recovery steps.
Do NOT stop or ask for help until you have exhausted the playbook.

---

## Dart Analysis Error

**Symptoms**: `flutter analyze` errors, type mismatch, null safety issues

1. Read the error — file, line, expected type vs actual
2. Null safety issue: add `?` for nullable, `!` only if you're certain it's non-null
3. Type mismatch: check the model class — does it match the API response?
4. Missing override: add `@override` annotation
5. **절대 하지 말 것**: `// ignore:` comments로 분석 경고 무시

---

## Build Failure

**Symptoms**: `flutter build` fails, Gradle/Xcode errors

1. **Gradle (Android)**:
   - `Could not resolve`: dependency version conflict → check `pubspec.yaml`
   - `minSdkVersion`: update `android/app/build.gradle` minimum SDK
2. **Xcode (iOS)**:
   - `Pod install` failure: note in result — may need `pod repo update`
   - Minimum deployment target: check `ios/Podfile`
3. Clean and retry: `flutter clean && flutter pub get`
4. If persists: note in result with full error — 환경 문제일 수 있음

---

## Test Failure

**Symptoms**: `flutter test` FAILED, widget test assertion errors

1. Read the error — which test, which widget, expected vs actual
2. Widget test: check if `pumpAndSettle()` is needed (async operations)
3. Provider not found: wrap test widget with `ProviderScope` (Riverpod)
4. Mock missing: ensure all dependencies are mocked
5. Re-run specific test: `flutter test test/path/to_test.dart`
6. **3회 실패 시**: 다른 접근 방식 시도

---

## State Management Issue

**Symptoms**: UI not updating, stale state, provider errors

1. **Riverpod**: Check provider type — `StateNotifierProvider` vs `FutureProvider` vs `AsyncNotifierProvider`
2. Is the widget watching correctly? (`ref.watch` not `ref.read` for UI)
3. Is the state being mutated instead of replaced? (create new state object)
4. Add debug print in provider to trace state changes
5. Check: is `dispose` being called prematurely?

---

## Platform-Specific Crash

**Symptoms**: Works on one platform, crashes on another

1. Check for `Platform.isIOS` / `Platform.isAndroid` guards
2. Check permissions: camera, location, storage — different per platform
3. Check native plugin compatibility — some plugins don't support both platforms
4. If plugin issue: note in result with platform and version info
5. Test on emulator for the failing platform

---

## Memory Leak

**Symptoms**: App slows down over time, `flutter run` shows increasing memory

1. Check: are all controllers disposed? (`TextEditingController`, `AnimationController`)
2. Check: are streams closed? (`StreamSubscription.cancel()`)
3. Check: are listeners removed? (`removeListener` in `dispose`)
4. Check: are `Timer` / `Timer.periodic` cancelled?
5. Use `DevTools` memory tab to identify leak source

---

## API Integration Error

**Symptoms**: Dio errors, `DioException`, wrong response parsing

1. **Connection refused**: backend running? correct URL/port?
2. **401**: auth interceptor sending token? token expired?
3. **Parse error**: `response.data` shape doesn't match model → log raw response
4. **Timeout**: increase Dio timeout or check network conditions
5. If backend issue: document expected contract in result

---

## Rate Limit / Quota / Memory Fallback

동일: backend-agent 플레이북의 "Rate Limit" 및 "Serena Memory" 섹션 참조.

---

## 일반 원칙

- **3회 실패**: 같은 접근 3번 실패하면 반드시 다른 방법 시도
- **막힘**: 5턴 이상 진전 없으면 현재 상태 저장, `Status: blocked`
- **범위 초과**: backend/frontend 문제는 result에 기록만
