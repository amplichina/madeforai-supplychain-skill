import type { InitialAssessment, ProductCategory } from "./schemas.js";

type KnowledgeEntry = {
  likelyProcesses: string[];
  keyRisks: string[];
  questionsForUser: string[];
  complexity: InitialAssessment["estimated_complexity"];
  sanity: SanityEntry;
};

export type SanityEntry = {
  typicalQuantity: { min: number; max: number };
  incompatibleProcessKeywords: string[];
};

export type SanityFlag = {
  field: "quantity" | "process";
  concern: { en: string; zh: string };
};

export const KNOWLEDGE_BASE: Record<ProductCategory, KnowledgeEntry> = {
  badge: {
    likelyProcesses: ["die casting", "soft enamel", "hard enamel", "electroplating"],
    keyRisks: [
      "mold cost and lead time need manual confirmation",
      "enamel color matching may differ from digital artwork",
      "electroplating finish can vary by supplier and batch",
    ],
    questionsForUser: [
      "What badge size, thickness, and metal finish are required?",
      "Do you need soft enamel, hard enamel, or printed details?",
      "Is a backing type required, such as butterfly clutch or magnet?",
    ],
    complexity: "medium",
    sanity: {
      typicalQuantity: { min: 30, max: 20_000 },
      incompatibleProcessKeywords: ["uv printing on fabric", "embroidery", "刺绣", "热转印"],
    },
  },
  acrylic: {
    likelyProcesses: ["laser cutting", "UV printing", "protective film", "edge polishing"],
    keyRisks: [
      "edge quality depends on acrylic thickness and cutting settings",
      "UV print color can shift on transparent or translucent material",
      "surface scratches may occur without protective packing",
    ],
    questionsForUser: [
      "What acrylic thickness and shape are required?",
      "Should the print be single-sided, double-sided, or layered?",
      "Do you need keychains, stands, magnets, or other accessories?",
    ],
    complexity: "low",
    sanity: {
      typicalQuantity: { min: 10, max: 20_000 },
      incompatibleProcessKeywords: ["electroplating", "enamel", "电镀", "珐琅", "烤漆金属"],
    },
  },
  card: {
    likelyProcesses: ["digital printing", "offset printing", "lamination", "coating"],
    keyRisks: [
      "paper stock affects perceived quality and durability",
      "small-batch color consistency needs proofing",
      "coating and lamination choices affect finish and cost",
    ],
    questionsForUser: [
      "What size, paper weight, and finish are required?",
      "Is this single-sided or double-sided printing?",
      "Do you need rounded corners, lamination, or special coating?",
    ],
    complexity: "low",
    sanity: {
      typicalQuantity: { min: 50, max: 100_000 },
      incompatibleProcessKeywords: ["die casting", "electroplating", "压铸", "电镀"],
    },
  },
  packaging_card: {
    likelyProcesses: ["paper stock selection", "foil stamping", "die cutting", "color proofing"],
    keyRisks: [
      "foil stamping requires artwork and mold details to be confirmed",
      "color consistency can vary across paper stocks",
      "die-cut packaging dimensions need physical sample verification",
    ],
    questionsForUser: [
      "What product will the packaging card hold?",
      "Do you have dielines or exact dimensions?",
      "Do you need foil stamping, embossing, hanging holes, or barcodes?",
    ],
    complexity: "medium",
    sanity: {
      typicalQuantity: { min: 100, max: 100_000 },
      incompatibleProcessKeywords: ["die casting", "压铸", "电镀"],
    },
  },
  sticker: {
    likelyProcesses: ["vinyl printing", "kiss cutting", "lamination", "adhesive selection"],
    keyRisks: [
      "adhesive performance depends on target surface",
      "waterproof claims need material confirmation",
      "small text or fine cuts may lose detail",
    ],
    questionsForUser: [
      "What size, shape, and finish are required?",
      "Will stickers be used indoors, outdoors, or on packaging?",
      "Do you need waterproof vinyl, removable adhesive, or sheet format?",
    ],
    complexity: "low",
    sanity: {
      typicalQuantity: { min: 50, max: 200_000 },
      incompatibleProcessKeywords: ["die casting", "压铸", "电镀", "刺绣"],
    },
  },
  print_collateral: {
    likelyProcesses: [
      "offset printing",
      "digital printing",
      "special paper stock",
      "hot foil stamping",
      "spot UV",
      "die cutting",
      "binding",
    ],
    keyRisks: [
      "screen color and printed color differ; a proof or Pantone reference is needed for brand colors",
      "special or uncoated stock shifts ink appearance and needs a paper sample before the run",
      "bleed, safe margins, and fold lines must be corrected before plates are made",
      "foil and spot UV require separate artwork layers and add tooling cost",
    ],
    questionsForUser: [
      "Which items and quantities are required: business cards, folders, brochures, flyers, or envelopes?",
      "What paper stock and weight are required, and is there a brand Pantone color to match?",
      "Are any finishes required, such as foil, spot UV, embossing, rounded corners, or binding?",
      "Do you have print-ready files with bleed, or should the files be prepared before submission?",
    ],
    complexity: "medium",
    sanity: {
      typicalQuantity: { min: 100, max: 200_000 },
      incompatibleProcessKeywords: [
        "die casting",
        "electroplating",
        "injection molding",
        "压铸",
        "电镀",
        "注塑",
      ],
    },
  },
  exhibition_display: {
    likelyProcesses: [
      "large format printing",
      "roll-up and X-banner assembly",
      "foam board and KT board mounting",
      "acrylic and metal structure",
      "on-site installation",
    ],
    keyRisks: [
      "large format artwork must have adequate resolution or it will look soft at viewing distance",
      "structure, weight, and transport method need confirmation for booth and store use",
      "venue rules on size, fire rating, and installation windows are set by the organizer",
      "installation and dismantling labor is usually quoted separately",
    ],
    questionsForUser: [
      "What items and finished sizes are required: roll-up, backdrop, display stand, shelf talker, or signage?",
      "Where will the materials be used: exhibition booth, retail store, or office reception?",
      "Is installation required, and on what date must everything be on site?",
      "Is the artwork available at large-format resolution with the correct bleed?",
    ],
    complexity: "medium",
    sanity: {
      typicalQuantity: { min: 1, max: 5_000 },
      incompatibleProcessKeywords: ["die casting", "enamel", "压铸", "珐琅"],
    },
  },
  apparel: {
    likelyProcesses: [
      "screen printing",
      "embroidery",
      "heat transfer",
      "digital direct-to-garment",
      "cut and sew",
      "woven labels",
    ],
    keyRisks: [
      "size curves differ by supplier and region; a size specification must be agreed before cutting",
      "fabric composition changes hand feel, shrinkage, and print result",
      "embroidery reproduces fine detail and gradients poorly; artwork usually needs simplification",
      "color fastness and shrinkage should be checked on a sample before the full run",
    ],
    questionsForUser: [
      "Which garments and quantities per size are required: polo, tee, jacket, cap, or apron?",
      "What fabric and weight are required, and is there a color reference for the garment?",
      "Which decoration method and positions are required: screen print, embroidery, or heat transfer?",
      "Are woven labels, hang tags, or individual packaging required?",
    ],
    complexity: "medium",
    sanity: {
      typicalQuantity: { min: 20, max: 50_000 },
      incompatibleProcessKeywords: [
        "die casting",
        "electroplating",
        "laser cutting acrylic",
        "压铸",
        "电镀",
      ],
    },
  },
  small_batch_merch: {
    likelyProcesses: [
      "supplier sourcing",
      "sample verification",
      "custom printing",
      "packing check",
    ],
    keyRisks: [
      "process depends heavily on product type and available suppliers",
      "minimum order quantity may differ from requested quantity",
      "sample quality should be checked before bulk production",
    ],
    questionsForUser: [
      "What exact product type and dimensions are required?",
      "Do you have reference photos or artwork files?",
      "Is the priority lowest cost, fastest sample, or best quality?",
    ],
    complexity: "high",
    sanity: {
      typicalQuantity: { min: 10, max: 50_000 },
      incompatibleProcessKeywords: [],
    },
  },
  other: {
    likelyProcesses: ["manual supplier assessment", "process discovery", "sample verification"],
    keyRisks: [
      "manufacturing process is unclear until reviewed by a Reality Operator",
      "supplier capability and MOQ need manual confirmation",
      "timeline and feasibility may change after supplier feedback",
    ],
    questionsForUser: [
      "Can you provide reference images, drawings, or dimensions?",
      "What is the intended use and target market?",
      "What constraints matter most: budget, timeline, quality, or MOQ?",
    ],
    complexity: "high",
    sanity: {
      typicalQuantity: { min: 1, max: 1_000_000 },
      incompatibleProcessKeywords: [],
    },
  },
};

