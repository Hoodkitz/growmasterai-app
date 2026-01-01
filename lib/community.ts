// Community Types and Mock Data

export interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userLevel: number;
  userBadge: string;
  content: string;
  images?: string[];
  likes: number;
  comments: number;
  isLiked: boolean;
  createdAt: Date;
  tags?: string[];
}

export interface Contest {
  id: string;
  title: string;
  description: string;
  type: "yield" | "photo" | "strain" | "raffle";
  prize: string;
  prizeValue: number;
  sponsor?: string;
  startDate: Date;
  endDate: Date;
  participants: number;
  isJoined: boolean;
  requirements?: string;
  entries?: ContestEntry[];
}

export interface ContestEntry {
  id: string;
  contestId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  value: number; // yield in grams or votes
  image?: string;
  submittedAt: Date;
  rank?: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  userLevel: number;
  userBadge: string;
  totalYield: number;
  totalHarvests: number;
  points: number;
  isCurrentUser?: boolean;
}

export interface Vendor {
  id: string;
  name: string;
  logo: string;
  description: string;
  website?: string;
  isVerified: boolean;
  rating: number;
  products: number;
}

export interface Auction {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorLogo: string;
  title: string;
  description: string;
  image: string;
  currentBid: number;
  minBid: number;
  bidIncrement: number;
  bids: number;
  endDate: Date;
  isActive: boolean;
}

export interface Raffle {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorLogo: string;
  title: string;
  description: string;
  image: string;
  prize: string;
  ticketPrice: number;
  totalTickets: number;
  soldTickets: number;
  endDate: Date;
  isActive: boolean;
  userTickets: number;
}

export interface EquipmentDeal {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorLogo: string;
  title: string;
  description: string;
  image: string;
  originalPrice: number;
  salePrice: number;
  discount: number;
  stock: number;
  endDate: Date;
  isActive: boolean;
}

export interface AdBanner {
  id: string;
  vendorId: string;
  vendorName: string;
  image: string;
  link: string;
  position: "home" | "community" | "marketplace";
  impressions: number;
  clicks: number;
  isActive: boolean;
}

// Mock Data
export const MOCK_POSTS: CommunityPost[] = [
  {
    id: "1",
    userId: "user1",
    userName: "GreenThumb420",
    userLevel: 5,
    userBadge: "🌲",
    content: "Meine Northern Lights ist jetzt in Woche 6 der Blüte! Die Trichome werden langsam milchig. Was meint ihr, noch 2 Wochen? 🌿",
    images: [],
    likes: 42,
    comments: 8,
    isLiked: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    tags: ["Northern Lights", "Blüte", "Trichome"],
  },
  {
    id: "2",
    userId: "user2",
    userName: "OrganicGrower",
    userLevel: 7,
    userBadge: "👑",
    content: "Ernte-Update: 285g von 4 Pflanzen! Neuer persönlicher Rekord 🏆 Danke an die Community für die Tipps!",
    images: [],
    likes: 128,
    comments: 23,
    isLiked: true,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    tags: ["Ernte", "Rekord"],
  },
  {
    id: "3",
    userId: "user3",
    userName: "LEDMaster",
    userLevel: 4,
    userBadge: "🌳",
    content: "Hat jemand Erfahrung mit Kalziummangel? Meine Blätter zeigen braune Flecken. Die KI-Diagnose sagt Kalzium, aber ich bin unsicher bei der Dosierung.",
    images: [],
    likes: 15,
    comments: 12,
    isLiked: false,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    tags: ["Hilfe", "Kalziummangel", "Nährstoffe"],
  },
];

export const MOCK_CONTESTS: Contest[] = [
  {
    id: "1",
    title: "Ernte des Monats Januar",
    description: "Zeige uns deinen besten Ertrag! Der Grower mit dem höchsten dokumentierten Ertrag gewinnt.",
    type: "yield",
    prize: "Premium Samen-Set im Wert von 200€",
    prizeValue: 200,
    sponsor: "SeedBank Pro",
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-01-31"),
    participants: 156,
    isJoined: false,
    requirements: "Mindestens 3 dokumentierte Ernten in der App",
  },
  {
    id: "2",
    title: "Foto-Wettbewerb: Beste Blüte",
    description: "Teile dein schönstes Blüten-Foto und gewinne mit den meisten Votes!",
    type: "photo",
    prize: "LED Grow Light 600W",
    prizeValue: 350,
    sponsor: "GrowTech",
    startDate: new Date("2026-01-15"),
    endDate: new Date("2026-02-15"),
    participants: 89,
    isJoined: true,
    requirements: "Foto muss in der App aufgenommen werden",
  },
  {
    id: "3",
    title: "Verlosung: Komplettes Grow-Zelt Set",
    description: "Nimm an der Verlosung teil und gewinne ein komplettes Grow-Setup!",
    type: "raffle",
    prize: "120x120cm Grow-Zelt mit Belüftung",
    prizeValue: 500,
    sponsor: "GrowMaster Official",
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-01-20"),
    participants: 423,
    isJoined: false,
    requirements: "Premium oder Pro Mitgliedschaft",
  },
];

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, userId: "u1", userName: "MasterGrower", userLevel: 9, userBadge: "💎", totalYield: 12500, totalHarvests: 45, points: 15200 },
  { rank: 2, userId: "u2", userName: "GreenKing", userLevel: 8, userBadge: "⭐", totalYield: 10800, totalHarvests: 38, points: 12800 },
  { rank: 3, userId: "u3", userName: "OrganicPro", userLevel: 8, userBadge: "⭐", totalYield: 9500, totalHarvests: 35, points: 11500 },
  { rank: 4, userId: "u4", userName: "LEDExpert", userLevel: 7, userBadge: "👑", totalYield: 8200, totalHarvests: 30, points: 9800 },
  { rank: 5, userId: "u5", userName: "HydroMaster", userLevel: 7, userBadge: "👑", totalYield: 7800, totalHarvests: 28, points: 9200 },
  { rank: 6, userId: "u6", userName: "SoilGuru", userLevel: 6, userBadge: "🏆", totalYield: 6500, totalHarvests: 25, points: 7800 },
  { rank: 7, userId: "u7", userName: "AutoFlower", userLevel: 6, userBadge: "🏆", totalYield: 5800, totalHarvests: 22, points: 7200 },
  { rank: 8, userId: "u8", userName: "IndoorKing", userLevel: 5, userBadge: "🌲", totalYield: 5200, totalHarvests: 20, points: 6500 },
  { rank: 9, userId: "u9", userName: "OutdoorPro", userLevel: 5, userBadge: "🌲", totalYield: 4800, totalHarvests: 18, points: 6000 },
  { rank: 10, userId: "u10", userName: "NewGrower", userLevel: 4, userBadge: "🌳", totalYield: 4200, totalHarvests: 15, points: 5200 },
];

