/**
 * BookLink Admin Console - Operational Management Engine
 * Target: 독서모임 관리자 / Core Value: 투명한 소통 및 고도화 자동화
 */

document.addEventListener("DOMContentLoaded", () => {
  // =========================================================================
  // 1. Google Sheets Style Member DB Engine
  // =========================================================================

  // 개인정보 보호 익명화(마스킹) 유틸
  function maskName(name) {
    if (!name) return "***";
    return "***";
  }

  function maskPhone(phone) {
    return "010-0000-0000";
  }

  const initialMembers = [
    { id: 1, name: "***", phone: "010-0000-0000", channel: "소모임", attendance: 8, fee: "완료", book: "도둑맞은 집중력", role: "정회원", note: "제출" },
    { id: 2, name: "***", phone: "010-0000-0000", channel: "당근", attendance: 3, fee: "완료", book: "도둑맞은 집중력", role: "일반회원", note: "제출" },
    { id: 3, name: "***", phone: "010-0000-0000", channel: "인스타", attendance: 12, fee: "완료", book: "물고기는 존재하지 않는다", role: "운영진", note: "제출" },
    { id: 4, name: "***", phone: "010-0000-0000", channel: "에타", attendance: 2, fee: "대기", book: "도둑맞은 집중력", role: "신규회원", note: "미제출" },
    { id: 5, name: "***", phone: "010-0000-0000", channel: "카카오톡", attendance: 6, fee: "완료", book: "원씽 (The ONE Thing)", role: "정회원", note: "제출" },
    { id: 6, name: "***", phone: "010-0000-0000", channel: "네이버", attendance: 4, fee: "대기", book: "도둑맞은 집중력", role: "일반회원", note: "미제출" },
    { id: 7, name: "***", phone: "010-0000-0000", channel: "소모임", attendance: 9, fee: "완료", book: "클린 코드", role: "호스트", note: "제출" },
    { id: 8, name: "***", phone: "010-0000-0000", channel: "당근", attendance: 5, fee: "면제", book: "도둑맞은 집중력", role: "운영진", note: "제출" }
  ];

  // 이전 버전 로컬 스토리지 캐시 완전 정리 (개인정보 보호)
  ["booklink_members_v1", "booklink_members_v2", "booklink_members_v3", "booklink_members_v4", "booklink_members_v5"].forEach((k) => localStorage.removeItem(k));

  let rawStored = JSON.parse(localStorage.getItem("booklink_members_v6"));
  let members = (rawStored && rawStored.length > 0) ? rawStored : [...initialMembers];
  // 기존 저장 데이터도 이름(***)과 연락처(010-0000-0000) 익명화 적용
  members = members.map((m) => ({
    ...m,
    name: maskName(m.name),
    phone: maskPhone(m.phone)
  }));
  localStorage.setItem("booklink_members_v6", JSON.stringify(members));
  let selectedMemberIds = new Set();
  let currentFilter = "all";
  let searchQuery = "";
  let currentActiveCell = null;

  // DOM Elements - Sheet
  const tableBody = document.getElementById("memberTableBody");
  const searchInput = document.getElementById("sheetSearchInput");
  const filterPills = document.querySelectorAll("#channelFilterGroup .filter-pill");
  const countAll = document.getElementById("countAll");
  const checkAllMembers = document.getElementById("checkAllMembers");
  const batchActionBar = document.getElementById("batchActionBar");
  const selectedCount = document.getElementById("selectedCount");

  // KPI Elements
  const kpiTotalMembers = document.getElementById("kpiTotalMembers");
  const kpiFeeRatio = document.getElementById("kpiFeeRatio");
  const kpiAvgAttendance = document.getElementById("kpiAvgAttendance");
  const kpiNoteRatio = document.getElementById("kpiNoteRatio");

  // Formula Bar Elements
  const currentCellCoord = document.getElementById("currentCellCoord");
  const formulaInput = document.getElementById("formulaInput");

  // Sync Elements
  const btnSyncGoogleNow = document.getElementById("btnSyncGoogleNow");
  const sheetSaveIndicator = document.getElementById("sheetSaveIndicator");
  const cloudSyncStatus = document.getElementById("cloudSyncStatus");

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

  // 1-1. Table Rendering
  function renderMemberTable() {
    if (!tableBody) return;

    const filtered = members.filter((m) => {
      const matchChannel = currentFilter === "all" || m.channel === currentFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        m.name.toLowerCase().includes(q) ||
        m.channel.toLowerCase().includes(q) ||
        m.book.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q) ||
        m.phone.includes(q);
      return matchChannel && matchSearch;
    });

    tableBody.innerHTML = "";

    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="11" style="text-align: center; padding: 40px; color: var(--text-dim);">
            일치하는 회원 데이터가 없습니다. (필터 또는 검색어를 확인하세요)
          </td>
        </tr>
      `;
    } else {
      filtered.forEach((m, idx) => {
        const tr = document.createElement("tr");
        const isSelected = selectedMemberIds.has(m.id);
        if (isSelected) tr.classList.add("row-selected");

        // Channel Chip Class
        const chipMap = {
          "카카오톡": "chip-kakao",
          "소모임": "chip-somoim",
          "네이버": "chip-naver",
          "당근": "chip-daangn",
          "에타": "chip-everytime",
          "인스타": "chip-instagram"
        };
        const chipClass = chipMap[m.channel] || "chip-somoim";

        // Fee Badge Class
        let feeClass = "fee-paid";
        let feeText = "✔ 납부 완료";
        if (m.fee === "대기") {
          feeClass = "fee-pending";
          feeText = "⏳ 입금 대기";
        } else if (m.fee === "면제") {
          feeClass = "fee-exempt";
          feeText = "🏷️ 회비 면제";
        }

        // Note Badge
        const noteClass = m.note === "제출" ? "note-submitted" : "note-pending";
        const noteText = m.note === "제출" ? "✔ 제출 완료" : "⏳ 미제출";

        // Role Class
        const isHost = m.role === "호스트";
        const roleClass = isHost ? "role-tag role-host" : "role-tag";

        tr.innerHTML = `
          <td class="col-select">
            <input type="checkbox" class="row-checkbox" data-id="${m.id}" ${isSelected ? "checked" : ""}>
          </td>
          <td class="col-num" data-coord="A${idx + 2}">${idx + 1}</td>
          <td class="col-name" data-coord="B${idx + 2}" data-val="${escapeHtml(maskName(m.name))}">
            <strong>${escapeHtml(maskName(m.name))}</strong>
          </td>
          <td class="col-phone" data-coord="C${idx + 2}" data-val="${escapeHtml(maskPhone(m.phone))}">${escapeHtml(maskPhone(m.phone))}</td>
          <td class="col-channel" data-coord="D${idx + 2}" data-val="${escapeHtml(m.channel)}">
            <span class="channel-chip ${chipClass}">${escapeHtml(m.channel)}</span>
          </td>
          <td class="col-attendance" data-coord="E${idx + 2}" data-val="${m.attendance}">
            <div class="attendance-cell">
              <button type="button" class="btn-counter btn-att-minus" data-id="${m.id}">-</button>
              <span class="count-number">${m.attendance}회</span>
              <button type="button" class="btn-counter btn-att-plus" data-id="${m.id}">+</button>
            </div>
          </td>
          <td class="col-fee" data-coord="F${idx + 2}" data-val="${m.fee}">
            <span class="fee-badge ${feeClass}" data-id="${m.id}" title="클릭 시 상태 전환 (완료/대기/면제)">
              ${feeText}
            </span>
          </td>
          <td class="col-book" data-coord="G${idx + 2}" data-val="${escapeHtml(m.book)}">📖 ${escapeHtml(m.book)}</td>
          <td class="col-role" data-coord="H${idx + 2}" data-val="${escapeHtml(m.role)}">
            <span class="${roleClass}">${escapeHtml(m.role)}</span>
          </td>
          <td class="col-note" data-coord="I${idx + 2}" data-val="${m.note}">
            <span class="note-badge ${noteClass}" data-id="${m.id}" title="클릭 시 발제문 제출여부 토글">
              ${noteText}
            </span>
          </td>
          <td class="col-action">
            <button type="button" class="btn-delete-row" data-id="${m.id}" title="명단에서 삭제">✕</button>
          </td>
        `;
        tableBody.appendChild(tr);
      });
    }

    updateMetrics();
    updateBatchBar();
  }

  // 1-2. Update KPI Metrics
  function updateMetrics() {
    if (!members.length) {
      if (kpiTotalMembers) kpiTotalMembers.textContent = "0명";
      if (kpiFeeRatio) kpiFeeRatio.textContent = "0%";
      if (kpiAvgAttendance) kpiAvgAttendance.textContent = "0회";
      if (kpiNoteRatio) kpiNoteRatio.textContent = "0%";
      if (countAll) countAll.textContent = "0";
      return;
    }

    const total = members.length;
    if (kpiTotalMembers) kpiTotalMembers.textContent = `${total}명`;
    if (countAll) countAll.textContent = total;

    // Fee Paid Ratio (완료 or 면제)
    const paidCount = members.filter((m) => m.fee === "완료" || m.fee === "면제").length;
    const feeRatio = Math.round((paidCount / total) * 100);
    if (kpiFeeRatio) kpiFeeRatio.textContent = `${feeRatio}% (${paidCount}/${total})`;

    // Avg Attendance
    const totalAtt = members.reduce((sum, m) => sum + (Number(m.attendance) || 0), 0);
    const avgAtt = (totalAtt / total).toFixed(1);
    if (kpiAvgAttendance) kpiAvgAttendance.textContent = `${avgAtt}회`;

    // Note Ratio
    const noteCount = members.filter((m) => m.note === "제출").length;
    const noteRatio = Math.round((noteCount / total) * 100);
    if (kpiNoteRatio) kpiNoteRatio.textContent = `${noteRatio}% (${noteCount}/${total})`;
  }

  // 1-3. Batch Selection Bar
  function updateBatchBar() {
    if (!batchActionBar) return;
    const count = selectedMemberIds.size;
    if (selectedCount) selectedCount.textContent = count;

    if (count > 0) {
      batchActionBar.style.display = "flex";
    } else {
      batchActionBar.style.display = "none";
    }

    if (checkAllMembers) {
      checkAllMembers.checked = members.length > 0 && selectedMemberIds.size === members.length;
    }
  }

  // 1-4. Search & Filter Listeners
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value;
      renderMemberTable();
    });
  }

  filterPills.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterPills.forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.getAttribute("data-channel");
      renderMemberTable();
    });
  });

  // Check all
  if (checkAllMembers) {
    checkAllMembers.addEventListener("change", (e) => {
      if (e.target.checked) {
        selectedMemberIds = new Set(members.map((m) => m.id));
      } else {
        selectedMemberIds.clear();
      }
      renderMemberTable();
    });
  }

  // Table Body Delegation
  if (tableBody) {
    tableBody.addEventListener("click", (e) => {
      // Row Checkbox
      const chk = e.target.closest(".row-checkbox");
      if (chk) {
        const id = parseInt(chk.getAttribute("data-id"), 10);
        if (chk.checked) selectedMemberIds.add(id);
        else selectedMemberIds.delete(id);
        renderMemberTable();
        return;
      }

      // Attendance Minus
      const btnMinus = e.target.closest(".btn-att-minus");
      if (btnMinus) {
        const id = parseInt(btnMinus.getAttribute("data-id"), 10);
        const target = members.find((m) => m.id === id);
        if (target && target.attendance > 0) {
          target.attendance -= 1;
          saveAndRefresh();
        }
        return;
      }

      // Attendance Plus
      const btnPlus = e.target.closest(".btn-att-plus");
      if (btnPlus) {
        const id = parseInt(btnPlus.getAttribute("data-id"), 10);
        const target = members.find((m) => m.id === id);
        if (target) {
          target.attendance += 1;
          saveAndRefresh();
        }
        return;
      }

      // Fee Toggle (완료 -> 대기 -> 면제 -> 완료)
      const feeBadge = e.target.closest(".fee-badge");
      if (feeBadge) {
        const id = parseInt(feeBadge.getAttribute("data-id"), 10);
        const target = members.find((m) => m.id === id);
        if (target) {
          if (target.fee === "완료") target.fee = "대기";
          else if (target.fee === "대기") target.fee = "면제";
          else target.fee = "완료";
          saveAndRefresh();
        }
        return;
      }

      // Note Toggle (제출 <-> 미제출)
      const noteBadge = e.target.closest(".note-badge");
      if (noteBadge) {
        const id = parseInt(noteBadge.getAttribute("data-id"), 10);
        const target = members.find((m) => m.id === id);
        if (target) {
          target.note = target.note === "제출" ? "미제출" : "제출";
          saveAndRefresh();
        }
        return;
      }

      // Delete Row
      const delBtn = e.target.closest(".btn-delete-row");
      if (delBtn) {
        const id = parseInt(delBtn.getAttribute("data-id"), 10);
        const target = members.find((m) => m.id === id);
        if (target && confirm(`'${target.name}' 회원을 명단에서 삭제하시겠습니까?`)) {
          members = members.filter((m) => m.id !== id);
          selectedMemberIds.delete(id);
          saveAndRefresh();
        }
        return;
      }

      // Cell Select for Formula Bar
      const cell = e.target.closest("td");
      if (cell) {
        document.querySelectorAll(".sheet-grid-table td").forEach((td) => td.classList.remove("cell-active"));
        cell.classList.add("cell-active");
        currentActiveCell = cell;

        const coord = cell.getAttribute("data-coord") || "B2";
        const val = cell.getAttribute("data-val") || cell.textContent.trim();
        if (currentCellCoord) currentCellCoord.textContent = coord;
        if (formulaInput) formulaInput.value = val;
      }
    });
  }

  // Formula Input Enter
  if (formulaInput) {
    formulaInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && currentActiveCell) {
        currentActiveCell.textContent = formulaInput.value;
        currentActiveCell.setAttribute("data-val", formulaInput.value);
        formulaInput.blur();
      }
    });
  }

  // Batch Buttons
  const btnBatchPaid = document.getElementById("btnBatchPaid");
  if (btnBatchPaid) {
    btnBatchPaid.addEventListener("click", () => {
      members.forEach((m) => {
        if (selectedMemberIds.has(m.id)) m.fee = "완료";
      });
      saveAndRefresh();
    });
  }

  const btnBatchNoteSubmitted = document.getElementById("btnBatchNoteSubmitted");
  if (btnBatchNoteSubmitted) {
    btnBatchNoteSubmitted.addEventListener("click", () => {
      members.forEach((m) => {
        if (selectedMemberIds.has(m.id)) m.note = "제출";
      });
      saveAndRefresh();
    });
  }

  const btnBatchDelete = document.getElementById("btnBatchDelete");
  if (btnBatchDelete) {
    btnBatchDelete.addEventListener("click", () => {
      if (confirm(`선택한 ${selectedMemberIds.size}명의 회원을 일괄 삭제하시겠습니까?`)) {
        members = members.filter((m) => !selectedMemberIds.has(m.id));
        selectedMemberIds.clear();
        saveAndRefresh();
      }
    });
  }

  // Instant Cloud Sync Animation
  if (btnSyncGoogleNow) {
    btnSyncGoogleNow.addEventListener("click", () => {
      btnSyncGoogleNow.classList.add("syncing");
      const textSpan = btnSyncGoogleNow.querySelector(".sync-text");
      if (textSpan) textSpan.textContent = "동기화 중...";

      if (sheetSaveIndicator) {
        sheetSaveIndicator.textContent = "🔄 Google Cloud 저장소와 패킷 교환 중...";
        sheetSaveIndicator.style.color = "var(--primary)";
      }

      setTimeout(() => {
        btnSyncGoogleNow.classList.remove("syncing");
        if (textSpan) textSpan.textContent = "구글 시트 즉시 동기화";
        const now = new Date();
        const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
        if (sheetSaveIndicator) {
          sheetSaveIndicator.textContent = `☁ 모든 변경사항이 Google Drive에 저장됨 (${timeStr})`;
          sheetSaveIndicator.style.color = "var(--sheet-green)";
        }
      }, 700);
    });
  }

  // Add Member Modal
  const btnAddMember = document.getElementById("btnAddMember");
  const addMemberModal = document.getElementById("addMemberModal");
  const btnCloseAddMember = document.getElementById("btnCloseAddMember");
  const addMemberForm = document.getElementById("addMemberForm");

  if (btnAddMember && addMemberModal) {
    btnAddMember.addEventListener("click", () => addMemberModal.classList.add("active"));
  }
  if (btnCloseAddMember && addMemberModal) {
    btnCloseAddMember.addEventListener("click", () => addMemberModal.classList.remove("active"));
  }
  if (addMemberModal) {
    addMemberModal.addEventListener("click", (e) => {
      if (e.target === addMemberModal) addMemberModal.classList.remove("active");
    });
  }

  if (addMemberForm) {
    addMemberForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("newMemberName").value.trim();
      const phone = document.getElementById("newMemberPhone").value.trim();
      const channel = document.getElementById("newMemberChannel").value;
      const role = document.getElementById("newMemberRole").value;
      const book = document.getElementById("newMemberBook").value.trim();
      const fee = document.getElementById("newMemberFee").value;
      const note = document.getElementById("newMemberNote").value;

      if (!name) return;

      const newId = members.length > 0 ? Math.max(...members.map((m) => m.id)) + 1 : 1;
      members.push({
        id: newId,
        name: maskName(name),
        phone: maskPhone(phone || "010-0000-0000"),
        channel,
        attendance: 1,
        fee,
        book,
        role,
        note
      });

      saveAndRefresh();
      addMemberForm.reset();
      addMemberModal.classList.remove("active");
    });
  }

  // CSV Export
  const btnExportCsv = document.getElementById("btnExportCsv");
  if (btnExportCsv) {
    btnExportCsv.addEventListener("click", () => {
      let csv = "번호,회원명,연락처,유입플랫폼,누적출석,회비납부,지정도서,등급,독서노트제출\n";
      members.forEach((m, idx) => {
        csv += `${idx + 1},"${m.name}","${m.phone}","${m.channel}",${m.attendance},"${m.fee}","${m.book}","${m.role}","${m.note}"\n`;
      });
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "2026_독서모임_회원명단_시트.csv";
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // JSON Export
  const btnExportJson = document.getElementById("btnExportJson");
  if (btnExportJson) {
    btnExportJson.addEventListener("click", () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(members, null, 2));
      const a = document.createElement("a");
      a.href = dataStr;
      a.download = "2026_독서모임_회원데이터.json";
      a.click();
    });
  }

  // Reset Data
  const btnResetData = document.getElementById("btnResetData");
  if (btnResetData) {
    btnResetData.addEventListener("click", () => {
      if (confirm("초기 샘플 데이터 8명 명단으로 복원하시겠습니까?")) {
        members = [...initialMembers];
        selectedMemberIds.clear();
        saveAndRefresh();
      }
    });
  }

  function saveAndRefresh() {
    localStorage.setItem("booklink_members_v6", JSON.stringify(members));
    renderMemberTable();
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
  const btnOpenKakaoApp = document.getElementById("btnOpenKakaoApp");

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

  if (btnOpenKakaoApp) {
    btnOpenKakaoApp.addEventListener("click", () => {
      const text = kakaoNoticeText ? kakaoNoticeText.value.trim() : "";
      if (navigator.share) {
        navigator.share({
          title: "주말 독서모임 신청 안내",
          text: text,
          url: "https://bookclub-apply-demo.streamlit.app"
        }).catch(() => {});
      } else {
        copyTextToClipboard(text, "📋 공지 전문이 클립보드에 복사되었습니다!\n카카오톡으로 이동하여 나와의 채팅에 붙여넣으세요.");
        window.location.href = "kakaotalk://";
      }
    });
  }

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
  renderMemberTable();
  setWeekOffset(0); // 현재 시점 기준 이번 주 토·일 계산 및 자유 도서 공지 적용
});

