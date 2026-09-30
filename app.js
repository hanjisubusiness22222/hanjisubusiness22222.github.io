/**
 * BookLink Admin Console - Operational Management Engine
 * Target: 독서모임 관리자 / Core Value: 투명한 소통 및 고도화 자동화
 */

document.addEventListener("DOMContentLoaded", () => {
  // =========================================================================
  // 1. Official Google Spreadsheet Integration
  // =========================================================================

  const GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/1i6zZuk5ii6VotMiYPdHSQOFzpht2JTUgOuDrRoXcZh8/edit?gid=0#gid=0";
  const GOOGLE_SHEET_EMBED_URL = "https://docs.google.com/spreadsheets/d/1i6zZuk5ii6VotMiYPdHSQOFzpht2JTUgOuDrRoXcZh8/htmlembed?gid=0&widget=true";

  const googleSheetIframe = document.getElementById("googleSheetIframe");
  const btnCopySheetLink = document.getElementById("btnCopySheetLink");
  const btnRefreshSheetIframe = document.getElementById("btnRefreshSheetIframe");
  const btnSyncGoogleNow = document.getElementById("btnSyncGoogleNow");

  // 클립보드 텍스트 복사 유틸
  function copyTextToClipboard(str, successMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(str)
        .then(() => {
          if (successMsg) alert(successMsg);
        })
        .catch(() => fallbackCopy(str, successMsg));
    } else {
      fallbackCopy(str, successMsg);
    }
  }

  function fallbackCopy(str, successMsg) {
    const ta = document.createElement("textarea");
    ta.value = str;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      if (successMsg) alert(successMsg);
    } catch (e) {
      alert("복사에 실패했습니다. 직접 텍스트를 선택하여 복사해주세요.");
    }
    document.body.removeChild(ta);
  }

  // XSS 방지 유틸
  function escapeHtml(str) {
    if (!str && str !== 0) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // 1-1. 시트 주소 복사
  if (btnCopySheetLink) {
    btnCopySheetLink.addEventListener("click", () => {
      copyTextToClipboard(GOOGLE_SHEET_URL, "📋 구글 스프레드시트 링크가 클립보드에 복사되었습니다!\n" + GOOGLE_SHEET_URL);
    });
  }

  // 1-2. 시트 Iframe 새로고침
  function reloadSheetIframe() {
    if (googleSheetIframe) {
      googleSheetIframe.src = GOOGLE_SHEET_EMBED_URL + "&t=" + Date.now();
    }
  }

  if (btnRefreshSheetIframe) {
    btnRefreshSheetIframe.addEventListener("click", () => {
      reloadSheetIframe();
      btnRefreshSheetIframe.textContent = "✔ 새로고침 완료!";
      setTimeout(() => {
        btnRefreshSheetIframe.innerHTML = "<span>🔄</span> <span>시트 새로고침</span>";
      }, 1000);
    });
  }

  // 1-3. 상단 헤더 '구글 시트 즉시 동기화' 버튼
  if (btnSyncGoogleNow) {
    btnSyncGoogleNow.addEventListener("click", () => {
      btnSyncGoogleNow.classList.add("syncing");
      const textSpan = btnSyncGoogleNow.querySelector(".sync-text");
      if (textSpan) textSpan.textContent = "동기화 중...";

      reloadSheetIframe();

      setTimeout(() => {
        btnSyncGoogleNow.classList.remove("syncing");
        if (textSpan) textSpan.textContent = "구글 시트 즉시 동기화";
        alert("✔ Google Drive 클라우드와 스프레드시트 화면이 실시간 동기화되었습니다!");
      }, 700);
    });
  }
  // =========================================================================
  // 3. Weekly Weekend (Sat/Sun) Master Scheduler (자유 도서 모임)
  // =========================================================================

  // 실시간 토·일 주말 날짜 계산 유틸
  function getWeekendDates(offsetWeeks = 0) {
    const today = new Date();
    const day = today.getDay(); // 0: 일요일, 6: 토요일
    
    // 다가오는 토요일 계산
    let daysUntilSat = 6 - day;
    if (day === 0) {
      daysUntilSat = 6;
    }

    const sat = new Date(today);
    sat.setDate(today.getDate() + daysUntilSat + (offsetWeeks * 7));

    const sun = new Date(sat);
    sun.setDate(sat.getDate() + 1);

    const pad = (n) => String(n).padStart(2, "0");
    const satM = pad(sat.getMonth() + 1);
    const satD = pad(sat.getDate());
    const sunM = pad(sun.getMonth() + 1);
    const sunD = pad(sun.getDate());

    const isSameMonth = satM === sunM;
    const shortRange = isSameMonth ? `${satM}/${satD}, ${sunD}` : `${satM}/${satD}, ${sunM}/${sunD}`;
    const fullSat = `${sat.getFullYear()}년 ${sat.getMonth() + 1}월 ${sat.getDate()}일 (토)`;
    const fullSun = `${sun.getFullYear()}년 ${sun.getMonth() + 1}월 ${sun.getDate()}일 (일)`;

    return {
      sat,
      sun,
      satShort: `${satM}/${satD}`,
      sunShort: `${sunM}/${sunD}`,
      shortRange,
      fullSat,
      fullSun,
      satDetailed: `토요반: ${satM}/${satD}(토) 14:00~16:30`,
      sunDetailed: `일요반: ${sunM}/${sunD}(일) 14:00~16:30`,
      bothDetailed: `토요반: ${satM}/${satD}(토) 14:00~16:30 | 일요반: ${sunM}/${sunD}(일) 14:00~16:30`
    };
  }

  // 상단 마스터 컨트롤 요소
  const masterDateRange = document.getElementById("masterDateRange");
  const btnApplyAllNotices = document.getElementById("btnApplyAllNotices");

  const btnWeekThis = document.getElementById("btnWeekThis");
  const btnWeekNext = document.getElementById("btnWeekNext");

  // 카카오톡 공지 작성기 요소
  const kakaoDate = document.getElementById("kakaoDate");
  const kakaoApplyUrl = document.getElementById("kakaoApplyUrl");
  const kakaoContactUrl = document.getElementById("kakaoContactUrl");
  const kakaoNoticeText = document.getElementById("kakaoNoticeText");
  const ktBubbleText = document.getElementById("ktBubbleText");
  const ktPinTitle = document.getElementById("ktPinTitle");
  const ktPinnedNotice = document.getElementById("ktPinnedNotice");
  const ktBtnPreviewApply = document.getElementById("ktBtnPreviewApply");
  const ktBtnPreviewContact = document.getElementById("ktBtnPreviewContact");
  const kakaoCharStats = document.getElementById("kakaoCharStats");
  const ktMsgDateText = document.getElementById("ktMsgDateText");
  const btnDateThisWeek = document.getElementById("btnDateThisWeek");
  const btnDateNextWeek = document.getElementById("btnDateNextWeek");
  const btnResetKakaoTpl = document.getElementById("btnResetKakaoTpl");
  const btnCopyKakao = document.getElementById("btnCopyKakao");
  const kakaoRoomListContainer = document.getElementById("kakaoRoomListContainer");
  const btnAddKakaoRoom = document.getElementById("btnAddKakaoRoom");
  const kakaoRoomCountBadge = document.getElementById("kakaoRoomCountBadge");
  const btnOpenAllRooms = document.getElementById("btnOpenAllRooms");

  // 네이버 카페 공지 작성기 요소
  const boardTitle = document.getElementById("boardTitle");
  const boardRound = document.getElementById("boardRound");
  const boardPlace = document.getElementById("boardPlace");
  const boardBody = document.getElementById("boardBody");
  const btnCopyBoardTitle = document.getElementById("btnCopyBoardTitle");
  const btnNaverDaySat = document.getElementById("btnNaverDaySat");
  const btnNaverDaySun = document.getElementById("btnNaverDaySun");

  const boardArticleContent = document.getElementById("boardArticleContent");
  const boardCharStats = document.getElementById("boardCharStats");
  const btnResetNaverTpl = document.getElementById("btnResetNaverTpl");
  const btnCopyNaverRich = document.getElementById("btnCopyNaverRich");
  const btnOpenNaverWriteDirect = document.getElementById("btnOpenNaverWriteDirect");

  // =========================================================================
  // 4. Kakao Notice Composer Logic (사용자 지정 서식)
  // =========================================================================

  function buildKakaoNoticeText(dateStr) {
    const applyUrl = (kakaoApplyUrl && kakaoApplyUrl.value.trim()) || "https://bookclub-apply-demo.streamlit.app";
    const contactUrl = (kakaoContactUrl && kakaoContactUrl.value.trim()) || "https://open.kakao.com/o/sample_contact";

    return `[${dateStr}] 모임신청 안내
 
①가입한 플랫폼에서 <참석> 표시 
 
②모임 신청 <독서모임 신청 페이지>
${applyUrl}
미 응답시 참석이 제한될 수 있습니다.

* 미등록은 아래로 연락
${contactUrl}

💫신청 방식 변경으로 인해, 기존 회원분들도 새롭게 등록해야하니 꼭 확인해 주세요💫`;
  }

  function updateKakaoPreview() {
    if (!ktBubbleText) return;
    const text = kakaoNoticeText ? kakaoNoticeText.value.trim() : "";
    
    // 링크 클릭 가능 태그로 변환
    const escaped = escapeHtml(text);
    const htmlWithLinks = escaped.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:#2563eb; text-decoration:underline; font-weight:600; word-break:break-all;">$1</a>'
    );
    ktBubbleText.innerHTML = htmlWithLinks;

    const firstLine = text.split("\n")[0] || "[10/03, 04] 모임신청 안내";
    if (ktPinTitle) {
      ktPinTitle.textContent = firstLine;
    }
    if (kakaoCharStats) {
      kakaoCharStats.textContent = `글자 수: ${text.length}자`;
    }
    if (ktMsgDateText) {
      const now = new Date();
      const days = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
      ktMsgDateText.textContent = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 ${days[now.getDay()]}`;
    }

    const now = new Date();
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const ampms = hours >= 12 ? "오후" : "오전";
    const displayHour = hours % 12 || 12;
    const ktLiveTime = document.getElementById("ktLiveTime");
    const ktTimeStamp = document.getElementById("ktTimeStamp");
    if (ktLiveTime) ktLiveTime.textContent = `${String(hours).padStart(2, "0")}:${minutes}`;
    if (ktTimeStamp) ktTimeStamp.textContent = `${ampms} ${displayHour}:${minutes}`;

    // 미리보기 버튼 링크 연동
    const applyUrl = (kakaoApplyUrl && kakaoApplyUrl.value.trim()) || "https://bookclub-apply-demo.streamlit.app";
    const contactUrl = (kakaoContactUrl && kakaoContactUrl.value.trim()) || "https://open.kakao.com/o/sample_contact";
    if (ktBtnPreviewApply) ktBtnPreviewApply.href = applyUrl;
    if (ktBtnPreviewContact) ktBtnPreviewContact.href = contactUrl;
  }

  // =========================================================================
  // 5. Naver Cafe SmartEditor Composer & Bridge Logic (강남 독서모임 사용자 서식)
  // =========================================================================

  let currentNaverDay = "sat"; // "sat" or "sun"

  // 토요일(강남) / 일요일(종각)별 기본 모임 설정
  const naverSettings = {
    sat: {
      locationName: "강남",
      place: "강남역 인근 카페",
      round: "436회"
    },
    sun: {
      locationName: "종각",
      place: "종각역 인근 카페",
      round: "437회"
    }
  };

  function getNaverCurrentShortDate(dayType = currentNaverDay) {
    const raw = masterDateRange ? masterDateRange.value.trim() : "10/03, 04";
    const parts = raw.split(",");
    const satPart = parts[0] ? parts[0].trim() : "10/03";
    const sunPart = parts[1] ? parts[1].trim() : "04";
    if (dayType === "sat") {
      return satPart;
    }
    if (sunPart.includes("/")) {
      return sunPart;
    }
    const month = satPart.split("/")[0] || "10";
    return `${month}/${sunPart}`;
  }

  function buildNaverNoticeTitle(dayType = currentNaverDay) {
    const isSat = dayType === "sat";
    const dayTag = isSat ? "토" : "일";
    const dateStr = getNaverCurrentShortDate(dayType);
    const cfg = naverSettings[dayType];
    const loc = cfg.locationName;
    const round = cfg.round;
    return `[${dateStr}/${dayTag}]${loc} 독서모임 ${round} 공지`;
  }

  function buildNaverNoticeText(dayType = currentNaverDay) {
    const isSat = dayType === "sat";
    const dayName = isSat ? "토요일" : "일요일";
    const cfg = naverSettings[dayType];
    const place = cfg.place;
    const applyUrl = (kakaoApplyUrl && kakaoApplyUrl.value.trim()) || "https://bookclub-apply-demo.streamlit.app";
    const contactUrl = (kakaoContactUrl && kakaoContactUrl.value.trim()) || "https://open.kakao.com/o/sample_contact";

    return `${dayName} 독서모임


일시 : ${dayName} 오후 2:00~4:30
준비 : 책소개, 자기소개
장소 : ${place}


강남 독서모임은 자유책으로 진행합니다.
자유책은 각자 선택한 책을 "미리" 읽어온 뒤,
모임에서 그 책을 소개하는 방식입니다.


${applyUrl}

신청 방법 : 상단 링크 클릭->모임 일정&신청->자유책 신청
신청기간 : 모임날 10분 전까지 언제든 :)

* 미등록은 아래 프로필로 연락 부탁드립니다.
${contactUrl}`;
  }

  function getNaverNoticeData() {
    const title = boardTitle ? boardTitle.value.trim() : "";
    const body = boardBody ? boardBody.value.trim() : "";

    const escapedBody = escapeHtml(body);
    const htmlWithLinks = escapedBody.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:#2563eb; text-decoration:underline; font-weight:bold; word-break:break-all;">$1</a>'
    );

    const richHtml = `
      <div style="font-family:'Apple SD Gothic Neo','Malgun Gothic','Pretendard',sans-serif; color:#1e293b; line-height:1.8; font-size:15px; max-width:720px;">
        <h2 style="font-size:20px; font-weight:800; color:#0f172a; border-bottom:2px solid #03c75a; padding-bottom:12px; margin:0 0 20px 0;">
          ${escapeHtml(title)}
        </h2>
        <div style="white-space:pre-wrap; font-size:15px; color:#1e293b;">
${htmlWithLinks}
        </div>
      </div>
    `;

    return { title, richHtml, plainText: body };
  }

  function updateBoardPreview() {
    if (!boardArticleContent) return;
    const data = getNaverNoticeData();
    boardArticleContent.innerHTML = data.richHtml;

    if (boardCharStats) {
      boardCharStats.textContent = `글자 수: ${data.plainText.length}자`;
    }
  }

  // 네이버 스마트에디터 서식 클립보드 복사 함수 (HTML + PlainText)
  async function copyRichContentToClipboard(plainText, htmlText, alertMsg) {
    try {
      if (window.ClipboardItem) {
        const textBlob = new Blob([plainText], { type: "text/plain" });
        const htmlBlob = new Blob([htmlText], { type: "text/html" });
        const clipboardItem = new ClipboardItem({
          "text/plain": textBlob,
          "text/html": htmlBlob
        });
        await navigator.clipboard.write([clipboardItem]);
        if (alertMsg) alert(alertMsg);
        return true;
      } else {
        copyTextToClipboard(plainText, alertMsg || "공지문 텍스트가 복사되었습니다.");
        return true;
      }
    } catch (err) {
      copyTextToClipboard(plainText, alertMsg || "공지문 텍스트가 복사되었습니다.");
      return true;
    }
  }

  function getNaverCafeWriteUrl() {
    return "https://cafe.naver.com";
  }

  // =========================================================================
  // 6. Master Controller Sync Engine (자유책 양일 모임 전용)
  // =========================================================================

  function applyDateRange(dateRange) {
    if (masterDateRange) masterDateRange.value = dateRange;
    if (kakaoDate) kakaoDate.value = dateRange;

    // 1. 카카오톡 양식 동기화
    if (kakaoNoticeText) {
      kakaoNoticeText.value = buildKakaoNoticeText(dateRange);
    }
    updateKakaoPreview();

    // 2. 네이버 카페 양식 동기화
    if (boardRound) {
      boardRound.value = naverSettings[currentNaverDay].round;
    }
    if (boardPlace) {
      boardPlace.value = naverSettings[currentNaverDay].place;
    }
    if (boardTitle) {
      boardTitle.value = buildNaverNoticeTitle(currentNaverDay);
    }
    if (boardBody) {
      boardBody.value = buildNaverNoticeText(currentNaverDay);
    }
    updateBoardPreview();
  }

  function setWeekOffset(offset) {
    const dates = getWeekendDates(offset);
    applyDateRange(dates.shortRange);

    // 퀵 버튼 active 상태 표시
    [btnWeekThis, btnWeekNext].forEach((btn) => {
      if (btn) btn.classList.remove("active");
    });
    if (offset === 0 && btnWeekThis) btnWeekThis.classList.add("active");
    if (offset === 1 && btnWeekNext) btnWeekNext.classList.add("active");
  }

  // 퀵 주차 버튼 이벤트
  if (btnWeekThis) btnWeekThis.addEventListener("click", () => setWeekOffset(0));
  if (btnWeekNext) btnWeekNext.addEventListener("click", () => setWeekOffset(1));

  // 카카오 내부 날짜 버튼
  if (btnDateThisWeek) btnDateThisWeek.addEventListener("click", () => setWeekOffset(0));
  if (btnDateNextWeek) btnDateNextWeek.addEventListener("click", () => setWeekOffset(1));

  // 마스터 날짜 직접 입력 이벤트
  if (masterDateRange) {
    masterDateRange.addEventListener("input", () => {
      applyDateRange(masterDateRange.value);
    });
  }

  if (btnApplyAllNotices) {
    btnApplyAllNotices.addEventListener("click", () => {
      const curDate = masterDateRange ? masterDateRange.value.trim() : "10/03, 04";
      applyDateRange(curDate);
      alert("✅ 상단 주말 일정에 맞춰 카카오톡과 네이버 카페 공지가 동시에 최신 내용으로 갱신되었습니다!");
    });
  }

  // 카카오 날짜 직접 입력 이벤트
  if (kakaoDate) {
    kakaoDate.addEventListener("input", () => {
      const rawDate = kakaoDate.value.trim() || "10/03, 04";
      if (masterDateRange) masterDateRange.value = rawDate;
      if (kakaoNoticeText) {
        const lines = kakaoNoticeText.value.split("\n");
        lines[0] = `[${rawDate}] 모임신청 안내`;
        kakaoNoticeText.value = lines.join("\n");
      }
      updateKakaoPreview();
    });
  }

  // 카카오 신청 및 문의 URL 변경 이벤트
  [kakaoApplyUrl, kakaoContactUrl].forEach((inp) => {
    if (inp) {
      inp.addEventListener("input", () => {
        const curDate = kakaoDate ? kakaoDate.value.trim() : "10/03, 04";
        if (kakaoNoticeText) {
          kakaoNoticeText.value = buildKakaoNoticeText(curDate);
        }
        updateKakaoPreview();
      });
    }
  });

  if (kakaoNoticeText) {
    kakaoNoticeText.addEventListener("input", updateKakaoPreview);
  }

  if (btnResetKakaoTpl) {
    btnResetKakaoTpl.addEventListener("click", () => {
      const curDate = kakaoDate ? kakaoDate.value.trim() : "10/03, 04";
      applyDateRange(curDate);
    });
  }

  // 카카오 액션
  if (btnCopyKakao) {
    btnCopyKakao.addEventListener("click", () => {
      const text = kakaoNoticeText ? kakaoNoticeText.value.trim() : "";
      copyTextToClipboard(text, "📋 카카오톡 공지 전문이 복사되었습니다!\n클립보드에 저장된 공지를 바로 붙여넣기(Ctrl+V)하세요.");
    });
  }

  // =========================================================================
  // 오픈 카톡방 동적 목록 관리 (추가, 삭제, 개별/일괄 열기)
  // =========================================================================
  let kakaoChatRooms = [
    { id: 1, url: "https://open.kakao.com/o/sample_room1" },
    { id: 2, url: "https://open.kakao.com/o/sample_room2" },
    { id: 3, url: "https://open.kakao.com/o/sample_room3" }
  ];
  let nextKakaoRoomId = 4;

  function renderKakaoRoomList() {
    if (!kakaoRoomListContainer) return;
    kakaoRoomListContainer.innerHTML = "";

    if (kakaoRoomCountBadge) {
      kakaoRoomCountBadge.textContent = `${kakaoChatRooms.length}개`;
    }

    kakaoChatRooms.forEach((room, index) => {
      const row = document.createElement("div");
      row.className = "kakao-room-row";
      row.style.cssText = "display:flex; align-items:center; gap:8px; background:#ffffff; border:1px solid #e2e8f0; border-radius:6px; padding:8px 10px;";

      // 방 라벨
      const label = document.createElement("span");
      label.style.cssText = "font-size:0.78rem; font-weight:700; color:#1e40af; background:#eff6ff; border:1px solid #bfdbfe; padding:6px 10px; border-radius:4px; min-width:60px; text-align:center; white-space:nowrap;";
      label.textContent = `단톡방 ${index + 1}`;

      // URL 입력창
      const input = document.createElement("input");
      input.type = "text";
      input.className = "room-url-input";
      input.value = room.url;
      input.placeholder = `예: https://open.kakao.com/o/sample_room${index + 1}`;
      input.style.cssText = "flex:1; font-size:0.85rem; padding:8px 10px; border:1px solid #cbd5e1; border-radius:5px; background:#ffffff;";
      input.addEventListener("input", () => {
        room.url = input.value.trim();
      });

      // 개별 열기 버튼
      const btnOpen = document.createElement("button");
      btnOpen.type = "button";
      btnOpen.className = "btn-sheet-tool";
      btnOpen.title = `공지 복사 후 단톡방 ${index + 1} 열기`;
      btnOpen.style.cssText = "padding:7px 12px; font-size:0.78rem; font-weight:700; border:1px solid #fde047; background:#fee500; color:#1e1b4b; border-radius:5px; cursor:pointer; display:inline-flex; align-items:center; gap:4px; white-space:nowrap;";
      btnOpen.innerHTML = "<span>🔗</span> <span>열기</span>";
      btnOpen.addEventListener("click", () => {
        const url = input.value.trim();
        if (!url) {
          alert(`⚠️ [단톡방 ${index + 1}] 주소를 입력해주세요.`);
          return;
        }
        const text = kakaoNoticeText ? kakaoNoticeText.value.trim() : "";
        copyTextToClipboard(text, `📋 공지 전문이 복사되었습니다!\n열린 [단톡방 ${index + 1}]에 바로 붙여넣기(Ctrl+V)하세요.`);
        window.open(url, "_blank");
      });

      // 삭제 버튼
      const btnDelete = document.createElement("button");
      btnDelete.type = "button";
      btnDelete.title = `단톡방 ${index + 1} 삭제`;
      btnDelete.style.cssText = "padding:7px 10px; font-size:0.8rem; font-weight:700; border:1px solid #fca5a5; background:#fee2e2; color:#b91c1c; border-radius:5px; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; white-space:nowrap;";
      btnDelete.innerHTML = "<span>🗑️</span>";
      btnDelete.addEventListener("click", () => {
        if (kakaoChatRooms.length <= 1) {
          alert("⚠️ 최소 1개 이상의 발송 대상 단톡방 주소가 유지되어야 합니다.");
          return;
        }
        kakaoChatRooms = kakaoChatRooms.filter((r) => r.id !== room.id);
        renderKakaoRoomList();
      });

      row.appendChild(label);
      row.appendChild(input);
      row.appendChild(btnOpen);
      row.appendChild(btnDelete);
      kakaoRoomListContainer.appendChild(row);
    });
  }

  // 단톡방 추가 버튼
  if (btnAddKakaoRoom) {
    btnAddKakaoRoom.addEventListener("click", () => {
      const nextNum = kakaoChatRooms.length + 1;
      kakaoChatRooms.push({
        id: nextKakaoRoomId++,
        url: `https://open.kakao.com/o/sample_room${nextNum}`
      });
      renderKakaoRoomList();
    });
  }

  // 전체 단톡방 일괄 열기 버튼
  if (btnOpenAllRooms) {
    btnOpenAllRooms.addEventListener("click", () => {
      if (kakaoChatRooms.length === 0) {
        alert("⚠️ 등록된 단톡방이 없습니다.");
        return;
      }
      const text = kakaoNoticeText ? kakaoNoticeText.value.trim() : "";
      copyTextToClipboard(text, `📋 공지 전문이 복사되었습니다!\n열린 ${kakaoChatRooms.length}개 단톡방에 순서대로 붙여넣기(Ctrl+V)하세요.`);
      kakaoChatRooms.forEach((r) => {
        if (r.url) {
          window.open(r.url, "_blank");
        }
      });
    });
  }

  // 초기 렌더링 호출
  renderKakaoRoomList();

  // 네이버 카페 입력 변경 이벤트
  if (boardTitle) {
    boardTitle.addEventListener("input", updateBoardPreview);
  }
  if (boardBody) {
    boardBody.addEventListener("input", updateBoardPreview);
  }

  if (boardRound) {
    boardRound.addEventListener("input", () => {
      naverSettings[currentNaverDay].round = boardRound.value.trim() || "";
      if (boardTitle) boardTitle.value = buildNaverNoticeTitle(currentNaverDay);
      updateBoardPreview();
    });
  }

  if (boardPlace) {
    boardPlace.addEventListener("input", () => {
      naverSettings[currentNaverDay].place = boardPlace.value.trim() || "";
      if (boardBody) boardBody.value = buildNaverNoticeText(currentNaverDay);
      updateBoardPreview();
    });
  }

  if (btnCopyBoardTitle) {
    btnCopyBoardTitle.addEventListener("click", () => {
      const title = boardTitle ? boardTitle.value.trim() : "";
      copyTextToClipboard(title, "📋 게시글 제목이 복사되었습니다!\n네이버 카페 글쓰기 창 제목 칸에 바로 붙여넣기(Ctrl+V)하세요.");
    });
  }

  if (btnNaverDaySat) {
    btnNaverDaySat.addEventListener("click", () => {
      currentNaverDay = "sat";
      btnNaverDaySat.classList.add("active");
      if (btnNaverDaySun) btnNaverDaySun.classList.remove("active");
      if (boardRound) boardRound.value = naverSettings.sat.round;
      if (boardPlace) boardPlace.value = naverSettings.sat.place;
      if (boardTitle) boardTitle.value = buildNaverNoticeTitle("sat");
      if (boardBody) boardBody.value = buildNaverNoticeText("sat");
      updateBoardPreview();
    });
  }

  if (btnNaverDaySun) {
    btnNaverDaySun.addEventListener("click", () => {
      currentNaverDay = "sun";
      btnNaverDaySun.classList.add("active");
      if (btnNaverDaySat) btnNaverDaySat.classList.remove("active");
      if (boardRound) boardRound.value = naverSettings.sun.round;
      if (boardPlace) boardPlace.value = naverSettings.sun.place;
      if (boardTitle) boardTitle.value = buildNaverNoticeTitle("sun");
      if (boardBody) boardBody.value = buildNaverNoticeText("sun");
      updateBoardPreview();
    });
  }

  if (btnResetNaverTpl) {
    btnResetNaverTpl.addEventListener("click", () => {
      if (boardTitle) boardTitle.value = buildNaverNoticeTitle(currentNaverDay);
      if (boardBody) boardBody.value = buildNaverNoticeText(currentNaverDay);
      updateBoardPreview();
    });
  }

  // 네이버 카페 스마트에디터 원클릭 브리지
  if (btnCopyNaverRich) {
    btnCopyNaverRich.addEventListener("click", async () => {
      const data = getNaverNoticeData();
      await copyRichContentToClipboard(
        data.plainText,
        data.richHtml,
        "📋 네이버 카페용 공지문 본문이 클립보드에 복사되었습니다!\n\n네이버 카페 글쓰기 창에서 본문에 바로 'Ctrl + V'를 누르시면 서식이 그대로 붙여넣어집니다."
      );
    });
  }

  if (btnOpenNaverWriteDirect) {
    btnOpenNaverWriteDirect.addEventListener("click", async () => {
      const data = getNaverNoticeData();
      await copyRichContentToClipboard(data.plainText, data.richHtml, "");
      const writeUrl = getNaverCafeWriteUrl();

      window.open(writeUrl, "_blank");

      alert(`✅ 네이버 카페용 공지 본문이 클립보드에 복사되었습니다!\n\n새로 열린 네이버 카페 글쓰기 창에서:\n1. 제목 입력창에 상단 '📋 제목 복사' 버튼으로 복사한 제목 붙여넣기\n2. 본문 에디터에 'Ctrl + V (붙여넣기)'를 누르시면 됩니다.`);
    });
  }

  // =========================================================================
  // 7. Nav Tabs Smooth Scroll & Active Handling
  // =========================================================================
  const navTabs = document.querySelectorAll(".console-nav .nav-tab");
  navTabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      const targetId = tab.getAttribute("href");
      if (targetId && targetId.startsWith("#")) {
        e.preventDefault();
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          navTabs.forEach((t) => t.classList.remove("active"));
          tab.classList.add("active");
          targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    });
  });

  // =========================================================================
  // 8. Initial Load & Startup Execution
  // =========================================================================
  setWeekOffset(0); // 현재 시점 기준 이번 주 토·일 계산 및 자유 도서 공지 적용
});

