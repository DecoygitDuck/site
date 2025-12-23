// NoteCenter OS Mini Demo — A playful sticky note experience
// Core features: Create notes, categorize, pin, filter
// Limited: Max 5 notes, no persistence, no terminal

export function mountNcosMini(container) {
  // === STYLES ===
  const styles = document.createElement("style");
  styles.textContent = `
    .ncos-mini {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      background: linear-gradient(135deg, #fef8f0 0%, #fff5eb 100%);
      font-family: 'Segoe UI', system-ui, sans-serif;
      overflow: hidden;
      color: #2c2c2c;
    }
    .ncos-mini * { box-sizing: border-box; margin: 0; padding: 0; }

    /* Header */
    .ncos-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: #fff;
      border-bottom: 2px solid #2c2c2c;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      flex-shrink: 0;
    }
    .ncos-logo {
      font-weight: 700;
      font-size: 14px;
      color: #ff6b9d;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .ncos-logo-icon {
      font-size: 18px;
      animation: ncos-bounce 2s ease-in-out infinite;
    }
    @keyframes ncos-bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-3px); }
    }
    .ncos-add-btn {
      background: #ff6b9d;
      color: white;
      border: 2px solid #2c2c2c;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 2px 2px 0 #2c2c2c;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .ncos-add-btn:hover {
      transform: translate(-1px, -1px);
      box-shadow: 3px 3px 0 #2c2c2c;
    }
    .ncos-add-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
      box-shadow: 2px 2px 0 #2c2c2c;
    }

    /* Filter bar */
    .ncos-filters {
      display: flex;
      gap: 6px;
      padding: 10px 16px;
      background: #fff;
      border-bottom: 1px solid rgba(0,0,0,0.08);
      flex-shrink: 0;
      flex-wrap: wrap;
    }
    .ncos-filter-btn {
      font-size: 11px;
      padding: 5px 10px;
      border: 1.5px solid #2c2c2c;
      border-radius: 12px;
      background: #fff;
      cursor: pointer;
      transition: all 0.15s ease;
      font-weight: 500;
    }
    .ncos-filter-btn:hover {
      transform: scale(1.02);
    }
    .ncos-filter-btn.active {
      background: #2c2c2c;
      color: #fff;
    }

    /* Notes grid */
    .ncos-grid {
      flex: 1;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 12px;
      padding: 16px;
      overflow-y: auto;
      align-content: start;
    }

    /* Sticky note */
    .ncos-note {
      background: #fff59d;
      border-radius: 3px;
      padding: 12px;
      min-height: 120px;
      box-shadow: 2px 2px 6px rgba(0,0,0,0.12);
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      position: relative;
      animation: ncos-note-appear 0.3s ease-out;
    }
    @keyframes ncos-note-appear {
      from { opacity: 0; transform: scale(0.9) rotate(-3deg); }
      to { opacity: 1; transform: scale(1) rotate(0); }
    }
    .ncos-note:nth-child(odd) { transform: rotate(0.8deg); }
    .ncos-note:nth-child(even) { transform: rotate(-0.8deg); }
    .ncos-note:hover {
      transform: rotate(0) scale(1.03);
      box-shadow: 4px 4px 12px rgba(0,0,0,0.18);
      z-index: 10;
    }
    .ncos-note.cat-general { background: #fff59d; }
    .ncos-note.cat-work { background: #bbdefb; }
    .ncos-note.cat-personal { background: #f8bbd0; }
    .ncos-note.cat-ideas { background: #c8e6c9; }

    .ncos-note-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 6px;
    }
    .ncos-note-title {
      font-weight: 600;
      font-size: 12px;
      color: #2c2c2c;
      flex: 1;
      word-break: break-word;
      line-height: 1.3;
    }
    .ncos-note-actions {
      display: flex;
      gap: 2px;
      flex-shrink: 0;
    }
    .ncos-note-btn {
      background: transparent;
      border: none;
      font-size: 12px;
      cursor: pointer;
      padding: 2px;
      opacity: 0.6;
      transition: opacity 0.15s, transform 0.15s;
    }
    .ncos-note-btn:hover {
      opacity: 1;
      transform: scale(1.15);
    }
    .ncos-note-body {
      flex: 1;
      font-size: 11px;
      color: #444;
      line-height: 1.4;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 4;
      -webkit-box-orient: vertical;
    }
    .ncos-note-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
      font-size: 9px;
      color: #666;
    }
    .ncos-note-cat {
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }

    /* Empty state */
    .ncos-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px;
      color: #888;
      text-align: center;
      grid-column: 1 / -1;
    }
    .ncos-empty-icon {
      font-size: 36px;
      margin-bottom: 8px;
      animation: ncos-float 3s ease-in-out infinite;
    }
    @keyframes ncos-float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }

    /* Modal */
    .ncos-modal-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      animation: ncos-fade-in 0.2s ease;
    }
    @keyframes ncos-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .ncos-modal {
      background: #fff;
      border-radius: 12px;
      width: 90%;
      max-width: 280px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      animation: ncos-modal-in 0.25s ease;
      overflow: hidden;
    }
    @keyframes ncos-modal-in {
      from { transform: scale(0.9) translateY(-10px); opacity: 0; }
      to { transform: scale(1) translateY(0); opacity: 1; }
    }
    .ncos-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: linear-gradient(135deg, #ff6b9d, #ff8fb3);
      color: white;
    }
    .ncos-modal-title {
      font-weight: 700;
      font-size: 14px;
    }
    .ncos-modal-close {
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .ncos-modal-close:hover {
      background: rgba(255,255,255,0.3);
    }
    .ncos-modal-body {
      padding: 16px;
    }
    .ncos-form-group {
      margin-bottom: 12px;
    }
    .ncos-form-label {
      display: block;
      font-size: 11px;
      font-weight: 600;
      margin-bottom: 4px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .ncos-form-input,
    .ncos-form-textarea,
    .ncos-form-select {
      width: 100%;
      padding: 8px 10px;
      border: 2px solid #e0e0e0;
      border-radius: 6px;
      font-size: 13px;
      font-family: inherit;
      transition: border-color 0.15s;
    }
    .ncos-form-input:focus,
    .ncos-form-textarea:focus,
    .ncos-form-select:focus {
      outline: none;
      border-color: #ff6b9d;
    }
    .ncos-form-textarea {
      resize: none;
      height: 80px;
    }
    .ncos-modal-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 16px;
    }
    .ncos-btn {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    .ncos-btn-secondary {
      background: #f0f0f0;
      border: 1px solid #ddd;
      color: #666;
    }
    .ncos-btn-secondary:hover {
      background: #e8e8e8;
    }
    .ncos-btn-primary {
      background: #ff6b9d;
      border: none;
      color: white;
    }
    .ncos-btn-primary:hover {
      background: #ff5588;
    }
    .ncos-btn-danger {
      background: #ef4444;
      border: none;
      color: white;
    }
    .ncos-btn-danger:hover {
      background: #dc2626;
    }

    /* Demo limit notice */
    .ncos-limit-notice {
      padding: 8px 16px;
      background: linear-gradient(90deg, #fef3c7, #fde68a);
      border-top: 1px solid rgba(0,0,0,0.1);
      font-size: 10px;
      color: #92400e;
      text-align: center;
      flex-shrink: 0;
    }

    /* HUD */
    .ncos-hud {
      position: absolute;
      bottom: 40px;
      right: 12px;
      font-size: 10px;
      color: rgba(0,0,0,0.3);
      text-align: right;
    }
  `;
  container.appendChild(styles);

  // === STATE ===
  const MAX_NOTES = 5;
  let notes = [
    { id: "demo1", title: "Welcome to NoteCenter!", body: "Click the + button to create your first note. Try different categories!", category: "general", pinned: true, createdAt: Date.now() - 50000 },
    { id: "demo2", title: "Meeting Notes", body: "Discuss project timeline, assign tasks, review budget proposal.", category: "work", pinned: false, createdAt: Date.now() - 40000 },
    { id: "demo3", title: "Gift Ideas", body: "Book for mom, headphones for dad, art supplies for sister.", category: "personal", pinned: false, createdAt: Date.now() - 30000 },
    { id: "demo4", title: "App Feature Idea", body: "Add voice notes feature with transcription support.", category: "ideas", pinned: false, createdAt: Date.now() - 20000 }
  ];
  let currentFilter = "all";
  let editingNoteId = null;

  // === MAIN CONTAINER ===
  const root = document.createElement("div");
  root.className = "ncos-mini";
  root.innerHTML = `
    <div class="ncos-header">
      <div class="ncos-logo">
        <span class="ncos-logo-icon">📝</span>
        <span>NoteCenter · mini</span>
      </div>
      <button class="ncos-add-btn" id="ncosAddBtn">
        <span>+ New</span>
      </button>
    </div>
    <div class="ncos-filters" id="ncosFilters">
      <button class="ncos-filter-btn active" data-filter="all">All</button>
      <button class="ncos-filter-btn" data-filter="general">General</button>
      <button class="ncos-filter-btn" data-filter="work">Work</button>
      <button class="ncos-filter-btn" data-filter="personal">Personal</button>
      <button class="ncos-filter-btn" data-filter="ideas">Ideas</button>
    </div>
    <div class="ncos-grid" id="ncosGrid"></div>
    <div class="ncos-limit-notice">
      Demo: ${notes.length}/${MAX_NOTES} notes · Full version has unlimited notes & more features!
    </div>
    <div class="ncos-hud">Arrow keys: navigate · Enter: edit</div>
  `;
  container.appendChild(root);

  const grid = root.querySelector("#ncosGrid");
  const addBtn = root.querySelector("#ncosAddBtn");
  const filtersContainer = root.querySelector("#ncosFilters");
  const limitNotice = root.querySelector(".ncos-limit-notice");

  // === HELPERS ===
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function formatDate(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString();
  }

  function getFilteredNotes() {
    let filtered = currentFilter === "all"
      ? notes
      : notes.filter(n => n.category === currentFilter);
    // Sort: pinned first, then by date
    return filtered.sort((a, b) => {
      if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
      return b.createdAt - a.createdAt;
    });
  }

  function updateLimitNotice() {
    limitNotice.textContent = `Demo: ${notes.length}/${MAX_NOTES} notes · Full version has unlimited notes & more features!`;
    addBtn.disabled = notes.length >= MAX_NOTES;
  }

  // === RENDER ===
  function render() {
    const filtered = getFilteredNotes();

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="ncos-empty">
          <div class="ncos-empty-icon">${currentFilter === "all" ? "📝" : "🔍"}</div>
          <p>${currentFilter === "all" ? "No notes yet! Create your first one." : "No notes in this category."}</p>
        </div>
      `;
    } else {
      grid.innerHTML = filtered.map(note => `
        <div class="ncos-note cat-${note.category}" data-id="${note.id}" tabindex="0">
          <div class="ncos-note-header">
            <div class="ncos-note-title">${note.pinned ? "⭐ " : ""}${escapeHtml(note.title)}</div>
            <div class="ncos-note-actions">
              <button class="ncos-note-btn pin-btn" data-id="${note.id}" title="${note.pinned ? "Unpin" : "Pin"}">${note.pinned ? "⭐" : "☆"}</button>
              <button class="ncos-note-btn delete-btn" data-id="${note.id}" title="Delete">🗑️</button>
            </div>
          </div>
          <div class="ncos-note-body">${escapeHtml(note.body)}</div>
          <div class="ncos-note-footer">
            <span class="ncos-note-cat">${note.category}</span>
            <span>${formatDate(note.createdAt)}</span>
          </div>
        </div>
      `).join("");
    }

    updateLimitNotice();
  }

  // === MODAL ===
  function showModal(note = null) {
    editingNoteId = note ? note.id : null;
    const isEdit = !!note;

    const overlay = document.createElement("div");
    overlay.className = "ncos-modal-overlay";
    overlay.innerHTML = `
      <div class="ncos-modal">
        <div class="ncos-modal-header">
          <div class="ncos-modal-title">${isEdit ? "Edit Note" : "New Note"}</div>
          <button class="ncos-modal-close" id="ncosModalClose">×</button>
        </div>
        <div class="ncos-modal-body">
          <div class="ncos-form-group">
            <label class="ncos-form-label">Title</label>
            <input type="text" class="ncos-form-input" id="ncosNoteTitle" maxlength="40" value="${isEdit ? escapeHtml(note.title) : ""}" placeholder="Note title...">
          </div>
          <div class="ncos-form-group">
            <label class="ncos-form-label">Note</label>
            <textarea class="ncos-form-textarea" id="ncosNoteBody" placeholder="Write your note...">${isEdit ? escapeHtml(note.body) : ""}</textarea>
          </div>
          <div class="ncos-form-group">
            <label class="ncos-form-label">Category</label>
            <select class="ncos-form-select" id="ncosNoteCategory">
              <option value="general" ${(!isEdit || note.category === "general") ? "selected" : ""}>General</option>
              <option value="work" ${note?.category === "work" ? "selected" : ""}>Work</option>
              <option value="personal" ${note?.category === "personal" ? "selected" : ""}>Personal</option>
              <option value="ideas" ${note?.category === "ideas" ? "selected" : ""}>Ideas</option>
            </select>
          </div>
          <div class="ncos-modal-actions">
            <button class="ncos-btn ncos-btn-secondary" id="ncosCancelBtn">Cancel</button>
            <button class="ncos-btn ncos-btn-primary" id="ncosSaveBtn">Save</button>
          </div>
        </div>
      </div>
    `;
    root.appendChild(overlay);

    const titleInput = overlay.querySelector("#ncosNoteTitle");
    const bodyInput = overlay.querySelector("#ncosNoteBody");
    const categorySelect = overlay.querySelector("#ncosNoteCategory");
    const closeBtn = overlay.querySelector("#ncosModalClose");
    const cancelBtn = overlay.querySelector("#ncosCancelBtn");
    const saveBtn = overlay.querySelector("#ncosSaveBtn");

    function closeModal() {
      overlay.remove();
      editingNoteId = null;
    }

    function saveNote() {
      const title = titleInput.value.trim();
      const body = bodyInput.value.trim();
      const category = categorySelect.value;

      if (!title || !body) {
        alert("Please fill in both title and note.");
        return;
      }

      if (editingNoteId) {
        const note = notes.find(n => n.id === editingNoteId);
        if (note) {
          note.title = title;
          note.body = body;
          note.category = category;
        }
      } else {
        notes.unshift({
          id: generateId(),
          title,
          body,
          category,
          pinned: false,
          createdAt: Date.now()
        });
      }

      closeModal();
      render();
    }

    closeBtn.addEventListener("click", closeModal);
    cancelBtn.addEventListener("click", closeModal);
    saveBtn.addEventListener("click", saveNote);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });

    // Enter to save, Escape to close
    overlay.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
      if (e.key === "Enter" && e.ctrlKey) saveNote();
    });

    setTimeout(() => titleInput.focus(), 50);
  }

  // === EVENT HANDLERS ===
  addBtn.addEventListener("click", () => {
    if (notes.length < MAX_NOTES) {
      showModal();
    }
  });

  filtersContainer.addEventListener("click", (e) => {
    const btn = e.target.closest(".ncos-filter-btn");
    if (!btn) return;

    filtersContainer.querySelectorAll(".ncos-filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    render();
  });

  grid.addEventListener("click", (e) => {
    const pinBtn = e.target.closest(".pin-btn");
    const deleteBtn = e.target.closest(".delete-btn");
    const noteCard = e.target.closest(".ncos-note");

    if (pinBtn) {
      e.stopPropagation();
      const note = notes.find(n => n.id === pinBtn.dataset.id);
      if (note) {
        note.pinned = !note.pinned;
        render();
      }
      return;
    }

    if (deleteBtn) {
      e.stopPropagation();
      if (confirm("Delete this note?")) {
        notes = notes.filter(n => n.id !== deleteBtn.dataset.id);
        render();
      }
      return;
    }

    if (noteCard) {
      const note = notes.find(n => n.id === noteCard.dataset.id);
      if (note) showModal(note);
    }
  });

  // Keyboard navigation
  grid.addEventListener("keydown", (e) => {
    const noteCard = e.target.closest(".ncos-note");
    if (!noteCard) return;

    if (e.key === "Enter") {
      const note = notes.find(n => n.id === noteCard.dataset.id);
      if (note) showModal(note);
    }
  });

  // Global keyboard shortcuts
  const onKeyDown = (e) => {
    // Only handle if demo is open and no modal
    if (!document.body.classList.contains("demo-open")) return;
    if (root.querySelector(".ncos-modal-overlay")) return;

    if (e.key === "n" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (notes.length < MAX_NOTES) showModal();
    }
  };

  window.addEventListener("keydown", onKeyDown);

  // Initial render
  render();

  // Focus container
  setTimeout(() => {
    const firstNote = grid.querySelector(".ncos-note");
    if (firstNote) firstNote.focus();
  }, 100);

  // === DESTROY ===
  function destroy() {
    window.removeEventListener("keydown", onKeyDown);
    root.remove();
    styles.remove();
  }

  // === API (matching orby-mini pattern) ===
  function setMuted(m) {
    // NoteCenter doesn't have audio, but we keep the API consistent
  }

  function needsGesture() {
    return false;
  }

  container._demoSetMuted = setMuted;

  return { destroy, setMuted, needsGesture };
}
