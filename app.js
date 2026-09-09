/**
 * BookLink Interactive Script
 * Target: 독서모임 관리자 / Core Value: 투명한 소통
 */

document.addEventListener("DOMContentLoaded", () => {
  // =========================================================================
  // 1. Google Sheets Style Member DB Implementation
  // =========================================================================

  const initialMembers = [
    { id: 1, name: "이지원", channel: "소모임", attendance: 8, fee: "완료", book: "도둑맞은 집중력", status: "정회원" },
    { id: 2, name: "박준영", channel: "당근", attendance: 3, fee: "완료", book: "도둑맞은 집중력", status: "일반회원" },
    { id: 3, name: "최서연", channel: "인스타", attendance: 12, fee: "완료", book: "물고기는 존재하지 않는다", status: "운영진" },
    { id: 4, name: "정민호", channel: "에타", attendance: 2, fee: "대기", book: "도둑맞은 집중력", status: "신규회원" },
    { id: 5, name: "한가은", channel: "카카오톡", attendance: 6, fee: "완료", book: "원씽 (The ONE Thing)", status: "정회원" },
    { id: 6, name: "윤도현", channel: "네이버", attendance: 4, fee: "대기", book: "도둑맞은 집중력", status: "일반회원" },
  ];

  // 로컬스토리지 또는 초기 데이터
  let members = JSON.parse(localStorage.getItem("booklink_members")) || [...initialMembers];
  let currentFilter = "all";
  let searchQuery = "";

  const tableBody = document.getElementById("memberTableBody");
  const searchInput = document.getElementById("sheetSearchInput");
  const filterPills = document.querySelectorAll("#channelFilterGroup .filter-pill");
  const countAll = document.getElementById("countAll");
  const paidRatioText = document.getElementById("paidRatioText");

  // 테이블 렌더링 함수
  function renderMemberTable() {
    if (!tableBody) return;

    // 필터 및 검색 적용
    const filtered = members.filter((m) => {
      const matchChannel = currentFilter === "all" || m.channel === currentFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        m.name.toLowerCase().includes(q) ||
        m.channel.toLowerCase().includes(q) ||
        m.book.toLowerCase().includes(q) ||
        m.status.toLowerCase().includes(q);
      return matchChannel && matchSearch;
    });

    tableBody.innerHTML = "";

    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 32px; color: var(--text-dim);">
            일치하는 회원 데이터가 없습니다.
          </td>
        </tr>
      `;
    } else {
      filtered.forEach((m, idx) => {
        const tr = document.createElement("tr");

        // 채널 뱃지 클래스
        const channelClassMap = {
          "소모임": "channel-somoim",
          "당근": "channel-daangn",
          "인스타": "channel-instagram",
          "에타": "channel-everytime",
          "카카오톡": "channel-kakao",
          "네이버": "channel-naver"
        };
        const channelClass = channelClassMap[m.channel] || "channel-somoim";
        const feeClass = m.fee === "완료" ? "fee-paid" : "fee-pending";

        tr.innerHTML = `
          <td class="col-index">${idx + 1}</td>
          <td><strong>${escapeHtml(m.name)}</strong></td>
          <td><span class="channel-chip ${channelClass}">${escapeHtml(m.channel)}</span></td>
          <td>${m.attendance}회 출석</td>
          <td>
            <span class="fee-badge ${feeClass}" data-id="${m.id}" title="클릭하여 납부 상태 변경">
              ${m.fee === "완료" ? "✔ 납부 완료" : "⏳ 입금 대기"}
            </span>
          </td>
          <td>📖 ${escapeHtml(m.book)}</td>
          <td><span class="status-badge">${escapeHtml(m.status)}</span></td>
          <td class="col-actions">
            <button type="button" class="btn-delete-row" data-id="${m.id}" title="회원 삭제">✕</button>
          </td>
        `;
        tableBody.appendChild(tr);
      });
    }

    // 메트릭 업데이트
    updateMetrics();
  }

  function updateMetrics() {
    if (countAll) countAll.textContent = members.length;
    if (paidRatioText) {
      if (members.length === 0) {
        paidRatioText.textContent = "0%";
      } else {
        const paidCount = members.filter((m) => m.fee === "완료").length;
        const ratio = Math.round((paidCount / members.length) * 100);
        paidRatioText.textContent = `${ratio}% (${paidCount}/${members.length}명)`;
      }
    }
  }

  // 검색 이벤트
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value;
      renderMemberTable();
    });
  }

  // 필터 탭 클릭
  filterPills.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterPills.forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.getAttribute("data-channel");
      renderMemberTable();
    });
  });

  // 회비 상태 토글 & 삭제 이벤트 위임
  if (tableBody) {
    tableBody.addEventListener("click", (e) => {
      const feeBadge = e.target.closest(".fee-badge");
      if (feeBadge) {
        const id = parseInt(feeBadge.getAttribute("data-id"), 10);
        const target = members.find((m) => m.id === id);
        if (target) {
          target.fee = target.fee === "완료" ? "대기" : "완료";
          saveMembers();
          renderMemberTable();
        }
        return;
      }

      const delBtn = e.target.closest(".btn-delete-row");
      if (delBtn) {
        const id = parseInt(delBtn.getAttribute("data-id"), 10);
        if (confirm("해당 회원을 명단에서 삭제하시겠습니까?")) {
          members = members.filter((m) => m.id !== id);
          saveMembers();
          renderMemberTable();
        }
      }
    });
  }

  // 신규 회원 등록 모달
  const btnAddMember = document.getElementById("btnAddMember");
  const addMemberModal = document.getElementById("addMemberModal");
  const btnCloseAddMember = document.getElementById("btnCloseAddMember");
  const addMemberForm = document.getElementById("addMemberForm");

  if (btnAddMember && addMemberModal) {
    btnAddMember.addEventListener("click", () => {
      addMemberModal.classList.add("active");
    });
  }
  if (btnCloseAddMember && addMemberModal) {
    btnCloseAddMember.addEventListener("click", () => {
      addMemberModal.classList.remove("active");
    });
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
      const channel = document.getElementById("newMemberChannel").value;
      const book = document.getElementById("newMemberBook").value.trim();
      const fee = document.getElementById("newMemberFee").value;

      if (!name) return;

      const newId = members.length > 0 ? Math.max(...members.map((m) => m.id)) + 1 : 1;
      members.push({
        id: newId,
        name,
        channel,
        attendance: 1,
        fee,
        book,
        status: "신규회원"
      });

      saveMembers();
      renderMemberTable();
      addMemberForm.reset();
      addMemberModal.classList.remove("active");
    });
  }

  // CSV 내보내기
  const btnExportCsv = document.getElementById("btnExportCsv");
  if (btnExportCsv) {
    btnExportCsv.addEventListener("click", () => {
      let csv = "번호,이름,유입플랫폼,누적출석,회비납부,지정도서,상태\n";
      members.forEach((m, idx) => {
        csv += `${idx + 1},${m.name},${m.channel},${m.attendance},${m.fee},${m.book},${m.status}\n`;
      });
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "2026_독서모임_회원명단.csv";
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // 데이터 초기화
  const btnResetData = document.getElementById("btnResetData");
  if (btnResetData) {
    btnResetData.addEventListener("click", () => {
      if (confirm("초기 샘플 데이터로 복원하시겠습니까?")) {
        members = [...initialMembers];
        saveMembers();
        renderMemberTable();
      }
    });
  }

  function saveMembers() {
    localStorage.setItem("booklink_members", JSON.stringify(members));
  }

  // =========================================================================
  // 2. Multi-Platform Broadcast Simulator
  // =========================================================================

  const noticeTitle = document.getElementById("noticeTitle");
  const noticeBook = document.getElementById("noticeBook");
  const noticeDateTime = document.getElementById("noticeDateTime");
  const noticePlace = document.getElementById("noticePlace");
  const noticeBody = document.getElementById("noticeBody");
  const previewContainer = document.getElementById("previewContainer");
  const previewCharCount = document.getElementById("previewCharCount");
  const previewTabs = document.querySelectorAll("#previewTabGroup .preview-tab");

  let activePlatform = "kakao";

  function getPlatformPreview(platform) {
    const title = noticeTitle.value.trim();
    const book = noticeBook.value.trim();
    const dt = noticeDateTime.value.trim();
    const place = noticePlace.value.trim();
    const body = noticeBody.value.trim();

    switch (platform) {
      case "kakao":
        return `
<span class="preview-badge-brand" style="background:#fee500; color:#3c1e1e;">💬 카카오톡 알림톡 & 단톡방 포맷</span>
📢 <strong>[독서모임 알림] ${escapeHtml(title)}</strong>

안녕하세요, 회원님! 이번 주 정기 모임 공지드립니다.

📚 <strong>선정 도서</strong>: ${escapeHtml(book)}
🗓 <strong>일시</strong>: ${escapeHtml(dt)}
📍 <strong>장소</strong>: ${escapeHtml(place)}

💬 <strong>발제 및 전달사항</strong>:
${escapeHtml(body)}

* 본 공지는 모든 플랫폼에 투명하고 동일하게 전달됩니다.
문의사항은 오픈채팅 1:1 질문방으로 남겨주세요!`;

      case "somoim":
        return `
<span class="preview-badge-brand" style="background:#fee2e2; color:#b91c1c;">👥 소모임 앱 정기 정모 공지</span>
[정모] <strong>${escapeHtml(title)}</strong>

안녕하세요 소모임 회원 여러분!
함께 깊은 생각과 대화를 나눌 정기 모임을 안내합니다.

• 지정 도서: ${escapeHtml(book)}
• 모임 시간: ${escapeHtml(dt)}
• 모임 장소: ${escapeHtml(place)}

[진행 순서 및 안내]
${escapeHtml(body)}

투명한 모임 운영을 위해 참석 투표(참석/불참)를 금요일 자정까지 완료해 주세요!`;

      case "daangn":
        return `
<span class="preview-badge-brand" style="background:#ffedd5; color:#c2410c;">🥕 당근마켓 우리동네 모임 포맷</span>
🥕 <strong>동네 이웃과 함께하는 따뜻한 독서모임</strong>

이웃님들 안녕하세요! 이번 주말 동네 독서모임 소식 공유해요 :)

책 제목: <strong>${escapeHtml(book)}</strong>
모이는 날: ${escapeHtml(dt)}
만나는 곳: ${escapeHtml(place)}

${escapeHtml(body)}

* 당근 매너온도 36.5도 이상의 이웃이라면 누구나 환영합니다! 부담 없이 챗 주세요.`;

      case "instagram":
        return `
<span class="preview-badge-brand" style="background:#fce7f3; color:#be185d;">📸 인스타그램 피드 & 카드뉴스 캡션</span>
📖 <strong>${escapeHtml(title)}</strong>
-
이번 모임에서 함께 나눌 책은 <strong>${escapeHtml(book)}</strong> 입니다.

🗓 ${escapeHtml(dt)}
📍 ${escapeHtml(place)}

"${escapeHtml(body.split("\n")[0] || "")}"

바쁜 일상 속, 책과 함께 나만의 호흡을 되찾아보세요.
신청 및 문의는 프로필 링크의 구글 시트 신청서를 확인해 주세요!

.
.
#독서모임 #북스타그램 #책추천 #${book.replace(/\s+/g, "")} #독서토론 #커뮤니티 #투명한소통`;

      case "everytime":
        return `
<span class="preview-badge-brand" style="background:#fef2f2; color:#dc2626;">🎓 에브리타임 대학생 북클럽 포맷</span>
[소모임 홍보/공지] <strong>${escapeHtml(title)}</strong>

새로운 시각과 진솔한 대화를 나누고 싶은 학우들을 모십니다!

- 도서: ${escapeHtml(book)}
- 일시: ${escapeHtml(dt)}
- 장소: ${escapeHtml(place)}

${escapeHtml(body)}

참가비는 대관비 실비로 투명하게 공개됩니다. 쪽지 주시면 오픈채팅 링크 드릴게요!`;

      default:
        return title;
    }
  }

  function updatePreview() {
    if (!previewContainer) return;
    const content = getPlatformPreview(activePlatform);
    previewContainer.innerHTML = content;

    // 글자수 카운트
    const plainText = previewContainer.textContent || "";
    if (previewCharCount) {
      previewCharCount.textContent = `글자 수: ${plainText.length}자`;
    }
  }

  // 탭 변경
  previewTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      previewTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      activePlatform = tab.getAttribute("data-target");
      updatePreview();
    });
  });

  // 입력 감지
  [noticeTitle, noticeBook, noticeDateTime, noticePlace, noticeBody].forEach((el) => {
    if (el) {
      el.addEventListener("input", updatePreview);
    }
  });

  // 샘플 불러오기
  const btnLoadSample = document.getElementById("btnLoadSampleNotice");
  if (btnLoadSample) {
    btnLoadSample.addEventListener("click", () => {
      noticeTitle.value = "[제15회 북클럽] '클린 코드' & 투명한 협업 문화";
      noticeBook.value = "클린 코드 (로버트 C. 마틴)";
      noticeDateTime.value = "2026년 9월 26일 (토) 오후 3시";
      noticePlace.value = "신논현 스터디룸 '모두의 공간' Room A";
      noticeBody.value = "읽기 좋은 코드가 왜 더 나은 팀을 만드는지 토론합니다.\n가장 공감되었던 원칙 1가지와 실천 경험을 나눠주세요!\n* 모임 후 구글 시트로 출석 및 모임 기록이 100% 공개됩니다.";
      updatePreview();
    });
  }

  // 멀티플랫폼 동시 전송 시뮬레이션
  const btnBroadcastSubmit = document.getElementById("btnBroadcastSubmit");
  const broadcastModal = document.getElementById("broadcastModal");
  const btnCloseModal = document.getElementById("btnCloseModal");
  const btnModalConfirm = document.getElementById("btnModalConfirm");
  const modalChannelResult = document.getElementById("modalChannelResult");

  if (btnBroadcastSubmit && broadcastModal) {
    btnBroadcastSubmit.addEventListener("click", () => {
      const checkedChannels = Array.from(
        document.querySelectorAll("input[name='broadcastChannel']:checked")
      ).map((el) => el.value);

      if (checkedChannels.length === 0) {
        alert("최소 1개 이상의 전송 대상 플랫폼을 선택해주세요.");
        return;
      }

      // 채널명 한글 매핑
      const nameMap = {
        kakao: "카카오톡 오픈채팅 & 알림톡",
        somoim: "소모임 앱 공지사항",
        daangn: "당근마켓 동네생활 모임",
        instagram: "인스타그램 피드 & 스토리",
        everytime: "에브리타임 동아리 게시판",
        naver: "네이버 카페 & 블로그"
      };

      if (modalChannelResult) {
        modalChannelResult.innerHTML = checkedChannels
          .map(
            (ch) => `
          <div class="channel-result-row">
            <span>📡 ${nameMap[ch] || ch}</span>
            <span style="color: var(--accent-emerald); font-weight:700;">전송 완료 (동기화 100%)</span>
          </div>
        `
          )
          .join("");
      }

      broadcastModal.classList.add("active");
    });
  }

  if (btnCloseModal && broadcastModal) {
    btnCloseModal.addEventListener("click", () => {
      broadcastModal.classList.remove("active");
    });
  }
  if (btnModalConfirm && broadcastModal) {
    btnModalConfirm.addEventListener("click", () => {
      broadcastModal.classList.remove("active");
    });
  }
  if (broadcastModal) {
    broadcastModal.addEventListener("click", (e) => {
      if (e.target === broadcastModal) broadcastModal.classList.remove("active");
    });
  }

  // XSS 방지 유틸
  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // 초기 렌더링
  renderMemberTable();
  updatePreview();
});
