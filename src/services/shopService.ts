import shopRepository from "../repositorys/shopRepository";
import exChangeRepository from "../repositorys/exchangeRepository";
import prismaClient from "../utils/prismaClient";
import createNotificationFromType from "../utils/notification/createByType";
import {
  CreateShopCardData,
  UpdateShopCardData,
} from "../utils/interface/shop/shopInterfaces.js";
import { CustomError } from "../utils/interface/customError";

/* 카드 존재 여부 확인 */
const checkCardExists = async (shopId: number) => {
  const shopDetails = await shopRepository.getShopById(shopId);
  if (!shopDetails) {
    const error: any = new Error("Card not found");
    error.status = 404;
    throw error;
  }
  return shopDetails;
};

/* 상점에 포토카드 판매 등록 */
const createShopCard = async (data: CreateShopCardData) => {
  if (data.totalCount <= 0) {
    const error: any = new Error("Total count must be greater than zero");
    error.status = 400;
    throw error;
  }

  const originalCard = await prismaClient.card.findUnique({
    where: { id: data.cardId },
  });

  if (!originalCard) {
    const error: any = new Error("Card not found");
    error.status = 404;
    throw error;
  }

  const newCard = await prismaClient.$transaction(async (prisma) => {
    const card = await prisma.shop.findFirst({
      where: { userId: data.userId, cardId: data.cardId },
    });

    if (data.totalCount > originalCard.totalCount) {
      const error: any = new Error(
        `Cannot sell more than the total count of ${originalCard.totalCount}`
      );
      error.status = 400;
      throw error;
    }

    if (card) {
      const error: any = new Error("Card already registered in shop");
      error.status = 409;
      error.data = { shopId: card.id };
      throw error;
    }

    await shopRepository.updateCardRemainingCount(data.cardId, data.totalCount);

    const newShopCard = await prisma.shop.create({
      data: {
        userId: data.userId,
        cardId: data.cardId,
        price: data.price,
        totalCount: data.totalCount,
        exchangeGrade: data.exchangeGrade || "",
        exchangeGenre: data.exchangeGenre || "",
        exchangeDescription: data.exchangeDescription || "",
        remainingCount: data.totalCount,
      },
    });

    await createNotificationFromType(4, {
      userId: data.userId,
      shop: {
        user: { id: data.userId },
        card: originalCard,
      },
    });

    return {
      ...newShopCard,
      imageUrl: originalCard.imageURL,
    };
  });

  return newCard;
};

/* 상점에 등록한 포토 카드 상세 조회 */
const getShopByShopId = async (shopId: number) => {
  const shopDetails = await shopRepository.getShopById(shopId);

  if (!shopDetails) {
    throw new Error(`Shop with ID ${shopId} not found.`);
  }

  return {
    ...shopDetails,
  };
};

const getExchangeByUserId = async (shopId: number, userId: number) => {
  const exchange = await exChangeRepository.getByShopIdAndUser(shopId, userId);

  if (!exchange) {
    const error: CustomError = new Error("Not Found");
    error.status = 404;
    error.message = "신청한 교환 내역을 찾을 수 없습니다.";
    throw error;
  }

  return exchange;
};

/* 판매중인 포토카드 수정 */
const updateShopCard = async (data: UpdateShopCardData) => {
  const card = await checkCardExists(data.shopId);

  if (card.userId !== data.userId) {
    const error: any = new Error("Unauthorized access to this card");
    error.status = 403;
    throw error;
  }

  const cardInfo = await prismaClient.card.findUnique({
    where: { id: card.cardId },
  });

  if (!cardInfo) {
    throw new Error("Card not found");
  }

  // Update logic for card as per the conditions given in the original code...

  await createNotificationFromType(6, {
    userId: data.userId,
    shop: {
      user: { id: data.userId },
      card: cardInfo,
    },
  });

  return {
    ...(await shopRepository.updateShopCard(data)),
    imageUrl: cardInfo.imageURL,
  };
};

/* 판매 중인 포토 카드 취소 */
const deleteShopCard = async (shopId: number, userId: number) => {
  const card = await checkCardExists(shopId);

  if (card.userId !== userId) {
    const error: any = new Error("Unauthorized access to this card");
    error.status = 403;
    throw error;
  }

  const cardInfo = await prismaClient.card.findUnique({
    where: { id: card.cardId },
  });

  if (!cardInfo) {
    throw new Error("Card not found");
  }

  await createNotificationFromType(5, {
    userId: card.userId,
    shop: {
      user: { id: card.userId },
      card: { name: cardInfo.name, grade: cardInfo.grade },
    },
  });

  return await shopRepository.deleteShopCard(shopId, userId);
};

/* 모든 판매중인 포토카드 조회 */
const getAllShop = async (
  filters: Record<string, any> = {},
  sortOrder = "createAt_DESC",
  page: number,
  pageSize: number
) => {
  const { cards, totalCards } = await shopRepository.getAllShopCards(
    filters,
    sortOrder,
    page,
    pageSize
  );

  if (cards.length === 0) {
    throw new Error("입력하신 조건에 맞는 카드를 찾을 수 없습니다.");
  }

  return {
    list: cards.map((shopCard) => ({
      ...shopCard,
      isSoldOut: shopCard.remainingCount === 0,
    })),
    hasMore: totalCards > page * pageSize,
  };
};

const getExchangeByShopId = async (shopId: number) => {
  return await shopRepository.getExchangeByShopId(shopId);
};

/* 필터별 카드 개수 조회 */
const getFilterCounts = async (filters: Record<string, any> = {}) => {
  const { grade, genre, isSoldOut } = filters;

  const where: Record<string, any> = {
    AND: [
      ...(isSoldOut !== undefined
        ? [{ remainingCount: isSoldOut === "true" ? 0 : { gt: 0 } }]
        : []),
    ],
  };

  const totalCardsCount = await prismaClient.shop.count({ where });

  const genreCounts = await prismaClient.shop.findMany({
    where,
    include: {
      card: { select: { genre: true } },
    },
  });

  const gradeCounts = await prismaClient.shop.findMany({
    where,
    include: {
      card: { select: { grade: true } },
    },
  });

  const soldOutCount = await prismaClient.shop.count({
    where: {
      ...where,
      remainingCount: 0,
    },
  });

  const gradeCount = gradeCounts.reduce((acc: Record<string, number>, item) => {
    const grade = item.card.grade;
    acc[grade] = (acc[grade] || 0) + 1;
    return acc;
  }, {});

  const genreCount = genreCounts.reduce((acc: Record<string, number>, item) => {
    const genre = item.card.genre;
    acc[genre] = (acc[genre] || 0) + 1;
    return acc;
  }, {});

  return {
    totalCount: totalCardsCount,
    gradeCount,
    genreCount,
    soldOutCount,
  };
};

export default {
  createShopCard,
  getShopByShopId,
  updateShopCard,
  deleteShopCard,
  getAllShop,
  getExchangeByShopId,
  getExchangeByUserId,
  getFilterCounts,
};
