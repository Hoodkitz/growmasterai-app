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
