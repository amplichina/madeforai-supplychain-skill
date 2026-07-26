import { assessManufacturingTask } from "../domain/manufacturingKnowledge.js";
import {
  GenerateArtworkBriefInputSchema,
  type GenerateArtworkBriefInput,
  type ProductCategory,
} from "../domain/schemas.js";

export type GenerateArtworkBriefOutput = {
  product_category: ProductCategory;
  user_language: "en" | "zh";
  brief_text: string;
  production_artwork_checklist: string[];
  file_requirements: string[];
  questions_for_user: string[];
  safety_boundaries: string[];
  next_step: string;
};

const CATEGORY_ARTWORK_REQUIREMENTS: Record<ProductCategory, string[]> = {
  badge: [
    "Vector artwork with separated enamel color areas",
    "Pantone or approximate color references for each fill area",
    "Metal finish preference, such as gold, nickel, black nickel, or antique",
    "Backing type and packaging reference if needed",
  ],
  acrylic: [
    "High-resolution transparent PNG or vector artwork",
    "Cut line path showing final acrylic shape",
    "Front/back print direction and white ink layer requirements",
    "Accessory holes, stand slots, keychain holes, or magnet placement",
  ],
  card: [
    "Print-ready front and back artwork",
    "Final size, bleed, safe area, and corner radius if any",
    "Paper weight and surface finish reference",
    "Color mode or proofing requirement for brand-critical colors",
  ],
  packaging_card: [
    "Dieline or exact flat size with bleed and fold/cut marks",
    "Product mounting method, holes, slots, or adhesive points",
    "Special process layers, such as foil, embossing, spot UV, or barcode",
    "Paper stock and finish reference",
  ],
  sticker: [
    "High-resolution PNG or vector artwork",
    "Kiss-cut or die-cut outline",
    "Sticker size, finish, and sheet or individual format",
    "Indoor/outdoor use, waterproof requirement, and adhesive preference",
  ],
  print_collateral: [
    "Print-ready PDF with 3mm bleed, crop marks, and outlined fonts",
    "Pantone or CMYK reference for brand colors",
    "Paper stock, weight, and finish preference, with a physical sample if color is critical",
    "Fold, die-cut, foil, and spot UV layers supplied separately",
  ],
  exhibition_display: [
    "Large-format artwork at adequate resolution for the finished size",
    "Finished dimensions and safe area allowing for frame, base, and overlap",
    "Structure preference: roll-up, X-banner, backdrop, rigid board, or acrylic",
    "Venue, installation date, and any organizer restrictions on size or materials",
  ],
  apparel: [
    "Vector artwork for screen print or embroidery, with color count noted",
    "Print or embroidery positions and finished decoration size",
    "Garment type, fabric composition, color reference, and quantity per size",
    "Woven label, hang tag, and individual packaging requirements if any",
  ],
  small_batch_merch: [
    "Reference images showing product shape, material, and finish",
    "Logo or artwork files with placement instructions",
    "Dimensions, color requirements, and packaging references",
    "Any compliance, labeling, or target-market constraints",
  ],
  other: [
    "Reference images, drawings, or sketches showing the intended product",
    "Dimensions, material preference, and expected finish",
    "Artwork files or logo placement instructions if customization is needed",
    "Quality target, usage scenario, and packaging expectations",
  ],
};

const CATEGORY_ARTWORK_REQUIREMENTS_ZH: Record<ProductCategory, string[]> = {
  badge: [
    "矢量图稿，珐琅填色区域需要清楚分层",
    "每个颜色区域提供 Pantone 或接近色号",
    "确认金属电镀颜色，例如金色、镍色、黑镍或古铜",
    "如需背卡、蝴蝶扣、磁吸或独立包装，请提供参考",
  ],
  acrylic: [
    "高清透明 PNG 或矢量图稿",
    "标明最终亚克力外形的刀线",
    "确认单面/双面印刷、白墨层和正反方向",
    "标明钥匙扣孔、支架槽、磁铁或配件位置",
  ],
  card: [
    "正反面可印刷图稿",
    "最终尺寸、出血、安全区和圆角要求",
    "纸张克重、表面工艺和手感参考",
    "如品牌色敏感，请说明打样或色彩校对要求",
  ],
  packaging_card: [
    "刀模线或准确展开尺寸，包含出血、折线和切线",
    "产品固定方式，例如挂孔、卡槽、胶点或扎带孔",
    "特殊工艺图层，例如烫金、击凸、局部 UV 或条码",
    "纸张材质、克重和表面处理参考",
  ],
  sticker: [
    "高清 PNG 或矢量图稿",
    "明确亲吻切或全切刀线",
    "贴纸尺寸、表面工艺、单张或整版格式",
    "说明室内/户外、防水和胶水要求",
  ],
  print_collateral: [
    "印刷成品 PDF，包含 3mm 出血、裁切标记，字体转曲",
    "品牌色提供 Pantone 或 CMYK 色值",
    "确认纸张材质、克重与表面工艺；对色要求高时请提供纸样",
    "折线、刀模、烫金、局部 UV 请分层提供",
  ],
  exhibition_display: [
    "大幅面图稿分辨率需匹配成品尺寸",
    "标明成品尺寸与安全区，预留边框、底座与搭接",
    "确认结构形式：易拉宝、X 展架、背景板、KT 板或亚克力",
    "说明使用场地、进场安装日期及主办方对尺寸材料的限制",
  ],
  apparel: [
    "印花或刺绣使用矢量图稿，并标明颜色数量",
    "标明印绣位置与成品尺寸",
    "确认服装款式、面料成分、颜色参考及各尺码数量",
    "如需织唛、吊牌或独立包装请一并说明",
  ],
  small_batch_merch: [
    "展示产品形状、材质和表面效果的参考图",
    "Logo 或定制图稿文件，并说明放置位置",
    "尺寸、颜色要求和包装参考",
    "目标市场、标签或合规要求",
  ],
  other: [
    "展示目标产品的参考图、草图或结构图",
    "尺寸、材质偏好和表面效果要求",
    "如需定制，请提供图稿文件或 Logo 放置说明",
    "质量目标、使用场景和包装预期",
  ],
};

