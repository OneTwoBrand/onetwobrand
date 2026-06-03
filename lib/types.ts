/**
 * ONE TWO — Shared TypeScript types
 * Coloque em lib/types.ts
 */

export type OPStatus =
  | 'Aberta'
  | 'Aguardando Material'
  | 'Em Produção'
  | 'Em Bordagem'
  | 'Em Revisão'
  | 'Finalizada'
  | 'Vendida'
  | 'Entregue';

export type Tone =
  | 'neutral'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger';

export type Size = 'sm' | 'md' | 'lg';

export type IconName =
  | 'home' | 'scissors' | 'box' | 'cart' | 'menu' | 'user' | 'coin' | 'chart'
  | 'needle' | 'bell' | 'search' | 'plus' | 'chevron' | 'chevronDown'
  | 'chevronLeft' | 'chevronUp' | 'eye' | 'eyeOff' | 'check' | 'x' | 'arrow'
  | 'arrowLeft' | 'filter' | 'grid' | 'list' | 'calendar' | 'pin'
  | 'paperclip' | 'upload' | 'download' | 'star' | 'settings' | 'sparkle'
  | 'edit' | 'trash' | 'more' | 'diamond' | 'package' | 'truck' | 'tag' | 'bot'
  | 'file' | 'camera' | 'location' | 'phone' | 'mail' | 'palette';

export type AIFeature =
  | 'chat'
  | 'fill'
  | 'summarize'
  | 'voice'
  | 'analysis';

export interface AIUsageLog {
  id: string;
  userId: string;
  feature: AIFeature;
  calls: number;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCost?: number;
  result: 'success' | 'insufficient_data' | 'error';
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  city: string;
  state: string;
  phone?: string;
  email?: string;
  vip: boolean;
  totalPieces: number;
  totalSpent: number;
  createdAt: string;
}

export interface Piece {
  id: string;
  name: string;
  fabric: string;
  color: string;
  sizes: ('PP' | 'P' | 'M' | 'G' | 'GG')[];
  price: number;
  photoUrl?: string;
}

export interface StockItem {
  pieceId: string;
  size: string;
  color: string;
  quantity: number;
  lowThreshold: number;
}

export interface Seamstress {
  id: string;
  name: string;
  role: 'Costureira-chefe' | 'Bordadeira' | 'Atelier · QA' | 'Costureira';
  avgLeadDays?: number;
}

export interface ProductionOrder {
  id: string;
  opNumber: string;       // ex: "0241"
  clientId: string;
  pieceId: string;
  qty: number;
  seamstressId?: string;
  dueDate: string;        // ISO
  status: OPStatus;
  fabricUsed?: string;
  embroideryNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OPHistoryEntry {
  id: string;
  opId: string;
  actorId: string | 'system';
  type: 'Corte' | 'Costura' | 'Bordagem' | 'Revisão' | 'Entrega' | 'Sistema';
  note: string;
  createdAt: string;
}

export interface EmbroideryShipment {
  id: string;
  code: string;            // ex: "BD-118"
  seamstressId: string;
  sentAt: string;
  expectedReturnAt: string;
  returnedAt?: string;
  qty: number;
  status: 'Em Bordagem' | 'Finalizada';
}

export interface Sale {
  id: string;
  clientId: string;
  total: number;
  paymentMethod: 'pix' | 'card' | 'cash' | 'transfer';
  status: 'pending' | 'paid' | 'cancelled';
  createdAt: string;
}

export interface SaleItem {
  saleId: string;
  pieceId: string;
  size: string;
  qty: number;
  unitPrice: number;
}
