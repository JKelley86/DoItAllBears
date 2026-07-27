const VEHICLES = {
  car: {
    icon: "🚗",
    type: "CAR",
    title: "The Challenger",
    description: "Your car's dedicated page. Add specifications, maintenance records, photos, documents, and anything else you want to keep here.",
    link: "cars.html"
  },
  truck: {
    icon: "🛻",
    type: "TRUCK",
    title: "The RAM",
    description: "Your truck's command center. Keep towing information, maintenance, modifications, fuel records, and trip details in one place.",
    link: "cars.html"
  },
  boat: {
    icon: "🚤",
    type: "WATERCRAFT",
    title: "The Boat",
    description: "Your boat's home base. Add specifications, winterization notes, maintenance, launch information, and lake trips.",
    link: "boat.html"
  },
  camper: {
    icon: "🏕️",
    type: "CAMPER",
    title: "The Camper",
    description: "Your camping command center. Store towing setup, packing lists, maintenance, modifications, and camping trips.",
    link: "camper.html"
  },
  mower: {
    icon: "🌱",
    type: "LAWN EQUIPMENT",
    title: "The Mower",
    description: "Your lawn equipment page. Keep maintenance schedules, oil information, parts, and service records here.",
    link: "lawnmower.html"
  }
};

const world = document.getElementById("world");
const loadingScreen = document.getElementById("loading-screen");
const modal = document.getElementById("vehicleModal");
const modalIcon = document.getElementById("modalIcon");
const modalType = document.getElementById("modalType");
const modalTitle = document.getElementById("modalTitle");
const modalDescription = document.getElementById("modalDescription");
const modalLink = document.getElementById("modalLink");
const sidePanel = document.getElementById("sidePanel");
const toast = document.getElementById("toast");
const garageScreen = document.getElementById("garageModeScreen");

window.addEventListener("load", () => {
  setTimeout(() => loadingScreen.classList.add("loaded"), 1100);
});

function openVehicle(key) {
  const vehicle = VEHICLES[key];
  if (!vehicle) return;

  modalIcon.textContent = vehicle.icon;
  modalType.textContent = vehicle.type;
  modalTitle.textContent = vehicle.title;
  modalDescription.textContent = vehicle.description;
  modalLink.href = vehicle.link;

  modal.classList.add("open");
  sidePanel.classList.remove("open");
  garageScreen.classList.remove("open");
}

function closeModal() {
  modal.classList.remove("open");
}

function focusVehicle(key) {
  const target = document.querySelector(`.vehicle[data-vehicle="${key}"]`);
  if (!target) return;

  sidePanel.classList.remove("open");
  garageScreen.classList.remove("open");

  if (window.innerWidth <= 650) {
    openVehicle(key);
    return;
  }

  target.animate(
    [
      { transform: "translateY(0) scale(1)" },
      { transform: "translateY(-12px) scale(1.08)" },
      { transform: "translateY(0) scale(1)" }
    ],
    { duration: 850, easing: "ease-in-out" }
  );

  showToast(`${VEHICLES[key].title} selected`);
}

document.querySelectorAll(".vehicle").forEach(vehicle => {
  const key = vehicle.dataset.vehicle;

  vehicle.addEventListener("click", e => {
    if (e.target.tagName === "BUTTON") e.preventDefault();
    openVehicle(key);
  });

  vehicle.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openVehicle(key);
    }
  });
});

document.querySelectorAll("[data-target]").forEach(button => {
  button.addEventListener("click", () => {
    focusVehicle(button.dataset.target);
  });
});

document.getElementById("modalClose").addEventListener("click", closeModal);
document.getElementById("modalStay").addEventListener("click", closeModal);
document.querySelector(".modal-backdrop").addEventListener("click", closeModal);

document.getElementById("menuToggle").addEventListener("click", () => {
  sidePanel.classList.toggle("open");
});

document.getElementById("closePanel").addEventListener("click", () => {
  sidePanel.classList.remove("open");
});

document.getElementById("timeToggle").addEventListener("click", e => {
  world.classList.toggle("night");
  e.currentTarget.textContent = world.classList.contains("night") ? "☾" : "☀";
  showToast(world.classList.contains("night") ? "Night mode activated" : "Day mode activated");
});

document.getElementById("soundToggle").addEventListener("click", e => {
  e.currentTarget.classList.toggle("active");
  showToast(e.currentTarget.classList.contains("active") ? "Sound enabled" : "Sound muted");
});

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

/* ===== V3 REAL OBJECT INTERACTIONS ===== */

function pulseObject(element) {
  if (!element) return;
  element.classList.remove("object-active");
  void element.offsetWidth;
  element.classList.add("object-active");
}

