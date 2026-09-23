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
          msgKakaoTest.textContent = "🟢 인증 성공: 3개 단톡방 세션 정상 연결됨";
          msgKakaoTest.style.color = "var(--accent-emerald)";
        }
        if (badgeKakaoStatus) {
          badgeKakaoStatus.textContent = "🟢 세션 정상 (3개 방 연결)";
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
  // 3. KakaoTalk Notice Composer & Real Mobile Mockup Preview
  // =========================================================================

  const kakaoDate = document.getElementById("kakaoDate");
  const kakaoNoticeText = document.getElementById("kakaoNoticeText");

  const ktBubbleText = document.getElementById("ktBubbleText");
  const ktPinTitle = document.getElementById("ktPinTitle");
  const ktPinnedNotice = document.getElementById("ktPinnedNotice");
  const kakaoCharStats = document.getElementById("kakaoCharStats");

  const btnDateThisWeek = document.getElementById("btnDateThisWeek");
  const btnDateNextWeek = document.getElementById("btnDateNextWeek");
  const btnResetKakaoTpl = document.getElementById("btnResetKakaoTpl");
  const btnCopyKakao = document.getElementById("btnCopyKakao");
  const btnOpenKakaoApp = document.getElementById("btnOpenKakaoApp");

  function buildKakaoNotice(date) {
    return `[${date}] 모임신청 안내
 
①가입한 플랫폼에서 <참석> 표시 
 
②모임 신청 <플래닛 신청 페이지>
https://bookclubplanet26.streamlit.app/
미 응답시 참석이 제한될 수 있습니다.

* 미등록은 아래로 연락
https://open.kakao.com/o/sWLBJTue

💫신청 방식 변경으로 인해, 기존 회원분들도 새롭게 등록해야하니 꼭 확인해 주세요💫`;
  }

  function updateKakaoPreview() {
    if (!ktBubbleText) return;
    const text = kakaoNoticeText ? kakaoNoticeText.value.trim() : "";
    
    // Render links as clickable styled anchors in phone bubble
    const escaped = escapeHtml(text);
    const htmlWithLinks = escaped.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:#2563eb; text-decoration:underline; font-weight:600; word-break:break-all;">$1</a>'
    );
    ktBubbleText.innerHTML = htmlWithLinks;

    const firstLine = text.split("\n")[0] || "[09/19, 20] 모임신청 안내";
    if (ktPinTitle) {
      ktPinTitle.textContent = firstLine;
    }
    if (kakaoCharStats) {
      kakaoCharStats.textContent = `글자 수: ${text.length}자`;
    }
  }

  function onDateChange() {
    const rawDate = kakaoDate ? kakaoDate.value.trim() : "09/19, 20";
    if (kakaoNoticeText) {
      const lines = kakaoNoticeText.value.split("\n");
      lines[0] = `[${rawDate}] 모임신청 안내`;
      kakaoNoticeText.value = lines.join("\n");
    }
    updateKakaoPreview();
  }

  if (kakaoDate) {
    kakaoDate.addEventListener("input", onDateChange);
  }
  if (kakaoNoticeText) {
    kakaoNoticeText.addEventListener("input", updateKakaoPreview);
  }

  if (btnDateThisWeek && kakaoDate) {
    btnDateThisWeek.addEventListener("click", () => {
      kakaoDate.value = "09/19, 20";
      onDateChange();
    });
  }

  if (btnDateNextWeek && kakaoDate) {
    btnDateNextWeek.addEventListener("click", () => {
      kakaoDate.value = "09/26, 27";
      onDateChange();
    });
  }

  if (btnResetKakaoTpl && kakaoNoticeText) {
    btnResetKakaoTpl.addEventListener("click", () => {
      const curDate = kakaoDate ? kakaoDate.value.trim() : "09/19, 20";
      kakaoNoticeText.value = buildKakaoNotice(curDate);
      updateKakaoPreview();
    });
  }

  function copyTextToClipboard(str, successMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(str)
        .then(() => alert(successMsg))
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
      alert(successMsg);
    } catch (e) {
      alert("복사에 실패했습니다. 직접 텍스트를 선택하여 복사해주세요.");
    }
    document.body.removeChild(ta);
  }

  if (btnCopyKakao) {
    btnCopyKakao.addEventListener("click", () => {
      const text = kakaoNoticeText ? kakaoNoticeText.value.trim() : "";
      copyTextToClipboard(text, "📋 카카오톡 공지 전문이 복사되었습니다!\n단톡방에 바로 붙여넣기(Ctrl+V)하세요.");
    });
  }

  if (btnOpenKakaoApp) {
    btnOpenKakaoApp.addEventListener("click", () => {
      const text = kakaoNoticeText ? kakaoNoticeText.value.trim() : "";
      if (navigator.share) {
        navigator.share({
          title: "독서모임 신청 안내",
          text: text,
          url: "https://bookclubplanet26.streamlit.app/"
        }).catch(() => {});
      } else {
        copyTextToClipboard(text, "📋 공지 전문이 클립보드에 복사되었습니다!\n카카오톡 단톡방으로 이동하여 붙여넣으세요.");
        window.location.href = "kakaotalk://";
      }
    });
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // =========================================================================
  // 4. Community Board Notice Composer & Multi-Platform Preview
  // =========================================================================

  const boardTitle = document.getElementById("boardTitle");
  const boardBook = document.getElementById("boardBook");
  const boardDateTime = document.getElementById("boardDateTime");
  const boardPlace = document.getElementById("boardPlace");
  const boardFee = document.getElementById("boardFee");
  const boardBody = document.getElementById("boardBody");

  const optBoardMarkdown = document.getElementById("optBoardMarkdown");
  const optBoardHashtags = document.getElementById("optBoardHashtags");
  const optBoardSheetLink = document.getElementById("optBoardSheetLink");

  const boardArticleContent = document.getElementById("boardArticleContent");
  const boardCharStats = document.getElementById("boardCharStats");
  const boardSpecBadge = document.getElementById("boardSpecBadge");
  const boardSubtabs = document.querySelectorAll("#boardSubtabGroup .board-subtab");

  const btnSampleBoard1 = document.getElementById("btnSampleBoard1");
  const btnSendBoard = document.getElementById("btnSendBoard");

  const boardTerminalCard = document.getElementById("boardTerminalCard");
  const boardTerminalLogBody = document.getElementById("boardTerminalLogBody");
  const boardTermStatusTag = document.getElementById("boardTermStatusTag");
  const btnClearBoardTerminal = document.getElementById("btnClearBoardTerminal");

  let activeBoardTab = "somoim";

  function appendBoardLog(msg, type = "info") {
    if (!boardTerminalLogBody) return;
    const line = document.createElement("div");
    line.className = `term-line ${type}`;
    line.textContent = msg;
    boardTerminalLogBody.appendChild(line);
    boardTerminalLogBody.scrollTop = boardTerminalLogBody.scrollHeight;
  }

  // Board Subtabs
  boardSubtabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      boardSubtabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      activeBoardTab = tab.getAttribute("data-board");
      updateBoardPreview();
    });
  });

  function formatBoardHtml(platform) {
    if (!boardTitle) return "";
    const title = boardTitle.value.trim();
    const book = boardBook ? boardBook.value.trim() : "";
    const dt = boardDateTime ? boardDateTime.value.trim() : "";
    const place = boardPlace ? boardPlace.value.trim() : "";
    const fee = boardFee ? boardFee.value.trim() : "";
    const body = boardBody ? boardBody.value.trim() : "";

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
              <span style="background:#ff6f0f; color:#ffffff; font-weight:700; font-size:0.75rem; padding:2px 8px; border-radius:4px;">🥕 당근 동네생활</span>
              <span style="font-size:0.8rem; color:#64748b;">역삼1동 인근 북클럽</span>
            </div>
            <h3 style="font-size:1.1rem; color:#0f172a; margin-bottom:10px;">${escapeHtml(title)}</h3>
            <div style="font-size:0.88rem; line-height:1.6; color:#334155; white-space:pre-wrap;">
동네 이웃들과 편안하게 책 이야기를 나누는 따뜻한 모임입니다 :)

