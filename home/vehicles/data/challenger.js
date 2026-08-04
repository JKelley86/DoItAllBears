window.VEHICLE_DATA = {
  id: "challenger-2020",
  dataFile: "challenger.js",
  make: "Dodge",
  model: "Challenger GT",
  year: 2020,
  type: "Performance coupe",
  accent: "#68727d",
  art: "car",
  quickSpecs: [
    { label: "Engine", value: "Add engine details" },
    { label: "Drivetrain", value: "Add drivetrain" },
    { label: "VIN", value: "Add VIN" },
    { label: "Current mileage", value: "Add mileage" }
  ],
  categories: [
    { id: "overview", name: "Overview & Specifications", icon: "▦", description: "VIN, engine, dimensions, capacities, and factory specifications" },
    { id: "fluids", name: "Fluids & Capacities", icon: "◉", description: "Oil, coolant, transmission, brake, and washer fluids" },
    { id: "filters", name: "Filters", icon: "≋", description: "Oil, engine air, cabin air, and fuel filters" },
    { id: "engine", name: "Engine & Ignition", icon: "⚙", description: "Spark plugs, coils, belts, hoses, sensors, and engine parts" },
    { id: "brakes", name: "Brakes", icon: "◫", description: "Pads, rotors, calipers, fluid, and torque information" },
    { id: "tires", name: "Tires & Wheels", icon: "⊙", description: "Sizes, pressure, rotation, lug nuts, and wheel information" },
    { id: "lighting", name: "Lighting", icon: "✦", description: "Headlights, taillights, signals, interior lights, and bulbs" },
    { id: "electrical", name: "Battery & Electrical", icon: "ϟ", description: "Battery, alternator, starter, wiring, and grounds" },
    { id: "fuses", name: "Fuses & Relays", icon: "▤", description: "Fuse locations, sizes, relay assignments, and diagrams" },
    { id: "devices", name: "Technology & Devices", icon: "⌁", description: "Radio, displays, cameras, sensors, modules, and accessories" },
    { id: "drivetrain", name: "Transmission & Drivetrain", icon: "⛭", description: "Transmission, differential, axles, and driveshaft" },
    { id: "suspension", name: "Suspension & Steering", icon: "⌇", description: "Shocks, struts, control arms, tie rods, and alignment" },
    { id: "hvac", name: "Heating & Air Conditioning", icon: "❄", description: "Cabin filter, refrigerant, blower, heat, and controls" },
    { id: "interior", name: "Interior", icon: "▱", description: "Seats, trim, switches, mats, storage, and cabin parts" },
    { id: "exterior", name: "Exterior & Body", icon: "◇", description: "Wipers, glass, paint, trim, doors, and body parts" },
    { id: "safety", name: "Safety & Security", icon: "⬡", description: "Airbags, locks, keys, alarms, and safety systems" },
    { id: "parts", name: "Parts & Consumables", icon: "#", description: "Common replacement parts, part numbers, brands, and alternatives" },
    { id: "instructions", name: "Instructions & Procedures", icon: "☷", description: "Step-by-step repairs, resets, setup, and operating instructions" },
    { id: "documents", name: "Documents & Links", icon: "▧", description: "Manuals, diagrams, receipts, warranties, and useful links" },
    { id: "service", name: "Service History & Notes", icon: "✓", description: "Completed maintenance, repairs, problems, and observations" }
  ],
  records: [
    { id: "challenger-oil", category: "fluids", type: "Fluid", title: "Engine Oil", value: "SAE 5W-20 — 5.9 quarts", notes: "Confirm capacity against the owner's manual when servicing." },
    { id: "challenger-filter-bosch", category: "filters", type: "Part", title: "Oil Filter", brand: "Bosch K&G", partNumber: "PS-7026", value: "Engine oil filter option" },
    { id: "challenger-filter-mopar", category: "filters", type: "Part", title: "Oil Filter", brand: "Mopar", partNumber: "M0-349", value: "OEM-style engine oil filter option" },
    { id: "challenger-air-filter", category: "filters", type: "Part", title: "Engine Air Filter", partNumber: "Fram 11257", value: "Replacement engine air filter" },
    { id: "challenger-drain-plug", category: "engine", type: "Part", title: "Oil Drain Plug", partNumber: "653106", value: "M14-1.5 thread" },
    { id: "challenger-front-brakes", category: "brakes", type: "Needed", title: "Front Brake Parts", value: "Part numbers not recorded yet" },
    { id: "challenger-rear-brakes", category: "brakes", type: "Needed", title: "Rear Brake Parts", value: "Part numbers not recorded yet" },
    { id: "challenger-headlights", category: "lighting", type: "Needed", title: "Headlight Bulbs", value: "Bulb information not recorded yet" }
  ]
};
