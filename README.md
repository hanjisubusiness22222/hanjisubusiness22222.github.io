# 📚 BookLink Admin Console - 독서모임 운영 관리자 통합 콘솔

> **HUFS 1학년 2학기 기술개발연구프로젝트 | 개인 홈페이지 과제**  
> 독서모임 호스트와 운영진을 위해 정기 공지(카카오톡, 네이버 카페) 작성 자동화, 구글 스프레드시트 회원 관리, 그리고 투명한 회계 장부 모니터링을 하나로 통합한 웹 콘솔입니다.

[![Deploy GitHub Pages](https://github.com/hanjisubusiness22222/hanjisubusiness22222.github.io/actions/workflows/deploy.yml/badge.svg)](https://github.com/hanjisubusiness22222/hanjisubusiness22222.github.io/actions/workflows/deploy.yml)
[![Accounting Sync Pipeline](https://github.com/hanjisubusiness22222/hanjisubusiness22222.github.io/actions/workflows/accounting_sync.yml/badge.svg)](https://github.com/hanjisubusiness22222/hanjisubusiness22222.github.io/actions/workflows/accounting_sync.yml)

---

## 1. 프로젝트 목적 (Purpose)

* **개발 배경**: 매주 주말 진행되는 독서모임(토·일 양일 자유 도서 모임)을 운영하면서, 매주 달라지는 날짜를 달력에서 수동으로 계산하고 카카오톡 단체방과 네이버 카페 게시판에 공지문을 일일이 복사·붙여넣기하는 작업에 많은 시간이 소모되었습니다.
* **해결하고자 한 문제**:
  1. **반복적인 주말 일정 계산 및 공지 작성 자동화**: 버튼 하나로 이번 주/다음 주 토·일 날짜를 자동 계산하여 플랫폼별(카카오톡 모바일 뷰, 네이버 스마트에디터 서식) 맞춤 공지문 즉시 생성.
  2. **구글 스프레드시트 회원 DB 일원화**: 흩어져 있던 회원 명단 시트를 관리자 콘솔 내에 실시간 연동하여 한 화면에서 조회 및 편집 연결.
  3. **회비 입출금 장부의 투명성 확보**: 모임원들이 언제든 회비 잔고와 입출금 내역을 확인할 수 있도록 실시간 회계 대시보드를 제공하고, 관리자가 원클릭으로 원본 구글 시트로 이동할 수 있는 환경 구축.
  4. **운영 신뢰성 및 데이터 무결성**: GitHub Actions를 통해 회계 장부를 매일 자동 검증 및 백업(Git Scraping)하여 데이터 유실과 위·변조 방지.

---

## 2. 서비스 주소 (Live URL)

* 🌐 **배포 웹사이트 URL**: **[https://hanjisubusiness22222.github.io/](https://hanjisubusiness22222.github.io/)**
* 🐙 **GitHub 원격 저장소**: **[https://github.com/hanjisubusiness22222/hanjisubusiness22222.github.io](https://github.com/hanjisubusiness22222/hanjisubusiness22222.github.io)**
* 📑 **연동된 공식 구글 스프레드시트 (회계 장부)**: [구글 스프레드시트 바로가기](https://docs.google.com/spreadsheets/d/1QjELjB_rJuvDJGJ7XpjH3Tt3YKNsEbHh4AwiR6rH0Yc/edit?gid=0#gid=0)

> [!NOTE]
> 별도의 서버 구동이나 패키지 설치 없이 PC와 모바일 스마트폰 웹 브라우저에서 즉시 접속하여 사용하실 수 있습니다.

---

## 3. 실행 및 수정 방법 (How to Run & Modify)

### 1) 실행 방법 (로컬 환경)
1. GitHub 저장소를 클론(Clone)하거나 ZIP 파일로 다운로드합니다:
   ```bash
   git clone https://github.com/hanjisubusiness22222/hanjisubusiness22222.github.io.git
   cd hanjisubusiness22222.github.io
   ```
2. 프로젝트 폴더 내의 [`index.html`](index.html) 파일을 크롬(Chrome), 엣지(Edge), 사파리(Safari) 등 웹 브라우저로 더블 클릭하여 실행합니다.
   * 로컬 서버로 테스트할 경우: `python -m http.server 8080` 실행 후 브라우저에서 `http://localhost:8080` 접속

### 2) 수정 및 커스터마이징 방법
* **공지 템플릿 및 기본값 수정**:
  * [`app.js`](app.js) 파일 내 `DEFAULT_PARAMS` 객체에서 모임 장소, 회비, 오픈채팅 링크 기본값을 수정할 수 있습니다.
* **구글 스프레드시트 ID 변경**:
  * 회원 명단 시트: [`index.html`](index.html) 및 [`app.js`](app.js)의 `GOOGLE_SHEET_URL` 상수 변경
  * 회계 장부 시트: [`app.js`](app.js) 및 [`scripts/sync_accounting.py`](scripts/sync_accounting.py)의 `SHEET_ID` 변경
* **스타일 및 레이아웃 수정**:
  * [`style.css`](style.css)에서 컬러 팔레트, 폰트, 카드 여백, 반응형 미디어 쿼리(`@media`) 수정 가능
* **수정 후 배포 반영**:
  * 코드 수정 후 `git add .` -> `git commit -m "수정 내용"` -> `git push origin main`을 실행하면 GitHub Pages에 1~2분 내로 자동 재배포됩니다.

---

## 4. 현재 상태 (Current Status)

### 1) 현재 상태에 점검 (Self-Inspection)
* **목적 및 콘텐츠 완성도**:
  * 방문자와 목적이 분명한 독서모임 관리 콘솔로 구축 완료.
  * 상단 헤더의 `[👤 제작자 소개 & 포트폴리오]` 모달을 통해 **자기소개, 관심 분야, 진행한 프로젝트(완성작 및 '준비 중' 표기)**가 구체적으로 기술되어 있음.
  * 전화번호, 거주지 주소, 주민등록번호, 계좌번호 등 불필요한 개인정보는 일절 수집·노출하지 않는 Zero-PII 원칙을 철저히 준수함.
* **화면과 작동 상태 (PC 및 스마트폰)**:
  * PC와 모바일 화면 모두에서 가로 스크롤(가로 넘침) 없이 쾌적하게 1열/2열 반응형으로 표시됨.
  * 상단 메뉴 탭 스크롤, 실시간 공지 클립보드 복사, 구글 시트 원본 새 창 열기 등 모든 추가 기능이 100% 정상 작동함.
  * 키보드 탐색 사용자(`Tab` 키)를 위해 명확한 `:focus-visible` 파란색 초점 링을 전역 적용하여 기본 웹 접근성을 확보함.

### 2) 동료 의견 (Peer Feedback)
* **피드백 1 (공지 자동화 편의성)**: *"매주 토요일/일요일 날짜를 달력 보고 손으로 바꾸는 게 번거로웠는데, 버튼 클릭 한 번으로 이번 주말 날짜가 자동 계산되어 카톡과 카페 양식이 한꺼번에 만들어지는 점이 매우 실용적이다."*
* **피드백 2 (회계 투명성)**: *"모임 회비를 구글 시트로 관리할 때 모임원들에게 보여주기 불편했는데, 웹 대시보드에서 잔고와 수입/지출을 바로 확인하고 필요할 때 원본 구글 시트로 바로 넘어갈 수 있어 모임 운영의 신뢰도가 높아질 것 같다."*
* **피드백 3 (UI 개선 제안)**: *"회계 대시보드 하단에 구글 시트 iframe 뷰어가 또 들어가 있어서 화면이 다소 무겁고, 네 번째 카드의 '탈퇴 회원 0명' 텍스트는 불필요해 보인다. 대시보드 카드와 요약 테이블만 남겨 더 심플하게 정리하면 좋겠다."*

### 3) 수정 결과 (Revisions Made)
* **회계 대시보드 UI 경량화**: 동료 피드백을 수용하여 하단의 무거운 구글 시트 iframe 박스를 과감히 제거하고, 상단 **`[📊 회계 장부 구글 시트 원본 새 창에서 열기 / 편집 ↗]`** 버튼과 4종 KPI 카드, 2열 입출금 요약 테이블만 깔끔하게 남겨 한 화면에 집중되는 SaaS 레이아웃으로 개편함.
* **불필요한 보조 텍스트 제거**: 네 번째 카드 하단의 `탈퇴 회원 0명` 텍스트를 완전히 삭제하고, **`회비 집행률 37.5%`**만 크고 선명하게 단독 표시되도록 수정함.
* **모바일 스마트폰 뷰포트 최적화**: 모바일 헤더 가로 터치 스크롤 바 적용 및 입출금 테이블 1열 세로 스택(`.accounting-tables-grid`) 적용으로 모바일 가로 넘침 완벽 제거.
* **웹 접근성(a11y) 초점 링 적용**: 키보드로 탐색하는 사용자를 위해 `style.css`에 `:focus-visible` 파란색 초점 링(3px solid #2563eb)을 전역 적용함.
* **제작자 소개 & 포트폴리오 모달 추가**: 상단 헤더에 `[👤 제작자 소개 & 포트폴리오]` 버튼을 신설하여 개발자(한지수) 자기소개, 관심 분야, 완성 및 개발 예정 프로젝트('준비 중' 표기)를 열람할 수 있도록 보강함.

### 4) 사용한 자료 및 AI 도움 (References & AI Assistance)
* **사용한 자료 및 기술 레퍼런스**:
  * **MDN Web Docs**: `ClipboardItem` 비동기 클립보드 API, HTML5 시맨틱 태그, 키보드 접근성 `:focus-visible` 명세
  * **Google Cloud & Sheets API**: Google Visualization API (`/gviz/tq`) 엔드포인트 파라미터 및 CSV 데이터 규격
  * **GitHub Documentation**: GitHub Pages 및 GitHub Actions Workflow YAML 문법 (`schedule`, `workflow_dispatch`, `actions/checkout`)
* **AI 도구 활용 내역 (Antigravity Assistant)**:
  * 구글 시트 CSV 데이터를 브라우저에서 안전하게 실시간 파싱하고 입출금 및 잔고를 자동 계산하는 JavaScript 알고리즘 구현 지원
  * 개인정보 보호를 위한 회원 실명 자동 마스킹 함수(`maskName`) 및 XSS 방어 필터 설계 지원
  * GitHub Actions 기반 일일 자동 감사 백업 스크립트(`scripts/sync_accounting.py`) 및 워크플로우 파이프라인 구성 지원

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
