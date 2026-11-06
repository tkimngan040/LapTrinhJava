"use client";

import React, { useState } from "react";
import { Search, Plus, RefreshCw, Eye, EyeOff, CheckCircle2, AlertCircle, ChevronDown, Edit3, X } from "lucide-react";
import styles from "./products.module.css";

interface Product {
    id: string;
    name: string;
    brand: string;
    family: string;
    notes: string;
    description: string;
    pricePerSpray: number;
    rating: number;
    status: "ACTIVE" | "INACTIVE" | "DRAFT";
    image: string;
}

const initialProducts: Product[] = [
    { id: "1", name: "Acqua Di Gio", brand: "Giorgio Armani", family: "Aquatic Aromatic", notes: "Bergamot, Sea Notes, Jasmine", description: "A classic aquatic fragrance capturing the spirit of the Mediterranean sea and sun.", pricePerSpray: 12000, rating: 4.8, status: "ACTIVE", image: "/images/acqua-di-gio.jpg" },
    { id: "2", name: "Acqua Di Gio Profondo", brand: "Giorgio Armani", family: "Aquatic Mineral", notes: "Marine Notes, Rosemary, Patchouli", description: "An intense marine interpretation of Acqua Di Gio, deep and mysterious.", pricePerSpray: 14000, rating: 4.9, status: "ACTIVE", image: "/images/acqua-di-gio-profondo.jpg" },
    { id: "3", name: "Bleu de Chanel", brand: "Chanel", family: "Woody Aromatic", notes: "Lemon, Mint, Pink Pepper, Cedar", description: "An aromatic-woody fragrance with a captivating trail of timeless elegance.", pricePerSpray: 15000, rating: 5.0, status: "ACTIVE", image: "/images/bleu-de-chanel.png" },
    { id: "4", name: "Burberry Goddess", brand: "Burberry", family: "Aromatic Vanilla", notes: "Vanilla Infusion, Lavender, Cocoa", description: "A gourmand aromatic scent centered around a trio of distinct vanillas.", pricePerSpray: 13000, rating: 4.7, status: "ACTIVE", image: "/images/burberry-goddess.jpg" },
    { id: "5", name: "Burberry Her", brand: "Burberry", family: "Floral Fruity", notes: "Red & Dark Berries, Jasmine, Amber", description: "A vibrant and adventurous fruity floral signature created by Francis Kurkdjian.", pricePerSpray: 12500, rating: 4.6, status: "ACTIVE", image: "/images/burberry-her.jpg" },
    { id: "6", name: "Carolina Herrera Good Girl", brand: "Carolina Herrera", family: "Amber Floral", notes: "Tuberose, Jasmine, Tonka Bean, Cacao", description: "A sensual, evocative fragrance born from the dualities of modern femininity.", pricePerSpray: 14500, rating: 4.9, status: "ACTIVE", image: "/images/carolina-herrera-good-girl.jpg" },
    { id: "7", name: "Club de Nuit Intense", brand: "Armaf", family: "Woody Spicy", notes: "Lemon, Pineapple, Blackcurrant, Birch", description: "A bold and commanding woody spicy scent with exceptional projection.", pricePerSpray: 10000, rating: 4.8, status: "ACTIVE", image: "/images/club-de-nuit-intense.jpg" },
    { id: "8", name: "Coco Mademoiselle", brand: "Chanel", family: "Amber Floral", notes: "Orange, Patchouli, Turkish Rose, Jasmine", description: "An irresistible oriental fragrance of spirited and independent character.", pricePerSpray: 16000, rating: 4.9, status: "ACTIVE", image: "/images/coco-mademoiselle.jpg" },
    { id: "9", name: "Creed Aventus", brand: "Creed", family: "Chypre Fruity", notes: "Pineapple, Birch, Musk, Oakmoss", description: "The legendary scent celebrating strength, power, and timeless success.", pricePerSpray: 25000, rating: 5.0, status: "ACTIVE", image: "/images/creed-aventus.jpg" },
    { id: "10", name: "Dior Sauvage", brand: "Dior", family: "Aromatic Fougere", notes: "Calabrian Bergamot, Pepper, Amberwood", description: "Radically fresh, raw and noble all at once, inspired by wide-open spaces.", pricePerSpray: 14000, rating: 4.9, status: "ACTIVE", image: "/images/dior-sauvage.jpg" },
    { id: "11", name: "Jean Paul Gaultier Le Male", brand: "Jean Paul Gaultier", family: "Amber Fougere", notes: "Mint, Lavender, Vanilla, Cinnamon", description: "A reassuringly traditional and intensely modern masculine classic.", pricePerSpray: 13500, rating: 4.7, status: "ACTIVE", image: "/images/jean-paul-gaultier-le-male.jpg" },
    { id: "12", name: "Jean Paul Gaultier Scandal", brand: "Jean Paul Gaultier", family: "Chypre Floral", notes: "Blood Orange, Honey, Patchouli", description: "An addictive honey chypre floral breaking all conventional clichés.", pricePerSpray: 14000, rating: 4.8, status: "ACTIVE", image: "/images/jean-paul-gaultier-scandal.jpg" },
    { id: "13", name: "Le Labo Another 13", brand: "Le Labo", family: "Amber Woody", notes: "Ambroxan, Jasmine, Moss, Ambrette", description: "An hypnotic and addictive composition born from a collaboration with AnOther magazine.", pricePerSpray: 22000, rating: 4.9, status: "ACTIVE", image: "/images/le-labo-another-13.jpg" },
    { id: "14", name: "Maison Margiela By The Fireplace", brand: "Maison Margiela", family: "Woody Spicy", notes: "Clove, Chestnut, Vanilla, Cashmeran", description: "Recreates the cozy warmth of a crackling fireplace on a crisp winter morning.", pricePerSpray: 18000, rating: 4.8, status: "ACTIVE", image: "/images/maison-margiela-by-the-fireplace.jpg" },
    { id: "15", name: "MCM EDP", brand: "MCM", family: "Amber Fruity", notes: "Raspberry, Jasmine, White Peony, Moss", description: "A groundbreaking floral woody fragrance echoing MCM's classic heritage.", pricePerSpray: 12000, rating: 4.5, status: "ACTIVE", image: "/images/mcm-edp.jpg" },
    { id: "16", name: "MFK Baccarat Rouge 540", brand: "Maison Francis Kurkdjian", family: "Amber Floral", notes: "Jasmin, Saffron, Ambergris, Cedarwood", description: "A luminous and poetic amber floral aura resembling an amber breeze.", pricePerSpray: 30000, rating: 5.0, status: "ACTIVE", image: "/images/mfk-baccarat-rouge-540.jpg" },
    { id: "17", name: "Miss Dior Blooming Bouquet", brand: "Dior", family: "Floral", notes: "Damask Rose, Peony, White Musk", description: "An instant crush, a tender and sparkling floral composition.", pricePerSpray: 14000, rating: 4.7, status: "ACTIVE", image: "/images/miss-dior-blooming-bouquet.jpg" },
    { id: "18", name: "Montblanc Explorer", brand: "Montblanc", family: "Woody Aromatic", notes: "Bergamot, Vetiver, Patchouli", description: "An invitation to an ultimate exploratory journey across untamed nature.", pricePerSpray: 11000, rating: 4.7, status: "ACTIVE", image: "/images/montblanc-explorer.jpg" },
    { id: "19", name: "Montblanc Legend", brand: "Montblanc", family: "Aromatic Fougere", notes: "Lavender, Pineapple, Oakmoss", description: "A charismatic and authentic fragrance for men of virtue and conviction.", pricePerSpray: 10500, rating: 4.6, status: "ACTIVE", image: "/images/montblanc-legend.jpg" },
    { id: "20", name: "Narciso Rodriguez For Her", brand: "Narciso Rodriguez", family: "Floral Woody Musk", notes: "Musc, Orange Blossom, Osmanthus, Amber", description: "A sensual tribute to modern women built around a magnetic heart of musc.", pricePerSpray: 13500, rating: 4.8, status: "ACTIVE", image: "/images/narciso-rodriguez-for-her.jpg" },
    { id: "21", name: "Narciso Rodriguez Pure Musc", brand: "Narciso Rodriguez", family: "Floral Woody Musk", notes: "Musc, White Flowers, Cashmeran", description: "Pure musc captures the essence of pure, transcendent grace and intimacy.", pricePerSpray: 14000, rating: 4.8, status: "ACTIVE", image: "/images/narciso-rodriguez-pure-musc.jpg" },
    { id: "22", name: "Paco Rabanne 1 Million", brand: "Paco Rabanne", family: "Woody Spicy", notes: "Blood Mandarin, Mint, Cinnamon, Leather", description: "Daring, bold and golden. The fragrance of success and audacious luxury.", pricePerSpray: 13000, rating: 4.7, status: "ACTIVE", image: "/images/paco-rabanne-1-million.jpg" },
    { id: "23", name: "Paco Rabanne Invictus", brand: "Paco Rabanne", family: "Aquatic Woody", notes: "Marine Notes, Grapefruit, Bay Leaf, Guaiac Wood", description: "A clash of biting freshness and animal sensuality representing champion power.", pricePerSpray: 13000, rating: 4.8, status: "ACTIVE", image: "/images/paco-rabanne-invictus.jpg" },
    { id: "24", name: "Parfums de Marly Sedley", brand: "Parfums de Marly", family: "Woody Aquatic", notes: "Bergamot, Spearmint, Lavender, Cashmeran", description: "A fresh, modern citrus woody sensation infused with aristocratic elegance.", pricePerSpray: 24000, rating: 4.9, status: "ACTIVE", image: "/images/parfums-de-marly-sedley.jpg" },
    { id: "25", name: "Roja Elysium", brand: "Roja Parfums", family: "Aromatic Fougere", notes: "Grapefruit, Lime, Ambergris, Leather", description: "An ultra-luxurious creation designed for men who reach for their ultimate heaven.", pricePerSpray: 28000, rating: 5.0, status: "ACTIVE", image: "/images/roja-elysium.jpg" },
    { id: "26", name: "Tom Ford Black Orchid", brand: "Tom Ford", family: "Amber Floral", notes: "Black Truffle, Ylang-Ylang, Orchid, Patchouli", description: "A luxurious and sensual fragrance of rich, dark accords and an alluring potion of black orchids.", pricePerSpray: 20000, rating: 4.9, status: "ACTIVE", image: "/images/tom-ford-black-orchid.jpg" },
    { id: "27", name: "Valentino Born in Roma", brand: "Valentino", family: "Amber Woody", notes: "Blackcurrant, Jasmine Grandiflorum, Bourbon Vanilla", description: "A modern aromatic floral couture fragrance inspired by Roman street culture.", pricePerSpray: 15000, rating: 4.8, status: "ACTIVE", image: "/images/valentino-born-in-roma.jpg" },
    { id: "28", name: "Versace Bright Crystal", brand: "Versace", family: "Floral Fruity", notes: "Yuzu, Pomegranate, Peony, Magnolia", description: "A sheer, sensual and luminous floral jewel fragrance by Versace.", pricePerSpray: 11000, rating: 4.7, status: "ACTIVE", image: "/images/versace-bright-crystal.jpg" },
    { id: "29", name: "Versace Dylan Blue", brand: "Versace", family: "Aromatic Fougere", notes: "Aquatic Notes, Bergamot, Fig Leaf, Ambrox", description: "A strong, spirited and distinctive masculine fragrance capturing Mediterranean depths.", pricePerSpray: 12000, rating: 4.8, status: "ACTIVE", image: "/images/versace-dylan-blue.jpg" },
    { id: "30", name: "Versace Eros", brand: "Versace", family: "Aromatic Fougere", notes: "Mint Leaves, Italian Lemon, Tonka Bean", description: "A fragrance for a strong, passionate man, master of himself like the Greek god.", pricePerSpray: 12500, rating: 4.9, status: "ACTIVE", image: "/images/versace-eros.jpg" },
    { id: "31", name: "YSL Libre", brand: "Yves Saint Laurent", family: "Amber Fougere", notes: "Lavender Essence, Orange Blossom, Musk Accord", description: "The freedom of a bold, uncompromising feminine fragrance statement.", pricePerSpray: 15000, rating: 4.9, status: "ACTIVE", image: "/images/ysl-libre.jpg" },
    { id: "32", name: "YSL Y EDP", brand: "Yves Saint Laurent", family: "Aromatic Fougere", notes: "Sage, Geranium, Incense, Vetiver", description: "An intense representation of the Y olfactive signature for the self-made man.", pricePerSpray: 14500, rating: 4.9, status: "ACTIVE", image: "/images/ysl-y-edp.jpg" },
];

