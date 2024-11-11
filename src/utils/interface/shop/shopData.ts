import { Shop } from "@prisma/client";

export interface ShopData extends Shop {
  user: { nickname: string };
  card: { name: string; grade: string };
}
