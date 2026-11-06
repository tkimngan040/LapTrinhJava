export interface Product {
    id: string;
    name: string;
    brand: string;
    price: number; // VND per spray
    volumeMl: number;
    category: "Men" | "Women" | "Unisex" | "Niche";
    image: string;
    description: string;
    notes: {
        top: string;
        heart: string;
        base: string;
    };
    status: "AVAILABLE" | "LOW_STOCK" | "OUT_OF_STOCK";
}

export const scentStationProducts: Product[] = [
    {
        id: "PROD-001",
        name: "Acqua Di Gio",
        brand: "Giorgio Armani",
        price: 30000,
        volumeMl: 2.5,
        category: "Men",
        image: "/images/acqua-di-gio.jpg",
        description: "A legendary aquatic fragrance embodying the freedom of the wind and sea.",
        notes: { top: "Marine Notes, Bergamot", heart: "Rosemary, Persimmon", base: "Patchouli, Cedar" },
        status: "AVAILABLE"
    },
    {
        id: "PROD-002",
        name: "Acqua Di Gio Profundo",
        brand: "Giorgio Armani",
        price: 35000,
        volumeMl: 2.5,
        category: "Men",
        image: "/images/acqua-di-gio-profundo.jpg",
        description: "An intense aquatic interpretation diving into the deep blue sea depths.",
        notes: { top: "Marine Notes, Green Mandarin", heart: "Lavender, Rosemary", base: "Mineral Amber, Patchouli" },
        status: "AVAILABLE"
    },
    {
        id: "PROD-003",
        name: "Bleu de Chanel",
        brand: "Chanel",
        price: 35000,
        volumeMl: 2.0,
        category: "Men",
        image: "/images/bleu-de-chanel.png",
        description: "An aromatic-woody fragrance with a captivating, resolute character.",
        notes: { top: "Lemon Zest, Bergamot, Mint", heart: "Lavender, Pineapple, Geranium", base: "Cedar, Sandalwood, Amber" },
        status: "AVAILABLE"
    },
    {
        id: "PROD-004",
        name: "Burberry Goddess",
        brand: "Burberry",
        price: 32000,
        volumeMl: 2.0,
        category: "Women",
        image: "/images/burberry-goddess.jpg",
        description: "A unique gourmand aromatic fragrance led by a powerful trio of vanillas.",
        notes: { top: "Vanilla Infusion, Lavender", heart: "Vanilla Caviar", base: "Vanilla Absolute" },
        status: "AVAILABLE"
    },
    {
        id: "PROD-005",
        name: "Burberry Her",
        brand: "Burberry",
        price: 30000,
        volumeMl: 2.0,
        category: "Women",
        image: "/images/burberry-her.jpg",
        description: "A vibrant fruity-floral scent capturing the spirited attitude of London.",
        notes: { top: "Blackcurrant, Blueberry, Raspberry", heart: "Jasmine, Violet", base: "Musk, Dry Amber" },
        status: "AVAILABLE"
    },
    {
        id: "PROD-006",
        name: "Good Girl",
        brand: "Carolina Herrera",
        price: 35000,
        volumeMl: 2.0,
        category: "Women",
        image: "/images/carolina-herrera-good-girl.jpg",
        description: "A sensual, evocative fragrance born from the beautiful contradictions of modern femininity.",
        notes: { top: "Almond, Coffee", heart: "Jasmine Sambac, Tuberose", base: "Tonka Bean, Cacao" },
        status: "AVAILABLE"
    },
    {
        id: "PROD-007",
        name: "Club de Nuit Intense Man",
        brand: "Armaf",
        price: 25000,
        volumeMl: 2.0,
        category: "Men",
        image: "/images/club-de-nuit-intense.jpg",
        description: "A bold, smoky, and woody fragrance with explosive masculine projection.",
        notes: { top: "Lemon, Pineapple, Blackcurrant", heart: "Birch, Jasmine, Rose", base: "Musk, Ambergris, Patchouli" },
        status: "AVAILABLE"
    },
    {
        id: "PROD-008",
        name: "Club de Nuit Maleka",
        brand: "Armaf",
        price: 28000,
        volumeMl: 2.0,
        category: "Unisex",
        image: "/images/club-de-nuit-maleka.jpg",
        description: "An exotic and alluring scent profile designed for standout presence.",
        notes: { top: "Spicy Accents, Bergamot", heart: "Floral Notes, Oud", base: "Amber, Musk, Woods" },
        status: "AVAILABLE"
    },
    {
        id: "PROD-009",
        name: "Coco Mademoiselle",
        brand: "Chanel",
        price: 38000,
        volumeMl: 2.0,
        category: "Women",
        image: "/images/coco-mademoiselle.jpg",
        description: "An irresistible oriental amber fragrance with a spirited and fresh character.",
        notes: { top: "Orange, Mandarin Orange, Bergamot", heart: "Turkish Rose, Jasmine, Mimosa", base: "Patchouli, Vanilla, White Musk" },
        status: "AVAILABLE"
    },
    {
        id: "PROD-010",
        name: "Creed Aventus",
        brand: "Creed",
        price: 50000,
        volumeMl: 1.5,
        category: "Niche",
        image: "/images/creed-aventus.jpg",
        description: "The iconic symbol of strength, power, and success for the modern connoisseur.",
        notes: { top: "Blackcurrant, Italian Bergamot, Apple, Pineapple", heart: "Rose, Dry Birch, Moroccan Jasmine", base: "Musk, Oakmoss, Ambergris" },
        status: "AVAILABLE"
    },
    {
        id: "PROD-011",
        name: "Dior Sauvage",
        brand: "Dior",
        price: 35000,
        volumeMl: 2.0,
        category: "Men",
        image: "/images/dior-sauvage.jpg",
        description: "A radically fresh composition, dictated by a name that has the ring of manifest truth.",
        notes: { top: "Reggio Calabria Bergamot, Pepper", heart: "Sichuan Pepper, Lavender, Pink Pepper", base: "Ambroxan, Cedar, Labdanum" },
        status: "AVAILABLE"
    },
    {
        id: "PROD-012",
        name: "Le Male",
        brand: "Jean Paul Gaultier",
        price: 32000,
        volumeMl: 2.0,
        category: "Men",
        image: "/images/jean-paul-gaultier-le-male.jpg",
        description: "A virile and proud fragrance offering a comforting, traditional trail.",
        notes: { top: "Mint, Lavender, Bergamot", heart: "Cinnamon, Cumin, Orange Blossom", base: "Vanilla, Tonka Bean, Sandalwood" },
        status: "AVAILABLE"
    },
    {
        id: "PROD-013",
        name: "Scandal",
        brand: "Jean Paul Gaultier",
        price: 33000,
        volumeMl: 2.0,
        category: "Women",
        image: "/images/jean-paul-gaultier-scandal.jpg",
        description: "An addictive honey-chypre floral fragrance breaking all standard clichés.",
        notes: { top: "Blood Orange, Mandarin", heart: "Honey, Gardenia, Peach, Orange Blossom", base: "Beeswax, Patchouli, Caramel" },
        status: "AVAILABLE"
    },
    {
        id: "PROD-014",
        name: "Another 13",
        brand: "Le Labo",
        price: 55000,
        volumeMl: 1.5,
        category: "Niche",
        image: "/images/le-labo-another-13.jpg",
        description: "An hypnotic and unique molecular composition built around ambroxan.",
        notes: { top: "Iso E Super, Amyl Salicylate", heart: "Jasmin, Moss", base: "Ambroxan, Musk" },
        status: "AVAILABLE"
    },
    {
        id: "PROD-015",
        name: "By the Fireplace",
        brand: "Maison Margiela",
        price: 45000,
        volumeMl: 1.5,
        category: "Niche",
        image: "/images/maison-margiela-by-the-fireplace.jpg",
        description: "A comforting smoky and woody fragrance recreating the cozy warmth of a winter fireplace.",
        notes: { top: "Clove Oil, Pink Pepper, Orange Blossom", heart: "Chestnut Accord, Guaiac Wood, Cade Oil", base: "Vanilla, Cashmeran, Peru Balsam" },
        status: "AVAILABLE"
    },
    {
        id: "PROD-016",
        name: "MCM EDP",
        brand: "MCM",
        price: 30000,
        volumeMl: 2.0,
        category: "Unisex",
        image: "/images/mcm-edp.jpg",
        description: "A playful, energetic fragrance merging classic floral and modern street aesthetics.",
        notes: { top: "Raspberry, Jasmine", heart: "Violet Leaf, White Peony", base: "White Moss, Vanilla, Ambrox" },
        status: "AVAILABLE"
    },
    {
        id: "PROD-017",
        name: "Baccarat Rouge 540",
        brand: "Maison Francis Kurkdjian",
        price: 60000,
        volumeMl: 1.5,
        category: "Niche",
        image: "/images/mfk-baccarat-rouge-540.jpg",
        description: "A luminous and sophisticated amber-floral breeze touching the skin like an amber blossom.",
        notes: { top: "Jasmin, Saffron", heart: "Amberwood, Ambergris", base: "Fir Resin, Cedar" },
        status: "AVAILABLE"
    },
    {
        id: "PROD-018",
        name: "Miss Dior Blooming Bouquet",
        brand: "Dior",
        price: 35000,
        volumeMl: 2.0,
        category: "Women",
        image: "/images/miss-dior-blooming-bouquet.jpg",
        description: "An instant burst of floral tenderness designed like a dress embroidered with flowers.",
        notes: { top: "Calabrian Bergamot", heart: "Damask Rose, Peony", base: "White Musk" },
        status: "AVAILABLE"
    },
    {
        id: "PROD-019",
        name: "Explorer",
        brand: "Montblanc",
        price: 26000,
        volumeMl: 2.0,
        category: "Men",
        image: "/images/montblanc-explorer.jpg",
        description: "An invitation to an adventurous olfactory journey across untamed nature.",
        notes: { top: "Bergamot, Pink Pepper, Clary Sage", heart: "Leather, Vetiver", base: "Patchouli, Cocoa, Ambrofix" },
        status: "AVAILABLE"
    },
    {
        id: "PROD-020",
        name: "Legend",
        brand: "Montblanc",
        price: 25000,
        volumeMl: 2.0,
        category: "Men",
        image: "/images/montblanc-legend.jpg",
        description: "A charismatic and modern fougère fragrance expressing subtle strength and authenticity.",
        notes: { top: "Lavender, Pineapple, Bergamot, Verbena", heart: "Red Apple, Dried Fruits, Oakmoss, Geranium", base: "Tonka Bean, Sandalwood" },
        status: "AVAILABLE"
    },
    {
        id: "PROD-021",
        name: "For Her",
        brand: "Narciso Rodriguez",
        price: 32000,
        volumeMl: 2.0,
        category: "Women",
        image: "/images/narciso-rodriguez-for-her.jpg",
        description: "An iconic modern musk masterpiece radiating elegance, mystery, and grace.",
        notes: { top: "Honey Flower, Orange Blossom, Osmanthus", heart: "Heart of Musk, Amber", base: "Vetiver, Vanille, Patchouli" },
        status: "AVAILABLE"
    },
    {
        id: "PROD-022",
        name: "Pure Musc",
        brand: "Narciso Rodriguez",
        price: 34000,
        volumeMl: 2.0,
        category: "Women",
        image: "/images/narciso-rodriguez-pure-musc.jpg",
        description: "A pure addiction celebrating the transcendent beauty of musk in its absolute form.",
        notes: { top: "Musk", heart: "Floral Notes", base: "Cashmeran" },
        status: "AVAILABLE"
    },
    {
        id: "PROD-023",
        name: "1 Million",
        brand: "Paco Rabanne",
        price: 30000,
        volumeMl: 2.0,
        category: "Men",
        image: "/images/paco-rabanne-1-million.jpg",
        description: "A flamboyant and bold leather fragrance for the man who dares to command wealth.",
        notes: { top: "Blood Mandarin, Grapefruit, Mint", heart: "Cinnamon, Spicy Notes, Rose", base: "Amber, Leather, Woody Notes, Patchouli" },
        status: "AVAILABLE"
    },
    {
        id: "PROD-024",
        name: "Invictus",
        brand: "Paco Rabanne",
        price: 30000,
        volumeMl: 2.0,
        category: "Men",
        image: "/images/paco-rabanne-invictus.jpg",
        description: "A clash of biting freshness and animal sensuality representing champion energy.",
        notes: { top: "Marine Notes, Grapefruit, Mandarin", heart: "Bay Leaf, Jasmine", base: "Ambergris, Guaiac Wood, Oakmoss, Patchouli" },
        status: "AVAILABLE"
    },
    {
        id: "PROD-025",
        name: "Sedley",
        brand: "Parfums de Marly",
        price: 52000,
        volumeMl: 1.5,
        category: "Niche",
        image: "/images/parfums-de-marly-sedley.jpg",
        description: "A modern, refreshing aquatic-citrus explosion combining classical elegance with lightness.",
        notes: { top: "Bergamot, Spearmint, Watery Notes", heart: "Geranium, Lavender, Sunnotes", base: "Incense, Sandalwood, Vetiver" },
        status: "AVAILABLE"
    },
    {
        id: "PROD-026",
        name: "Elysium",
        brand: "Roja Dove",
        price: 58000,
        volumeMl: 1.5,
        category: "Niche",
        image: "/images/roja-elysium.jpg",
        description: "An ultra-luxurious creation for the man who needs no directions, he makes his own.",
        notes: { top: "Lemon, Bergamot, Grapefruit, Thyme", heart: "Lily of the Valley, Rose, Apple, Blackcurrant", base: "Vetiver, Cedarwood, Ambergris, Leather" },
        status: "AVAILABLE"
    },
    {
        id: "PROD-027",
        name: "Black Orchid",
        brand: "Tom Ford",
        price: 48000,
        volumeMl: 1.5,
        category: "Niche",
        image: "/images/tom-ford-black-orchid.jpg",
        description: "A luxurious and sensual fragrance of rich, dark accords and an alluring potion of black orchids.",
        notes: { top: "Truffle, Gardenia, Black Currant, Ylang-Ylang", heart: "Orchid, Spices, Fruity Notes", base: "Mexican Chocolate, Patchouli, Vanilla, Incense" },
        status: "AVAILABLE"
    },
    {
        id: "PROD-028",
        name: "Born in Roma",
        brand: "Valentino",
        price: 36000,
        volumeMl: 2.0,
        category: "Unisex",
        image: "/images/valentino-born-in-roma.jpg",
        description: "A modern haute couture floriental fragrance fusing edgy street culture with Roman heritage.",
        notes: { top: "Blackcurrant Accord, Bergamot", heart: "Jasmine Grandiflorum, Jasmine Tea", base: "Bourbon Vanilla, Cashmeran, Guaiac Wood" },
        status: "AVAILABLE"
    },
    {
        id: "PROD-029",
        name: "Bright Crystal",
        brand: "Versace",
        price: 28000,
        volumeMl: 2.0,
        category: "Women",
        image: "/images/versace-bright-crystal.jpg",
        description: "A precious jewel of rare beauty characterized by a fresh, vibrant, flowery scent.",
        notes: { top: "Yuzu, Pomegranate, Frosted Accord", heart: "Peony, Magnolia, Lotus Flower", base: "Acajou, Amber, Musk" },
        status: "AVAILABLE"
    },
    {
        id: "PROD-030",
        name: "Dylan Blue",
        brand: "Versace",
        price: 30000,
        volumeMl: 2.0,
        category: "Men",
        image: "/images/versace-dylan-blue.jpg",
        description: "A strong, distinctive fragrance embodying modern masculinity and charismatic strength.",
        notes: { top: "Calabrian Bergamot, Grapefruit, Aquatic Notes", heart: "Violet Leaf, Papyrus, Patchouli, Black Pepper", base: "Mineral Musk, Tonka Bean, Saffron" },
        status: "AVAILABLE"
    },
    {
        id: "PROD-031",
        name: "Eros",
        brand: "Versace",
        price: 31000,
        volumeMl: 2.0,
        category: "Men",
        image: "/images/versace-eros.jpg",
        description: "A fragrance that interprets sublime masculine seduction through a luminous aura.",
        notes: { top: "Mint Oil, Italian Lemon, Green Apple", heart: "Tonka Bean, Venezuelan Ambroxan, Geranium", base: "Madagascar Vanilla, Vetiver, Oakmoss" },
        status: "AVAILABLE"
    },
    {
        id: "PROD-032",
        name: "Libre",
        brand: "Yves Saint Laurent",
        price: 38000,
        volumeMl: 2.0,
        category: "Women",
        image: "/images/ysl-libre.jpg",
        description: "The fragrance of freedom — a grand floral statement for a woman who lives by her own rules.",
        notes: { top: "Mandarin Oil, Lavender Oil, Blackcurrant", heart: "Jasminum Sambac, Orange Blossom, Jasmine", base: "Madagascar Vanilla, Cedarwood, Ambergris" },
        status: "AVAILABLE"
    },
    {
        id: "PROD-033",
        name: "Y EDP",
        brand: "Yves Saint Laurent",
        price: 36000,
        volumeMl: 2.0,
        category: "Men",
        image: "/images/ysl-y-edp.jpg",
        description: "The expression of a man who dares to follow his passions and carve his own path.",
        notes: { top: "Bergamot, Ginger, Apple", heart: "Sage, Geranium, Juniper Berries", base: "Vetiver, Cedar, Patchouli, Labdanum" },
        status: "AVAILABLE"
    }
];