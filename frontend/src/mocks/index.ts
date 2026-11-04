export interface ApiError {
    timestamp: string;
    status: number;
    code: string;
    message: string;
}

export interface AuthUser {
    id: number;
    fullName: string;
    email: string;
    brandId: number | null;
    roles: string[];
}

export interface LoginResponse {
    token: string;
    user: AuthUser;
}

export interface MachineMenuSlot {
    slotNumber: number;
    productId?: string | number;
    productName: string;
    notes: string;
    imageUrl: string;
    price: number; // Kiosk Experience Price per spray in VND
    available: boolean;
    retailPrice10ml?: number | null;
    retailPriceSource?: string | null;
    retailPriceCheckedAt?: string;
    brand?: string;
    concentration?: string;
    audience?: "Men" | "Women" | "Unisex";
    fragranceFamily?: string;
    description?: string;
}

export interface MachineMenuResponse {
    deviceId: string;
    status: string;
    slots: MachineMenuSlot[];
}

export interface CreateOrderResponse {
    orderId: number;
    status: string;
    price: number;
    qrContent: string;
    expiresAt: string;
}

export interface OrderStatusResponse {
    orderId: number;
    status: string;
    failureReason: string | null;
}

interface MockAccount {
    email: string;
    password: string;
    user: AuthUser;
    locked: boolean;
}

// Mock accounts for Frontend testing only
export const MOCK_ACCOUNTS: MockAccount[] = [
    {
        email: "admin@scentstation.local",
        password: "ScentDemo123!",
        locked: false,
        user: {
            id: 1,
            fullName: "Platform Administrator",
            email: "admin@scentstation.local",
            brandId: null,
            roles: ["PSA"],
        },
    },
    {
        email: "viewer@scentstation.local",
        password: "ScentDemo123!",
        locked: false,
        user: {
            id: 2,
            fullName: "Viewer Account",
            email: "viewer@scentstation.local",
            brandId: null,
            roles: ["VW"],
        },
    },
    {
        email: "locked@scentstation.local",
        password: "ScentDemo123!",
        locked: true,
        user: {
            id: 3,
            fullName: "Locked Account",
            email: "locked@scentstation.local",
            brandId: null,
            roles: ["VW"],
        },
    },
];

export function mockLogin(
    email: string,
    password: string,
): LoginResponse {
    const account = MOCK_ACCOUNTS.find(
        (item) => item.email === email.trim().toLowerCase(),
    );

    if (!account || account.password !== password) {
        throw new Error("Invalid email or password.");
    }

    if (account.locked) {
        throw new Error("Your account has been locked. Please contact the administrator.");
    }

    return {
        token: `mock-jwt-token-${account.user.id}`,
        user: account.user,
    };
}

export const mockLoginResponse: LoginResponse = {
    token: "mock-jwt-token-1",
    user: MOCK_ACCOUNTS[0].user,
};

export const mockCreateOrderResponse: CreateOrderResponse = {
    orderId: 55,
    status: "PENDING",
    price: 20000,
    qrContent: "MOCK-QR-ORDER-55",
    expiresAt: "2026-11-05T10:30:00Z",
};

export const mockOrderStatus: OrderStatusResponse = {
    orderId: 55,
    status: "DISPENSING",
    failureReason: null,
};

export const mockApiError: ApiError = {
    timestamp: "2026-11-05T10:30:00Z",
    status: 400,
    code: "SLOT_EMPTY",
    message: "Slot has insufficient volume",
};

