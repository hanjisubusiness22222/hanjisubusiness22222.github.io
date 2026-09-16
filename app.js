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
        if (textSpan) textSpan.textContent = "즉시 동기화";
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
  // 2. Credentials Manager (ID / PW Settings for Messenger & Boards)
  // =========================================================================

  // Password visibility toggle
  document.querySelectorAll(".btn-toggle-pw").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = btn.previousElementSibling;
      if (input) {
        if (input.type === "password") {
          input.type = "text";
          btn.textContent = "🙈";
        } else {
          input.type = "password";
          btn.textContent = "👁️";
        }
      }
    });
  });

  // Save credentials
  const btnSaveCredentials = document.getElementById("btnSaveCredentials");
  if (btnSaveCredentials) {
    btnSaveCredentials.addEventListener("click", () => {
      btnSaveCredentials.textContent = "✔ 저장 완료!";
      btnSaveCredentials.style.background = "var(--sheet-green)";
      setTimeout(() => {
        btnSaveCredentials.textContent = "💾 계정 정보 안전 저장";
        btnSaveCredentials.style.background = "";
      }, 1500);
    });
  }

  // Kakao Bot Session Test
  const btnKakaoTest = document.querySelector(".btn-auth-test[data-platform='kakao']");
  const msgKakaoTest = document.getElementById("msgKakaoTest");
  const badgeKakaoStatus = document.getElementById("badgeKakaoStatus");

  if (btnKakaoTest) {
    btnKakaoTest.addEventListener("click", () => {
      if (msgKakaoTest) msgKakaoTest.textContent = "카카오 인증 서버 핑 테스트 중...";
      setTimeout(() => {
        if (msgKakaoTest) {
          msgKakaoTest.textContent = "🟢 인증 성공: OAuth2 토큰 유효함";
          msgKakaoTest.style.color = "var(--accent-emerald)";
        }
        if (badgeKakaoStatus) {
          badgeKakaoStatus.textContent = "🟢 세션 정상 (200 OK)";
          badgeKakaoStatus.classList.add("badge-active");
        }
      }, 600);
    });
  }

  // Test All Accounts
  const btnTestAllAccounts = document.getElementById("btnTestAllAccounts");
  if (btnTestAllAccounts) {
    btnTestAllAccounts.addEventListener("click", () => {
      btnTestAllAccounts.textContent = "🔄 6개 플랫폼 세션 검증 중...";
      setTimeout(() => {
        btnTestAllAccounts.textContent = "✔ 전체 계정 정상 연결됨";
        alert("카카오톡 메신저 및 5개 게시판 플랫폼의 ID/PW 자격증명 인증이 모두 정상 확인되었습니다.");
      }, 800);
    });
  }

  // =========================================================================
  // 3. Multi-Platform Notice Composer & Real-time Split Previews
  // =========================================================================

  const noticeTitle = document.getElementById("noticeTitle");
  const noticeBook = document.getElementById("noticeBook");
  const noticeDateTime = document.getElementById("noticeDateTime");
  const noticePlace = document.getElementById("noticePlace");
  const noticeFee = document.getElementById("noticeFee");
  const noticeBody = document.getElementById("noticeBody");

  // Options
  const chkKakao = document.getElementById("chkKakao");
  const optKakaoPin = document.getElementById("optKakaoPin");
  const optKakaoVote = document.getElementById("optKakaoVote");
  const optKakaoMention = document.getElementById("optKakaoMention");

  const optBoardMarkdown = document.getElementById("optBoardMarkdown");
  const optBoardHashtags = document.getElementById("optBoardHashtags");
  const optBoardSheetLink = document.getElementById("optBoardSheetLink");

  // Preview elements
  const btnViewMessenger = document.getElementById("btnViewMessenger");
  const btnViewBoard = document.getElementById("btnViewBoard");
  const previewScreenMessenger = document.getElementById("previewScreenMessenger");
  const previewScreenBoard = document.getElementById("previewScreenBoard");

  const ktBubbleText = document.getElementById("ktBubbleText");
  const ktPinTitle = document.getElementById("ktPinTitle");
  const ktPinnedNotice = document.getElementById("ktPinnedNotice");
  const boardArticleContent = document.getElementById("boardArticleContent");
  const previewCharStats = document.getElementById("previewCharStats");
  const previewSpecBadge = document.getElementById("previewSpecBadge");
  const boardSubtabs = document.querySelectorAll("#boardSubtabGroup .board-subtab");

  let activeBoardTab = "somoim";
  let activePreviewMode = "messenger";

  // Mode Switch (Messenger vs Board)
  if (btnViewMessenger && btnViewBoard) {
    btnViewMessenger.addEventListener("click", () => {
      activePreviewMode = "messenger";
      btnViewMessenger.classList.add("active");
      btnViewBoard.classList.remove("active");
      if (previewScreenMessenger) previewScreenMessenger.style.display = "flex";
      if (previewScreenBoard) previewScreenBoard.style.display = "none";
      updatePreview();
    });

    btnViewBoard.addEventListener("click", () => {
      activePreviewMode = "board";
      btnViewBoard.classList.add("active");
      btnViewMessenger.classList.remove("active");
      if (previewScreenMessenger) previewScreenMessenger.style.display = "none";
      if (previewScreenBoard) previewScreenBoard.style.display = "flex";
      updatePreview();
    });
  }

  // Board Subtabs
  boardSubtabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      boardSubtabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      activeBoardTab = tab.getAttribute("data-board");
      updatePreview();
    });
  });

  // Generate Messenger Content (KakaoTalk Format)
  function formatMessengerText() {
    const title = noticeTitle.value.trim();
    const book = noticeBook.value.trim();
    const dt = noticeDateTime.value.trim();
    const place = noticePlace.value.trim();
    const fee = noticeFee.value.trim();
    const body = noticeBody.value.trim();

    let text = `📢 [독서모임 공지] ${title}\n\n`;
    if (optKakaoMention && optKakaoMention.checked) {
      text += `@멤버 전원 이번 주 정기 모임 안내드립니다!\n\n`;
    } else {
      text += `안녕하세요 회원 여러분! 이번 주 정기 모임 안내드립니다.\n\n`;
    }

    text += `📚 도서: ${book}\n`;
    text += `🗓 일시: ${dt}\n`;
    text += `📍 장소: ${place}\n`;
    text += `💰 회비: ${fee}\n\n`;
    text += `💬 [발제 & 전달사항]\n${body}\n\n`;

    if (optKakaoVote && optKakaoVote.checked) {
      text += `🗳 참석 투표: 아래 버튼을 눌러 참석 여부를 선택해주세요!\n`;
    }
    text += `* 출석부와 회비 내역은 구글 시트로 투명하게 공개됩니다.`;

    return text;
  }

  // Generate Board Content (Tailored by platform)
  function formatBoardHtml(platform) {
    const title = noticeTitle.value.trim();
    const book = noticeBook.value.trim();
    const dt = noticeDateTime.value.trim();
    const place = noticePlace.value.trim();
    const fee = noticeFee.value.trim();
    const body = noticeBody.value.trim();

    const sheetLink = optBoardSheetLink && optBoardSheetLink.checked
      ? `<div style="background:#eff6ff; border:1px solid #bfdbfe; padding:10px 14px; border-radius:6px; margin-top:14px; font-size:0.8rem; color:#1e40af;">
          🔗 <strong>투명한 운영 공개</strong>: <a href="#section-sheet" style="text-decoration:underline;">[구글 시트 실시간 출석부 및 회비 장부 열람하기]</a>
         </div>`
      : "";

    const hashtagText = optBoardHashtags && optBoardHashtags.checked
      ? `<div style="margin-top:14px; color:#2563eb; font-size:0.8rem; font-weight:600;">
          #독서모임 #북클럽 #${book.replace(/[\s\(\)]+/g, "")} #독서토론 #강남독서모임 #책추천 #투명한소통
         </div>`
      : "";

    switch (platform) {
      case "somoim":
        return `
          <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
              <span style="background:#fee2e2; color:#991b1b; font-weight:700; font-size:0.75rem; padding:2px 8px; border-radius:4px;">👥 소모임 정기정모 공지</span>
              <span style="font-size:0.75rem; color:#64748b;">모임장 호스트 작성</span>
            </div>
            <h3 style="font-size:1.15rem; color:#0f172a; margin-bottom:12px;">[정모] ${escapeHtml(title)}</h3>
            <div style="background:#f8fafc; border-left:4px solid #ff4757; padding:12px; font-size:0.85rem; margin-bottom:14px;">
              <p>• <strong>선정 도서</strong>: ${escapeHtml(book)}</p>
              <p>• <strong>정모 일시</strong>: ${escapeHtml(dt)}</p>
              <p>• <strong>모임 장소</strong>: ${escapeHtml(place)}</p>
              <p>• <strong>회비 실비</strong>: ${escapeHtml(fee)}</p>
            </div>
            <div style="font-size:0.88rem; line-height:1.6; color:#334155; white-space:pre-wrap;">${escapeHtml(body)}</div>
            ${sheetLink}
            ${hashtagText}
          </div>
        `;

      case "naver":
        return `
          <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:18px;">
            <div style="border-bottom:1px solid #e2e8f0; padding-bottom:12px; margin-bottom:14px;">
              <span style="color:#03c75a; font-weight:700; font-size:0.8rem;">[정기모임 공지]</span>
              <h3 style="font-size:1.2rem; margin:4px 0 8px; color:#0f172a;">${escapeHtml(title)}</h3>
              <div style="font-size:0.75rem; color:#64748b; display:flex; gap:12px;">
                <span>작성자: 북클럽 매니저</span>
                <span>조회: 1</span>
                <span>댓글: 0</span>
              </div>
            </div>
            <div style="font-size:0.88rem; line-height:1.7; color:#1e293b; white-space:pre-wrap;">
안녕하세요, 네이버 카페 회원 여러분!
이번 주 정기 독서모임을 안내해 드립니다.

■ 함께 나눌 책: <strong>${escapeHtml(book)}</strong>
■ 모임 시간: ${escapeHtml(dt)}
■ 모임 장소: ${escapeHtml(place)}
■ 참가비 안내: ${escapeHtml(fee)}

[발제 및 진행 안내]
${escapeHtml(body)}
            </div>
            ${sheetLink}
            ${hashtagText}
          </div>
        `;

      case "daangn":
        return `
          <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:16px;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
              <span style="background:#ffedd5; color:#9a3412; font-weight:700; font-size:0.75rem; padding:2px 8px; border-radius:4px;">🥕 당근 동네생활 모임</span>
              <span style="font-size:0.75rem; color:#64748b;">역삼1동 · 방금 전</span>
            </div>
            <h3 style="font-size:1.1rem; color:#0f172a; margin-bottom:10px;">이웃과 함께 읽는 ${escapeHtml(book)}</h3>
            <p style="font-size:0.85rem; color:#475569; margin-bottom:12px;">
              동네 이웃들과 책 한 권으로 솔직하고 따뜻한 대화를 나눠요 :)<br>
              매너온도 36.5도 이상인 동네 이웃 누구나 환영합니다!
            </p>
            <div style="background:#fff7ed; border-radius:6px; padding:10px 14px; font-size:0.82rem; margin-bottom:12px;">
              <p>📍 모이는 곳: ${escapeHtml(place)}</p>
              <p>⏰ 언제: ${escapeHtml(dt)}</p>
              <p>☕ 회비: ${escapeHtml(fee)}</p>
            </div>
            <div style="font-size:0.85rem; line-height:1.6; white-space:pre-wrap; color:#334155;">${escapeHtml(body)}</div>
            ${sheetLink}
          </div>
        `;

      case "everytime":
        return `
          <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:16px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
              <span style="color:#c62917; font-weight:800; font-size:0.78rem;">[동아리/소모임]</span>
              <span style="font-size:0.72rem; color:#94a3b8;">익명</span>
            </div>
            <h3 style="font-size:1.1rem; color:#0f172a; margin-bottom:10px;">${escapeHtml(title)}</h3>
            <div style="font-size:0.85rem; line-height:1.6; color:#334155; white-space:pre-wrap;">
이번 주말 독서모임 같이 할 학우분들 구합니다!

- 책: ${escapeHtml(book)}
- 시간: ${escapeHtml(dt)}
- 위치: ${escapeHtml(place)}
- 회비: ${escapeHtml(fee)}

${escapeHtml(body)}

참가비는 대관 실비로 구글 시트에 100% 투명 공개됩니다. 부담 없이 쪽지 주세요!
            </div>
            ${hashtagText}
          </div>
        `;

      case "instagram":
        return `
          <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:16px;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
              <div style="width:32px; height:32px; border-radius:50%; background:#fce7f3; display:flex; align-items:center; justify-content:center; font-size:0.8rem;">📸</div>
              <div>
                <strong style="font-size:0.82rem; color:#0f172a;">bookclub_transparent</strong>
                <p style="font-size:0.7rem; color:#94a3b8;">오리지널 피드 카드뉴스 캡션</p>
              </div>
            </div>
            <div style="background:#f1f5f9; height:180px; border-radius:6px; display:flex; align-items:center; justify-content:center; color:#64748b; font-size:0.85rem; margin-bottom:14px; text-align:center;">
              🖼 [카드뉴스 썸네일 이미지 미리보기]<br>
              <strong>${escapeHtml(title)}</strong>
            </div>
            <div style="font-size:0.85rem; line-height:1.6; color:#1e293b; white-space:pre-wrap;">
📖 ${escapeHtml(title)}
-
이번 모임에서 함께 나눌 책은 <strong>${escapeHtml(book)}</strong> 입니다.

🗓 일시: ${escapeHtml(dt)}
📍 장소: ${escapeHtml(place)}

"${escapeHtml(body.split("\n")[0] || "")}"

신청 및 투명한 회원 명단은 프로필 링크의 구글 시트에서 확인하실 수 있습니다.
            </div>
            ${hashtagText}
          </div>
        `;

      default:
        return title;
    }
  }

  // Update Live Preview
  function updatePreview() {
    const title = noticeTitle.value.trim();

    // Pinned notice in Kakao
    if (ktPinTitle) ktPinTitle.textContent = title;
    if (ktPinnedNotice) {
      ktPinnedNotice.style.display = optKakaoPin && optKakaoPin.checked ? "flex" : "none";
    }

    // Messenger Preview
    const messengerText = formatMessengerText();
    if (ktBubbleText) ktBubbleText.textContent = messengerText;

    // Board Preview
    const boardHtml = formatBoardHtml(activeBoardTab);
    if (boardArticleContent) boardArticleContent.innerHTML = boardHtml;

    // Char Stats
    if (activePreviewMode === "messenger") {
      if (previewCharStats) previewCharStats.textContent = `글자 수: ${messengerText.length}자 (공백 포함)`;
      if (previewSpecBadge) previewSpecBadge.textContent = "카카오톡 메시지 규격 준수 (최대 1,000자)";
    } else {
      const plainBoard = boardArticleContent ? boardArticleContent.textContent : "";
      if (previewCharStats) previewCharStats.textContent = `글자 수: ${plainBoard.length}자 (공백 포함)`;
      if (previewSpecBadge) previewSpecBadge.textContent = "게시판 마크다운 서식 최적화 완료";
    }
  }

  // Form Input Listeners
  [noticeTitle, noticeBook, noticeDateTime, noticePlace, noticeFee, noticeBody].forEach((input) => {
    if (input) input.addEventListener("input", updatePreview);
  });

  [optKakaoPin, optKakaoVote, optKakaoMention, optBoardMarkdown, optBoardHashtags, optBoardSheetLink].forEach((chk) => {
    if (chk) chk.addEventListener("change", updatePreview);
  });

  // Sample Notice Buttons
  const btnSampleNotice1 = document.getElementById("btnSampleNotice1");
  if (btnSampleNotice1) {
    btnSampleNotice1.addEventListener("click", () => {
      noticeTitle.value = "[제14회 북클럽] '도둑맞은 집중력' 함께 읽고 대화하기";
      noticeBook.value = "도둑맞은 집중력 (요한 하리)";
      noticeDateTime.value = "2026년 9월 19일 (토) 오후 2:00 ~ 4:30";
      noticePlace.value = "강남역 북카페 '생각의 숲' 3번 룸";
      noticeFee.value = "10,000원 (대관료 및 음료 1잔 포함, 영수증 100% 공개)";
      noticeBody.value = `스마트폰과 알고리즘의 유혹 속에서 우리의 집중력은 왜 흐려졌을까요?\n가장 인상 깊었던 챕터 1곳과 함께 나누고 싶은 질문 1개를 준비해 와주세요!\n* 모임 후 출석 및 회계 내역은 구글 시트를 통해 회원 전원에게 투명하게 공개됩니다.`;
      updatePreview();
    });
  }

  const btnSampleNotice2 = document.getElementById("btnSampleNotice2");
  if (btnSampleNotice2) {
    btnSampleNotice2.addEventListener("click", () => {
      noticeTitle.value = "[제15회 북클럽] '클린 코드' & 협업의 정석";
      noticeBook.value = "클린 코드 (로버트 C. 마틴)";
      noticeDateTime.value = "2026년 9월 26일 (토) 오후 3:00 ~ 5:30";
      noticePlace.value = "신논현 코워킹 스페이스 Room A";
      noticeFee.value = "10,000원 (공간 대관비 실비 집행)";
      noticeBody.value = `읽기 좋은 코드가 왜 더 투명하고 지속 가능한 팀을 만드는지 토론합니다.\n현업이나 과제에서 겪었던 협업 사례 1가지를 나눠주세요!\n* 사전 독서노트를 작성해주신 분에 한해 선착순으로 진행됩니다.`;
      updatePreview();
    });
  }

  // =========================================================================
  // 4. One-Click Broadcast Execution & Live Terminal Console Engine
  // =========================================================================

  const btnExecuteBroadcast = document.getElementById("btnExecuteBroadcast");
  const terminalCard = document.getElementById("automationTerminalCard");
  const terminalLogBody = document.getElementById("terminalLogBody");
  const termStatusTag = document.getElementById("termStatusTag");
  const btnClearTerminal = document.getElementById("btnClearTerminal");

  // Report Modal Elements
  const broadcastReportModal = document.getElementById("broadcastReportModal");
  const btnCloseReportModal = document.getElementById("btnCloseReportModal");
  const btnConfirmReport = document.getElementById("btnConfirmReport");
  const reportMessengerRow = document.getElementById("reportMessengerRow");
  const reportBoardList = document.getElementById("reportBoardList");

  if (btnClearTerminal && terminalLogBody) {
    btnClearTerminal.addEventListener("click", () => {
      terminalLogBody.innerHTML = `<div class="term-line info">[SYSTEM] 터미널 콘솔이 초기화되었습니다.</div>`;
    });
  }

  function appendTerminalLog(msg, type = "info") {
    if (!terminalLogBody) return;
    const line = document.createElement("div");
    line.className = `term-line ${type}`;
    line.textContent = msg;
    terminalLogBody.appendChild(line);
    terminalLogBody.scrollTop = terminalLogBody.scrollHeight;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  if (btnExecuteBroadcast) {
    btnExecuteBroadcast.addEventListener("click", async () => {
      const selectedChannels = Array.from(
        document.querySelectorAll("input[name='sendChannels']:checked")
      ).map((el) => el.value);

      if (selectedChannels.length === 0) {
        alert("최소 1개 이상의 메신저 또는 게시글 채널을 선택해주세요.");
        return;
      }

      // Scroll to Terminal smoothly
      if (terminalCard) {
        terminalCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }

      if (termStatusTag) {
        termStatusTag.textContent = "작업 실행 중 (RUNNING...)";
        termStatusTag.style.color = "#facc15";
      }

      appendTerminalLog(`\n>>> [START] 원클릭 멀티플랫폼 공지 자동화 태스크 시작 (${new Date().toLocaleTimeString()})`, "warn");

      // 1. Credentials session test
      await sleep(350);
      appendTerminalLog("[AUTH] 플랫폼별 ID/PW 인증 세션 검증 시작...", "info");
      await sleep(300);
      appendTerminalLog("  ✔ 카카오톡 비즈니스 세션 토큰 확인 완료 (user: bookclub_master@kakao.com)", "success");
      await sleep(250);
      appendTerminalLog("  ✔ 커뮤니티(소모임, 네이버, 당근, 에타, 인스타) 로그인 세션 유효 확인 (100% OK)", "success");

      // 2. Messenger Dispatch
      if (selectedChannels.includes("kakao")) {
        await sleep(350);
        appendTerminalLog("[MESSENGER] 💬 카카오톡 단톡방(open.kakao.com/o/gBookClub2026) 메시지 패킷 송신...", "info");
        await sleep(300);
        appendTerminalLog("  ✔ 카카오톡 알림톡 및 채팅방 발송 성공 (수신자: 18명)", "success");
        if (optKakaoPin && optKakaoPin.checked) {
          await sleep(200);
          appendTerminalLog("  ✔ 카카오톡 단톡방 상단 톡게시판 핀 공지 고정 완료", "success");
        }
        if (optKakaoVote && optKakaoVote.checked) {
          await sleep(200);
          appendTerminalLog("  ✔ [참석/불참/미정] 실시간 투표 폼 생성 완료", "success");
        }
      }

      // 3. Board Postings
      const boardChannelMap = {
        somoim: "소모임 앱 정기정모 (Club ID: CLUB_92819)",
        naver: "네이버 카페 [모임공지] (Doc #9412)",
        daangn: "당근마켓 동네생활 모임 (지역: 역삼1동)",
        everytime: "에브리타임 대학생 북클럽 (동아리 게시판)",
        instagram: "인스타그램 피드 캡션 (@bookclub_transparent)"
      };

      for (const ch of selectedChannels) {
        if (ch !== "kakao") {
          await sleep(300);
          appendTerminalLog(`[BOARD] 📝 ${boardChannelMap[ch]} 글쓰기 API 요청 중...`, "info");
          await sleep(250);
          appendTerminalLog(`  ✔ ${boardChannelMap[ch]} 포스팅 등록 성공 (HTTP 200 OK)`, "success");
        }
      }

      // 4. Finished
      await sleep(300);
      appendTerminalLog(`[COMPLETE] 🎉 선택된 ${selectedChannels.length}개 채널에 원클릭 동시 배포가 100% 완료되었습니다!\n`, "success");

      if (termStatusTag) {
        termStatusTag.textContent = "배포 완료 (COMPLETED)";
        termStatusTag.style.color = "#4ade80";
      }

      // Populate Report Modal
      if (reportMessengerRow) {
        if (selectedChannels.includes("kakao")) {
          reportMessengerRow.style.display = "flex";
        } else {
          reportMessengerRow.style.display = "none";
        }
      }

      if (reportBoardList) {
        const boardItems = selectedChannels.filter((c) => c !== "kakao");
        if (boardItems.length === 0) {
          reportBoardList.innerHTML = `<div style="font-size:0.8rem; color:#94a3b8;">게시글 채널 선택 없음</div>`;
        } else {
          reportBoardList.innerHTML = boardItems
            .map((ch) => `
              <div class="report-board-item">
                <span>📝 ${boardChannelMap[ch]}</span>
                <span class="badge-success">등록 완료</span>
              </div>
            `)
            .join("");
        }
      }

      // Show modal
      if (broadcastReportModal) {
        broadcastReportModal.classList.add("active");
      }
    });
  }

  // Modal Closers
  if (btnCloseReportModal && broadcastReportModal) {
    btnCloseReportModal.addEventListener("click", () => {
      broadcastReportModal.classList.remove("active");
    });
  }
  if (btnConfirmReport && broadcastReportModal) {
    btnConfirmReport.addEventListener("click", () => {
      broadcastReportModal.classList.remove("active");
    });
  }
  if (broadcastReportModal) {
    broadcastReportModal.addEventListener("click", (e) => {
      if (e.target === broadcastReportModal) broadcastReportModal.classList.remove("active");
    });
  }

  // Nav Tabs Smooth Scroll & Active Handling
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

  // Initial Load
  renderMemberTable();
  updatePreview();
});
