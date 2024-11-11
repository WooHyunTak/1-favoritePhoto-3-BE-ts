export interface CreateCardData {
  name: string;
  grade: string;
  genre: string;
  description: string;
  totalCount: number;
  remainingCount: number;
  imageURL: string;
  purchasePrice: number;
  userId: number;
}

export interface WhereConditionsParams {
  keyword?: string;
  genre?: string;
  grade?: string;
}

export interface GetByUserIdParams {
  limit: number;
  cursor?: number;
  keyword?: string;
  genre?: string;
  grade?: string;
}

export interface GetByUserIdParamsWith {
  where: Record<string, any>;
  limit: number;
  cursor?: number;
}
