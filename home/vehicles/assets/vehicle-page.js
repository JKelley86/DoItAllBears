(function () {
  "use strict";

  const data = window.VEHICLE_DATA;
  const app = document.getElementById("vehicleApp");
  const storageKey = `vehicle-records-v1:${data.id}`;
  let activeCategory = "all";
  let searchTerm = "";
  let localRecords = loadLocalRecords();

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>'"]/g, character => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    })[character]);
  }

  function loadLocalRecords() {
    try { return JSON.parse(localStorage.getItem(storageKey) || "[]"); }
    catch (error) { return []; }
  }

  function saveLocalRecords() {
    localStorage.setItem(storageKey, JSON.stringify(localRecords));
  }

  function vehicleArt() {
    if (data.art === "mower") {
      return `<svg viewBox="0 0 640 240" aria-hidden="true"><path d="M91 163h95l23-79h125l30 79h111l34 26H83Z"/><path d="M246 84V49h88l31 114M207 119h143M476 162l31-67h38"/><circle cx="173" cy="184" r="43"/><circle cx="441" cy="184" r="34"/><circle cx="528" cy="190" r="23"/></svg>`;
    }
    if (data.art === "boat") {
      return `<svg viewBox="0 0 640 240" aria-hidden="true"><path d="M73 147h492l-57 66H151Z"/><path d="M190 145l43-79h168l66 79M278 66V31h15M291 33l101 32H291Z"/><path d="M100 218c49 16 88 16 137 0 49 16 88 16 137 0 49 16 88 16 137 0"/></svg>`;
    }
    if (data.art === "camper") {
      return `<svg viewBox="0 0 640 240" aria-hidden="true"><path d="M69 68h407c38 0 65 24 76 74l14 43H78Z"/><path d="M108 91h98v55h-98ZM240 91h82v55h-82ZM372 92h65v93h-65Z"/><path d="M565 184h44"/><circle cx="186" cy="188" r="36"/><circle cx="451" cy="188" r="36"/></svg>`;
    }
    if (data.art === "truck") {
      return `<svg viewBox="0 0 640 240" aria-hidden="true"><path d="M69 155h58l18-82h212l57 72h129c23 0 39 13 39 35v9H58v-17c0-10 5-17 11-17Z"/><path d="M171 91h166l39 54H158Z"/><circle cx="159" cy="186" r="40"/><circle cx="489" cy="186" r="40"/></svg>`;
    }
    return `<svg viewBox="0 0 640 240" aria-hidden="true"><path d="M92 151c23-55 64-72 151-78l150-8c46-1 83 22 124 62l45 18c12 5 18 15 18 30v13H60v-13c0-13 11-21 32-24Z"/><path d="m215 83-44 54h252l-54-56Z"/><circle cx="166" cy="185" r="38"/><circle cx="479" cy="185" r="38"/></svg>`;
  }

  function renderShell() {
    const displayName = [data.year, data.model].filter(Boolean).join(" ");
    document.documentElement.style.setProperty("--accent", data.accent || "#526c59");
    app.innerHTML = `
      <header class="vehicle-topbar">
        <div class="topbar-inner">
          <button id="backButton" class="icon-button" type="button" aria-label="Go back">‹</button>
          <div class="topbar-title"><small>${escapeHtml(data.make)}</small><strong>${escapeHtml(displayName)}</strong></div>
          <button id="topAddButton" class="icon-button" type="button" aria-label="Add information">＋</button>
        </div>
      </header>
      <section class="vehicle-hero">
        <div class="vehicle-hero-inner">
          <div class="vehicle-hero-copy">
            <p class="eyebrow">${escapeHtml(data.make)} vehicle database</p>
            <h1>${data.year ? `${escapeHtml(data.year)}<br>` : ""}${escapeHtml(data.model)}</h1>
            <p>${escapeHtml(data.type)}. Store every part, device, instruction, specification, document, and service record in one searchable place.</p>
            <div class="quick-specs">${data.quickSpecs.map(spec => `<span class="quick-spec"><small>${escapeHtml(spec.label)}</small><b>${escapeHtml(spec.value)}</b></span>`).join("")}</div>
          </div>
          <div class="hero-vehicle-art">${vehicleArt()}</div>
        </div>
      </section>
      <main class="vehicle-shell">
        <div class="dashboard-bar">
          <label class="search-box"><span>⌕</span><input id="recordSearch" type="search" placeholder="Search parts, numbers, devices, or instructions…"></label>
          <button id="addRecordButton" class="primary-button" type="button">＋ Add info</button>
          <button id="instructionsButton" class="secondary-button" type="button">☷ Instructions</button>
          <button id="exportButton" class="secondary-button" type="button">Export for GitHub</button>
        </div>
        <nav id="categoryTabs" class="category-tabs" aria-label="Vehicle categories"></nav>
        <div class="content-summary"><div><p class="eyebrow">Vehicle information</p><h2 id="contentTitle">All records</h2></div><span id="recordCount" class="record-count"></span></div>
        <div id="categorySections" class="category-sections"></div>
      </main>
      <div id="modalBackdrop" class="modal-backdrop" hidden></div>
      <section id="recordModal" class="record-modal" role="dialog" aria-modal="true" hidden>
        <div class="modal-header"><div><p class="eyebrow">${escapeHtml(data.model)}</p><h2>Add vehicle information</h2></div><button id="closeModal" class="close-modal" type="button">×</button></div>
        <form id="recordForm" class="record-form">
          <div class="field-grid">
            <label>Category<select name="category" required>${data.categories.map(category => `<option value="${escapeHtml(category.id)}">${escapeHtml(category.name)}</option>`).join("")}</select></label>
            <label>Record type<select name="type"><option>Part</option><option>Device</option><option>Specification</option><option>Fluid</option><option>Instruction</option><option>Document</option><option>Service</option><option>Note</option></select></label>
          </div>
          <label>Name<input name="title" required placeholder="Example: Cabin air filter"></label>
          <div class="field-grid"><label>Part/model number<input name="partNumber" placeholder="Example: 68406048AA"></label><label>Brand/manufacturer<input name="brand" placeholder="Example: Mopar"></label></div>
          <label>Details or specification<input name="value" placeholder="Size, capacity, location, compatibility, etc."></label>
          <label>Tools / supplies<input name="tools" placeholder="Oil, filter wrench, socket set…"></label>
          <label>Instruction steps<textarea name="instructions" placeholder="Enter one numbered step per line"></textarea></label>
          <div class="field-grid"><label>Useful link<input name="linkUrl" type="url" placeholder="https://…"></label><label>Link label<input name="linkLabel" placeholder="Manual, product, video…"></label></div>
          <label>Notes<textarea name="notes" placeholder="Alternatives, torque specs, purchase location, observations…"></textarea></label>
          <div class="form-note">Items added here are saved on this browser. Use Export to download a combined JSON file that can later be copied into the vehicle's permanent data file.</div>
          <div class="modal-actions"><button id="cancelModal" class="secondary-button" type="button">Cancel</button><button class="primary-button" type="submit">Save record</button></div>
        </form>
      </section>`;

    document.getElementById("recordSearch").addEventListener("input", event => { searchTerm = event.target.value.trim().toLowerCase(); renderRecords(); });
    document.getElementById("backButton").addEventListener("click", () => {
      if (history.length > 1) history.back();
      else location.href = "../index.html";
    });
    document.getElementById("addRecordButton").addEventListener("click", openModal);
    document.getElementById("topAddButton").addEventListener("click", openModal);
    document.getElementById("exportButton").addEventListener("click", exportData);
    document.getElementById("instructionsButton").addEventListener("click", () => {
      activeCategory = "instructions";
      searchTerm = "";
      document.getElementById("recordSearch").value = "";
      renderTabs();
      renderRecords();
      document.getElementById("contentTitle").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    document.getElementById("closeModal").addEventListener("click", closeModal);
    document.getElementById("cancelModal").addEventListener("click", closeModal);
    document.getElementById("modalBackdrop").addEventListener("click", closeModal);
    document.getElementById("recordForm").addEventListener("submit", saveRecord);
    renderTabs();
    renderRecords();
  }

  function allRecords() {
    const permanentIds = new Set(data.records.map(record => record.id));
    return [
      ...data.records.map(record => ({ ...record, permanent: true })),
      ...localRecords.filter(record => !permanentIds.has(record.id))
    ];
  }

  function searchable(record) {
    const category = data.categories.find(item => item.id === record.category);
    return [record.title, record.type, record.value, record.partNumber, record.brand, record.tools, record.notes, ...(record.instructions || []), ...(record.links || []).flatMap(link => [link.label, link.url]), category?.name]
      .filter(Boolean).join(" ").toLowerCase();
  }

  function filteredRecords() {
    return allRecords().filter(record =>
      (activeCategory === "all" || record.category === activeCategory) &&
      (!searchTerm || searchable(record).includes(searchTerm))
    );
  }

  function renderTabs() {
    const tabs = document.getElementById("categoryTabs");
    tabs.innerHTML = `<button class="category-tab ${activeCategory === "all" ? "active" : ""}" data-category="all">All</button>` +
      data.categories.map(category => `<button class="category-tab ${activeCategory === category.id ? "active" : ""}" data-category="${escapeHtml(category.id)}">${category.icon} ${escapeHtml(category.name)}</button>`).join("");
    tabs.querySelectorAll("[data-category]").forEach(button => button.addEventListener("click", () => {
      activeCategory = button.dataset.category;
      renderTabs();
      renderRecords();
    }));
  }

  function renderRecords() {
    const records = filteredRecords();
    const container = document.getElementById("categorySections");
    const selected = data.categories.find(category => category.id === activeCategory);
    document.getElementById("contentTitle").textContent = selected?.name || (searchTerm ? "Search results" : "All records");
    document.getElementById("recordCount").textContent = `${records.length} ${records.length === 1 ? "record" : "records"}`;

    const categoriesToShow = activeCategory === "all"
      ? data.categories.filter(category => records.some(record => record.category === category.id))
      : data.categories.filter(category => category.id === activeCategory);

    if (!categoriesToShow.length) {
      container.innerHTML = `<div class="no-results"><span>⌕</span><strong>No matching information</strong><p>Try another search or add a new record.</p></div>`;
      return;
    }

    container.innerHTML = categoriesToShow.map(category => {
      const categoryRecords = records.filter(record => record.category === category.id);
      const shouldOpen = activeCategory !== "all" || Boolean(searchTerm);
      return `<section class="category-section ${shouldOpen ? "open" : ""}" data-section="${escapeHtml(category.id)}">
        <button class="category-header" type="button"><span class="category-icon">${category.icon}</span><span><h3>${escapeHtml(category.name)}</h3><p>${categoryRecords.length} records · ${escapeHtml(category.description)}</p></span><span class="category-chevron">⌄</span></button>
        <div class="record-grid" ${shouldOpen ? "" : "hidden"}>${categoryRecords.length ? categoryRecords.map(renderCard).join("") : `<div class="empty-category">Nothing recorded here yet. Tap <b>Add info</b> to add the first item.</div>`}</div>
      </section>`;
    }).join("");

    container.querySelectorAll(".category-header").forEach(button => button.addEventListener("click", () => {
      const section = button.closest(".category-section");
      const grid = section.querySelector(".record-grid");
      section.classList.toggle("open");
      grid.hidden = !grid.hidden;
    }));
    container.querySelectorAll("[data-delete-record]").forEach(button => button.addEventListener("click", () => deleteLocalRecord(button.dataset.deleteRecord)));
  }

  function renderCard(record) {
    const instructions = Array.isArray(record.instructions) ? record.instructions : [];
    const links = Array.isArray(record.links) ? record.links : [];
    return `<article class="record-card">
      <span class="record-type">${escapeHtml(record.type || "Information")}</span>
      <h4>${escapeHtml(record.title)}</h4>
      ${record.value ? `<p class="record-value">${escapeHtml(record.value)}</p>` : ""}
      <div class="record-meta">${record.partNumber ? `<span><b>Part/model:</b> ${escapeHtml(record.partNumber)}</span>` : ""}${record.brand ? `<span><b>Brand:</b> ${escapeHtml(record.brand)}</span>` : ""}${record.tools ? `<span><b>Tools / supplies:</b> ${escapeHtml(record.tools)}</span>` : ""}${record.notes ? `<span>${escapeHtml(record.notes)}</span>` : ""}</div>
      ${instructions.length ? `<ol class="instruction-list">${instructions.map(step => `<li>${escapeHtml(step)}</li>`).join("")}</ol>` : ""}
      ${links.length ? `<div class="record-links">${links.map(link => `<a class="mini-button" href="${escapeHtml(link.url)}" target="_blank" rel="noopener">${escapeHtml(link.label || "Open link")} ↗</a>`).join("")}</div>` : ""}
      ${record.permanent ? "" : `<div class="record-actions"><button class="mini-button" data-delete-record="${escapeHtml(record.id)}">Remove local item</button></div>`}
    </article>`;
  }

  function openModal() {
    document.getElementById("recordModal").hidden = false;
    document.getElementById("modalBackdrop").hidden = false;
    if (activeCategory !== "all") document.querySelector('#recordForm [name="category"]').value = activeCategory;
    setTimeout(() => document.querySelector('#recordForm [name="title"]').focus(), 60);
  }

  function closeModal() {
    document.getElementById("recordModal").hidden = true;
    document.getElementById("modalBackdrop").hidden = true;
  }

  function saveRecord(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    localRecords.push({
      id: `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      category: values.category,
      type: values.type,
      title: values.title.trim(),
      partNumber: values.partNumber.trim(),
      brand: values.brand.trim(),
      value: values.value.trim(),
      tools: values.tools.trim(),
      instructions: values.instructions.split("\n").map(step => step.trim()).filter(Boolean),
      links: values.linkUrl.trim() ? [{ label: values.linkLabel.trim() || "Open link", url: values.linkUrl.trim() }] : [],
      notes: values.notes.trim(),
      addedAt: new Date().toISOString()
    });
    saveLocalRecords();
    event.currentTarget.reset();
    closeModal();
    activeCategory = values.category;
    renderTabs();
    renderRecords();
    showToast("Vehicle information saved on this device");
  }

  function deleteLocalRecord(id) {
    if (!confirm("Remove this locally added record?")) return;
    localRecords = localRecords.filter(record => record.id !== id);
    saveLocalRecords();
    renderRecords();
  }

  function exportData() {
    const output = { ...data, records: allRecords().map(({ permanent, ...record }) => record) };
    const javascript = `window.VEHICLE_DATA = ${JSON.stringify(output, null, 2)};\n`;
    const blob = new Blob([javascript], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = data.dataFile || `${data.id}.js`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast(`Downloaded ${data.dataFile}. Replace the matching file in GitHub's data folder.`);
  }

  function showToast(message) {
    document.querySelector(".toast")?.remove();
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2400);
  }

  renderShell();
})();
