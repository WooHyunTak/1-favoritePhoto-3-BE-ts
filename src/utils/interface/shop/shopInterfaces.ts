import { Shop } from "@prisma/client";
export interface WhereConditions {
  userId: number;
  OR?: Array<{ card: { name: { contains: string; mode: "insensitive" } } }>;
}

export interface CreateShopCardData {
  userId: number;
  cardId: number;
  price: number;
  totalCount: number;
  exchangeGrade?: string;
  exchangeGenre?: string;
  exchangeDescription?: string;
}

export interface UpdateShopCardData {
  shopId: number;
  cardId: number;
  userId: number;
  price: number;
  totalCount: number;
  remainingCount?: number;
  exchangeGrade?: string;
  exchangeGenre?: string;
  exchangeDescription?: string;
}

export interface Filters {
  search?: string;
  grade?: string;
  genre?: string;
  isSoldOut?: boolean;
}

interface CardDetails {
  name: string;
  grade: string;
  genre: string;
  imageURL: string | null;
}

// 상점 카드와 관련된 사용자 및 카드 정보를 포함하는 인터페이스
interface ShopCardWithRelations {
  id: number;
  createAt: Date;
  updateAt: Date;
  userId: number;
  cardId: number;
  price: number;
  totalCount: number;
  remainingCount: number;
  exchangeGrade: string;
  exchangeGenre: string;
  exchangeDescription: string | null;
  user: {
    nickname: string;
  };
  card: CardDetails;
}

// 판매 중인지 여부를 추가로 포함하는 상점 카드 인터페이스
interface ShopCardWithSoldOut extends ShopCardWithRelations {
  isSoldOut: boolean;
}

// 모든 상점 카드의 페이지네이션 결과를 나타내는 인터페이스
export interface PaginationResult {
  totalCards: number;
  currentPage: number;
  totalPages: number;
  cards: ShopCardWithSoldOut[];
}