/* Campfire: the actual campfire is clickable. */
const campfire = document.getElementById("campfireInteractive");

if (campfire) {
  campfire.addEventListener("click", () => {
    const flame = campfire.querySelector(".flame");
    const isBig = campfire.classList.toggle("big-fire");

    pulseObject(campfire);

    if (isBig) {
      showToast("The campfire is roaring 🔥");
    } else {
      showToast("The fire settles back down.");
    }
  });

  campfire.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      campfire.click();
    }
  });
}

/* Lake: the actual lake is clickable. The boat remains above it and
   receives clicks itself because it has a higher z-index. */
const lake = document.getElementById("lakeInteractive");

if (lake) {
  const exploreLake = () => {
    lake.classList.remove("ripple");
    void lake.offsetWidth;
    lake.classList.add("ripple");
    showToast("You skipped a stone across the lake 🌊");
  };

  lake.addEventListener("click", exploreLake);

  lake.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      exploreLake();
    }
  });
}

/* Garage: the actual garage building is clickable. */
const garage = document.getElementById("garageInteractive");

if (garage) {
  const enterGarage = () => {
    pulseObject(garage);
    showToast("Opening the garage...");
    setTimeout(() => {
      garageScreen.classList.add("open");
    }, 350);
  };

  garage.addEventListener("click", enterGarage);

  garage.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      enterGarage();
    }
  });
}

/* House: the actual house is clickable. */
const house = document.getElementById("houseInteractive");

if (house) {
  const checkHouse = () => {
    pulseObject(house);
    showToast("The house is quiet tonight. 🏠");
  };

  house.addEventListener("click", checkHouse);

  house.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      checkHouse();
    }
  });
}

/* Garage Mode */
document.getElementById("garageMode").addEventListener("click", () => {
  sidePanel.classList.remove("open");
  garageScreen.classList.add("open");
});

document.getElementById("garageClose").addEventListener("click", () => {
  garageScreen.classList.remove("open");
});

/* Garage Mode vehicle buttons */
document.querySelectorAll(".garage-items [data-target]").forEach(button => {
  button.addEventListener("click", e => {
    e.preventDefault();
    e.stopPropagation();
    openVehicle(button.dataset.target);
  });
});

/* Find Something now triggers actual object interactions. */
document.getElementById("discoverMode").addEventListener("click", () => {
  sidePanel.classList.remove("open");

  const discoveries = [
    {
      message: "You found the campfire. Make it roar. 🔥",
      action: () => campfire?.click()
    },
    {
      message: "You found the lake. Skip a stone. 🌊",
      action: () => lake?.click()
    },
    {
      message: "The garage is waiting. 🛠️",
      action: () => garage?.click()
    },
    {
      message: "You found the house. 🏠",
      action: () => house?.click()
    },
    {
      message: "The boat is waiting at the dock. 🚤",
      action: () => openVehicle("boat")
    }
  ];

  const discovery = discoveries[Math.floor(Math.random() * discoveries.length)];

  showToast(discovery.message);
  setTimeout(() => discovery.action(), 850);
});

/* Desktop parallax. Disabled on touch devices. */
if (window.matchMedia("(pointer: fine)").matches) {
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;

  window.addEventListener("mousemove", e => {
    targetX = (e.clientX / window.innerWidth - 0.5) * 2;
    targetY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  function animateParallax() {
    currentX += (targetX - currentX) * 0.035;
    currentY += (targetY - currentY) * 0.035;

    document.querySelector(".mountains-back").style.transform =
      `translate(${currentX * -8}px, ${currentY * -3}px)`;

    document.querySelector(".mountains-front").style.transform =
      `translate(${currentX * -16}px, ${currentY * -6}px)`;

    document.querySelector(".cloud-1").style.marginLeft = `${currentX * 10}px`;

    requestAnimationFrame(animateParallax);
  }

  animateParallax();
}

/* Touch interaction */
let touchStartY = 0;

window.addEventListener("touchstart", e => {
  touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

window.addEventListener("touchend", e => {
  const touchEndY = e.changedTouches[0].screenY;
  const delta = touchStartY - touchEndY;

  if (Math.abs(delta) < 50) return;

  if (delta > 0) {
    showToast("Exploring deeper into the property...");
    world.style.transform = "translateY(-3%) scale(1.03)";
  } else {
    showToast("Heading back toward the house...");
    world.style.transform = "translateY(0) scale(1)";
  }

  setTimeout(() => {
    world.style.transform = "";
  }, 900);
});

/* Close overlays with Escape */
window.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  closeModal();
  sidePanel.classList.remove("open");
  garageScreen.classList.remove("open");
});
