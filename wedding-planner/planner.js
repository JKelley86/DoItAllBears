const PERMANENT_PLANNERS = [
  // Add PDFs to a "pdfs" folder and list them here.
  // Example:
  // { name: "Master Wedding Planner", file: "pdfs/master-wedding-planner.pdf", category: "Complete planner" },
];

const DB_NAME = "WeddingPlannerLibrary";
const STORE_NAME = "pdfs";
const DB_VERSION = 1;

const plannerGrid = document.getElementById("plannerGrid");
const plannerSearch = document.getElementById("plannerSearch");
const plannerCount = document.getElementById("plannerCount");
const emptyState = document.getElementById("emptyState");
const pdfUpload = document.getElementById("pdfUpload");
const uploadButton = document.getElementById("uploadButton");
const bottomUpload = document.getElementById("bottomUpload");
const template = document.getElementById("plannerCardTemplate");

let uploadedPlanners = [];

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getUploadedPlanners() {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).getAll();

    request.onsuccess = () => resolve(
      request.result.sort((a, b) => b.addedAt - a.addedAt)
    );
    request.onerror = () => reject(request.error);
  });
}

async function saveUploadedPlanner(file) {
  const db = await openDatabase();
  const item = {
    id: crypto.randomUUID(),
    name: file.name.replace(/\.pdf$/i, ""),
    fileName: file.name,
    size: file.size,
    addedAt: Date.now(),
    blob: file,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(item);
    transaction.oncomplete = () => resolve(item);
    transaction.onerror = () => reject(transaction.error);
  });
}

async function deleteUploadedPlanner(id) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(id);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) return "PDF document";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function renderPlanners() {
  const query = plannerSearch.value.trim().toLowerCase();

  const planners = [
    ...PERMANENT_PLANNERS.map((planner, index) => ({
      ...planner,
      type: "permanent",
      id: `permanent-${index}`,
    })),
    ...uploadedPlanners.map(planner => ({
      ...planner,
      type: "uploaded",
    })),
  ].filter(planner => {
    const searchable = `${planner.name} ${planner.category || ""} ${planner.fileName || ""}`.toLowerCase();
    return searchable.includes(query);
  });

  plannerGrid.innerHTML = "";
  plannerCount.textContent = planners.length;
  emptyState.hidden = planners.length > 0;

  planners.forEach(planner => {
    const card = template.content.firstElementChild.cloneNode(true);
    const openButton = card.querySelector(".planner-open");
    const deleteButton = card.querySelector(".planner-delete");

    card.querySelector(".planner-name").textContent = planner.name;
    card.querySelector(".planner-meta").textContent =
      planner.type === "uploaded"
        ? `Saved on this device • ${formatFileSize(planner.size)}`
        : planner.category || "Website PDF";

    openButton.addEventListener("click", () => {
      const params = new URLSearchParams({ name: planner.name });

      if (planner.type === "uploaded") {
        params.set("id", planner.id);
      } else {
        params.set("src", planner.file);
      }

      window.location.href = `viewer.html?${params.toString()}`;
    });

    if (planner.type === "uploaded") {
      deleteButton.hidden = false;
      deleteButton.setAttribute("aria-label", `Remove ${planner.name}`);
      deleteButton.addEventListener("click", async event => {
        event.stopPropagation();

        const confirmed = window.confirm(`Remove "${planner.name}" from this device?`);
        if (!confirmed) return;

        await deleteUploadedPlanner(planner.id);
        uploadedPlanners = uploadedPlanners.filter(item => item.id !== planner.id);
        renderPlanners();
      });
    }

    plannerGrid.appendChild(card);
  });
}

async function handleUploads(files) {
  const pdfFiles = [...files].filter(file =>
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );

  for (const file of pdfFiles) {
    const saved = await saveUploadedPlanner(file);
    uploadedPlanners.unshift(saved);
  }

  pdfUpload.value = "";
  renderPlanners();
}

uploadButton.addEventListener("click", () => pdfUpload.click());
bottomUpload.addEventListener("click", () => pdfUpload.click());
pdfUpload.addEventListener("change", event => handleUploads(event.target.files));
plannerSearch.addEventListener("input", renderPlanners);

(async function initialize() {
  try {
    uploadedPlanners = await getUploadedPlanners();
  } catch (error) {
    console.error("Unable to open saved planner storage:", error);
  }

  renderPlanners();
})();
