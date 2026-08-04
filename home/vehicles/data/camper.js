window.VEHICLE_DATA = {
  id: "my-camper",
  dataFile: "camper.js",
  make: "My",
  model: "Camper",
  year: "",
  type: "Camper / travel trailer",
  accent: "#776b5b",
  art: "camper",
  quickSpecs: [
    { label: "Make / model", value: "Add details" },
    { label: "GVWR", value: "Add weight" },
    { label: "Length", value: "Add length" },
    { label: "VIN", value: "Add VIN" }
  ],
  categories: [
    { id: "overview", name: "Overview & Specifications", icon: "▦", description: "VIN, floor plan, dimensions, capacities, model, and specifications" },
    { id: "towing", name: "Weights, Hitch & Towing", icon: "↔", description: "GVWR, payload, tongue weight, hitch, sway control, and setup" },
    { id: "running", name: "Tires, Brakes & Bearings", icon: "⊙", description: "Tires, pressures, lug torque, brakes, hubs, bearings, and suspension" },
    { id: "battery", name: "12-Volt & Batteries", icon: "ϟ", description: "Batteries, converter, fuses, wiring, disconnect, solar, and charging" },
    { id: "shorepower", name: "120-Volt & Shore Power", icon: "▤", description: "Shore power, breakers, outlets, inverter, generator, and surge protection" },
    { id: "propane", name: "Propane System", icon: "◉", description: "Tanks, regulator, lines, detector, valves, and leak testing" },
    { id: "plumbing", name: "Plumbing & Water", icon: "≋", description: "Fresh water, pump, city connection, fixtures, filters, and leaks" },
    { id: "tanks", name: "Holding Tanks & Sewer", icon: "◇", description: "Fresh, gray, and black tanks, valves, sensors, hoses, and treatment" },
    { id: "climate", name: "Heating & Cooling", icon: "❄", description: "Furnace, air conditioner, thermostat, vents, filters, and service" },
    { id: "waterheater", name: "Water Heater", icon: "☼", description: "Fuel source, bypass, anode, drain, controls, and maintenance" },
    { id: "appliances", name: "Appliances", icon: "▱", description: "Refrigerator, range, microwave, television, and appliance model numbers" },
    { id: "exterior", name: "Roof, Exterior & Awning", icon: "⌂", description: "Roof, seals, windows, siding, stabilizers, steps, and awning" },
    { id: "interior", name: "Interior & Furniture", icon: "□", description: "Furniture, cabinetry, beds, hardware, storage, and interior parts" },
    { id: "safety", name: "Safety Equipment", icon: "⬡", description: "Smoke, propane, and CO detectors, extinguishers, exits, and checklists" },
    { id: "devices", name: "Devices & Accessories", icon: "+", description: "Cameras, routers, monitors, controllers, accessories, and model numbers" },
    { id: "parts", name: "Parts & Consumables", icon: "#", description: "Replacement parts, part numbers, seals, filters, and purchase links" },
    { id: "instructions", name: "Instructions & Procedures", icon: "☷", description: "Setup, leveling, operation, maintenance, repair, and packing procedures" },
    { id: "winterization", name: "Winterization & Storage", icon: "❉", description: "Water-system winterizing, battery storage, covers, and spring opening" },
    { id: "documents", name: "Documents & Links", icon: "▧", description: "Manuals, diagrams, receipts, registration, and warranties" },
    { id: "service", name: "Service History & Notes", icon: "✓", description: "Completed maintenance, repairs, trips, problems, and observations" }
  ],
  records: [
    { id: "camper-winterize", category: "instructions", type: "Instruction", title: "Winterize the Camper", value: "Add the exact procedure for this camper", notes: "Enter tools, supplies, and one step per line, including the water-heater bypass and antifreeze details that apply to your model." }
  ]
};