export const MOCK_VENDORS: Vendor[] = [
  { id: "v1", name: "SeedBank Pro", logo: "🌱", description: "Premium Genetik seit 2010", website: "https://seedbankpro.com", isVerified: true, rating: 4.8, products: 150 },
  { id: "v2", name: "GrowTech", logo: "💡", description: "LED Beleuchtung & Technik", website: "https://growtech.com", isVerified: true, rating: 4.6, products: 85 },
  { id: "v3", name: "NutrientKing", logo: "🧪", description: "Organische Dünger", website: "https://nutrientking.com", isVerified: true, rating: 4.7, products: 120 },
  { id: "v4", name: "TentMaster", logo: "🏕️", description: "Grow-Zelte & Zubehör", website: "https://tentmaster.com", isVerified: true, rating: 4.5, products: 60 },
];

export const MOCK_AUCTIONS: Auction[] = [
  {
    id: "a1",
    vendorId: "v1",
    vendorName: "SeedBank Pro",
    vendorLogo: "🌱",
    title: "Limitierte Genetik: Purple Haze OG",
    description: "Seltene Kreuzung, nur 10 Packs verfügbar weltweit!",
    image: "",
    currentBid: 85,
    minBid: 50,
    bidIncrement: 5,
    bids: 12,
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    isActive: true,
  },
  {
    id: "a2",
    vendorId: "v2",
    vendorName: "GrowTech",
    vendorLogo: "💡",
    title: "Spider Farmer SF-4000 LED",
    description: "Neuwertig, Originalverpackt mit 5 Jahren Garantie",
    image: "",
    currentBid: 320,
    minBid: 250,
    bidIncrement: 10,
    bids: 8,
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    isActive: true,
  },
];

export const MOCK_RAFFLES: Raffle[] = [
  {
    id: "r1",
    vendorId: "v4",
    vendorName: "TentMaster",
    vendorLogo: "🏕️",
    title: "Komplett-Set Verlosung",
    description: "Gewinne ein 120x120 Zelt mit Belüftung, Filter und LED!",
    image: "",
    prize: "Grow-Zelt Komplett-Set",
    ticketPrice: 5,
    totalTickets: 200,
    soldTickets: 145,
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    isActive: true,
    userTickets: 0,
  },
  {
    id: "r2",
    vendorId: "v3",
    vendorName: "NutrientKing",
    vendorLogo: "🧪",
    title: "Jahresvorrat Dünger",
    description: "Komplettes Nährstoff-Set für ein ganzes Jahr!",
    image: "",
    prize: "Bio-Dünger Jahresset",
    ticketPrice: 2,
    totalTickets: 500,
    soldTickets: 312,
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    isActive: true,
    userTickets: 3,
  },
];

export const MOCK_DEALS: EquipmentDeal[] = [
  {
    id: "d1",
    vendorId: "v2",
    vendorName: "GrowTech",
    vendorLogo: "💡",
    title: "LED Grow Light 300W",
    description: "Perfekt für 60x60cm Zelte, Full Spectrum",
    image: "",
    originalPrice: 149,
    salePrice: 99,
    discount: 34,
    stock: 15,
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    isActive: true,
  },
  {
    id: "d2",
    vendorId: "v4",
    vendorName: "TentMaster",
    vendorLogo: "🏕️",
    title: "Grow-Zelt 80x80x180cm",
    description: "Hochwertige Qualität, lichtdicht, stabil",
    image: "",
    originalPrice: 89,
    salePrice: 59,
    discount: 34,
    stock: 8,
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    isActive: true,
  },
];

export function formatTimeRemaining(endDate: Date): string {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  
  if (diff <= 0) return "Beendet";
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}T ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return "Gerade eben";
  if (minutes < 60) return `vor ${minutes}m`;
  if (hours < 24) return `vor ${hours}h`;
  if (days < 7) return `vor ${days}T`;
  
  return date.toLocaleDateString("de-DE");
}
