# 📚 BookLink Admin Console - 독서모임 운영 관리자 통합 콘솔

> **HUFS 1학년 2학기 기술개발연구프로젝트 | 개인 홈페이지 과제**  
> 독서모임 호스트와 운영진을 위해 정기 공지(카카오톡, 네이버 카페) 작성 자동화, 구글 스프레드시트 회원 관리, 그리고 투명한 회계 장부 모니터링을 하나로 통합한 웹 콘솔입니다.

[![Deploy GitHub Pages](https://github.com/hanjisubusiness22222/hanjisubusiness22222.github.io/actions/workflows/deploy.yml/badge.svg)](https://github.com/hanjisubusiness22222/hanjisubusiness22222.github.io/actions/workflows/deploy.yml)
[![Accounting Sync Pipeline](https://github.com/hanjisubusiness22222/hanjisubusiness22222.github.io/actions/workflows/accounting_sync.yml/badge.svg)](https://github.com/hanjisubusiness22222/hanjisubusiness22222.github.io/actions/workflows/accounting_sync.yml)

---

## 1. 목적



---

## 2. 주소

* 🌐 **배포 웹사이트 URL**: **[https://hanjisubusiness22222.github.io/](https://hanjisubusiness22222.github.io/)**
* 🐙 **GitHub 원격 저장소**: **[https://github.com/hanjisubusiness22222/hanjisubusiness22222.github.io](https://github.com/hanjisubusiness22222/hanjisubusiness22222.github.io)**
* 📑 **연동 공식 구글 스프레드시트 (회계 장부)**: [구글 스프레드시트 바로가기](https://docs.google.com/spreadsheets/d/1QjELjB_rJuvDJGJ7XpjH3Tt3YKNsEbHh4AwiR6rH0Yc/edit?gid=0#gid=0)

---

## 3. 실행 및 수정 방법

### 1) 실행 방법 (로컬 환경)
1. GitHub 저장소를 클론(Clone)하거나 ZIP 파일로 다운로드합니다:
   ```bash
   git clone https://github.com/hanjisubusiness22222/hanjisubusiness22222.github.io.git
   cd hanjisubusiness22222.github.io
   ```
2. 프로젝트 폴더 내의 [`index.html`](index.html) 파일을 크롬(Chrome), 엣지(Edge) 등 웹 브라우저에서 더블 클릭하여 실행합니다.

### 2) 수정 및 커스터마이징 방법
* **공지 템플릿 및 기본값 수정**: [`app.js`](app.js) 파일 내 `DEFAULT_PARAMS` 객체에서 수정
* **구글 시트 연동 ID 변경**: [`app.js`](app.js) 및 [`scripts/sync_accounting.py`](scripts/sync_accounting.py) 내 시트 ID 수정
* **스타일 수정**: [`style.css`](style.css)에서 디자인 및 반응형 레이아웃 수정
* **수정 후 배포**: `git add .` -> `git commit -m "수정 내용"` -> `git push origin main` 실행 시 GitHub Pages에 자동 반영

---

## 4. 현재 상태

### 1) 현재 상태에 점검



### 2) 동료 의견



### 3) 수정 결과



### 4) 사용한 자료 및 AI 도움



---

## 5. 상세 기능 안내 (4-Step Workflow)

| 기능 단계 | 주요 명칭 | 핵심 기능 설명 |
| :--- | :--- | :--- |
| **STEP 1** | **💬 카카오톡 공지 자동화** | 이번 주/다음 주 토·일 날짜 원클릭 자동 계산, 노란 말풍선 실시간 모바일 목업, 서식 유지 원클릭 복사 & 카카오톡 앱 바로 연결 |
| **STEP 2** | **📝 네이버 카페 공지 브리지** | 스마트에디터 ONE 서식 실시간 미리보기, `ClipboardItem` 기반 서식+링크 동시 클립보드 복사, 네이버 카페 글쓰기 창 즉시 열기 |
| **STEP 3** | **📊 회원 목록 관리 DB** | 공식 구글 스프레드시트 회원 명단 실시간 연동, 시트 주소 복사, 원본 새 창 열기/편집 연결 |
| **STEP 4** | **💰 회계 장부 & 재정 대시보드** | 누적 잔고(₩100,000), 총 수입, 총 지출, 집행률 4종 KPI 카드, 예산 밸런스 게이지 바, 개인정보 보호 마스킹 입출금 내역 요약 피드, 원본 구글 시트 원클릭 바로가기 |

---

## 6. 라이선스 및 저작권
- **Project**: BookLink Admin Console & Financial Dashboard
- **Author**: 한지수 (HUFS 기술개발연구프로젝트)
- **Copyright**: © 2026 BookLink. All Rights Reserved.
