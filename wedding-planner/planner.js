const PERMANENT_PLANNERS = [
  {
    name: "Damian & Tori",
    file: "pdfs/Damian_Tori.pdf",
    category: "Complete planner"
  }
];

const DB_NAME = "WeddingPlannerLibrary";
const STORE_NAME = "pdfs";
const DB_VERSION = 1;

document.addEventListener("DOMContentLoaded", initializePlannerPage);

function initializePlannerPage() {
  const plannerGrid = document.getElementById("plannerGrid");
  const plannerSearch = document.getElementById("plannerSearch");
  const plannerCount = document.getElementById("plannerCount");
  const emptyState = document.getElementById("emptyState");
  const pdfUpload = document.getElementById("pdfUpload");
  const uploadButton = document.getElementById("uploadButton");
  const bottomUpload = document.getElementById("bottomUpload");
  const template = document.getElementById("plannerCardTemplate");

  let uploadedPlanners = [];

  if (!plannerGrid) {
    console.error("plannerGrid was not found. Check that index.html is using the correct IDs.");
    return;
  }

  function createId() {
    if (
      window.crypto &&
      typeof window.crypto.randomUUID === "function"
    ) {
      return window.crypto.randomUUID();
    }

    return (
      Date.now().toString(36) +
      Math.random().toString(36).substring(2)
    );
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error("IndexedDB is unavailable."));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = function () {
        const database = request.result;

        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, {
            keyPath: "id"
          });
        }
      };

      request.onsuccess = function () {
        resolve(request.result);
      };

      request.onerror = function () {
        reject(request.error);
      };
    });
  }

  async function getUploadedPlanners() {
    const database = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(
        STORE_NAME,
        "readonly"
      );

      const request = transaction
        .objectStore(STORE_NAME)
        .getAll();

      request.onsuccess = function () {
        const results = request.result || [];

        results.sort(function (a, b) {
          return b.addedAt - a.addedAt;
        });

        resolve(results);
      };

      request.onerror = function () {
        reject(request.error);
      };
    });
  }

  async function saveUploadedPlanner(file) {
    const database = await openDatabase();

    const planner = {
      id: createId(),
      name: file.name.replace(/\.pdf$/i, ""),
      fileName: file.name,
      size: file.size,
      addedAt: Date.now(),
      blob: file
    };

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(
        STORE_NAME,
        "readwrite"
      );

      transaction
        .objectStore(STORE_NAME)
        .put(planner);

      transaction.oncomplete = function () {
        resolve(planner);
      };

      transaction.onerror = function () {
        reject(transaction.error);
      };
    });
  }

  async function deleteUploadedPlanner(id) {
    const database = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(
        STORE_NAME,
        "readwrite"
      );

      transaction
        .objectStore(STORE_NAME)
        .delete(id);

      transaction.oncomplete = function () {
        resolve();
      };

      transaction.onerror = function () {
        reject(transaction.error);
      };
    });
  }

  function formatFileSize(bytes) {
    if (!Number.isFinite(bytes)) {
      return "PDF document";
    }

    if (bytes < 1024 * 1024) {
      return `${Math.max(
        1,
        Math.round(bytes / 1024)
      )} KB`;
    }

    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  }

  function openPlanner(planner) {
    const parameters = new URLSearchParams();

    parameters.set("name", planner.name);

    if (planner.type === "uploaded") {
      parameters.set("id", planner.id);
    } else {
      parameters.set("src", planner.file);
    }

    window.location.href =
      `viewer.html?${parameters.toString()}`;
  }

  function createPlannerCard(planner) {
    let card;

    if (template && template.content) {
      card =
        template.content.firstElementChild.cloneNode(true);
    } else {
      card = document.createElement("article");
      card.className = "planner-card";

      card.innerHTML = `
        <button class="planner-open" type="button">
          <span class="planner-icon">PDF</span>

          <span class="planner-info">
            <strong class="planner-name"></strong>
            <span class="planner-meta"></span>
          </span>

          <span class="chevron">›</span>
        </button>

        <button
          class="planner-delete icon-button"
          type="button"
          aria-label="Remove planner"
          hidden
        >
          ×
        </button>
      `;
    }

    const openButton =
      card.querySelector(".planner-open");

    const deleteButton =
      card.querySelector(".planner-delete");

    const nameElement =
      card.querySelector(".planner-name");

    const metaElement =
      card.querySelector(".planner-meta");

    nameElement.textContent = planner.name;

    if (planner.type === "uploaded") {
      metaElement.textContent =
        `Saved on this device • ${formatFileSize(
          planner.size
        )}`;
    } else {
      metaElement.textContent =
        planner.category || "Website PDF";
    }

    openButton.addEventListener("click", function () {
      openPlanner(planner);
    });

    if (
      planner.type === "uploaded" &&
      deleteButton
    ) {
      deleteButton.hidden = false;

      deleteButton.setAttribute(
        "aria-label",
        `Remove ${planner.name}`
      );

      deleteButton.addEventListener(
        "click",
        async function (event) {
          event.stopPropagation();

          const confirmed = window.confirm(
            `Remove "${planner.name}" from this device?`
          );

          if (!confirmed) {
            return;
          }

          try {
            await deleteUploadedPlanner(planner.id);

            uploadedPlanners =
              uploadedPlanners.filter(function (item) {
                return item.id !== planner.id;
              });

            renderPlanners();
          } catch (error) {
            console.error(
              "Unable to remove planner:",
              error
            );

            window.alert(
              "The planner could not be removed."
            );
          }
        }
      );
    }

    return card;
  }

  function renderPlanners() {
    const searchValue = plannerSearch
      ? plannerSearch.value.trim().toLowerCase()
      : "";

    const permanentItems =
      PERMANENT_PLANNERS.map(function (
        planner,
        index
      ) {
        return {
          ...planner,
          type: "permanent",
          id: `permanent-${index}`
        };
      });

    const uploadedItems =
      uploadedPlanners.map(function (planner) {
        return {
          ...planner,
          type: "uploaded"
        };
      });

    const planners = [
      ...permanentItems,
      ...uploadedItems
    ].filter(function (planner) {
      const searchableText = [
        planner.name,
        planner.category,
        planner.fileName
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(searchValue);
    });

    plannerGrid.innerHTML = "";

    if (plannerCount) {
      plannerCount.textContent =
        planners.length.toString();
    }

    if (emptyState) {
      emptyState.hidden =
        planners.length !== 0;
    }

    planners.forEach(function (planner) {
      plannerGrid.appendChild(
        createPlannerCard(planner)
      );
    });
  }

  async function handleUploads(fileList) {
    const files = Array.from(fileList || []);

    const pdfFiles = files.filter(function (file) {
      return (
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
      );
    });

    if (pdfFiles.length === 0) {
      window.alert("Please select a PDF file.");
      return;
    }

    for (const file of pdfFiles) {
      try {
        const planner =
          await saveUploadedPlanner(file);

        uploadedPlanners.unshift(planner);
      } catch (error) {
        console.error(
          "Unable to save uploaded PDF:",
          error
        );

        window.alert(
          `"${file.name}" could not be saved in this browser.`
        );
      }
    }

    if (pdfUpload) {
      pdfUpload.value = "";
    }

    renderPlanners();
  }

  function openFilePicker() {
    if (!pdfUpload) {
      console.error(
        "pdfUpload input was not found."
      );
      return;
    }

    pdfUpload.click();
  }

  if (uploadButton) {
    uploadButton.addEventListener(
      "click",
      openFilePicker
    );
  }

  if (bottomUpload) {
    bottomUpload.addEventListener(
      "click",
      openFilePicker
    );
  }

  if (pdfUpload) {
    pdfUpload.addEventListener(
      "change",
      function (event) {
        handleUploads(event.target.files);
      }
    );
  }

  if (plannerSearch) {
    plannerSearch.addEventListener(
      "input",
      renderPlanners
    );
  }

  // Render permanent planners immediately.
  renderPlanners();

  // Then load locally uploaded PDFs.
  getUploadedPlanners()
    .then(function (savedPlanners) {
      uploadedPlanners = savedPlanners;
      renderPlanners();
    })
    .catch(function (error) {
      console.warn(
        "Saved planner storage is unavailable:",
        error
      );

      // Permanent planners and buttons still work.
      renderPlanners();
    });
}
