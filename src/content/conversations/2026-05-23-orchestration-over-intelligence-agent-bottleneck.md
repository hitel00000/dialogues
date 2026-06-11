---
title: "지능보다 합의와 오케스트레이션: Agent 시대의 병목"
description: "미래 에이전트 시스템의 핵심 문제는 단일 에이전트의 지능 극대화보다 제한된 비용 내에서 어떻게 합의를 유지할 것인가에 대한 생각 정리."
date: 2026-05-23
---

이번 대화가 자유롭게 튄 건 맞는데, 생각보다 하나의 축으로 모이긴 했어. 내가 보기엔 takeaway는 **“Agent 시대의 핵심 병목은 지능보다 합의와 오케스트레이션”** 쪽이야.

정리해보면:

# 1. 하네스는 “문서”가 아니라 “운영 방식”

처음 질문에서 출발한 것.

네가 하는:

```txt
TASKS.md
NOW.md
AGENTS.md
ENGINEERING_TASTE.md
```

는 **지식/규칙**이고,

하네스는:

```txt
무엇을 읽을지
어떻게 작업할지
언제 검증할지
실패 시 어떻게 할지
```

를 결정하는 **운영 레이어**에 가까움.

즉:

> **문서 → 합의**
> **하네스 → 실행**

---

# 2. ADD의 병목은 “더 똑똑한 모델”이 아닐 수도 있음

중간에 자연스럽게 나온 핵심.

문제는 점점:

```txt
문맥 누락
프로젝트 전환 비용
반복 glue
일관성
```

이 되어가고 있음.

그래서 중요한 건:

> **좋은 agent**
> 보다
> **좋은 orchestration**

일 가능성이 커 보임.

OS 비유가 나온 이유도 여기.

---

# 3. Context는 비용 문제다

네가 꽤 중요한 포인트를 짚음.

현시점 LLM은:

> 문맥을 넣을수록 좋아지지만 비싸짐

이라는 구조적 tradeoff가 있음.

그래서 naive한:

```txt
문서 전부 주입
```

은 지속 가능성이 낮음.

대신 필요한 건:

```txt
hot context
warm retrieval
cold archive
```

같은 계층 구조.

즉:

> **Context engineering = memory hierarchy design**

---

# 4. 인간은 “큰 context”로 협업하지 않는다

이게 대화 후반 핵심.

처음엔:

> 인간 뇌가 효율적이다

였는데,

점점:

> 인간은 여러 뇌의 협업 시스템이다

로 이동했고,

마지막엔:

> 협업은 신뢰보다 **합의(protocol)** 기반이다

로 정교해짐.

인간 협업은 실제로:

```txt
README 전부 읽기
❌

몇 가지 shared assumptions
⭕
```

에 가까움.

예:

```txt
latency > elegance
small iteration
don't over-engineer
```

이런 합의만 공유.

---

# 5. 그래서 미래 Agent 시스템은 “super-agent”보다 “protocol”이 중요할 수도 있음

꽤 강한 takeaway.

현재 흐름:

> 더 똑똑한 단일 에이전트

하지만 인간 사례를 보면:

```txt
planner
coder
reviewer
memory
```

의 **사회적 협업 모델**이 더 자연스러울 수 있음.

그 핵심은:

> **shared contract**

---

# 6. 네 문서화 습관은 생각보다 primitive가 아닐 수 있다

이건 개인화 takeaway.

네가 하는:

```txt
TASKS
NOW
taste 문서
architecture 정리
```

는 단순 기록이 아니라:

> **agent 간 합의를 위한 압축 인터페이스**

에 가까울 가능성이 있음.

특히 ENGINEERING_TASTE.md는 꽤 중요한 primitive처럼 보여.

---

한 줄로 압축하면 이번 대화의 takeaway는 아마:

> **Agent 시대의 문제는 “지능 부족”보다 “제한된 비용 안에서 어떻게 합의를 유지할 것인가”에 가까울 수 있다.**

그리고 그걸 풀기 위한 primitive가:

```txt
protocol
context compression
memory hierarchy
lightweight harness
```

쪽일 가능성이 높다.

네 실전 워크플로 기준으로는 그래서 다음 실험이:

> **“문서를 AI용 contract처럼 더 압축해 볼까?”**

정도가 꽤 괜찮아 보여. 예를 들어 `PROJECT_CONTRACT.yaml` 같은 아주 작은 파일 하나를 실험적으로 써보는 식.
