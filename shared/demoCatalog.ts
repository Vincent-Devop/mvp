import { demoProductImages } from "./demoProductImages";

export const demoCategories = [
  { name: "Suitcases & Trolleys", slug: "suitcases", description: "Illustrative cabin, medium and large luggage samples." },
  { name: "Travel Duffel Bags", slug: "duffel-bags", description: "Illustrative weekender and holdall samples." },
  { name: "Travel Backpacks", slug: "backpacks", description: "Illustrative everyday and travel-ready pack samples." },
  { name: "Handbags & Ladies' Bags", slug: "handbags", description: "Illustrative travel totes, crossbodies and handbags." },
  { name: "Business Bags", slug: "business-bags", description: "Illustrative work, laptop and document bag samples." },
  { name: "Travel Accessories", slug: "travel-accessories", description: "Illustrative packing and travel-accessory samples." },
] as const;

export type DemoProduct = {
  name: string;
  slug: string;
  sku: string;
  categorySlug: string;
  description: string;
  material: string;
  retailPrice: number;
  compareAtPrice: number | null;
  imageUrl: string;
  color: string;
  size: string;
  stock: number;
  isFeatured: boolean;
  isBestseller: boolean;
  isNew: boolean;
};

type ExtraProductRow = readonly [
  name: string,
  sku: string,
  retailPrice: number,
  material: string,
  color: string,
  size: string,
  description: string,
];

const images = {
  suitcase: "/manus-storage/async-images/31pfdlJIO28hAMAiPMYI3b/image-1.webp",
  duffel: "/manus-storage/async-images/31pfdlJIO28hAMAiPMYI3b/image-2.webp",
  backpack: "/manus-storage/async-images/31pfdlJIO28hAMAiPMYI3b/image-3.webp",
  accessories: "/manus-storage/async-images/31pfdlJIO28hAMAiPMYI3b/image-4.webp",
  handbag: "/manus-storage/async-images/ouabAM8u5hoKqEDnNC4I7f/image-1.webp",
  business: "/manus-storage/async-images/ouabAM8u5hoKqEDnNC4I7f/image-2.webp",
} as const;

const slugify = (value: string) => value.normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function makeSample(categorySlug: string, imageUrl: string, row: ExtraProductRow): DemoProduct {
  const [name, sku, retailPrice, material, color, size, description] = row;
  return {
    name,
    slug: slugify(name),
    sku,
    categorySlug,
    description: `${description} This is an illustrative sample listing; specifications, price and availability have not been verified. Confirm all details with PRINCE BENJA DESIGNS before ordering.`,
    material,
    retailPrice,
    compareAtPrice: null,
    imageUrl,
    color,
    size,
    stock: 0,
    isFeatured: false,
    isBestseller: false,
    isNew: false,
  };
}

export const demoBranch = {
  code: "PIP",
  name: "Pipeline Stage",
  address: "Adjacent to Think Twice, Nairobi, Kenya",
  phone: "+254768524870",
} as const;

