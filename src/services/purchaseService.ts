import purchaseRepository from "../repositorys/purchaseRepository";
import createNotificationFromType from "../utils/notification/createByType";
import prismaClient from "../utils/prismaClient";
import { Card, Shop } from "@prisma/client";
import { CustomError } from "../utils/interface/customError";

// 알림 인터페이스 정의
interface PurchaseNotificationData {
  userId: number;
  card: Card;
  count?: number;
  consumer?: string;
  id: number;
  createAt: Date;
  updateAt: Date;
  cardId: number;
  shopId: number;
}

// 구매 생성 함수
const createPurchase = async (
  buyerId: number,
  count: number,
  shopId: number
): Promise<{ purchase: Shop } | CustomError> => {
  // 구매 및 상점 업데이트 처리
  const purchase = await purchaseRepository.createPurchase(
    buyerId,
    count,
    shopId
  );

  if (purchase) {
    // 구매 성공 알림을 생성하는 함수
    const sendNotification = async (
      type: number,
      data: PurchaseNotificationData
    ) => {
      await createNotificationFromType(type, {
        userId: data.userId,
        purchase: data,
      });
    };

    const notificationPromises: Promise<void>[] = [];

    // 구매자 알림 (구매 성공)
    notificationPromises.push(
      sendNotification(7, {
        userId: buyerId,
        card: purchase.card,
        count: count,
        id: purchase.id,
        createAt: purchase.createAt,
        updateAt: purchase.updateAt,
        cardId: purchase.cardId,
        shopId: purchase.id,
      })
    );

    // 판매자 알림 (판매 성공)
    const consumer = await prismaClient.user.findUnique({
      where: { id: buyerId },
      select: { nickname: true },
    });

    if (!consumer) {
      throw new Error("Buyer information retrieval failed.");
    }

    notificationPromises.push(
      sendNotification(8, {
        consumer: consumer.nickname,
        userId: purchase.userId,
        card: purchase.card,
        count: count,
        id: purchase.id,
        createAt: purchase.createAt,
        updateAt: purchase.updateAt,
        cardId: purchase.cardId,
        shopId: purchase.id,
      })
    );

    // 품절 알림 (구매자에게) 및 교환 알림 처리
    if (purchase.remainingCount === 0) {
      // 판매자 품절 알림 추가
      notificationPromises.push(
        sendNotification(9, {
          userId: purchase.userId,
          card: purchase.card,
          id: purchase.id,
          createAt: purchase.createAt,
          updateAt: purchase.updateAt,
          cardId: purchase.cardId,
          shopId: purchase.id,
        })
      );

      // 교환 요청자에게 교환 알림 추가
      const exchangeRequests = await prismaClient.exchange.findMany({
        where: {
          shopId: shopId,
          isApprove: true,
        },
        select: {
          userId: true,
        },
      });

      exchangeRequests.forEach((exchange) => {
        notificationPromises.push(
          sendNotification(9, {
            userId: exchange.userId,
            card: purchase.card,
            id: purchase.id,
            createAt: purchase.createAt,
            updateAt: purchase.updateAt,
            cardId: purchase.cardId,
            shopId: purchase.id,
          })
        );
      });
    }

    // 알림을 병렬로 처리
    await Promise.all(notificationPromises);

    return { purchase };
  }
  const error: CustomError = new Error();
  error.status = 500;
  error.message = "Internal Server Error";

  return error;
};

export default { createPurchase };
