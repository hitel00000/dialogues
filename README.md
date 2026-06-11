# Dialogues

관심사, 기술, 일상 등 흥미로운 다양한 주제의 대화와 생각을 기록하는 보관소(블로그)입니다.

## 🚀 프로젝트 개요

- **프레임워크**: [Astro](https://astro.build/)
- **디자인**: 개인 이력서 테마 디자인 연동 (2단 사이드바 레이아웃, 반응형 디자인)
- **콘텐츠 관리**: Astro Content Collections를 통한 Markdown 관리
- **배포**: GitHub Actions를 활용한 GitHub Pages 배포 (`/dialogues`)

## 🛠️ 주요 명령어

```sh
npm install      # 의존성 설치
npm run dev      # 로컬 개발 서버 시작 (localhost:4321)
npm run build    # 정적 사이트 빌드 (./dist/)
npm run preview  # 빌드 결과 로컬 미리보기
```

## 📝 글 작성하기

새로운 글은 아래 디렉토리에 마크다운(`.md`) 파일로 추가합니다.

- **대화 (Conversations)**: `src/content/conversations/`
- **에세이 (Essays)**: `src/content/essays/`

각 파일의 상단에는 아래 예시와 같이 Frontmatter를 포함해야 합니다.

```yaml
---
title: "글 제목"
description: "글에 대한 짧은 요약 (선택)"
date: 2026-06-11
---
```