const originalSamples: DemoProduct[] = [
  {
    name: "The Carry-On",
    slug: "the-carry-on",
    sku: "PB-CAB-001",
    categorySlug: "suitcases",
    description: "A streamlined hard-shell case for short escapes and smooth airport days. This is illustrative catalogue content; confirm product dimensions and current price with PRINCE BENJA DESIGNS.",
    material: "Hard-shell ABS",
    retailPrice: 650000,
    compareAtPrice: null,
    imageUrl: images.suitcase,
    color: "Charcoal",
    size: "Cabin",
    stock: 12,
    isFeatured: true,
    isBestseller: false,
    isNew: false,
  },
  {
    name: "The Weekend Edit",
    slug: "the-weekend-edit",
    sku: "PB-DUF-002",
    categorySlug: "duffel-bags",
    description: "A warm-toned travel duffel for a considered overnight pack. This is illustrative catalogue content; confirm product details and current price with PRINCE BENJA DESIGNS.",
    material: "Textured synthetic leather",
    retailPrice: 480000,
    compareAtPrice: null,
    imageUrl: images.duffel,
    color: "Cognac",
    size: "Medium",
    stock: 8,
    isFeatured: true,
    isBestseller: false,
    isNew: false,
  },
  {
    name: "The Commuter Pack",
    slug: "the-commuter-pack",
    sku: "PB-BPK-003",
    categorySlug: "backpacks",
    description: "A clean-lined travel backpack designed for daily carry and weekend plans. This is illustrative catalogue content; confirm product details and current price with PRINCE BENJA DESIGNS.",
    material: "Durable woven fabric",
    retailPrice: 350000,
    compareAtPrice: null,
    imageUrl: images.backpack,
    color: "Olive charcoal",
    size: "Medium",
    stock: 4,
    isFeatured: true,
    isBestseller: false,
    isNew: false,
  },
  {
    name: "The Packing Set",
    slug: "the-packing-set",
    sku: "PB-ACC-004",
    categorySlug: "travel-accessories",
    description: "A coordinated set to give the essentials their own place. This is illustrative catalogue content; confirm product details and current price with PRINCE BENJA DESIGNS.",
    material: "Lightweight woven fabric",
    retailPrice: 180000,
    compareAtPrice: null,
    imageUrl: images.accessories,
    color: "Warm sand",
    size: "Set of 4",
    stock: 14,
    isFeatured: false,
    isBestseller: false,
    isNew: false,
  },
];