export default function ProductsPage(): React.ReactElement {
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedBrand, setSelectedBrand] = useState<string>("ALL");
    const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

    const [isBrandOpen, setIsBrandOpen] = useState<boolean>(false);
    const [isStatusOpen, setIsStatusOpen] = useState<boolean>(false);

    // Modal state for Add/Edit
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Form fields
    const [name, setName] = useState<string>("");
    const [brand, setBrand] = useState<string>("Dior");
    const [family, setFamily] = useState<string>("");
    const [notes, setNotes] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [pricePerSpray, setPricePerSpray] = useState<number>(12000);
    const [image, setImage] = useState<string>("/images/dior-sauvage.jpg");

    const openAddModal = () => {
        setEditingProduct(null);
        setName("");
        setBrand("Dior");
        setFamily("Aromatic");
        setNotes("");
        setDescription("");
        setPricePerSpray(12000);
        setImage("/images/dior-sauvage.jpg");
        setIsModalOpen(true);
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setName(product.name);
        setBrand(product.brand);
        setFamily(product.family);
        setNotes(product.notes);
        setDescription(product.description);
        setPricePerSpray(product.pricePerSpray);
        setImage(product.image);
        setIsModalOpen(true);
    };

    const toggleStatus = (id: string): void => {
        setProducts(products.map(p => p.id === id ? { ...p, status: p.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" } : p));
    };

    const handleSubmitProduct = (e: React.FormEvent): void => {
        e.preventDefault();
        if (!name.trim() || pricePerSpray < 0) return;

        if (editingProduct) {
            setProducts(products.map(p => p.id === editingProduct.id ? {
                ...p,
                name,
                brand,
                family: family || "Luxury Floral",
                notes: notes || "Signature Blend",
                description: description || "Exclusive luxury formulation.",
                pricePerSpray,
                image
            } : p));
        } else {
            const newProd: Product = {
                id: Date.now().toString(),
                name,
                brand,
                family: family || "Luxury Floral",
                notes: notes || "Signature Blend",
                description: description || "Exclusive luxury formulation.",
                pricePerSpray,
                rating: 5.0,
                status: "ACTIVE",
                image: image || "/images/dior-sauvage.jpg"
            };
            setProducts([newProd, ...products]);
        }
        setIsModalOpen(false);
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesBrand = selectedBrand === "ALL" || p.brand === selectedBrand;
        const matchesStatus = selectedStatus === "ALL" || p.status === selectedStatus;
        return matchesSearch && matchesBrand && matchesStatus;
    });

    const uniqueBrands = Array.from(new Set(products.map(p => p.brand)));

    const brandLabels: Record<string, string> = {
        ALL: "All Brands",
        ...Object.fromEntries(uniqueBrands.map(b => [b, b]))
    };

    const statusLabels: Record<string, string> = {
        ALL: "All Statuses",
        ACTIVE: "Active",
        INACTIVE: "Inactive"
    };

    return (
        <div className={styles.container}>
            {/* Header với nút Add nằm thẳng hàng bên phải */}
            <div className={styles.header} style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 className={styles.title}>Perfume Product Management</h1>
                    {/* Đã lược bỏ phần hiển thị số lượng items loaded */}
                    <p className={styles.subtitle}>Manage catalog items, spray pricing, fragrance notes, and kiosk display visibility.</p>
                </div>
                <button onClick={openAddModal} className={styles.addButton}>
                    <Plus className="w-5 h-5" /> Add New Product
                </button>
            </div>

            {/* Filter Bar */}
            <div className={styles.filterBar}>
                <div className={styles.searchWrapper}>
                    <Search className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search perfume or brand..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                {/* Brand Dropdown */}
                <div style={{ position: "relative", flex: 1, minWidth: "160px" }}>
                    <div
                        onClick={() => { setIsBrandOpen(!isBrandOpen); setIsStatusOpen(false); }}
                        style={{
                            width: "100%",
                            backgroundColor: "#0A0A10",
                            border: "1px solid rgba(212, 175, 55, 0.3)",
                            borderRadius: "12px",
                            padding: "0.9rem 1rem",
                            fontSize: "0.9rem",
                            color: "#CBD5E1",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            cursor: "pointer",
                            userSelect: "none"
                        }}
                    >
                        <span>{brandLabels[selectedBrand] || "All Brands"}</span>
                        <ChevronDown className="w-4 h-4 text-amber-400" />
                    </div>
                    {isBrandOpen && (
                        <div style={{
                            position: "absolute",
                            top: "calc(100% + 8px)",
                            left: 0,
                            right: 0,
                            maxHeight: "260px",
                            overflowY: "auto",
                            backgroundColor: "#12121A",
                            border: "1px solid rgba(212, 175, 55, 0.4)",
                            borderRadius: "12px",
                            boxShadow: "0 20px 50px rgba(0,0,0,0.9)",
                            zIndex: 9999
                        }}>
                            {["ALL", ...uniqueBrands].map((b) => (
                                <div
                                    key={b}
                                    onClick={() => { setSelectedBrand(b); setIsBrandOpen(false); }}
                                    style={{
                                        padding: "0.85rem 1rem",
                                        fontSize: "0.875rem",
                                        color: "#CBD5E1",
                                        cursor: "pointer",
                                        borderBottom: "1px solid rgba(255,255,255,0.03)"
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(212, 175, 55, 0.15)"; e.currentTarget.style.color = "#D4AF37"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#CBD5E1"; }}
                                >
                                    {brandLabels[b] || b}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Status Dropdown */}
                <div style={{ position: "relative", flex: 1, minWidth: "160px" }}>
                    <div
                        onClick={() => { setIsStatusOpen(!isStatusOpen); setIsBrandOpen(false); }}
                        style={{
                            width: "100%",
                            backgroundColor: "#0A0A10",
                            border: "1px solid rgba(212, 175, 55, 0.3)",
                            borderRadius: "12px",
                            padding: "0.9rem 1rem",
                            fontSize: "0.9rem",
                            color: "#CBD5E1",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            cursor: "pointer",
                            userSelect: "none"
                        }}
                    >
                        <span>{statusLabels[selectedStatus]}</span>
                        <ChevronDown className="w-4 h-4 text-amber-400" />
                    </div>
                    {isStatusOpen && (
                        <div style={{
                            position: "absolute",
                            top: "calc(100% + 8px)",
                            left: 0,
                            right: 0,
                            backgroundColor: "#12121A",
                            border: "1px solid rgba(212, 175, 55, 0.4)",
                            borderRadius: "12px",
                            boxShadow: "0 20px 50px rgba(0,0,0,0.9)",
                            overflow: "hidden",
                            zIndex: 9999
                        }}>
                            {["ALL", "ACTIVE", "INACTIVE"].map((s) => (
                                <div
                                    key={s}
                                    onClick={() => { setSelectedStatus(s); setIsStatusOpen(false); }}
                                    style={{
                                        padding: "0.85rem 1rem",
                                        fontSize: "0.875rem",
                                        color: "#CBD5E1",
                                        cursor: "pointer",
                                        borderBottom: "1px solid rgba(255,255,255,0.03)"
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(212, 175, 55, 0.15)"; e.currentTarget.style.color = "#D4AF37"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#CBD5E1"; }}
                                >
                                    {statusLabels[s]}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <button onClick={() => { setSearchQuery(""); setSelectedBrand("ALL"); setSelectedStatus("ALL"); }} className={styles.resetButton}>
                    <RefreshCw className="w-4 h-4" /> Reset
                </button>
            </div>

            {/* Table Card với phần tiêu đề đứng im và chỉ cuộn danh sách sản phẩm bên dưới */}
            <div className={styles.tableCard}>
                <div className={styles.tableScrollContainer}>
                    <table className={styles.table} style={{ borderCollapse: "separate", borderSpacing: "0 12px", width: "100%" }}>
                        <thead className={styles.tableHead}>
                        <tr>
                            <th style={{ padding: "0.85rem 1.5rem 1.25rem 1.5rem" }}>Product</th>
                            <th style={{ padding: "0.85rem 1.5rem 1.25rem 1.5rem" }}>Brand</th>
                            <th style={{ padding: "0.85rem 1.5rem 1.25rem 1.5rem" }}>Fragrance Family & Notes</th>
                            <th style={{ padding: "0.85rem 1.5rem 1.25rem 1.5rem" }}>Price / Spray</th>
                            <th style={{ padding: "0.85rem 1.5rem 1.25rem 1.5rem" }}>Rating</th>
                            <th style={{ padding: "0.85rem 1.5rem 1.25rem 1.5rem" }}>Status</th>
                            <th style={{ padding: "0.85rem 1.5rem 1.25rem 1.5rem", textAlign: "right" }}>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredProducts.map((product) => (
                            <tr key={product.id} className={styles.tableRow}>
                                {/* Các ô dữ liệu sản phẩm (giữ nguyên code cũ của bạn) */}
                                <td className={styles.tableCell} style={{ padding: "1.25rem 1.5rem" }}>
                                    <div className={styles.productImageCell} style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                                        <div className={styles.imagePlaceholder} style={{ width: "60px", height: "60px", minWidth: "60px", minHeight: "60px", borderRadius: "12px", overflow: "hidden" }}>
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                style={{ width: "60px", height: "60px", objectFit: "cover", display: "block" }}
                                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                            />
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                                            <span style={{ fontWeight: 700, color: "#FFF", fontSize: "1rem", lineHeight: "1.3" }}>{product.name}</span>
                                            <span style={{ fontSize: "0.8rem", color: "#94A3B8", lineHeight: "1.4", maxWidth: "280px" }}>{product.description.substring(0, 48)}...</span>
                                        </div>
                                    </div>
                                </td>
                                <td className={styles.tableCell} style={{ padding: "1.25rem 1.5rem", color: "#E2E8F0", fontWeight: 500 }}>{product.brand}</td>
                                <td className={styles.tableCell} style={{ padding: "1.25rem 1.5rem" }}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                                        <span style={{ color: "#F3E7C4", fontSize: "0.9rem", fontWeight: 600 }}>{product.family}</span>
                                        <span style={{ color: "#94A3B8", fontSize: "0.78rem" }}>🌿 {product.notes}</span>
                                    </div>
                                </td>
                                <td className={styles.tableCell} style={{ padding: "1.25rem 1.5rem", color: "#D4AF37", fontWeight: 700, fontFamily: "Space Grotesk, monospace", fontSize: "1rem" }}>
                                    {product.pricePerSpray.toLocaleString()} VND
                                </td>
                                <td className={styles.tableCell} style={{ padding: "1.25rem 1.5rem", color: "#F8F8F8", fontFamily: "Space Grotesk, monospace", fontWeight: 600 }}>⭐ {product.rating}</td>
                                <td className={styles.tableCell} style={{ padding: "1.25rem 1.5rem" }}>
                            <span className={product.status === "ACTIVE" ? styles.badgeActive : styles.badgeInactive}>
                                {product.status === "ACTIVE" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                                {product.status}
                            </span>
                                </td>
                                <td className={styles.tableCell} style={{ padding: "1.25rem 1.5rem", textAlign: "right" }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.6rem" }}>
                                        <button onClick={() => openEditModal(product)} title="Edit Product" className={styles.actionButton}>
                                            <Edit3 className="w-4 h-4 text-amber-300" />
                                        </button>
                                        <button onClick={() => toggleStatus(product.id)} title={product.status === "ACTIVE" ? "Hide Product" : "Show Product"} className={styles.actionButton}>
                                            {product.status === "ACTIVE" ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4 text-emerald-400" />}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Add / Edit Product */}
            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent} style={{ maxWidth: "38rem", maxHeight: "90vh", overflowY: "auto" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                            <h2 className={styles.modalTitle} style={{ margin: 0 }}>
                                {editingProduct ? "Edit Perfume Product" : "Add New Perfume Product"}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                style={{ background: "transparent", border: "none", color: "#94A3B8", cursor: "pointer" }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitProduct}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#94A3B8", marginBottom: "0.375rem", textTransform: "uppercase" }}>Perfume Name *</label>
                                    <input
                                        type="text" required value={name} onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Tom Ford Lost Cherry"
                                        style={{ width: "100%", background: "#0A0A10", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", padding: "0.8rem", color: "#FFF", outline: "none" }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#94A3B8", marginBottom: "0.375rem", textTransform: "uppercase" }}>Brand *</label>
                                    <input
                                        type="text" required value={brand} onChange={(e) => setBrand(e.target.value)}
                                        placeholder="e.g. Tom Ford"
                                        style={{ width: "100%", background: "#0A0A10", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", padding: "0.8rem", color: "#FFF", outline: "none" }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#94A3B8", marginBottom: "0.375rem", textTransform: "uppercase" }}>Fragrance Family</label>
                                    <input
                                        type="text" value={family} onChange={(e) => setFamily(e.target.value)}
                                        placeholder="e.g. Amber Floral"
                                        style={{ width: "100%", background: "#0A0A10", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", padding: "0.8rem", color: "#FFF", outline: "none" }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#94A3B8", marginBottom: "0.375rem", textTransform: "uppercase" }}>Price Per Spray (VND) *</label>
                                    <input
                                        type="number" required min="0" value={pricePerSpray} onChange={(e) => setPricePerSpray(Number(e.target.value))}
                                        style={{ width: "100%", background: "#0A0A10", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", padding: "0.8rem", color: "#FFF", outline: "none" }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: "1.25rem" }}>
                                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#94A3B8", marginBottom: "0.375rem", textTransform: "uppercase" }}>Fragrance Notes</label>
                                <input
                                    type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
                                    placeholder="e.g. Bergamot, Jasmine, Vanilla, Amber"
                                    style={{ width: "100%", background: "#0A0A10", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", padding: "0.8rem", color: "#FFF", outline: "none" }}
                                />
                            </div>

                            <div style={{ marginBottom: "1.25rem" }}>
                                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#94A3B8", marginBottom: "0.375rem", textTransform: "uppercase" }}>Description</label>
                                <textarea
                                    rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Enter detailed perfume storytelling & aroma profile..."
                                    style={{ width: "100%", background: "#0A0A10", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", padding: "0.8rem", color: "#FFF", outline: "none", resize: "none" }}
                                />
                            </div>

                            <div style={{ marginBottom: "1.75rem" }}>
                                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#94A3B8", marginBottom: "0.375rem", textTransform: "uppercase" }}>Image Path / URL</label>
                                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                                    <input
                                        type="text" value={image} onChange={(e) => setImage(e.target.value)}
                                        placeholder="/images/dior-sauvage.jpg"
                                        style={{ flex: 1, background: "#0A0A10", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", padding: "0.8rem", color: "#FFF", outline: "none" }}
                                    />
                                    <div style={{ width: "44px", height: "44px", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(212,175,55,0.4)", flexShrink: 0, backgroundColor: "#000" }}>
                                        <img src={image} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    style={{ padding: "0.75rem 1.5rem", background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "#F8F8F8", borderRadius: "10px", cursor: "pointer", fontWeight: 600 }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{ padding: "0.75rem 1.75rem", background: "linear-gradient(135deg, #D4AF37 0%, #F5E6AD 100%)", color: "#050508", fontWeight: 700, borderRadius: "10px", border: "none", cursor: "pointer", boxShadow: "0 4px 20px rgba(212,175,55,0.4)" }}
                                >
                                    {editingProduct ? "Save Changes" : "Create Product"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}