window.VEHICLE_DATA = {
  id: "john-deere-s110",
  dataFile: "lawnmower.js",
  make: "John Deere",
  model: "S110",
  year: "",
  type: "42-inch riding lawn mower",
  accent: "#367c2b",
  art: "mower",
  quickSpecs: [
    { label: "Deck", value: "42 inch" },
    { label: "Engine", value: "Briggs & Stratton 33" },
    { label: "Service", value: "Yearly / 50 hours" },
    { label: "Current hours", value: "Add hours" }
  ],
  categories: [
    { id: "overview", name: "Overview & Specifications", icon: "▦", description: "Model, serial number, engine, deck, capacities, and specifications" },
    { id: "fluids", name: "Fluids & Capacities", icon: "◉", description: "Engine oil, fuel, grease, capacities, and approved fluid types" },
    { id: "filters", name: "Filters", icon: "≋", description: "Oil, air, pre-cleaner, and fuel filters" },
    { id: "engine", name: "Engine", icon: "⚙", description: "Engine parts, carburetor, belts, hoses, gaskets, and adjustments" },
    { id: "ignition", name: "Ignition", icon: "ϟ", description: "Spark plug, starter, key switch, and ignition parts" },
    { id: "fuel", name: "Fuel System", icon: "◇", description: "Fuel filter, pump, lines, carburetor, and fuel treatment" },
    { id: "deck", name: "Mower Deck", icon: "▱", description: "Deck parts, leveling, spindles, pulleys, and guards" },
    { id: "blades", name: "Blades", icon: "✦", description: "Blade sizes, part numbers, sharpening, replacement, and torque" },
    { id: "belts", name: "Belts & Pulleys", icon: "⌁", description: "Drive belts, deck belts, routing, tension, and pulleys" },
    { id: "tires", name: "Tires & Wheels", icon: "⊙", description: "Tire sizes, pressures, wheels, and hardware" },
    { id: "electrical", name: "Battery & Electrical", icon: "▤", description: "Battery, charging, fuses, switches, wiring, and lights" },
    { id: "devices", name: "Devices & Accessories", icon: "+", description: "Attachments, baggers, covers, carts, and added equipment" },
    { id: "parts", name: "Parts & Consumables", icon: "#", description: "Common replacement parts, kits, part numbers, and purchase links" },
    { id: "intervals", name: "Service Intervals", icon: "◷", description: "Hour-based and seasonal inspection and replacement schedules" },
    { id: "instructions", name: "Instructions & Procedures", icon: "☷", description: "Oil changes, blade service, deck removal, setup, and storage procedures" },
    { id: "documents", name: "Documents & Links", icon: "▧", description: "Manuals, diagrams, receipts, warranties, and useful links" },
    { id: "service", name: "Service History & Notes", icon: "✓", description: "Completed maintenance, repairs, problems, hours, and observations" }
  ],
  records: [
    { id: "mower-engine", category: "overview", type: "Specification", title: "Engine", value: "Briggs & Stratton 33" },
    { id: "mower-deck", category: "overview", type: "Specification", title: "Mower Deck", value: "42 inch" },
    { id: "mower-oil", category: "fluids", type: "Fluid", title: "Engine Oil", value: "SAE 10W-30 — 1.4 L / 1.5 qt", links: [{ label: "Oil", url: "https://a.co/d/h2OeJVr" }] },
    { id: "mower-air-filter", category: "filters", type: "Part", title: "Air Filter", value: "Cartridge", links: [{ label: "Filter and spark-plug kit", url: "https://a.co/d/ginZGPq" }] },
    { id: "mower-oil-filter", category: "filters", type: "Part", title: "Oil Filter", value: "Standard", links: [{ label: "Filter and spark-plug kit", url: "https://a.co/d/ginZGPq" }] },
    { id: "mower-fuel-filter", category: "filters", type: "Needed", title: "Fuel Filter", value: "Part number not recorded yet" },
    { id: "mower-spark-plug", category: "ignition", type: "Part", title: "Spark Plug", links: [{ label: "Filter and spark-plug kit", url: "https://a.co/d/ginZGPq" }] },
    { id: "mower-blades", category: "blades", type: "Part", title: "Mower Blades", value: "42-inch deck blade set", links: [{ label: "Mower blades", url: "https://a.co/d/19OwhLG" }] },
    { id: "mower-yearly-service", category: "intervals", type: "Schedule", title: "Yearly / 50-Hour Service", value: "Complete yearly or every 50 operating hours", instructions: ["Replace engine oil and oil filter", "Replace air filter", "Replace fuel filter", "Replace spark plug", "Sharpen or replace mower blades"] },
    { id: "mower-oil-change", category: "instructions", type: "Instruction", title: "Engine Oil Change", value: "Add the verified procedure for this mower", notes: "Use Add info to enter tools, supplies, and one step per line, then export lawnmower.js." }
  ]
};
