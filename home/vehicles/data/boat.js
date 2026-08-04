window.VEHICLE_DATA = {
  id: "my-boat",
  dataFile: "boat.js",
  make: "My",
  model: "Boat",
  year: "",
  type: "Boat",
  accent: "#3f7374",
  art: "boat",
  quickSpecs: [
    { label: "Make / model", value: "Add details" },
    { label: "Engine", value: "Add engine" },
    { label: "Registration", value: "Add number" },
    { label: "Engine hours", value: "Add hours" }
  ],
  categories: [
    { id: "overview", name: "Overview & Specifications", icon: "▦", description: "HIN, registration, dimensions, capacity, engine, and specifications" },
    { id: "engine", name: "Engine & Drive", icon: "⚙", description: "Engine, lower unit, outdrive, transmission, belts, hoses, and parts" },
    { id: "fluids", name: "Fluids & Capacities", icon: "◉", description: "Engine oil, gear lube, coolant, steering fluid, and capacities" },
    { id: "fuel", name: "Fuel System", icon: "◇", description: "Tank, fuel type, filters, pump, lines, treatment, and capacity" },
    { id: "cooling", name: "Cooling System", icon: "❄", description: "Impeller, raw-water system, coolant, thermostat, and flushing" },
    { id: "propeller", name: "Propeller & Running Gear", icon: "✦", description: "Propeller size, pitch, hub, shaft, anodes, and hardware" },
    { id: "electrical", name: "Battery & Electrical", icon: "ϟ", description: "Batteries, charger, selector, fuses, wiring, outlets, and shore power" },
    { id: "electronics", name: "Electronics & Navigation", icon: "⌁", description: "Chartplotter, sonar, radio, GPS, gauges, transducers, and settings" },
    { id: "bilge", name: "Bilge & Pumps", icon: "≋", description: "Bilge pumps, float switches, livewell, plumbing, and drainage" },
    { id: "steering", name: "Steering & Controls", icon: "⊙", description: "Steering, throttle, shift controls, cables, and trim" },
    { id: "lighting", name: "Lighting", icon: "☼", description: "Navigation, anchor, deck, cabin, and trailer lights" },
    { id: "safety", name: "Safety Gear", icon: "⬡", description: "Life jackets, extinguishers, flares, horn, first aid, and checklists" },
    { id: "trailer", name: "Boat Trailer", icon: "↔", description: "Tires, bearings, brakes, winch, coupler, wiring, and registration" },
    { id: "hull", name: "Hull, Deck & Canvas", icon: "▱", description: "Hull care, fittings, seats, covers, canvas, and storage" },
    { id: "devices", name: "Devices & Accessories", icon: "+", description: "Added equipment, mounts, chargers, accessories, and model numbers" },
    { id: "parts", name: "Parts & Consumables", icon: "#", description: "Replacement parts, part numbers, service kits, and purchase links" },
    { id: "instructions", name: "Instructions & Procedures", icon: "☷", description: "Operation, launching, maintenance, repair, and setup procedures" },
    { id: "winterization", name: "Winterization & Storage", icon: "❉", description: "End-of-season procedure, supplies, storage, and spring commissioning" },
    { id: "documents", name: "Documents & Links", icon: "▧", description: "Manuals, wiring diagrams, receipts, registration, and warranties" },
    { id: "service", name: "Service History & Notes", icon: "✓", description: "Completed maintenance, repairs, problems, engine hours, and observations" }
  ],
  records: [
    { id: "boat-winterize", category: "instructions", type: "Instruction", title: "Winterize the Boat", value: "Add the exact procedure for this boat and engine", notes: "Enter tools, supplies, and one step per line. Keep any engine-specific warnings with the procedure." }
  ]
};
