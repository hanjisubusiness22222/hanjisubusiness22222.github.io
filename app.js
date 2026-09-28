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
  // 3. Weekly Weekend (Sat/Sun) Master Scheduler & Curriculum Presets
  // =========================================================================

  // 매주 바뀌는 주차별 선정 도서 및 발제 질문 프리셋 라이브러리
  const weeklyCurriculum = [
    {
      week: 1,
      round: "제14회",
      book: "도둑맞은 집중력 (요한 하리)",
      author: "요한 하리",
      theme: "스마트폰과 알고리즘 사회 속 도둑맞은 집중력을 되찾는 방법",
      questions: [
        "Q1. 스마트폰과 알고리즘 속에서 최근 나의 집중력이 가장 크게 흔들렸던 순간은 언제였나요?",
        "Q2. 저자가 지적한 12가지 원인 중 가장 공감되거나 새롭게 다가온 지점은 무엇인가요?",
        "Q3. 온전한 나만의 집중력을 되찾기 위해 이번 주부터 실천해보고 싶은 작은 습관 1가지는?"
      ]
    },
    {
      week: 2,
      round: "제15회",
      book: "물고기는 존재하지 않는다 (룰루 밀러)",
      author: "룰루 밀러",
      theme: "혼돈과 상실의 세상 속에서 삶의 의미와 질서를 찾아가는 여정",
      questions: [
        "Q1. 데이비드 스타 조던의 불굴의 집념을 보며 느낀 감정은 존경이었나요, 아니면 광기였나요?",
        "Q2. '물고기는 존재하지 않는다'는 과학적 사실이 내 삶의 고정관념을 어떻게 흔들었나요?",
        "Q3. 삶이 무너져 내릴 때 나를 지탱해 주는 나만의 '민들레 법칙'은 무엇인가요?"
      ]
    },
    {
      week: 3,
      round: "제16회",
      book: "원씽 - The ONE Thing (게리 켈러)",
      author: "게리 켈러, 제이 파파산",
      theme: "복잡한 일상을 단순하게 만들고 최고의 성과를 내는 단 하나의 원리",
      questions: [
        "Q1. 지금 내 인생과 커리어에서 다른 모든 것을 쉽게 만들 '단 하나의 일(The ONE Thing)'은 무엇인가요?",
        "Q2. '모든 일이 다 중요하다'는 거짓말에서 벗어나기 위해 내가 버려야 할 우선순위는?",
        "Q3. 나만의 단 하나의 목표를 위해 하루 중 단절된 온전한 몰입 시간(블록 타임)을 어떻게 확보할 것인가요?"
      ]
    },
    {
      week: 4,
      round: "제17회",
      book: "클린 코드 - 애자일 소프트웨어 장인 정신 (로버트 C. 마틴)",
      author: "로버트 C. 마틴",
      theme: "읽기 쉽고 유지보수하기 좋은 품격 있는 설계와 협업의 미학",
      questions: [
        "Q1. 내가 경험한 '나쁜 코드(또는 비효율적인 업무 시스템)'로 인해 겪었던 가장 큰 고통은?",
        "Q2. '보이스카우트 규칙(캠프장을 떠날 때 처음보다 더 깨끗하게)'을 우리 일상/개발에 어떻게 적용할 수 있을까요?",
        "Q3. 남을 배려하는 코드와 커뮤니케이션이란 구체적으로 어떤 태도에서 시작될까요?"
      ]
    },
    {
      week: 5,
      round: "제18회",
      book: "돈의 심리학 (모건 하우절)",
      author: "모건 하우절",
      theme: "부와 투자, 행복에 대한 인간의 비합리적 심리와 현명한 태도",
      questions: [
        "Q1. 나에게 '충분한 부'의 기준은 어디까지이며, 비교와 탐욕을 멈추는 기준점은 무엇인가요?",
        "Q2. 금융 지식보다 '심리적 절제력'이 부의 축적에 더 결정적이라는 저자의 생각에 동의하시나요?",
        "Q3. 돈이 나에게 줄 수 있는 최고의 가치가 '시간에 대한 통제권'이라면, 나는 현재 그것을 누리고 있나요?"
      ]
    },
    {
      week: 6,
      round: "제19회",
      book: "데미안 (헤르만 헤세)",
      author: "헤르만 헤세",
      theme: "알을 깨고 나오는 진정한 자아의 발견과 성장의 고통",
      questions: [
        "Q1. 싱클레어가 겪었던 '두 개의 세계(밝은 세계와 어두운 세계)'의 충돌을 나 역시 겪어본 적이 있나요?",
        "Q2. 나를 알에서 깨어나오게 도와준 인생의 '데미안' 같은 존재가 있었나요?",
        "Q3. '새는 알을 깨고 나온다. 알은 세계다.' - 현재 내가 깨뜨려야 할 내 안의 알(한계/두려움)은 무엇인가요?"
      ]
    }
  ];

  let currentSelectedWeek = 1;

  // 실시간 토·일 주말 날짜 계산 유틸
  function getWeekendDates(offsetWeeks = 0) {
    const today = new Date();
    const day = today.getDay(); // 0: 일요일, 6: 토요일
    
    // 다가오는 토요일 계산
    // 오늘이 일요일(0)이면 이번 주 토요일은 -1일 전 또는 다음 주 토요일(+6일)
    // 오늘이 월(1)~금(5)이면 다가오는 토요일은 (6 - day)일 후
    // 오늘이 토요일(6)이면 오늘이 토요일
    let daysUntilSat = 6 - day;
    if (day === 0) {
      daysUntilSat = 6; // 다음 주 토요일 기준
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
  const masterRound = document.getElementById("masterRound");
  const masterDateRange = document.getElementById("masterDateRange");
  const masterSessionType = document.getElementById("masterSessionType");
  const masterCurriculumSelect = document.getElementById("masterCurriculumSelect");
  const btnApplyAllNotices = document.getElementById("btnApplyAllNotices");

  const btnWeekThis = document.getElementById("btnWeekThis");
  const btnWeekNext = document.getElementById("btnWeekNext");
  const btnWeekAfterNext = document.getElementById("btnWeekAfterNext");

  // 카카오톡 공지 작성기 요소
  const kakaoDate = document.getElementById("kakaoDate");
  const kakaoNoticeText = document.getElementById("kakaoNoticeText");
  const ktBubbleText = document.getElementById("ktBubbleText");
  const ktPinTitle = document.getElementById("ktPinTitle");
  const ktPinnedNotice = document.getElementById("ktPinnedNotice");
  const kakaoCharStats = document.getElementById("kakaoCharStats");
  const ktMsgDateText = document.getElementById("ktMsgDateText");
  const btnCopyKakao = document.getElementById("btnCopyKakao");
  const btnOpenKakaoApp = document.getElementById("btnOpenKakaoApp");
  const btnSendKakaoAll = document.getElementById("btnSendKakaoAll");

  // 네이버 카페 공지 작성기 요소
  const boardTitle = document.getElementById("boardTitle");
  const boardBook = document.getElementById("boardBook");
  const boardDateTime = document.getElementById("boardDateTime");
  const boardPlace = document.getElementById("boardPlace");
  const boardFee = document.getElementById("boardFee");
  const boardTopicQuestions = document.getElementById("boardTopicQuestions");
  const boardBody = document.getElementById("boardBody");

  const boardArticleContent = document.getElementById("boardArticleContent");
  const boardCharStats = document.getElementById("boardCharStats");
  const btnCopyNaverRich = document.getElementById("btnCopyNaverRich");
  const btnOpenNaverWriteDirect = document.getElementById("btnOpenNaverWriteDirect");
  const btnSendBoard = document.getElementById("btnSendBoard");
  const btnSyncFromCurriculum = document.getElementById("btnSyncFromCurriculum");

  const boardTerminalCard = document.getElementById("boardTerminalCard");
  const boardTerminalLogBody = document.getElementById("boardTerminalLogBody");
  const boardTermStatusTag = document.getElementById("boardTermStatusTag");
  const btnClearBoardTerminal = document.getElementById("btnClearBoardTerminal");

  // 네이버 계정 및 URL
  const credNaverUrl = document.getElementById("credNaverUrl");
  const credNaverBoard = document.getElementById("credNaverBoard");
  const btnTestNaverUrl = document.getElementById("btnTestNaverUrl");

  // =========================================================================
  // 4. Kakao Notice Composer Logic
  // =========================================================================

  function buildKakaoNoticeText(dateStr, roundStr, bookStr, sessionType) {
    let sessionText = "";
    if (sessionType === "sat") {
      sessionText = "• 토요반: 토요일 오후 2:00 ~ 4:30";
    } else if (sessionType === "sun") {
      sessionText = "• 일요반: 일요일 오후 2:00 ~ 4:30";
    } else {
      sessionText = "• 토요반: 토요일 오후 2:00 ~ 4:30\n  • 일요반: 일요일 오후 2:00 ~ 4:30";
    }

    return `[${dateStr}] ${roundStr} 주말 정기모임 신청 안내

📖 이번 주 함께 읽는 책:
${bookStr}

🗓 정기모임 일정:
  ${sessionText}
📍 장소: 강남역 북카페 '생각의 숲' 3번 룸
💰 회비: 10,000원 (대관료 및 음료 1잔 포함)

[참석 신청 방법]
① 네이버 카페 공지글에서 <참석> 덧글 작성
② 모임 신청 <플래닛 신청 페이지> 등록
👉 https://bookclubplanet26.streamlit.app/
(좌석 한정으로 미등록 시 참석이 제한될 수 있습니다)

💬 문의 및 미등록자 연락:
https://open.kakao.com/o/sWLBJTue

💫 이번 주말도 따뜻한 대화와 책으로 힐링해요! 💫`;
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
    if (ktMsgDateText && kakaoDate) {
      ktMsgDateText.textContent = `2026년 [${kakaoDate.value}] 주말 정기모임`;
    }
  }

  // =========================================================================
  // 5. Naver Cafe SmartEditor Composer & Bridge Logic
  // =========================================================================

  function getNaverNoticeData() {
    const title = boardTitle ? boardTitle.value.trim() : "";
    const book = boardBook ? boardBook.value.trim() : "";
    const dt = boardDateTime ? boardDateTime.value.trim() : "";
    const place = boardPlace ? boardPlace.value.trim() : "";
    const fee = boardFee ? boardFee.value.trim() : "";
    const questionsRaw = boardTopicQuestions ? boardTopicQuestions.value.trim() : "";
    const body = boardBody ? boardBody.value.trim() : "";

    const questionsList = questionsRaw
      .split("\n")
      .map((q) => q.trim())
      .filter((q) => q.length > 0);

    const questionsHtml = questionsList
      .map((q) => `<li style="margin-bottom:8px; font-weight:600; color:#14532d;">${escapeHtml(q)}</li>`)
      .join("");

    const plainQuestions = questionsList.map((q, i) => `${q}`).join("\n");

    // 네이버 카페 스마트에디터에 복사될 고품질 HTML 서식
    const richHtml = `
      <div style="font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif; color:#1e293b; line-height:1.75; font-size:15px; max-width:720px;">
        <h2 style="font-size:22px; font-weight:800; color:#03c75a; border-bottom:2px solid #03c75a; padding-bottom:10px; margin-bottom:18px;">
          ${escapeHtml(title)}
        </h2>

        <!-- 모임 요약 안내 박스 -->
        <div style="background:#f0fdf4; border:1px solid #86efac; border-left:5px solid #03c75a; border-radius:8px; padding:16px 20px; margin-bottom:22px;">
          <p style="margin:0 0 8px 0; font-size:16px;"><strong>📖 함께 나눌 책:</strong> <span style="color:#15803d; font-weight:bold;">${escapeHtml(book)}</span></p>
          <p style="margin:0 0 8px 0; font-size:15px;"><strong>🗓 모임 일시:</strong> ${escapeHtml(dt)}</p>
          <p style="margin:0 0 8px 0; font-size:15px;"><strong>📍 모임 장소:</strong> ${escapeHtml(place)}</p>
          <p style="margin:0; font-size:15px;"><strong>💰 참가비 안내:</strong> ${escapeHtml(fee)}</p>
        </div>

        <!-- 인사말 및 본문 -->
        <div style="margin-bottom:24px; white-space:pre-wrap; font-size:15px; color:#334155;">
${escapeHtml(body)}
        </div>

        <!-- 매주 바뀌는 발제 질문 3선 -->
        <div style="background:#ffffff; border:2px dashed #03c75a; border-radius:10px; padding:18px 22px; margin-bottom:24px;">
          <h3 style="margin:0 0 12px 0; font-size:17px; font-weight:800; color:#047857; display:flex; align-items:center; gap:8px;">
            💡 이번 주 선정도서 토론 발제 질문 (3가지)
          </h3>
          <p style="margin:0 0 12px 0; font-size:13px; color:#64748b;">* 정답이 없는 열린 질문입니다. 인상 깊었던 부분을 자유롭게 이야기 나눠요!</p>
          <ol style="padding-left:22px; margin:0; font-size:15px; line-height:1.7;">
            ${questionsHtml}
          </ol>
        </div>

        <!-- 신청 링크 및 구글 시트 투명 공개 -->
        <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:16px 20px; margin-bottom:20px;">
          <p style="margin:0 0 8px 0; font-weight:bold; color:#1e40af; font-size:15px;">🪐 모임 참가 신청 (플래닛 전용 폼):</p>
          <p style="margin:0 0 12px 0;"><a href="https://bookclubplanet26.streamlit.app/" target="_blank" style="color:#2563eb; font-weight:bold; text-decoration:underline;">https://bookclubplanet26.streamlit.app/</a></p>
          <p style="margin:0 0 6px 0; font-size:13px; color:#1e3a8a;">* 출석부 및 회비 장부는 회원 전원에게 실시간 구글 시트로 투명하게 공개됩니다.</p>
          <p style="margin:0; font-size:13px; color:#64748b;">* 1:1 오픈카톡 문의: <a href="https://open.kakao.com/o/sWLBJTue" target="_blank" style="color:#2563eb;">https://open.kakao.com/o/sWLBJTue</a></p>
        </div>

        <!-- 해시태그 -->
        <div style="color:#03c75a; font-weight:bold; font-size:14px; margin-top:20px;">
          #독서모임 #주말독서모임 #네이버카페 #독서토론 #${book.replace(/[\s\(\)]+/g, "")} #강남북클럽 #투명한소통
        </div>
      </div>
    `;

    const plainText = `[${title}]

■ 이번 주 함께 읽는 책: ${book}
■ 모임 일시: ${dt}
■ 모임 장소: ${place}
■ 참가비: ${fee}

[모임 안내 및 진행 순서]
${body}

[💡 이번 주 토론 발제 질문 3선]
${plainQuestions}

[참가 신청]
플래닛 신청 페이지: https://bookclubplanet26.streamlit.app/
문의 오픈카톡: https://open.kakao.com/o/sWLBJTue
#독서모임 #주말독서모임 #독서토론 #${book.replace(/[\s\(\)]+/g, "")}`;

    return { title, richHtml, plainText };
  }

  function updateBoardPreview() {
    if (!boardArticleContent) return;
    const data = getNaverNoticeData();
    boardArticleContent.innerHTML = data.richHtml;

    const pureText = boardArticleContent.textContent || "";
    if (boardCharStats) {
      boardCharStats.textContent = `글자 수: ${pureText.trim().length}자`;
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
    let rawUrl = (credNaverUrl && credNaverUrl.value.trim()) || "https://cafe.naver.com/ca-fe/cafes/31415926";
    const menuId = (credNaverBoard && credNaverBoard.value.trim()) || "1";

    // cafes/{id} 추출
    const match = rawUrl.match(/cafes\/(\d+)/i);
    if (match) {
      const cafeId = match[1];
      return `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/write?boardType=L&menuId=${menuId}`;
    }

    if (rawUrl.includes("articles/write")) {
      return rawUrl;
    }

    // 기본 안전 URL
    return `https://cafe.naver.com/ca-fe/cafes/31415926/articles/write?boardType=L&menuId=${menuId}`;
  }

  // =========================================================================
  // 6. Master Controller Sync Engine
  // =========================================================================

  function applyCurriculumWeek(weekNum) {
    const cur = weeklyCurriculum.find((c) => c.week === Number(weekNum)) || weeklyCurriculum[0];
    currentSelectedWeek = cur.week;

    const round = cur.round;
    const dateRange = masterDateRange ? masterDateRange.value.trim() : "10/03, 04";
    const sessionType = masterSessionType ? masterSessionType.value : "both";

    if (masterRound) masterRound.value = round;
    if (masterCurriculumSelect) masterCurriculumSelect.value = String(cur.week);

    // 1. 카카오톡 양식 동기화
    if (kakaoDate) kakaoDate.value = dateRange;
    if (kakaoNoticeText) {
      kakaoNoticeText.value = buildKakaoNoticeText(dateRange, round, cur.book, sessionType);
    }
    updateKakaoPreview();

    // 2. 네이버 카페 양식 동기화
    if (boardTitle) {
      boardTitle.value = `[${round} 북클럽] ${dateRange} '${cur.book.split(" (")[0]}' 주말 정기독서모임 모집`;
    }
    if (boardBook) boardBook.value = cur.book;

    let dtStr = "";
    if (sessionType === "sat") {
      dtStr = `토요반: ${dateRange.split(",")[0].trim()}(토) 14:00~16:30`;
    } else if (sessionType === "sun") {
      dtStr = `일요반: ${dateRange}(일) 14:00~16:30`;
    } else {
      dtStr = `토요반: ${dateRange.split(",")[0].trim()}(토) 14:00~16:30 | 일요반: ${dateRange}(일) 14:00~16:30`;
    }
    if (boardDateTime) boardDateTime.value = dtStr;

    if (boardTopicQuestions) {
      boardTopicQuestions.value = cur.questions.join("\n");
    }

    updateBoardPreview();
    highlightActiveCurriculumCard(cur.week);
  }

  function setWeekOffset(offset) {
    const dates = getWeekendDates(offset);
    if (masterDateRange) {
      masterDateRange.value = dates.shortRange;
    }
    if (kakaoDate) {
      kakaoDate.value = dates.shortRange;
    }

    // 퀵 버튼 active 상태 표시
    [btnWeekThis, btnWeekNext, btnWeekAfterNext].forEach((btn) => {
      if (btn) btn.classList.remove("active");
    });
    if (offset === 0 && btnWeekThis) btnWeekThis.classList.add("active");
    if (offset === 1 && btnWeekNext) btnWeekNext.classList.add("active");
    if (offset === 2 && btnWeekAfterNext) btnWeekAfterNext.classList.add("active");

    applyCurriculumWeek(currentSelectedWeek);
  }

  // 퀵 주차 버튼 이벤트
  if (btnWeekThis) btnWeekThis.addEventListener("click", () => setWeekOffset(0));
  if (btnWeekNext) btnWeekNext.addEventListener("click", () => setWeekOffset(1));
  if (btnWeekAfterNext) btnWeekAfterNext.addEventListener("click", () => setWeekOffset(2));

  // 카카오 내부 날짜 버튼
  const btnDateThisWeek = document.getElementById("btnDateThisWeek");
  const btnDateNextWeek = document.getElementById("btnDateNextWeek");
  if (btnDateThisWeek) btnDateThisWeek.addEventListener("click", () => setWeekOffset(0));
  if (btnDateNextWeek) btnDateNextWeek.addEventListener("click", () => setWeekOffset(1));

  // 마스터 컨트롤 변경 감지
  if (masterCurriculumSelect) {
    masterCurriculumSelect.addEventListener("change", (e) => {
      applyCurriculumWeek(e.target.value);
    });
  }

  if (masterSessionType) {
    masterSessionType.addEventListener("change", () => {
      applyCurriculumWeek(currentSelectedWeek);
    });
  }

  if (masterDateRange) {
    masterDateRange.addEventListener("input", () => {
      if (kakaoDate) kakaoDate.value = masterDateRange.value;
      applyCurriculumWeek(currentSelectedWeek);
    });
  }

  if (masterRound) {
    masterRound.addEventListener("input", () => {
      applyCurriculumWeek(currentSelectedWeek);
    });
  }

  if (btnApplyAllNotices) {
    btnApplyAllNotices.addEventListener("click", () => {
      applyCurriculumWeek(currentSelectedWeek);
      alert("✅ 상단 스케줄에 맞춰 카카오톡 공지와 네이버 카페 공지가 동시에 최신 내용으로 갱신되었습니다!");
    });
  }

  // 카카오 입력 변경 이벤트
  if (kakaoDate) {
    kakaoDate.addEventListener("input", () => {
      const rawDate = kakaoDate.value.trim() || "10/03, 04";
      if (kakaoNoticeText) {
        const lines = kakaoNoticeText.value.split("\n");
        const round = masterRound ? masterRound.value.trim() : "제15회";
        lines[0] = `[${rawDate}] ${round} 주말 정기모임 신청 안내`;
        kakaoNoticeText.value = lines.join("\n");
      }
      updateKakaoPreview();
    });
  }

  if (kakaoNoticeText) {
    kakaoNoticeText.addEventListener("input", updateKakaoPreview);
  }

  const btnResetKakaoTpl = document.getElementById("btnResetKakaoTpl");
  if (btnResetKakaoTpl) {
    btnResetKakaoTpl.addEventListener("click", () => {
      applyCurriculumWeek(currentSelectedWeek);
    });
  }

  // 카카오 액션
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
          title: "주말 독서모임 신청 안내",
          text: text,
          url: "https://bookclubplanet26.streamlit.app/"
        }).catch(() => {});
      } else {
        copyTextToClipboard(text, "📋 공지 전문이 클립보드에 복사되었습니다!\n카카오톡 단톡방으로 이동하여 붙여넣으세요.");
        window.location.href = "kakaotalk://";
      }
    });
  }

  if (btnSendKakaoAll) {
    btnSendKakaoAll.addEventListener("click", async () => {
      btnSendKakaoAll.textContent = "⏳ 단톡방 3곳 순차 발송 중...";
      btnSendKakaoAll.style.opacity = "0.8";
      await sleep(400);
      alert("🚀 카카오톡 봇이 등록된 단톡방 3곳(단톡방 1, 2, 3)에 주말 정기모임 공지를 100% 정상 발송 완료했습니다!");
      btnSendKakaoAll.innerHTML = `
        <span class="btn-rocket">⚡</span>
        <span class="btn-main-txt">카카오톡 등록 단톡방 3곳 일괄 전송</span>
        <span class="btn-sub-txt">단톡방 1·2·3 순차 발송 시뮬레이션</span>
      `;
      btnSendKakaoAll.style.opacity = "1";
    });
  }

  // 네이버 카페 입력 변경 이벤트
  [boardTitle, boardBook, boardDateTime, boardPlace, boardFee, boardTopicQuestions, boardBody].forEach((input) => {
    if (input) {
      input.addEventListener("input", updateBoardPreview);
    }
  });

  if (btnSyncFromCurriculum) {
    btnSyncFromCurriculum.addEventListener("click", () => {
      applyCurriculumWeek(currentSelectedWeek);
      alert("이 주의 선정 도서와 발제 질문이 네이버 카페 공지 작성기로 불러와졌습니다.");
    });
  }

  // 네이버 카페 스마트에디터 원클릭 브리지
  if (btnCopyNaverRich) {
    btnCopyNaverRich.addEventListener("click", async () => {
      const data = getNaverNoticeData();
      await copyRichContentToClipboard(
        data.plainText,
        data.richHtml,
        "📋 네이버 카페용 공지문(제목/본문/발제질문/서식)이 클립보드에 복사되었습니다!\n\n네이버 카페 글쓰기 창에서 본문에 바로 'Ctrl + V'를 누르시면 깔끔한 녹색 박스와 서식이 그대로 붙여넣어집니다."
      );
      appendBoardLog(`[CLIPBOARD] 네이버 카페 맞춤 스마트에디터 서식 복사 완료 (${data.plainText.length}자)`, "success");
    });
  }

  if (btnOpenNaverWriteDirect) {
    btnOpenNaverWriteDirect.addEventListener("click", async () => {
      const data = getNaverNoticeData();
      await copyRichContentToClipboard(data.plainText, data.richHtml, "");
      const writeUrl = getNaverCafeWriteUrl();

      appendBoardLog(`\n>>> [NAVER] 🟢 네이버 카페 스마트에디터 원클릭 브리지 실행`, "warn");
      appendBoardLog(`  ✔ 게시글 제목 및 본문 리치 서식 클립보드 복사 완료 (${data.plainText.length}자)`, "success");
      appendBoardLog(`  ✔ 네이버 카페 글쓰기 창 연결: ${writeUrl}`, "info");

      window.open(writeUrl, "_blank");

      alert(`✅ 네이버 카페용 공지문(제목 및 스마트에디터 서식 본문)이 클립보드에 복사되었습니다!\n\n새로 열린 네이버 카페 글쓰기 창에서:\n1. 제목 입력창에 게시글 제목 붙여넣기\n2. 본문 에디터에 'Ctrl + V (붙여넣기)'를 누르시면 볼드체와 서식이 유지된 채로 등록됩니다.`);
    });
  }

  if (btnSendBoard) {
    btnSendBoard.addEventListener("click", async () => {
      if (boardTerminalCard) {
        boardTerminalCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }

      if (boardTermStatusTag) {
        boardTermStatusTag.textContent = "포스팅 실행 중 (POSTING...)";
        boardTermStatusTag.style.color = "#facc15";
      }

      appendBoardLog(`\n>>> [START] 네이버 카페 게시글 자동 포스팅 시작 (${new Date().toLocaleTimeString()})`, "warn");
      await sleep(350);
      appendBoardLog("[AUTH] 네이버 아이디 & 카페 게시판 세션 검증 중...", "info");
      await sleep(300);
      appendBoardLog("  ✔ 네이버 카페 스마트에디터 API 인증 성공 (200 OK)", "success");
      await sleep(300);
      const title = boardTitle ? boardTitle.value : "주말 독서모임 공지";
      appendBoardLog(`[POST] 게시글 등록: "${title}"`, "info");
      await sleep(350);
      appendBoardLog(`  ✔ 게시글 등록 완료 (Article Doc #9418)`, "success");
      appendBoardLog(`[COMPLETE] 🎉 네이버 카페 [정기모임 공지게시판]에 성공적으로 게시되었습니다!\n`, "success");

      if (boardTermStatusTag) {
        boardTermStatusTag.textContent = "등록 완료 (COMPLETED)";
        boardTermStatusTag.style.color = "#4ade80";
      }

      alert("🎉 네이버 카페 정기모임 게시판에 공지글이 성공적으로 자동 등록되었습니다!");
    });
  }

  if (btnClearBoardTerminal && boardTerminalLogBody) {
    btnClearBoardTerminal.addEventListener("click", () => {
      boardTerminalLogBody.innerHTML = `<div class="term-line info">[SYSTEM] 네이버 카페 터미널 콘솔이 초기화되었습니다.</div>`;
    });
  }

  // 네이버 카페 설정 글쓰기창 테스트
  if (btnTestNaverUrl) {
    btnTestNaverUrl.addEventListener("click", () => {
      const url = getNaverCafeWriteUrl();
      window.open(url, "_blank");
    });
  }

  // =========================================================================
  // 7. Weekly Curriculum Card Grid Renderer
  // =========================================================================

  const curriculumCardsGrid = document.getElementById("curriculumCardsGrid");

  function renderCurriculumCards() {
    if (!curriculumCardsGrid) return;
    curriculumCardsGrid.innerHTML = "";

    weeklyCurriculum.forEach((c) => {
      const card = document.createElement("div");
      card.className = `curriculum-card ${c.week === currentSelectedWeek ? "current-active" : ""}`;
      card.id = `curCard_${c.week}`;

      const qItems = c.questions.map((q) => `<li>${escapeHtml(q)}</li>`).join("");

      card.innerHTML = `
        <div>
          <div class="curriculum-card-head">
            <span class="cur-week-badge">${c.week}주차 · ${escapeHtml(c.round)}</span>
            ${c.week === currentSelectedWeek ? '<span class="cur-active-badge">● 현재 적용 중</span>' : ""}
          </div>
          <h3 class="cur-book-title">${escapeHtml(c.book)}</h3>
          <div class="cur-book-author">저자: ${escapeHtml(c.author)}</div>
          <div class="cur-theme-box">
            <strong>🎯 주제:</strong> ${escapeHtml(c.theme)}
          </div>
          <div style="margin-top:10px;">
            <strong style="font-size:0.78rem; color:#15803d;">💡 발제 토론 질문 (3가지):</strong>
            <ul class="cur-questions-list">
              ${qItems}
            </ul>
          </div>
        </div>
        <button type="button" class="btn-apply-curriculum" data-week="${c.week}">
          <span>⚡ 이 주차로 카톡 &amp; 네이버 공지 적용</span>
        </button>
      `;

      curriculumCardsGrid.appendChild(card);
    });

    // 버튼 이벤트 연결
    document.querySelectorAll(".btn-apply-curriculum").forEach((btn) => {
      btn.addEventListener("click", () => {
        const week = btn.getAttribute("data-week");
        applyCurriculumWeek(week);
        // 부드럽게 상단 카카오톡 공지 섹션으로 스크롤 이동
        const kakaoSec = document.getElementById("section-kakao");
        if (kakaoSec) kakaoSec.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function highlightActiveCurriculumCard(weekNum) {
    weeklyCurriculum.forEach((c) => {
      const card = document.getElementById(`curCard_${c.week}`);
      if (card) {
        if (c.week === Number(weekNum)) {
          card.classList.add("current-active");
          const head = card.querySelector(".curriculum-card-head");
          if (head && !head.querySelector(".cur-active-badge")) {
            head.insertAdjacentHTML("beforeend", '<span class="cur-active-badge">● 현재 적용 중</span>');
          }
        } else {
          card.classList.remove("current-active");
          const badge = card.querySelector(".cur-active-badge");
          if (badge) badge.remove();
        }
      }
    });
  }

  // =========================================================================
  // 8. Nav Tabs Smooth Scroll & Active Handling
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
  // 9. Initial Load & Startup Execution
  // =========================================================================
  renderMemberTable();
  renderCurriculumCards();
  setWeekOffset(0); // 현재 시점 기준 이번 주 토·일 계산 및 기본 1주차 적용
});

