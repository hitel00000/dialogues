---
title: "결정과 실행의 분리: Deterministic Gatekeeper"
description: "LLM이 코드베이스 상태를 직접 수정하지 못하게 차단하고, Feature Graph 구조 변경만을 허용하여 결정성과 통제력을 확보하는 개발 구조 제안."
date: 2026-06-02
---

# Deterministic Gatekeeper for LLM-Driven Development

## 문제 상황

현재 LLM 기반 개발은 다음과 같은 문제가 있다.

### 1. 문서는 강제력이 없다

AGENTS.md, TASKS.md, NOW.md 등의 문서는 참고 자료일 뿐이다.

LLM은 문서를 읽을 수 있지만 반드시 따라야 하는 것은 아니다.

결과적으로:

* 문서 = soft constraint
* prompt = 실제 실행 지시

가 된다.

---

### 2. Patch / Diff도 본질적인 해결책이 아니다

겉보기에는 edit 권한을 제한한 것처럼 보인다.

하지만 실제로는:

* 무엇을 수정할지
* 어디를 수정할지
* 어떻게 수정할지

를 여전히 LLM이 결정한다.

즉:

Patch는 edit의 다른 표현일 뿐이다.

---

### 3. LLM에게 직접 코드 수정 권한을 주면 제어가 어렵다

현재 구조:

Human
→ LLM
→ Code

문제:

* Prompt override
* Context drift
* 문서 무시
* 의도치 않은 구조 변경

등이 발생한다.

---

## 핵심 관찰

문제는 "LLM이 똑똑하지 않다"가 아니다.

문제는:

"결정과 실행이 같은 계층에 존재한다"

는 것이다.

현재는:

LLM
→ 결정
→ 실행

을 동시에 수행한다.

---

## 목표 구조

다음 구조를 지향한다.

Human
→ LLM
→ Gatekeeper
→ Codebase

역할은 다음과 같다.

### Human

* 목표 제시
* 방향 결정

예:

"A에 B 기능을 추가해"

---

### LLM

* 요구사항 분석
* 설계
* 변경 의도 생성

예:

"이 기능을 구현하려면 AuthService에 OTP 검증이 필요하다"

---

### Gatekeeper

* 결정하지 않는다
* 해석하지 않는다
* 실행만 한다

역할:

* 상태 검증
* 규칙 검증
* 코드 생성
* 코드 수정

---

## 중요한 원칙

Gatekeeper는 또 다른 LLM이 아니다.

만약 Gatekeeper가:

* 추론
* 해석
* 설계

를 수행한다면

그것은 단순히 LLM을 하나 더 추가한 것에 불과하다.

---

## 핵심 질문

어떻게 하면

LLM:
"A에 B 기능을 추가해"

를

Gatekeeper가 결정적으로 실행할 수 있을까?

---

## 현재 결론

자연어를 직접 실행 대상으로 삼으면 안 된다.

왜냐하면:

"A"

"B"

모두 해석이 필요하기 때문이다.

Gatekeeper는 해석기를 가지는 순간 비결정적이 된다.

---

## 접근 방향

Gatekeeper는 "코드 편집기"가 아니라

"구조 변환기"

가 되어야 한다.

즉:

LLM
→ 구조적 변경 요청
→ Gatekeeper
→ Code Generation

구조를 목표로 한다.

---

## Feature 기반 접근

기능을 코드가 아닌 객체로 표현한다.

예시:

Feature:

* Inputs
* Outputs
* Dependencies
* Side Effects

---

예:

Feature: OTP Authentication

Inputs:

* user_id
* otp_code

Outputs:

* verified_session

Dependencies:

* UserIdentity
* SessionManagement

Side Effects:

* session_write

---

## Feature의 의미

Feature는 "설명"이 아니다.

Feature는:

"그래프 노드"

이다.

즉:

로그인 기능

같은 의미적 이름이 아니라

입출력과 의존성으로 정의되는 구조적 객체이다.

---

## 코드베이스 구조 변화

현재:

Code
├─ auth/
├─ user/
└─ session/

---

목표:

Feature Graph
├─ F_101
├─ F_102
└─ F_103

↓

Generated Code

---

Source of Truth는 코드가 아니라 Graph가 된다.

---

## Gatekeeper의 역할

입력:

Feature Graph

출력:

Codebase

---

Gatekeeper는:

1. Dependency Resolve
2. Validation
3. Code Generation

만 수행한다.

---

## 기대 효과

### 장점

* Prompt override 영향 감소
* 코드 직접 수정 제거
* 변경 이력 추적 가능
* 구조적 일관성 확보
* LLM 역할과 실행 역할 분리

---

### 단점

* 초기 구축 비용 큼
* Feature Schema 설계 필요
* 기존 코드베이스와 호환 어려움
* 모든 종류의 변경을 표현하기 어려움

---

## 아직 해결되지 않은 문제

### 1. Feature Schema의 경계

어디까지를 Feature로 볼 것인가?

---

### 2. Code Generation 품질

Graph → Code 변환이 충분히 유연할 것인가?

---

### 3. Legacy Code 처리

이미 존재하는 프로젝트를 어떻게 Graph로 변환할 것인가?

---

### 4. 표현력

모든 개발 작업이 Feature Graph로 표현 가능한가?

---

## MVP 구현 목표

### Step 1

LLM이 코드를 수정하지 못하게 한다.

LLM 출력:

* Feature 생성
* Feature 수정
* Feature 연결

만 허용

---

### Step 2

Gatekeeper 구현

역할:

* Schema Validation
* Dependency Validation
* Side Effect Validation

---

### Step 3

Feature Graph → Code Generator

구현

---

### Step 4

Git 연동

Graph 변경만 commit

Generated Code는 파생 산출물로 취급

---

## 현재 인식

완전한 결정성은 어려울 가능성이 높다.

그러나

Human → LLM → Code

보다

Human → LLM → Feature Graph → Deterministic Gatekeeper → Code

가 훨씬 통제 가능한 구조일 가능성이 있다.

핵심 목표는

"LLM을 더 잘 통제하는 것"

이 아니라

"LLM이 시스템 상태를 직접 수정하지 못하게 만드는 것"

이다.