export const mockMachineMenu: MachineMenuResponse = {
    deviceId: "demo-device",
    status: "ONLINE",
    slots: [
        {
            slotNumber: 1,
            productId: "mcm-edp-01",
            productName: "MCM EDP",
            brand: "MCM",
            concentration: "Eau de Parfum",
            audience: "Unisex",
            fragranceFamily: "Floral Fruity",
            description: "An energizing fragrance that blends vibrant raspberry, fresh jasmine, and clean woody notes, housed in the iconic Stark backpack bottle.",
            notes: "Raspberry, apricot, hand-picked jasmine, white moss",
            price: 10000,
            available: true,
            imageUrl: "/images/mcm-edp.jpg"
        },
        {
            slotNumber: 3,
            productId: "dior-sauvage-03",
            productName: "Dior Sauvage EDT",
            brand: "Dior",
            concentration: "Eau de Toilette",
            audience: "Men",
            fragranceFamily: "Aromatic Fougere",
            description: "A radically fresh composition, dictated by a name that has the ring of something raw. Calabrian bergamot meets woody amber and Sichuan pepper.",
            notes: "Calabrian bergamot, Sichuan pepper, Ambroxan, woody notes",
            price: 12000,
            available: true,
            imageUrl: "/images/dior-sauvage.jpg"
        },
        {
            slotNumber: 4,
            productId: "bleu-chanel-04",
            productName: "Bleu de Chanel EDP",
            brand: "Chanel",
            concentration: "Eau de Parfum",
            audience: "Men",
            fragranceFamily: "Woody Aromatic",
            description: "An aromatic-woody fragrance with a captivating trail. Encapsulates a spirit of independence and determination with citrus freshness and amber cedar notes.",
            notes: "Lemon, mint, pink pepper, grapefruit, ginger, cedar, sandalwood, frankincense",
            price: 12000,
            available: true,
            imageUrl: "/images/bleu-de-chanel.png"
        },
        {
            slotNumber: 5,
            productId: "coco-mademoiselle-05",
            productName: "Chanel Coco Mademoiselle EDP",
            brand: "Chanel",
            concentration: "Eau de Parfum",
            audience: "Women",
            fragranceFamily: "Amber Floral",
            description: "An elegant, modern amber-floral composition with vibrant orange notes, fresh rose, May jasmine, and warm patchouli base accents.",
            notes: "Vibrant orange, Turkish rose, Grasse jasmine, patchouli, tonka bean, vetiver",
            price: 15000,
            available: true,
            imageUrl: "/images/coco-mademoiselle.jpg"
        },
        {
            slotNumber: 6,
            productId: "ysl-libre-06",
            productName: "YSL Libre EDP",
            brand: "Yves Saint Laurent",
            concentration: "Eau de Parfum",
            audience: "Women",
            fragranceFamily: "Floral Amber",
            description: "A grand floral fragrance with an unapologetically bold French lavender essence, sensual Moroccan orange blossom, and a daring twist of musk accord.",
            notes: "Mandarin oil, lavender, orange blossom, jasmine sambac, vanilla, ambergris",
            price: 15000,
            available: true,
            imageUrl: "/images/ysl-libre.jpg"
        },
        {
            slotNumber: 7,
            productId: "ysl-y-edp-07",
            productName: "YSL Y EDP",
            brand: "Yves Saint Laurent",
            concentration: "Eau de Parfum",
            audience: "Men",
            fragranceFamily: "Woody Aromatic",
            description: "An intense woody aromatic scent capturing the essence of the accomplished man. Fresh apple and bergamot meet deep sage, geranium, and rich amber wood.",
            notes: "Apple, ginger, bergamot, sage, juniper berries, geranium, amberwood, tonka bean, cedar",
            price: 13000,
            available: true,
            imageUrl: "/images/ysl-y-edp.jpg"
        },
        {
            slotNumber: 8,
            productId: "versace-eros-08",
            productName: "Versace Eros EDT",
            brand: "Versace",
            concentration: "Eau de Toilette",
            audience: "Men",
            fragranceFamily: "Aromatic Fougere",
            description: "A passionate and vibrant fragrance interpreting sublime masculine heroism through a unique combination of fresh mint leaves, Italian lemon zest, and green apple.",
            notes: "Mint, green apple, Italian lemon, tonka bean, Venezuelan ambroxan, geranium flower, vanilla, cedarwood",
            price: 11000,
            available: true,
            imageUrl: "/images/versace-eros.jpg"
        },
        {
            slotNumber: 9,
            productId: "versace-dylan-blue-09",
            productName: "Versace Pour Homme Dylan Blue",
            brand: "Versace",
            concentration: "Eau de Toilette",
            audience: "Men",
            fragranceFamily: "Aromatic Fougere",
            description: "A strong, characterful fragrance that embodies modern masculinity. Combines watery freshness with citrus nuances, fig leaves, and a warm mineral musk base.",
            notes: "Calabrian bergamot, grapefruit, fig leaf, aquatic notes, violet leaf, black pepper, papyrus wood, patchouli, mineral musk, tonka bean",
            price: 11000,
            available: true,
            imageUrl: "/images/versace-dylan-blue.jpg"
        },
        {
            slotNumber: 10,
            productId: "versace-bright-crystal-10",
            productName: "Versace Bright Crystal EDT",
            brand: "Versace",
            concentration: "Eau de Toilette",
            audience: "Women",
            fragranceFamily: "Floral Fruity",
            description: "A precious jewel of rare beauty characterized by a fresh, vibrant, and flowery scent. Chilled yuzu and pomegranate blend with soothing peony, lotus, and magnolia.",
            notes: "Yuzu, pomegranate, iced accord, peony, lotus, magnolia, acajou wood, plant amber, musk",
            price: 11000,
            available: true,
            imageUrl: "/images/versace-bright-crystal.jpg"
        },
        {
            slotNumber: 11,
            productId: "miss-dior-blooming-bouquet-11",
            productName: "Miss Dior Blooming Bouquet EDT",
            brand: "Dior",
            concentration: "Eau de Toilette",
            audience: "Women",
            fragranceFamily: "Floral",
            description: "An instant pleasure, a declaration of love for life. A luminous floral fragrance centered around Damask rose, peony, and a soft embrace of white musks.",
            notes: "Calabrian bergamot, Damask rose, peony, apricot, peach, white musk",
            price: 14000,
            available: true,
            imageUrl: "/images/miss-dior-blooming-bouquet.jpg"
        },
        {
            slotNumber: 12,
            productId: "club-de-nuit-intense-12",
            productName: "Armaf Club de Nuit Intense Man",
            brand: "Armaf",
            concentration: "Eau de Toilette",
            audience: "Men",
            fragranceFamily: "Woody Spicy",
            description: "A bold and provocative woody spicy fragrance that opens with fresh fruity notes of lemon, apple, and blackcurrant, leading to an opulent floral heart and a rich smoky base.",
            notes: "Lemon, pineapple, bergamot, blackcurrant, apple, birch, jasmine, rose, musk, ambergris, patchouli, vanilla",
            price: 9000,
            available: true,
            imageUrl: "/images/club-de-nuit-intense.jpg"
        },
        {
            slotNumber: 13,
            productId: "acqua-di-gio-13",
            productName: "Acqua Di Giò EDT",
            brand: "Giorgio Armani",
            concentration: "Eau de Toilette",
            audience: "Men",
            fragranceFamily: "Aromatic Aquatic",
            description: "A iconic aquatic, aromatic fragrance born from the Mediterranean sea. Fresh calabrian bergamot, neroli, and green tangerine blend with marine notes and cedarwood.",
            notes: "Lime, lemon, bergamot, jasmine, orange, neroli, sea notes, peach, freesia, cyclamen, cedar, patchouli, white musk, oakmoss",
            price: 11000,
            available: true,
            imageUrl: "/images/acqua-di-gio.jpg"
        },
        {
            slotNumber: 14,
            productId: "acqua-di-gio-profondo-14",
            productName: "Acqua Di Giò Profondo",
            brand: "Giorgio Armani",
            concentration: "Eau de Parfum",
            audience: "Men",
            fragranceFamily: "Aromatic Aquatic",
            description: "An intense aquatic interpretation of Acqua Di Giò. Marine notes and zesty bergamot blend with aromatic rosemary, lavender, and deep mineral patchouli.",
            notes: "Marine notes, aquozone, bergamot, green mandarin, rosemary, cypress, lavender, mastic, mineral amber, patchouli, musk",
            price: 12500,
            available: true,
            imageUrl: "/images/acqua-di-gio-profondo.jpg"
        },
        {
            slotNumber: 15,
            productId: "roja-elysium-15",
            productName: "Roja Parfums Elysium",
            brand: "Roja Parfums",
            concentration: "Parfum Cologne",
            audience: "Men",
            fragranceFamily: "Fougere Aromatic",
            description: "An ultra-luxurious creation that translates supreme elegance. A complex blend of ultra-fresh citrus and herbal notes resting upon an intensely rich, complex woody and amber base.",
            notes: "Lemon, bergamot, grapefruit, lime, thyme, artemisia, lily of the valley, rose, jasmine, apple, blackcurrant, pink pepper, cedarwood, vetiver, ambergris, musk",
            price: 25000,
            available: true,
            imageUrl: "/images/roja-elysium.jpg"
        },
        {
            slotNumber: 16,
            productId: "parfums-de-marly-sedley-16",
            productName: "Parfums de Marly Sedley",
            brand: "Parfums de Marly",
            concentration: "Eau de Parfum",
            audience: "Unisex",
            fragranceFamily: "Woody Aquatic",
            description: "A fresh and magnetic fragrance that plays on contrasts of water and heat. Sparkling citrus notes of bergamot and mandarin blend with aromatic lavender, rosemary, and a rich woody base.",
            notes: "Bergamot, mandarin, grapefruit, mint, water notes, lavender, rosemary, frankincense, cedarwood, sandalwood, vetiver, cashmeran",
            price: 24000,
            available: true,
            imageUrl: "/images/parfums-de-marly-sedley.jpg"
        },
        {
            slotNumber: 17,
            productId: "valentino-born-in-roma-17",
            productName: "Valentino Donna Born In Roma",
            brand: "Valentino",
            concentration: "Eau de Parfum",
            audience: "Women",
            fragranceFamily: "Amber Floral",
            description: "A modern couture floriental fragrance. Italian bergamot and blackcurrant accords combine with three jasmine flowers and rich Bourbon vanilla.",
            notes: "Blackcurrant, pink pepper, bergamot, jasmine, jasmine sambac, jasmine tea, Bourbon vanilla, cashmere wood, guaiac wood",
            price: 15000,
            available: true,
            imageUrl: "/images/valentino-born-in-roma.jpg"
        },
        {
            slotNumber: 18,
            productId: "carolina-herrera-good-girl-18",
            productName: "Carolina Herrera Good Girl EDP",
            brand: "Carolina Herrera",
            concentration: "Eau de Parfum",
            audience: "Women",
            fragranceFamily: "Amber Floral",
            description: "A daring yet sophisticated fragrance inspired by the duality of the modern woman. Sweet tuberose and jasmine contrast with rich roasted tonka beans and cocoa.",
            notes: "Almond, coffee, bergamot, lemon, tuberose, jasmine sambac, orange blossom, tonka bean, cocoa, vanilla, praline, sandalwood, amber, musk",
            price: 15000,
            available: true,
            imageUrl: "/images/carolina-herrera-good-girl.jpg"
        },
        {
            slotNumber: 19,
            productId: "tom-ford-black-orchid-19",
            productName: "Tom Ford Black Orchid EDP",
            brand: "Tom Ford",
            concentration: "Eau de Parfum",
            audience: "Unisex",
            fragranceFamily: "Amber Floral",
            description: "A luxurious and sensual fragrance of rich, dark accords and an alluring allure of black orchids and spice, modern yet timeless.",
            notes: "Truffle, gardenia, black currant, ylang-ylang, jasmine, bergamot, mandarin orange, orchid, spices, fruity notes, lotus, Mexican chocolate, patchouli, vanilla, incense, amber, sandalwood, vetiver, white musk",
            price: 22000,
            available: true,
            imageUrl: "/images/tom-ford-black-orchid.jpg"
        },
        {
            slotNumber: 20,
            productId: "jean-paul-gaultier-le-male-20",
            productName: "Jean Paul Gaultier Le Male Le Parfum",
            brand: "Jean Paul Gaultier",
            concentration: "Eau de Parfum",
            audience: "Men",
            fragranceFamily: "Amber Oriental",
            description: "An intense woody oriental fragrance with a commanding presence. Cardamom top notes blend with a heart of iris and lavender, resting on a warm, addictive vanilla base.",
            notes: "Cardamom, lavender, iris, oriental notes, vanilla, wood notes",
            price: 14500,
            available: true,
            imageUrl: "/images/jean-paul-gaultier-le-male.jpg"
        },
        {
            slotNumber: 21,
            productId: "jean-paul-gaultier-scandal-21",
            productName: "Jean Paul Gaultier Scandal EDP",
            brand: "Jean Paul Gaultier",
            concentration: "Eau de Parfum",
            audience: "Women",
            fragranceFamily: "Chypre Floral",
            description: "An addictive and elegant chypre floral fragrance that breaks all the clichés. Fresh gardenia and blood orange transition into a scandalous heart of honey and patchouli.",
            notes: "Blood orange, mandarin orange, honey, gardenia, orange blossom, jasmine, peach, beeswax, caramel, patchouli, licorice",
            price: 14000,
            available: true,
            imageUrl: "/images/jean-paul-gaultier-scandal.jpg"
        },
        {
            slotNumber: 22,
            productId: "paco-rabanne-1-million-22",
            productName: "Paco Rabanne 1 Million EDT",
            brand: "Paco Rabanne",
            concentration: "Eau de Toilette",
            audience: "Men",
            fragranceFamily: "Woody Spicy",
            description: "A bold and disruptive fragrance designed like a gold ingot. Fresh blood mandarin and peppermint open the scent, leading to a warm heart of cinnamon and masculine leather.",
            notes: "Mandarin orange, peppermint, grapefruit, cinnamon, rose extract, spicy notes, amber, leather, patchouli, white wood",
            price: 12000,
            available: true,
            imageUrl: "/images/paco-rabanne-1-million.jpg"
        },
        {
            slotNumber: 23,
            productId: "paco-rabanne-invictus-23",
            productName: "Paco Rabanne Invictus EDT",
            brand: "Paco Rabanne",
            concentration: "Eau de Toilette",
            audience: "Men",
            fragranceFamily: "Aromatic Aquatic",
            description: "A clash of biting freshness and animalic sensuality. Sea notes and grapefruit peel lead to a powerful heart of bay leaf and guaiac wood.",
            notes: "Marine accord, grapefruit, mandarin, bay leaf, jasmine, guaiac wood, oakmoss, patchouli, ambergris",
            price: 11500,
            available: true,
            imageUrl: "/images/paco-rabanne-invictus.jpg"
        },
        {
            slotNumber: 24,
            productId: "creed-aventus-24",
            productName: "Creed Aventus EDP",
            brand: "Creed",
            concentration: "Eau de Parfum",
            audience: "Men",
            fragranceFamily: "Chypre Fruity",
            description: "A sophisticated blend for individuals who savor a life well-lived. Sensual, audacious, and contemporary, combining enticing fruity notes with a rich, woody base.",
            notes: "Lemon, pink pepper, apple, bergamot, blackcurrant, pineapple, jasmine, patchouli, birch, ambergris, cedarwood, oakmoss, musk",
            price: 28000,
            available: true,
            imageUrl: "/images/creed-aventus.jpg"
        },
        {
            slotNumber: 25,
            productId: "montblanc-explorer-25",
            productName: "Montblanc Explorer EDP",
            brand: "Montblanc",
            concentration: "Eau de Parfum",
            audience: "Men",
            fragranceFamily: "Woody Aromatic",
            description: "An unconventional woody aromatic leather fragrance that reveals an Italian bergamot, contrasted with rich vetiver from Haiti and deep patchouli from Indonesia.",
            notes: "Bergamot, pink pepper, clary sage, leather, vetiver, patchouli, akigalawood, cocoa pod",
            price: 9500,
            available: true,
            imageUrl: "/images/montblanc-explorer.jpg"
        },
        {
            slotNumber: 26,
            productId: "montblanc-legend-26",
            productName: "Montblanc Legend EDT",
            brand: "Montblanc",
            concentration: "Eau de Toilette",
            audience: "Men",
            fragranceFamily: "Aromatic Fougere",
            description: "An inspiring and self-confident fragrance dedicated to virtuous and charismatic men. Fresh aromatic notes blend with a magnetic floral heart and a sensual woody drydown.",
            notes: "Lavender, pineapple, bergamot, verbena, red apple, dried fruits, oakmoss, geranium, coumarin, rose, tonka bean, sandalwood",
            price: 9000,
            available: true,
            imageUrl: "/images/montblanc-legend.jpg"
        },
        {
            slotNumber: 27,
            productId: "narciso-rodriguez-for-her-27",
            productName: "Narciso Rodriguez For Her EDP",
            brand: "Narciso Rodriguez",
            concentration: "Eau de Parfum",
            audience: "Women",
            fragranceFamily: "Floral Woody Musk",
            description: "A modern classic celebrating women's grace and sensuality. A velvety heart of musc is enhanced by a delicate blend of floral notes, amber, and patchouli.",
            notes: "Rose, peach, musk, amber, patchouli, sandalwood",
            price: 13500,
            available: true,
            imageUrl: "/images/narciso-rodriguez-for-her.jpg"
        },
        {
            slotNumber: 28,
            productId: "narciso-rodriguez-pure-musc-28",
            productName: "Narciso Rodriguez For Her Pure Musc EDP",
            brand: "Narciso Rodriguez",
            concentration: "Eau de Parfum",
            audience: "Women",
            fragranceFamily: "Floral Woody Musk",
            description: "A pure and addictive fragrance that captures the essence of modern grace. Centered around a heart of musc, it is enhanced by white floral bouquets and cashmeran.",
            notes: "Musk, white flowers, cashmere wood",
            price: 13800,
            available: true,
            imageUrl: "/images/narciso-rodriguez-pure-musc.jpg"
        },
        {
            slotNumber: 29,
            productId: "burberry-her-29",
            productName: "Burberry Her EDP",
            brand: "Burberry",
            concentration: "Eau de Parfum",
            audience: "Women",
            fragranceFamily: "Floral Fruity Gourmand",
            description: "A vibrant and adventurous fruity floral fragrance capturing the spirit of London. Bursting with red and dark berry notes softened by a luminous white woody drydown.",
            notes: "Strawberry, raspberry, blackberry, sour cherry, blackcurrant, mandarin orange, lemon, violet, jasmine, musk, vanilla, cashmeran, woody notes, amber, patchouli",
            price: 13000,
            available: true,
            imageUrl: "/images/burberry-her.jpg"
        },
        {
            slotNumber: 30,
            productId: "burberry-goddess-30",
            productName: "Burberry Goddess EDP",
            brand: "Burberry",
            concentration: "Eau de Parfum",
            audience: "Women",
            fragranceFamily: "Aromatic Gourmand",
            description: "A unique gourmand aromatic fragrance led by a powerful trio of vanillas enriched with a luminous touch of lavender.",
            notes: "Vanilla infusion, lavender, vanilla caviar, vanilla absolute, cacao, ginger",
            price: 13500,
            available: true,
            imageUrl: "/images/burberry-goddess.jpg"
        },
        {
            slotNumber: 40,
            productId: "le-labo-another-13-40",
            productName: "Le Labo Another 13 EDP",
            brand: "Le Labo",
            concentration: "Eau de Parfum",
            audience: "Unisex",
            fragranceFamily: "Amber Woody",
            description: "A hypnotic and unique scent created in collaboration with AnOther Magazine. An addictive composition combining ambroxan, jasmine, moss, and ambrette seeds.",
            notes: "Ambroxan, jasmine, moss, ambrette seed, pear, salicylate",
            price: 27000,
            available: true,
            imageUrl: "/images/le-labo-another-13.jpg"
        },
        {
            slotNumber: 41,
            productId: "maison-margiela-by-the-fireplace-41",
            productName: "Maison Margiela Replica By the Fireplace EDT",
            brand: "Maison Margiela",
            concentration: "Eau de Toilette",
            audience: "Unisex",
            fragranceFamily: "Woody Spicy",
            description: "A warm and cozy fragrance recreating the signature warmth of a blazing fireplace in winter. Burning wood notes combine with sweet chestnut and vanilla.",
            notes: "Clove oil, pink pepper, orange flower, chestnut accord, guaiac wood oil, cade oil, vanilla accord, peru balsam, cashmeran",
            price: 16500,
            available: true,
            imageUrl: "/images/maison-margiela-by-the-fireplace.jpg"
        },
        {
            slotNumber: 42,
            productId: "mfk-baccarat-rouge-540-42",
            productName: "Maison Francis Kurkdjian Baccarat Rouge 540 EDP",
            brand: "Maison Francis Kurkdjian",
            concentration: "Eau de Parfum",
            audience: "Unisex",
            fragranceFamily: "Amber Floral",
            description: "A luminous and highly sophisticated amber floral fragrance that lays on the skin like an amber, floral, and woody breeze. A poetic alchemy born from the encounter between Baccarat crystal and red gold.",
            notes: "Jasmine, saffron, ambergris, cedarwood, fir resin",
            price: 32000,
            available: true,
            imageUrl: "/images/mfk-baccarat-rouge-540.jpg"
        },
    ],
};

export default mockMachineMenu;