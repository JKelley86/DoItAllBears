import * as pdfjsLib from "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.3.31/build/pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.3.31/build/pdf.worker.min.mjs";

const DB_NAME = "WeddingPlannerLibrary";
const STORE_NAME = "pdfs";
const DB_VERSION = 1;

const params = new URLSearchParams(window.location.search);
const sourcePath = params.get("src");
const storedId = params.get("id");
const requestedName = params.get("name") || "Wedding Planner";

const documentTitle = document.getElementById("documentTitle");
const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const errorMessage = document.getElementById("errorMessage");
const pdfPages = document.getElementById("pdfPages");
const openSearch = document.getElementById("openSearch");
const searchDrawer = document.getElementById("searchDrawer");
const pdfSearch = document.getElementById("pdfSearch");
const runSearch = document.getElementById("runSearch");
const searchStatus = document.getElementById("searchStatus");
const previousResult = document.getElementById("previousResult");
const nextResult = document.getElementById("nextResult");
const zoomOut = document.getElementById("zoomOut");
const zoomIn = document.getElementById("zoomIn");
const zoomLabel = document.getElementById("zoomLabel");
const previousPage = document.getElementById("previousPage");
const nextPage = document.getElementById("nextPage");
const pageIndicator = document.getElementById("pageIndicator");

let pdfDocument = null;
let pageTexts = [];
let scale = 1;
let searchResults = [];
let activeResultIndex = -1;
let renderToken = 0;
let currentPage = 1;
let pageObserver = null;
let lastRenderWidth = window.innerWidth;

documentTitle.textContent = requestedName;
document.title = `${requestedName} | Wedding Planner`;

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

async function getStoredPdf(id) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function resolvePdfSource() {
  if (storedId) {
    const item = await getStoredPdf(storedId);
    if (!item?.blob) throw new Error("This saved PDF is no longer available on this device.");
    documentTitle.textContent = item.name || requestedName;
    return new Uint8Array(await item.blob.arrayBuffer());
  }

  if (sourcePath) return sourcePath;

  throw new Error("No PDF was selected.");
}

function showError(error) {
  console.error(error);
  loadingState.hidden = true;
  errorState.hidden = false;
  errorMessage.textContent = error?.message || "The file may have moved or may not be a valid PDF.";
}

async function extractPageText(page) {
  const textContent = await page.getTextContent();
  return textContent.items
    .map(item => item.str)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function createPageObserver() {
  if (pageObserver) pageObserver.disconnect();

  pageObserver = new IntersectionObserver(entries => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

    if (visible[0]) {
      currentPage = Number(visible[0].target.dataset.pageNumber);
      updatePageIndicator();
    }
  }, {
    rootMargin: "-20% 0px -55% 0px",
    threshold: [0.05, 0.25, 0.5, 0.75],
  });

  document.querySelectorAll(".pdf-page").forEach(page => pageObserver.observe(page));
}

async function renderDocument({ preservePosition = false, showLoading = false } = {}) {
  const token = ++renderToken;
  const pageToRestore = currentPage;
  pdfPages.innerHTML = "";
  pageTexts = new Array(pdfDocument.numPages);
  searchResults = [];
  activeResultIndex = -1;
  updateSearchHighlights();
  if (showLoading) loadingState.hidden = false;

  const viewportWidth = Math.max(280, Math.min(window.innerWidth - 16, 900));

  for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
    if (token !== renderToken) return;

    const page = await pdfDocument.getPage(pageNumber);
    const naturalViewport = page.getViewport({ scale: 1 });
    const fitScale = viewportWidth / naturalViewport.width;
    const viewport = page.getViewport({ scale: fitScale * scale });

    const wrapper = document.createElement("section");
    wrapper.className = "pdf-page";
    wrapper.dataset.pageNumber = String(pageNumber);
    wrapper.style.width = `${viewport.width}px`;

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { alpha: false });
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(viewport.width * pixelRatio);
    canvas.height = Math.floor(viewport.height * pixelRatio);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    const badge = document.createElement("span");
    badge.className = "page-number-badge";
    badge.textContent = `Page ${pageNumber}`;

    wrapper.append(canvas, badge);
    pdfPages.appendChild(wrapper);

    await page.render({
      canvasContext: context,
      viewport,
      transform: pixelRatio === 1 ? null : [pixelRatio, 0, 0, pixelRatio, 0, 0],
    }).promise;

    pageTexts[pageNumber - 1] = await extractPageText(page);
  }

  loadingState.hidden = true;
  currentPage = Math.min(currentPage, pdfDocument.numPages);
  updatePageIndicator();
  createPageObserver();

  if (preservePosition) {
    document.querySelector(`.pdf-page[data-page-number="${pageToRestore}"]`)
      ?.scrollIntoView({ behavior: "instant", block: "start" });
  }
}

