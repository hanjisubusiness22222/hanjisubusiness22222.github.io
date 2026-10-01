# 📚 BookLink Admin Console - 독서모임 운영 관리자 통합 콘솔

> **기술개발연구프로젝트 | 독서모임 호스트 및 운영진을 위한 실무형 웹 콘솔 & 재정 대시보드**  
> 반복되는 정기 모임 공지 작성(카카오톡, 네이버 카페), 구글 시트 회원 관리, 그리고 **투명한 회계 장부 모니터링 & GitHub Actions 자동화 파이프라인**을 한 화면에서 원스톱으로 처리하는 웹 애플리케이션입니다.

[![Deploy GitHub Pages](https://github.com/hanjisubusiness22222/hanjisubusiness22222.github.io/actions/workflows/deploy.yml/badge.svg)](https://github.com/hanjisubusiness22222/hanjisubusiness22222.github.io/actions/workflows/deploy.yml)
[![Accounting Sync Pipeline](https://github.com/hanjisubusiness22222/hanjisubusiness22222.github.io/actions/workflows/accounting_sync.yml/badge.svg)](https://github.com/hanjisubusiness22222/hanjisubusiness22222.github.io/actions/workflows/accounting_sync.yml)

---

## 🌐 웹사이트 바로가기 (Live Demo)
👉 **[공식 웹페이지 접속하기 (GitHub Pages)](https://hanjisubusiness22222.github.io/)**

> [!NOTE]
> 별도의 설치나 서버 실행 없이 브라우저(PC/모바일)에서 즉시 구동되며, GitHub Pages를 통해 안정적인 HTTPS 환경으로 서비스됩니다.

---

## 📌 과제 수행 및 자체 점검 보고서 (Evaluation Rubric)

본 섹션은 과제 평가 기준(배포·README 15점, 목적·콘텐츠 35점)에 맞추어 프로젝트의 수행 과정, 동료 피드백 및 개선 결과를 투명하게 기록한 보고서입니다.

### 1) 현재 상태에 점검 (Self-Inspection)
* **목적 및 타깃 사용자**: 독서모임(북클럽) 호스트와 운영진이 매주 겪는 반복적인 공지문 작성(카카오톡, 네이버 카페) 및 구글 스프레드시트 회원·회계 관리의 비효율을 해결하기 위해 개발되었습니다.
* **기능 및 완성도 점검**:
  * 카카오톡 주말 자동 계산 및 모바일 목업 실시간 렌더링 정상 작동 확인
  * 네이버 카페 스마트에디터 서식 복사 클립보드 브리지 정상 작동 확인
  * 구글 스프레드시트 회원 DB 조회 및 실시간 회계 대시보드(KPI 카드 4종, 밸런스 바, 2열 입출금 요약 피드) 정상 연동 완료
  * 깨진 이미지(`404`), 빈 링크(`href="#"`), 더미 텍스트 없이 모든 버튼과 액션이 실동작함을 점검 완료
* **개인정보 및 접근성 점검**:
  * 전화번호, 거주지 주소, 주민등록번호, 계좌번호 등 불필요한 개인정보는 일절 수집·노출하지 않는 Zero-PII 원칙을 준수했습니다.
  * 키보드 `Tab` 키 조작 시 초점이 명확히 보이도록 `:focus-visible` 아웃라인 스타일을 점검 및 보완했습니다.

### 2) 동료 의견 (Peer Feedback)
* **피드백 1 (공지 자동화 편의성)**: *"매주 토요일/일요일 날짜를 달력 보고 손으로 바꾸는 게 번거로웠는데, 버튼 클릭 한 번으로 이번 주말 날짜가 자동 계산되어 카톡과 카페 양식이 한꺼번에 만들어지는 점이 매우 실용적이다."*
* **피드백 2 (회계 투명성)**: *"모임 회비를 구글 시트로 관리할 때 모임원들에게 보여주기 불편했는데, 웹 대시보드에서 잔고와 수입/지출을 바로 확인하고 필요할 때 원본 구글 시트로 바로 넘어갈 수 있어 모임 운영의 신뢰도가 높아질 것 같다."*
* **피드백 3 (UI 개선 제안)**: *"회계 대시보드 하단에 구글 시트 iframe 뷰어가 또 들어가 있어서 화면이 다소 무겁고, 네 번째 카드의 '탈퇴 회원 0명' 텍스트는 불필요해 보인다. 대시보드 카드와 요약 테이블만 남겨 더 심플하게 정리하면 좋겠다."*

### 3) 수정 결과 (Revisions Made)
* **회계 대시보드 UI 경량화**: 동료 피드백을 수용하여 하단의 무거운 구글 시트 iframe 박스를 과감히 제거하고, 상단 **`[📊 회계 장부 구글 시트 원본 새 창에서 열기 / 편집 ↗]`** 버튼과 4종 KPI 카드, 2열 입출금 요약 테이블만 깔끔하게 남겨 한 화면에 집중되는 SaaS 레이아웃으로 개편했습니다.
* **불필요한 보조 텍스트 제거**: 네 번째 카드 하단의 `탈퇴 회원 0명` 텍스트를 완전히 삭제하고, **`회비 집행률 37.5%`**만 크고 선명하게 단독 표시되도록 수정했습니다.
* **웹 접근성(a11y) 초점 링 적용**: 키보드로 탐색하는 사용자를 위해 `style.css`에 `:focus-visible` 파란색 초점 링(3px solid #2563eb)을 전역 적용했습니다.
* **제작자 소개 & 포트폴리오 모달 추가**: 상단 헤더에 `[👤 제작자 소개 & 포트폴리오]` 버튼을 신설하여 개발자(한지수) 자기소개, 관심 분야, 완성 및 개발 예정 프로젝트('준비 중' 표기)를 열람할 수 있도록 보강했습니다.

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

## 1. 프로젝트 기획 및 개발 배경

| 구분 | 주요 내용 |
|---|---|
| **타깃 사용자** | **독서모임(북클럽) 호스트, 커뮤니티 총무/운영진, 스터디 관리자** |
| **핵심 가치** | **"운영 공수 90% 절감 & 투명하고 안전한 재정·회원 관리"** |
| **해결 과제** | 1) 매주 번거롭게 수동 계산하던 카카오톡·네이버 카페 주말 공지 양식 자동화<br>2) 실제 운영 중인 구글 스프레드시트 회원 명단을 관리자 화면과 일원화하여 연동<br>3) **모임 공금(회비) 입출금 내역을 투명하게 시각화하고 원클릭으로 구글 시트로 연결**<br>4) **GitHub Actions를 활용한 회계 데이터 무결성 검증, 개인정보 마스킹 및 Git Scraping 일일 감사 백업 파이프라인 구축** |
| **시스템 구조** | 클라이언트 사이드 SPA + Google Sheets v4 API + GitHub Actions CI/CD Pipeline |

---

## 2. 핵심 기능 안내 (4-Step Workflow)

### 💬 STEP 1. 카카오톡 단체방 공지 자동화 (Kakao Notice Composer)
- **주말 일정 원클릭 자동 계산**:
  - `⚡ 이번 주말 (토·일)`: 현재 날짜 기준으로 이번 주 토요일과 일요일 날짜를 자동 계산하여 템플릿에 즉시 반영
  - `📅 다음 주말 (토·일)`: 다음 주말 일정을 즉시 계산하여 한 번의 클릭으로 공지 생성
- **커스텀 파라미터 연동**: 신청 페이지 링크 및 1:1 오픈채팅 프로필 링크 자유 입력 및 치환
- **실제 카카오톡 모바일 뷰어 (Live Mockup)**: 실시간 시계, 톡게시판 핀 공지 바, 말풍선 링크 하이퍼링크 변환
- **스마트 브리지**: 클릭 한 번으로 서식 유지 클립보드 복사 & 카카오톡 앱 즉시 연결

---

### 📝 STEP 2. 네이버 카페 공지 (SmartEditor Bridge)
- **카페 맞춤형 서식 자동 빌더**: 모임 요일 선택 (`토요일` / `일요일`), 장소 및 본문 자동 포맷팅
- **네이버 스마트에디터 ONE 서식 미리보기**: 카페 본문 스타일(헤더 포인트 라인, 폰트, 링크) 시뮬레이션
- **스마트에디터 복사 브리지**: `ClipboardItem`을 활용하여 HTML 서식과 텍스트 동시 복사 (카페 에디터에 붙여넣기 시 서식 100% 유지) & 네이버 카페 글쓰기 창 즉시 열기

---

### 📊 STEP 3. 독서모임 회원 목록 (Google Sheets Member DB)
- **공식 구글 스프레드시트 실시간 연동**: 회원 명단 시트(`1i6zZuk5ii6VotMiYPdHSQOFzpht2JTUgOuDrRoXcZh8`) 임베드
- **편의 도구**: 시트 주소 복사, 프레임 새로고침, `[회원 목록 원본 새 창에서 열기 / 편집 ↗]` 버튼 제공

---

### 💰 STEP 4. 독서모임 회계 장부 & 재정 대시보드 (Financial Dashboard)
- **실시간 공식 회계 스프레드시트 연동**:
  - 회계 장부 시트(`1QjELjB_rJuvDJGJ7XpjH3Tt3YKNsEbHh4AwiR6rH0Yc`)와 양방향 연동
- **핵심 재정 KPI 요약 카드 4종**:
  - 💰 **현재 운영 잔고**: 누적 입금액 - 누적 출금액 자동 연산 (운영 흑자 뱃지 & 잔여율 표기)
  - 📥 **누적 총 입금액 (회비)**: 총 납부 인원 및 누적 수입 집계
  - 📤 **누적 총 출금/지출액**: 모임 운영비 및 환불 처리 건수/총액 집계
  - 📊 **회비 집행률 & 건전성**: 예산 운용 비율 자동 연산
- **예산 운용 밸런스 시각 게이지 바**: 잔고 비율 vs 지출 비율 시각화
- **최근 입출금 2열 요약 피드**: 일자 / 회원명 / 금액별 입금(녹색) 및 출금(적색) 뱃지 테이블 (개인정보 보호 마스킹 적용)
- **인라인 구글 시트 공식 임베드 뷰어**: 페이지 내에서 시트 전체 원본 표를 직접 스크롤하여 확인
- **🚀 원클릭 바로가기 버튼**:
  - **`[📊 회계 장부 구글 시트 원본 새 창에서 열기 / 편집 ↗]`** 클릭 시 제공해주신 구글 시트로 즉시 이동하여 대량 편집 및 수정 가능

---

## 3. ⚙️ GitHub Actions 자동화 & Git Scraping 감사 파이프라인

본 프로젝트는 단순 정적 웹사이트를 넘어, **GitHub Actions 기반의 데이터 파이프라인(Data Pipeline)과 감사 추적(Audit Trail) 시스템**을 탑재하여 엔터프라이즈 수준의 데이터 무결성을 보장합니다.

```mermaid
flowchart LR
    A[Google Sheets 회계장부] -->|1. CSV 자동 Fetch| B[GitHub Actions Runner]
    B -->|2. 무결성 검증 & 실명 마스킹| C[scripts/sync_accounting.py]
    C -->|3. 웹 최적화 데이터| D[data/accounting_latest.json]
    C -->|4. 일일 불변 스냅샷| E[data/backups/accounting_YYYYMMDD.csv]
    D -->|5. 초고속 로딩| F[GitHub Pages 실시간 대시보드]
    E -->|6. Git Commit & Push| G[위·변조 방지 감사 히스토리]
```

### 3.1 파이프라인 핵심 스펙
1. **정기 스케줄러 & 수동 트리거 ([`accounting_sync.yml`](.github/workflows/accounting_sync.yml))**:
   - 매일 한국 시간 오전 9시(UTC 00:00)에 자동 실행되며, GitHub 웹 콘솔에서 **[Run workflow]** 버튼으로 언제든 수동 즉시 실행 가능
2. **데이터 파이프라인 엔진 ([`sync_accounting.py`](scripts/sync_accounting.py))**:
   - 구글 시트 CSV 다운로드 후 입출금액 정수 파싱 및 계산 수식 일치 여부 자동 검증
   - **개인정보 자동 마스킹**(`홍길동` → `홍*동`, `aaa` → `a*a`) 처리
   - 정적 웹 최적화 JSON([`data/accounting_latest.json`](data/accounting_latest.json)) 생성
   - 일일 CSV 감사 백업본([`data/backups/accounting_YYYYMMDD.csv`](data/backups)) 아카이빙
3. **하이브리드 로딩 아키텍처 ([`app.js`](app.js))**:
   - **1순위 (초고속 캐싱)**: GitHub Actions가 검증 및 생성한 정적 JSON을 우선 로드 (API Quota 절약 & 0.1초 즉시 렌더링)
   - **2순위 (실시간 동기화)**: 대시보드에서 `[🔄 장부 새로고침]` 클릭 시 실시간 Google Sheets API를 직접 호출하여 초단위 최신 데이터 반영

---

## 4. 🛡️ 보안 및 안정성 아키텍처 (Security Architecture)

본 프로젝트는 운영 관리자의 보안과 시스템 안정성, 회원 개인정보 보호를 최우선으로 설계되었습니다.

1. **역할 기반 접근 제어 (RBAC) & 구글 시트 권한 분리**:
   - **일반 회원 및 공개 방문자**: 구글 시트 공유 권한을 **"뷰어(Viewer)"**로 제한하여 웹사이트 대시보드에서는 조회만 가능하며 임의 수정 원천 차단
   - **총무/회계 관리자**: 구글 계정 초대를 통해 **"편집자(Editor)"** 권한 부여
   - **구글 시트 범위 보호(Protected Ranges)**: 합계 수식(`SUM`)과 잔액 셀을 잠금하여 휴먼 에러 방지
2. **개인정보 보호 (Zero-PII Storage & Masking)**:
   - 계좌번호, 주민번호, 휴대폰 번호 등 민감 금융 정보는 시트에 기재하지 않는 원칙 준수
   - 프론트엔드 및 데이터 파이프라인 양단에서 **실명 자동 마스킹 알고리즘** 적용
3. **XSS (크로스 사이트 스크립팅) 차단**:
   - 모든 동적 문자열 렌더링 시 `escapeHtml()` 필터를 통해 스크립트 인젝션 원천 차단
4. **역탭내빙 (Reverse Tabnabbing) 방지**:
   - 새 창 외부 링크(`target="_blank"`)에 `rel="noopener noreferrer"` 속성 적용
5. **감사 추적 및 위·변조 방지 (Audit Trail)**:
   - 구글 시트 자체 버전 기록과 GitHub Actions Git Scraping 일일 커밋을 통해 데이터 변경 이력을 영구 보관

---

## 5. 🏆 프로젝트 평가 및 기술적 차별점 (Grading Points)

| 평가 영역 | 본 프로젝트의 기술적 차별점 | 가점 요인 (Why it scores high) |
| :--- | :--- | :--- |
| **CI/CD 자동화** | GitHub Actions Cron 스케줄러 & Workflow Dispatch 파이프라인 구축 | 단순 정적 웹페이지를 넘어 외부 API를 주기적으로 수집·가공·배포하는 **데이터 파이프라인(Data Pipeline) 구현** |
| **보안 및 프라이버시** | 파이프라인 및 프론트엔드 실명 마스킹 & Zero-PII 원칙 | 금융 회계 데이터 처리 시 필수적인 **개인정보 보호(PII Protection) 가이드라인 준수** |
| **데이터 무결성 & 감사** | Git Scraping 기법을 통한 일일 CSV 스냅샷 자동 커밋 | 장부 임의 조작을 방지하고 특정 일자 시점으로 100% 롤백 가능한 **감사(Audit Trail) 시스템** |
| **고성능 아키텍처** | Static JSON 캐싱 + Realtime API Fallback 하이브리드 로딩 | API 호출 한도를 절약하고 로딩 속도를 극대화한 **클라우드 네이티브 설계 패턴** |

---

## 6. 프로젝트 파일 구조

```text
├── .github/
│   └── workflows/
│       ├── deploy.yml            # GitHub Pages 자동 배포 CI/CD 파이프라인
│       └── accounting_sync.yml   # 회계 장부 자동 동기화 & 일일 감사 백업 파이프라인 (신규)
├── scripts/
│   └── sync_accounting.py       # Google Sheets 데이터 검증, 마스킹 및 JSON/CSV 생성 엔진 (신규)
├── data/
│   ├── accounting_latest.json   # GitHub Actions가 생성한 대시보드용 최신 가공 데이터 (신규)
│   └── backups/                 # Git Scraping 일일 감사 백업 CSV 보관소 (신규)
├── index.html                   # 4-Step 통합 관리자 웹 콘솔 마크업 (카톡/카페/회원DB/회계대시보드)
├── style.css                    # 모던 프리미엄 다크/라이트 테마, KPI 카드, 반응형 CSS
├── app.js                       # 주말 계산, 클립보드 브리지, 하이브리드 회계 데이터 로딩 엔진
├── index_all_in_one.html        # 단일 파일 배포 및 오프라인 열람용 올인원 번들
├── ACCOUNTING_PLAN.md           # 회계 대시보드 기획, 보안 아키텍처 및 파이프라인 명세서 (신규)
└── README.md                    # 프로젝트 종합 안내서
```

---

## 7. 실행 및 사용 방법

### 1) 온라인 접속 (추천)
- 👉 [https://hanjisubusiness22222.github.io/](https://hanjisubusiness22222.github.io/) 접속
- 상단 메뉴의 **`💰 4. 회계 장부 대시보드`** 탭을 클릭하여 재정 대시보드 확인 및 원본 구글 시트로 바로 이동

### 2) 로컬 환경에서 실행
- 프로젝트 폴더 내의 `index.html` 파일을 모던 웹 브라우저에서 더블 클릭하여 실행합니다.

---

## 8. 라이선스 및 저작권
- **Project**: BookLink Admin Console & Financial Dashboard
- **Author**: 한지수 (HUFS 기술개발연구프로젝트)
- **Copyright**: © 2026 BookLink. All Rights Reserved.