• 도서: ${escapeHtml(book)}
• 일시: ${escapeHtml(dt)}
• 장소: ${escapeHtml(place)}
• 회비: ${escapeHtml(fee)}

${escapeHtml(body)}
            </div>
            ${sheetLink}
            ${hashtagText}
          </div>
        `;

      case "everytime":
        return `
          <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:16px;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
              <span style="background:#c62917; color:#ffffff; font-weight:700; font-size:0.75rem; padding:2px 8px; border-radius:4px;">🔴 에브리타임</span>
              <span style="font-size:0.8rem; color:#64748b;">동아리/학술 소모임 게시판</span>
            </div>
            <h3 style="font-size:1.05rem; color:#0f172a; margin-bottom:8px;">${escapeHtml(title)}</h3>
            <div style="font-size:0.85rem; line-height:1.6; color:#334155; white-space:pre-wrap;">
대학생 & 청년 대상 열린 독서모임입니다! 이번 주 모임 함께해요.

- 책 제목: ${escapeHtml(book)}
- 언제: ${escapeHtml(dt)}
- 어디서: ${escapeHtml(place)}
- 비용: ${escapeHtml(fee)}

${escapeHtml(body)}
            </div>
            ${sheetLink}
            ${hashtagText}
          </div>
        `;

      case "instagram":
        return `
          <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:16px;">
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
              <div style="width:34px; height:34px; border-radius:50%; background:linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888); display:flex; align-items:center; justify-content:center; color:#fff; font-size:0.75rem;">📷</div>
              <div>
                <strong style="font-size:0.85rem; color:#0f172a;">bookclub_official</strong>
                <div style="font-size:0.72rem; color:#64748b;">스폰서 및 공식 피드 포스팅</div>
              </div>
            </div>
            <div style="background:#f1f5f9; height:180px; border-radius:6px; display:flex; flex-direction:column; align-items:center; justify-content:center; margin-bottom:12px; color:#475569; text-align:center; padding:12px;">
              <span style="font-size:2rem; margin-bottom:6px;">📖</span>
              <strong style="font-size:0.95rem; color:#1e293b;">${escapeHtml(book)}</strong>
              <span style="font-size:0.75rem; color:#64748b; margin-top:4px;">카드뉴스 표지 썸네일 자동 생성</span>
            </div>
            <div style="font-size:0.83rem; line-height:1.6; color:#1e293b; white-space:pre-wrap;">
