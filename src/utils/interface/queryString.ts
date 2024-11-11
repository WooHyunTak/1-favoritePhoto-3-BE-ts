export interface QueryString {
  limit: number;
  cursor: number;
  keyword: string;
}

export interface WhereConditions {
  keyword?: string;
  genre?: string;
  grade?: string;
  OR?: Array<Object>;
  name?: Object;
  userId?: number;
  shop?: Object;
  exchange?: Object;
  salesType?: string;
  isSoldOut?: string;
}