const additionalSamples: DemoProduct[] = [
  ...([
    ["Atlas Spinner Cabin Case", "PB-CAB-002", 675000, "Polycarbonate shell", "Midnight blue", "Cabin", "A compact four-wheel spinner sample for short journeys."],
    ["Metropolitan Hardcase", "PB-CAB-003", 720000, "ABS hard shell", "Graphite", "20 inch", "A streamlined cabin case sample with a clean, city-ready profile."],
    ["Coastline Expandable Carry-On", "PB-CAB-004", 745000, "Polycarbonate shell", "Ocean navy", "Cabin", "An expandable carry-on sample for carefully packed weekends."],
    ["Voyager Cabin Trolley", "PB-CAB-005", 695000, "Textured ABS", "Royal violet", "Cabin", "A lightweight cabin trolley sample with a vivid colourway."],
    ["Heritage Check-In Case", "PB-CAB-006", 885000, "Polypropylene shell", "Stone grey", "Medium", "A medium-size check-in suitcase sample for longer stays."],
    ["Skyline 24-Inch Spinner", "PB-CAB-007", 935000, "Polycarbonate shell", "Silver charcoal", "24 inch", "A mid-size spinner sample with a modern hard-shell silhouette."],
    ["Compact Spinner Duo", "PB-CAB-008", 1120000, "ABS hard shell", "Black and violet", "2-piece set", "A coordinated two-piece luggage sample set for shared travel."],
    ["Transit Expandable Luggage", "PB-CAB-009", 980000, "Polypropylene shell", "Deep plum", "Large", "A large expandable luggage sample for extended travel."],
    ["Summit Hardcase Set", "PB-CAB-010", 1290000, "Polycarbonate shell", "Charcoal", "3-piece set", "A nested three-piece luggage sample set for different trip lengths."],
  ] as ExtraProductRow[]).map((row) => makeSample("suitcases", images.suitcase, row)),
  ...([
    ["Nomad Canvas Duffel", "PB-DUF-003", 425000, "Cotton canvas", "Sandstone", "Medium", "A soft-sided canvas duffel sample for overnight travel."],
    ["Safari Holdall", "PB-DUF-004", 565000, "Woven polyester", "Olive", "Large", "A roomy holdall sample with a practical travel profile."],
    ["Studio Overnight Bag", "PB-DUF-005", 345000, "Textured synthetic leather", "Cognac", "Small", "A compact overnight bag sample for a simple, light pack."],
    ["Coast-to-Coast Weekender", "PB-DUF-006", 520000, "Durable canvas blend", "Navy", "Large", "A generous weekend bag sample for longer short breaks."],
    ["Metro Gym & Travel Holdall", "PB-DUF-007", 365000, "Water-resistant polyester", "Black", "Medium", "A multi-use holdall sample for travel and everyday carry."],
    ["Horizon Expandable Duffel", "PB-DUF-008", 465000, "Recycled woven fabric", "Slate", "Medium", "An expandable duffel sample designed to adapt to a changing pack."],
    ["Explorer Cabin Duffle", "PB-DUF-009", 495000, "Reinforced polyester", "Forest green", "Cabin", "A cabin-size duffel sample for travel essentials and easy access."],
    ["Canvas Weekend Carryall", "PB-DUF-010", 395000, "Cotton canvas", "Natural", "Medium", "A relaxed carryall sample for an overnight or weekend plan."],
    ["Voyage Structured Holdall", "PB-DUF-011", 610000, "Synthetic leather blend", "Espresso", "Large", "A structured holdall sample with a polished travel look."],
  ] as ExtraProductRow[]).map((row) => makeSample("duffel-bags", images.duffel, row)),
  ...([
    ["Urban Commuter Pack", "PB-BPK-004", 365000, "Durable woven fabric", "Charcoal", "Medium", "A practical backpack sample for commutes and short trips."],
    ["Summit Trail Daypack", "PB-BPK-005", 445000, "Ripstop polyester", "Forest green", "22 litre", "A lightweight daypack sample for active travel days."],
    ["Voyager Laptop Backpack", "PB-BPK-006", 485000, "Water-resistant polyester", "Black", "15 inch", "A padded laptop backpack sample for work and travel."],
    ["Metro Rolltop Pack", "PB-BPK-007", 425000, "Recycled woven fabric", "Slate", "Medium", "A flexible rolltop backpack sample for changing daily loads."],
    ["Atlas Cabin Backpack", "PB-BPK-008", 545000, "Coated polyester", "Deep navy", "Cabin", "A travel backpack sample sized for a tidy cabin-ready pack."],
    ["Everyday Zip Pack", "PB-BPK-009", 295000, "Durable nylon", "Stone", "Small", "A compact zip backpack sample for everyday essentials."],
    ["Explorer Multi-Pocket Pack", "PB-BPK-010", 515000, "Heavy-duty polyester", "Olive charcoal", "Large", "A multi-compartment backpack sample for organised travel."],
    ["Transit Slim Work Pack", "PB-BPK-011", 410000, "Textured polyester", "Black", "15 inch", "A slim work-pack sample with a laptop-friendly profile."],
    ["Campus Travel Backpack", "PB-BPK-012", 335000, "Woven polyester", "Burgundy", "Medium", "A versatile backpack sample for campus and weekend use."],
  ] as ExtraProductRow[]).map((row) => makeSample("backpacks", images.backpack, row)),
  ...([
    ["Travel Organizer Folio", "PB-ACC-005", 125000, "Lightweight woven fabric", "Lavender", "One size", "A zip organiser folio sample for travel documents and small essentials."],
    ["Passport & Card Wallet", "PB-ACC-006", 95000, "Synthetic leather", "Plum", "One size", "A compact travel wallet sample for cards and passport storage."],
    ["Compression Packing Cubes", "PB-ACC-007", 215000, "Ripstop polyester", "Lilac", "Set of 4", "A compression cube sample set to help organise packed clothing."],
    ["Universal Luggage Strap", "PB-ACC-008", 78000, "Woven nylon", "Violet", "Adjustable", "An adjustable luggage strap sample for easy bag identification."],
    ["Foldaway Travel Tote", "PB-ACC-009", 118000, "Recycled polyester", "Royal violet", "One size", "A foldaway tote sample for extra carrying capacity on the move."],
    ["Travel Toiletry Pouch", "PB-ACC-010", 138000, "Water-resistant fabric", "Charcoal", "Medium", "A wipe-clean wash pouch sample for travel toiletries."],
    ["Luggage Tag Pair", "PB-ACC-011", 82000, "Textured synthetic leather", "Violet and white", "Pair", "A matching luggage tag sample pair for identifying travel bags."],
    ["Digital Accessory Pouch", "PB-ACC-012", 145000, "Padded woven fabric", "Navy", "Small", "A padded pouch sample for chargers and small electronics."],
    ["Travel Neck Pillow & Eye Mask", "PB-ACC-013", 185000, "Soft-touch fabric", "Lavender", "Travel set", "A comfort accessory sample set for longer journeys."],
  ] as ExtraProductRow[]).map((row) => makeSample("travel-accessories", images.accessories, row)),
  ...([
    ["City Day Tote", "PB-HBG-001", 385000, "Textured synthetic leather", "Cognac", "Medium", "A structured tote sample for daily carry and city breaks."],
    ["Compact Crossbody Bag", "PB-HBG-002", 265000, "Vegan leather blend", "Deep violet", "Small", "A compact crossbody sample for hands-free travel days."],
    ["Travel Shoulder Bag", "PB-HBG-003", 325000, "Durable woven fabric", "Charcoal", "Medium", "A shoulder bag sample with space for travel essentials."],
    ["Weekender Tote Bag", "PB-HBG-004", 445000, "Canvas and synthetic leather", "Natural and tan", "Large", "A roomy tote sample for a relaxed weekend itinerary."],
    ["Mini Zip Satchel", "PB-HBG-005", 245000, "Textured synthetic leather", "Plum", "Small", "A compact zip satchel sample for a light everyday pack."],
    ["Everyday Hobo Bag", "PB-HBG-006", 355000, "Soft-touch synthetic leather", "Mocha", "Medium", "A softly shaped handbag sample for everyday essentials."],
    ["Convertible Crossbody Tote", "PB-HBG-007", 495000, "Water-resistant canvas", "Olive", "Medium", "A convertible tote sample with a shoulder-strap silhouette."],
    ["Structured Work Tote", "PB-HBG-008", 525000, "Synthetic leather blend", "Black", "Large", "A structured work tote sample with a polished profile."],
    ["Coastline Market Bag", "PB-HBG-009", 285000, "Woven cotton blend", "Sandstone", "Large", "A lightweight market tote sample for flexible everyday carry."],
    ["Journey Organizer Tote", "PB-HBG-010", 465000, "Recycled woven fabric", "Navy", "Medium", "An organiser tote sample with a travel-ready shape."],
  ] as ExtraProductRow[]).map((row) => makeSample("handbags", images.handbag, row)),
  ...([
    ["Executive Laptop Briefcase", "PB-BUS-001", 725000, "Textured synthetic leather", "Black", "15 inch", "A structured laptop briefcase sample for meetings and business travel."],
    ["Slim Work Messenger", "PB-BUS-002", 485000, "Water-resistant polyester", "Charcoal", "15 inch", "A slim messenger bag sample for work documents and a laptop."],
    ["Corporate Laptop Backpack", "PB-BUS-003", 555000, "Ballistic woven fabric", "Navy", "15 inch", "A professional backpack sample with a laptop-focused silhouette."],
    ["Tech Organizer Portfolio", "PB-BUS-004", 310000, "Padded synthetic leather", "Violet", "13 inch", "A folio-style tech organiser sample for a light work setup."],
    ["Document Travel Folio", "PB-BUS-005", 325000, "Textured polyester", "Slate", "A4", "A document folio sample for travel papers and meeting notes."],
    ["Business Travel Carryall", "PB-BUS-006", 795000, "Coated canvas blend", "Espresso", "Cabin", "A cabin carryall sample for business-trip essentials."],
    ["Cabin Case & Briefcase Set", "PB-BUS-007", 1280000, "ABS shell and synthetic leather", "Black", "2-piece set", "A coordinated case-and-briefcase sample set for work travel."],
    ["Executive Crossbody Organizer", "PB-BUS-008", 395000, "Synthetic leather", "Deep plum", "Medium", "A compact crossbody organiser sample for mobile work essentials."],
    ["Workday Rolltop Pack", "PB-BUS-009", 515000, "Water-resistant woven fabric", "Graphite", "15 inch", "A versatile rolltop work-pack sample for office and travel."],
    ["Voyager Professional Backpack", "PB-BUS-010", 685000, "Reinforced polyester", "Black and violet", "Large", "A professional travel backpack sample with a roomy profile."],
  ] as ExtraProductRow[]).map((row) => makeSample("business-bags", images.business, row)),
];

// Override legacy category-level fixture paths with a unique photo for every sample SKU.
export const demoProducts: DemoProduct[] = [...originalSamples, ...additionalSamples].map((product) => ({
  ...product,
  imageUrl: demoProductImages[product.sku] ?? "/images/product-placeholder.svg",
}));
