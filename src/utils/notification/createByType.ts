import notificationRepository from "../../repositorys/notificationRepository";
import { Exchange, Shop, Purchase, User, Card } from "@prisma/client";
import { CustomError } from "../interface/customError";

interface ShopData {
  user: { nickname?: string; id: number };
  card: { name: string; grade: string };
}

interface ExchangeData extends Exchange {
  shop: ShopData;
  user: { nickname: string };
  card: { name: string; grade: string };
}

interface PurchaseData extends Purchase {
  userId: number;
  card: Card;
  count?: number;
  consumer?: string;
  id: number; // 필수 속성
  createAt: Date; // 필수 속성
  updateAt: Date;
  cardId: number;
  shopId: number;
}

interface NotificationType {
  userId: number;
  exchange?: ExchangeData;
  shop?: ShopData;
  purchase?: PurchaseData;
}

interface NotificationUser {
  userId: number;
  nickname: string;
  point: number;
}

interface NotificationData {
  userId: number;
  content: string;
  type: string;
}

const switchingType = (type: number, exchange: ExchangeData) => {
  const { user: consumer, userId: consumerId, shop } = exchange;

  switch (type) {
    case 1: //교환제안 판매자에게
      return {
        userId: shop.user.id,
        type: "교환제안",
        content: `${consumer.nickname}님이 [${shop.card.grade} | ${shop.card.name}]의 포토 카드 교환 제안을 했습니다.`,
      };
    case 2: //교환승인 구매자에게
      return {
        userId: consumerId,
        type: "교환승인",
        content: `${shop.user.nickname}님과의 [${shop.card.grade} | ${shop.card.name}]의 포토 카드 교환이 성사되었습니다.`,
      };
    case 3: //교환거절 구매자에게
      return {
        userId: consumerId,
        type: "교환거절",
        content: `${shop.user.nickname}님과의 [${shop.card.grade} | ${shop.card.name}]의 포토 카드 교환이 거절되었습니다.`,
      };
    case 4: //교환승인후 품절이라면 교환을 제안한 모든 사람에게
      return {
        userId: consumerId,
        type: "품절",
        content: `${shop.user.nickname}님과의 [${shop.card.grade} | ${shop.card.name}]의 포토 카드 교환이 거절되었습니다.(품절)`,
      };
    case 5: //교환신청자의 취소후 판매자에게
      return {
        userId: shop.user.id,
        type: "취소",
        content: `${consumer.nickname}님과의 [${shop.card.grade} | ${shop.card.name}]의 포토 카드 교환제안이 취소되었습니다.`,
      };
  }
};

/* 상점 관련 알림 */
const switchingTypeForShop = (type: number, shop: ShopData) => {
  const { user, card } = shop; // userId는 판매자 ID, card는 카드 정보

  switch (type) {
    case 4: // 포토카드 판매 등록시, 사용자에게
      return {
        userId: user.id,
        type: "등록완료",
        content: `[${card.grade} | ${card.name}]이 성공적으로 등록되었습니다.`,
      };
    case 5: // 포토카드 판매 취소시, 사용자에게
      return {
        userId: user.id,
        type: "판매취소",
        content: `[${card.grade} | ${card.name}]의 판매가 취소되었습니다.`,
      };
    case 6: // 판매중인 포토카드 수정, 사용자에게
      return {
        userId: user.id,
        type: "카드수정",
        content: `[${card.grade} | ${card.name}]이 수정되었습니다.`,
      };
  }
};

const switchingTypeForPurchase = (type: number, purchase: PurchaseData) => {
  switch (type) {
    case 7: // 포토카드 판매 완료시, 구매자에게
      return {
        userId: purchase.userId,
        type: "구매 완료",
        content: `[${purchase.card?.grade} | ${purchase.card?.name}] ${purchase.count}장을 성공적으로 구매했습니다.`,
      };
    case 8: //포토카드 판매 완료시, 판매자에게
      return {
        userId: purchase.userId,
        type: "판매 완료",
        content: `${purchase.consumer}님이 [${purchase.card?.grade} | ${purchase.card?.name}]을 ${purchase.count}장 구매했습니다.`,
      };
    case 9: // 품절시, 구매자+판매자에게
      return {
        userId: purchase.userId,
        type: "품절",
        content: `[${purchase.card?.grade} | ${purchase.card?.name}]이 품절되었습니다.`,
      };
  }
};

/* 포인트 알림 */
const createPointNotification = (
  userId: number,
  nickname: string,
  point: number
) => {
  return {
    userId: userId, // 사용자의 ID
    type: "포인트획득",
    content: `${nickname}님이 ${point} 포인트를 획득하였습니다.`,
  };
};

const createNotificationFromType = async (
  type: number,
  data: NotificationType | NotificationUser
) => {
  try {
    let notificationData: NotificationData | undefined;
    if ("exchange" in data)
      if (data.exchange) {
        // 교환 관련 알림 처리
        notificationData = switchingType(type, data.exchange);
      } else if (data.shop) {
        // 상점 관련 알림 처리
        notificationData = switchingTypeForShop(type, data.shop);
      } else if (type === 10) {
        const { userId, nickname, point } = data as unknown as NotificationUser; //고민이 좀 필요함 맞지않는 타입을 형 변환 하고 있음
        notificationData = createPointNotification(userId, nickname, point);
      } else {
        notificationData = switchingTypeForPurchase(
          type,
          data.purchase as PurchaseData
        );
      }
    const notification = await notificationRepository.createNotification(
      notificationData as NotificationData
    );

    return notification;
  } catch (e) {
    const error: CustomError = new Error("Internal Server Error");
    error.status = 500;
    error.data = {
      message: "알림 생성에 실패 했습니다.",
    };
    throw error;
  }
};

export default createNotificationFromType;