export function assessManufacturingTask(category: ProductCategory): InitialAssessment {
  const entry = KNOWLEDGE_BASE[category];

  return {
    likely_processes: entry.likelyProcesses,
    key_risks: entry.keyRisks,
    questions_for_user: entry.questionsForUser,
    estimated_complexity: entry.complexity,
  };
}

/**
 * Non-blocking category heuristics. Suspicious values become clarification
 * questions; they never reject a structurally valid task or invent a quote.
 */
export function assessOrderSanity(
  category: ProductCategory,
  input: { quantity?: number | null; process?: string | null },
): SanityFlag[] {
  const sanity = KNOWLEDGE_BASE[category].sanity;
  const flags: SanityFlag[] = [];

  if (typeof input.quantity === "number" && Number.isFinite(input.quantity)) {
    if (input.quantity > sanity.typicalQuantity.max) {
      flags.push({
        field: "quantity",
        concern: {
          en: `Quantity ${input.quantity} is above the configured small-batch heuristic for this category (up to approximately ${sanity.typicalQuantity.max}). Confirm that it is not a typo before proceeding.`,
          zh: `数量 ${input.quantity} 超出该品类当前配置的小批量参考区间（约至 ${sanity.typicalQuantity.max}）。请先确认是否误输，再继续推进。`,
        },
      });
    } else if (input.quantity < sanity.typicalQuantity.min) {
      flags.push({
        field: "quantity",
        concern: {
          en: `Quantity ${input.quantity} is below the configured small-batch heuristic for this category (approximately ${sanity.typicalQuantity.min}). Ask whether the user accepts possible minimum-order constraints and higher unit pricing.`,
          zh: `数量 ${input.quantity} 低于该品类当前配置的小批量参考值（约 ${sanity.typicalQuantity.min}）。请确认用户是否接受起订量限制和可能更高的单价。`,
        },
      });
    }
  }

  if (input.process) {
    const normalizedProcess = input.process.toLowerCase();
    const keyword = sanity.incompatibleProcessKeywords.find((candidate) =>
      normalizedProcess.includes(candidate.toLowerCase()),
    );
    if (keyword) {
      flags.push({
        field: "process",
        concern: {
          en: `The requested process includes "${keyword}", which is unusual for this category. Confirm the intended process; the human operator makes the final feasibility decision.`,
          zh: `所填工艺包含“${keyword}”，与该品类常规工艺不符。请确认真实意图，最终可行性由人工操作员判断。`,
        },
      });
    }
  }

  return flags;
}