function performSearch() {
  const query = pdfSearch.value.trim().toLowerCase();
  searchResults = [];
  activeResultIndex = -1;

  if (!query) {
    searchStatus.textContent = "Enter a word or phrase.";
    updateSearchHighlights();
    return;
  }

  pageTexts.forEach((text, pageIndex) => {
    const normalized = (text || "").toLowerCase();
    let startIndex = 0;
    let occurrence;

    while ((occurrence = normalized.indexOf(query, startIndex)) !== -1) {
      searchResults.push({ pageNumber: pageIndex + 1, occurrence });
      startIndex = occurrence + Math.max(query.length, 1);
    }
  });

  if (searchResults.length === 0) {
    searchStatus.textContent = `No matches for “${pdfSearch.value.trim()}”.`;
    updateSearchHighlights();
    return;
  }

  activeResultIndex = 0;
  updateSearchHighlights();
  goToActiveResult();
}

function updateSearchHighlights() {
  document.querySelectorAll(".pdf-page").forEach(page => {
    page.classList.remove("search-hit", "active-hit");
  });

  const hitPages = new Set(searchResults.map(result => result.pageNumber));
  hitPages.forEach(pageNumber => {
    document.querySelector(`.pdf-page[data-page-number="${pageNumber}"]`)
      ?.classList.add("search-hit");
  });

  if (activeResultIndex >= 0) {
    const active = searchResults[activeResultIndex];
    document.querySelector(`.pdf-page[data-page-number="${active.pageNumber}"]`)
      ?.classList.add("active-hit");

    searchStatus.textContent =
      `${activeResultIndex + 1} of ${searchResults.length} matches • Page ${active.pageNumber}`;
  }
}

function goToActiveResult() {
  if (activeResultIndex < 0 || !searchResults.length) return;

  const active = searchResults[activeResultIndex];
  document.querySelector(`.pdf-page[data-page-number="${active.pageNumber}"]`)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });

  updateSearchHighlights();
}

function moveResult(direction) {
  if (!searchResults.length) return;
  activeResultIndex =
    (activeResultIndex + direction + searchResults.length) % searchResults.length;
  goToActiveResult();
}

function updateZoomLabel() {
  zoomLabel.textContent = `${Math.round(scale * 100)}%`;
}

function updatePageIndicator() {
  pageIndicator.textContent = `${currentPage} / ${pdfDocument?.numPages || 0}`;
}

function goToPage(pageNumber) {
  if (!pdfDocument) return;

  currentPage = Math.max(1, Math.min(pageNumber, pdfDocument.numPages));
  document.querySelector(`.pdf-page[data-page-number="${currentPage}"]`)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
  updatePageIndicator();
}

openSearch.addEventListener("click", () => {
  searchDrawer.hidden = !searchDrawer.hidden;
  if (!searchDrawer.hidden) {
    setTimeout(() => pdfSearch.focus(), 50);
  }
});

runSearch.addEventListener("click", performSearch);
pdfSearch.addEventListener("keydown", event => {
  if (event.key === "Enter") performSearch();
});

previousResult.addEventListener("click", () => moveResult(-1));
nextResult.addEventListener("click", () => moveResult(1));

zoomOut.addEventListener("click", async () => {
  scale = Math.max(0.7, Number((scale - 0.15).toFixed(2)));
  updateZoomLabel();
  await renderDocument({ preservePosition: true });
});

zoomIn.addEventListener("click", async () => {
  scale = Math.min(2.2, Number((scale + 0.15).toFixed(2)));
  updateZoomLabel();
  await renderDocument({ preservePosition: true });
});

previousPage.addEventListener("click", () => goToPage(currentPage - 1));
nextPage.addEventListener("click", () => goToPage(currentPage + 1));

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const newWidth = window.innerWidth;

    // Mobile browsers frequently change only the viewport height while their
    // address bar opens/closes. Re-rendering for that would jump to the top.
    if (pdfDocument && Math.abs(newWidth - lastRenderWidth) >= 2) {
      lastRenderWidth = newWidth;
      renderDocument({ preservePosition: true }).catch(showError);
    }
  }, 250);
});

(async function initialize() {
  try {
    updateZoomLabel();
    const source = await resolvePdfSource();
    pdfDocument = await pdfjsLib.getDocument(source).promise;
    await renderDocument({ showLoading: true });
  } catch (error) {
    showError(error);
  }
})();