const COMMON_FILE_REQUIREMENTS_EN = [
  "Use production-ready source files when possible: AI, SVG, PDF, PSD, or high-resolution PNG.",
  "Include dimensions, bleed, safe area, cut lines, and process layers where relevant.",
  "Use public URLs or accessible cloud links for asset submission. Do not upload private credentials.",
  "Do not include payment information or sensitive identity documents in artwork links.",
];

const COMMON_FILE_REQUIREMENTS_ZH = [
  "尽量提供可生产源文件：AI、SVG、PDF、PSD，或高清 PNG。",
  "如适用，请包含尺寸、出血、安全区、刀线、工艺图层。",
  "提交素材时使用可访问的公开链接或云盘链接，不要提交私密账号凭证。",
  "素材链接中不要包含支付信息或敏感身份证明文件。",
];

const SAFETY_BOUNDARIES_EN = [
  "MadeForAI does not generate artwork or images.",
  "MadeForAI does not judge intellectual-property ownership.",
  "MadeForAI does not place orders automatically.",
  "A human Reality Operator must confirm feasibility, price, sample quality, and lead time.",
];

const SAFETY_BOUNDARIES_ZH = [
  "MadeForAI 不生成图片或图库素材。",
  "MadeForAI 不判断知识产权归属。",
  "MadeForAI 不会自动下单。",
  "必须由人工 Reality Operator 确认可行性、价格、样品质量和交期。",
];

function buildEnglishBrief(input: GenerateArtworkBriefInput): string {
  const product = input.product_name ?? input.product_category;
  const lines = [
    `Prepare production-ready artwork for ${product}.`,
    input.manufacturing_goal ? `Goal: ${input.manufacturing_goal}` : null,
    input.quantity ? `Target quantity: ${input.quantity}` : null,
    input.target_market ? `Target market: ${input.target_market}` : null,
    "Use your own AI tool or designer to create the artwork, then submit the final asset URLs through create_supplychain_task.",
    "Prices, materials, processes, and lead times must still be manually confirmed by a human Reality Operator.",
  ];

  return lines.filter(Boolean).join("\n");
}

function buildChineseBrief(input: GenerateArtworkBriefInput): string {
  const product = input.product_name ?? input.product_category;
  const lines = [
    `请为「${product}」准备符合生产要求的图库/设计素材。`,
    input.manufacturing_goal ? `制造目标：${input.manufacturing_goal}` : null,
    input.quantity ? `目标数量：${input.quantity}` : null,
    input.target_market ? `目标市场：${input.target_market}` : null,
    "你可以使用自己的 Codex、Claude、Gemini 或设计师生成/整理素材，然后把最终素材链接通过 create_supplychain_task 提交。",
    "价格、材质、工艺、打样质量和交期仍然必须由人工 Reality Operator 确认。",
  ];

  return lines.filter(Boolean).join("\n");
}

export async function generateArtworkBrief(input: unknown): Promise<GenerateArtworkBriefOutput> {
  const parsed = GenerateArtworkBriefInputSchema.parse(input);
  const assessment = assessManufacturingTask(parsed.product_category);
  const userLanguage = parsed.language === "zh" ? "zh" : "en";
  const isChinese = userLanguage === "zh";

  return {
    product_category: parsed.product_category,
    user_language: userLanguage,
    brief_text: isChinese ? buildChineseBrief(parsed) : buildEnglishBrief(parsed),
    production_artwork_checklist: isChinese
      ? CATEGORY_ARTWORK_REQUIREMENTS_ZH[parsed.product_category]
      : CATEGORY_ARTWORK_REQUIREMENTS[parsed.product_category],
    file_requirements: isChinese ? COMMON_FILE_REQUIREMENTS_ZH : COMMON_FILE_REQUIREMENTS_EN,
    questions_for_user: assessment.questions_for_user,
    safety_boundaries: isChinese ? SAFETY_BOUNDARIES_ZH : SAFETY_BOUNDARIES_EN,
    next_step:
      "After the user provides production-ready asset URLs and order details, call create_supplychain_task.",
  };
}