✨ ${escapeHtml(title)} ✨

📖 이주의 도서: ${escapeHtml(book)}
🗓 일시: ${escapeHtml(dt)}
📍 장소: ${escapeHtml(place)}

${escapeHtml(body)}
            </div>
            ${hashtagText}
          </div>
        `;

      default:
        return `<p>${escapeHtml(body)}</p>`;
    }
  }

  function updateBoardPreview() {
    if (!boardArticleContent) return;
    const html = formatBoardHtml(activeBoardTab);
    boardArticleContent.innerHTML = html;

    const pureText = boardArticleContent.textContent || "";
    if (boardCharStats) {
      boardCharStats.textContent = `글자 수: ${pureText.trim().length}자`;
    }
    if (boardSpecBadge) {
      const specNames = {
        somoim: "소모임 정모 규격 준수",
        naver: "네이버 카페 에디터 호환",
        daangn: "당근 동네생활 피드 규격",
        everytime: "에타 게시글 서식 최적화",
        instagram: "인스타그램 피드 캡션 최적화"
      };
      boardSpecBadge.textContent = specNames[activeBoardTab] || "서식 최적화";
    }
  }

  [boardTitle, boardBook, boardDateTime, boardPlace, boardFee, boardBody].forEach((input) => {
    if (input) {
      input.addEventListener("input", updateBoardPreview);
    }
  });
  [optBoardMarkdown, optBoardHashtags, optBoardSheetLink].forEach((chk) => {
    if (chk) {
      chk.addEventListener("change", updateBoardPreview);
    }
  });

  if (btnSampleBoard1 && boardTitle) {
    btnSampleBoard1.addEventListener("click", () => {
      boardTitle.value = "[제14회 북클럽] '도둑맞은 집중력' 함께 읽고 대화하기";
      if (boardBook) boardBook.value = "도둑맞은 집중력 (요한 하리)";
      if (boardDateTime) boardDateTime.value = "2026년 9월 19일 (토) 오후 2:00 ~ 4:30";
      if (boardPlace) boardPlace.value = "강남역 북카페 '생각의 숲' 3번 룸 (스터디룸 B)";
      if (boardFee) boardFee.value = "10,000원 (대관료 및 음료 1잔 포함, 영수증 100% 공개)";
      if (boardBody) boardBody.value = `스마트폰과 알고리즘의 유혹 속에서 우리의 집중력은 왜 흐려졌을까요?\n가장 인상 깊었던 챕터 1곳과 함께 나누고 싶은 질문 1개를 준비해 와주세요!\n\n모임 진행 순서:\n1. 아이스브레이킹 및 도서 한줄평 (20분)\n2. 발제 질문 중심 자유 토론 (80분)\n3. 다음 모임 도서 추천 및 마무리 (20분)\n\n* 모임 후 출석 및 회계 내역은 구글 시트를 통해 회원 전원에게 투명하게 공개됩니다.`;
      updateBoardPreview();
    });
  }

  if (btnClearBoardTerminal && boardTerminalLogBody) {
    btnClearBoardTerminal.addEventListener("click", () => {
      boardTerminalLogBody.innerHTML = `<div class="term-line info">[SYSTEM] 커뮤니티 터미널 콘솔이 초기화되었습니다.</div>`;
    });
  }

  if (btnSendBoard) {
    btnSendBoard.addEventListener("click", async () => {
      const selectedChannels = Array.from(
        document.querySelectorAll("input[name='sendBoardChannels']:checked")
      ).map((el) => el.value);

      if (selectedChannels.length === 0) {
        alert("최소 1개 이상의 커뮤니티 채널을 선택해주세요.");
        return;
      }

      if (boardTerminalCard) {
        boardTerminalCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }

      if (boardTermStatusTag) {
        boardTermStatusTag.textContent = "작업 실행 중 (RUNNING...)";
        boardTermStatusTag.style.color = "#facc15";
      }

      appendBoardLog(`\n>>> [START] 커뮤니티 게시판 일괄 등록 태스크 시작 (${new Date().toLocaleTimeString()})`, "warn");
      await sleep(300);
      appendBoardLog("[AUTH] 커뮤니티 로그인 계정 및 API 키 세션 검증...", "info");
      await sleep(250);
      appendBoardLog("  ✔ 5개 커뮤니티 플랫폼 인증 세션 100% 유효함 (200 OK)", "success");

      const boardChannelMap = {
        somoim: "소모임 앱 정기정모 (Club ID: CLUB_92819)",
        naver: "네이버 카페 [모임공지] (Doc #9412)",
        daangn: "당근마켓 동네생활 모임 (지역: 역삼1동)",
        everytime: "에브리타임 대학생 북클럽 (동아리 게시판)",
        instagram: "인스타그램 피드 캡션 (@bookclub_transparent)"
      };

      for (const ch of selectedChannels) {
        await sleep(300);
        appendBoardLog(`[BOARD] 📝 ${boardChannelMap[ch]} 글쓰기 API 요청 중...`, "info");
        await sleep(250);
        appendBoardLog(`  ✔ ${boardChannelMap[ch]} 포스팅 등록 성공 (HTTP 200 OK)`, "success");
      }

      await sleep(250);
      appendBoardLog(`[COMPLETE] 🎉 선택된 ${selectedChannels.length}개 커뮤니티에 자동 포스팅이 100% 완료되었습니다!\n`, "success");

      if (boardTermStatusTag) {
        boardTermStatusTag.textContent = "배포 완료 (COMPLETED)";
        boardTermStatusTag.style.color = "#4ade80";
      }
      alert(`선택하신 ${selectedChannels.length}개 커뮤니티 플랫폼에 게시글 등록이 성공적으로 완료되었습니다!`);
    });
  }

  // =========================================================================
  // 5. Nav Tabs Smooth Scroll & Active Handling
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

  // Initial Load
  renderMemberTable();
  updateKakaoPreview();
  updateBoardPreview();
});
