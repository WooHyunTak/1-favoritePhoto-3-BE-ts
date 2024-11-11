import exchangeRepository from "../repositorys/exchangeRepository";
import shopRepository from "../repositorys/shopRepository";
import { CustomError } from "../utils/interface/customError";
import { QueryString, WhereConditions } from "../utils/interface/queryString";
import createNotificationFromType from "../utils/notification/createByType";

interface ExchangeData {
  userId: number;
  cardId: number;
  shopId: number;
  count: number;
  description: string;
}

const whereConditions = (userId: number, keyword: string) => {
  const where: WhereConditions = { userId };
  if (keyword) {
    where.OR = [
      {
        shop: {
          card: {
            name: { contains: keyword, mode: "insensitive" },
          },
        },
      },
      {
        card: {
          name: { contains: keyword, mode: "insensitive" },
        },
      },
    ];
  }
  return where;
};

const createExchange = async (data: ExchangeData) => {
  try {
    //판매의 남아있는 카드 수량을 검사하는 로직 필요
    const checkShop = await shopRepository.getShopItem(data.shopId);
    if (checkShop)
      if (checkShop.remainingCount <= 0) {
        const error: CustomError = new Error("Unprocessable Entity");
        error.status = 422;
        error.data = {
          message: "거래가능한 수량이 없습니다.",
        };
        throw error;
      }
    const exchange = await exchangeRepository.create(data);
    //판매자에게 교환제안 알림생성
    createNotificationFromType(1, exchange);
    return exchange;
  } catch (error) {
    throw error;
  }
};

//요구사항에 없음 일단 제작
const updateExchange = async (exchangeId: number, data: ExchangeData) => {
  const exchange = await exchangeRepository.update(exchangeId, data);

  return exchange;
};

const deleteExchange = async (exchangeId: number, userId: number) => {
  try {
    const exchange = await exchangeRepository.getById(exchangeId);
    if (!exchange) {
      const error: CustomError = new Error("Not Found");
      error.status = 404;
      error.data = {
        message: "교환신청 내역을 찾을수 없습니다.",
      };
      throw error;
    }

    if (exchange.userId !== userId) {
      const error: CustomError = new Error("Unauthorized");
      error.status = 401;
      error.data = {
        message: "본인의 교환제안만 취소 할 수 있습니다.",
      };
      throw error;
    }
    //판매자에게 교환제안취소 알림생성
    createNotificationFromType(5, exchange);
    const deleteExchange = await exchangeRepository.deleteExchange(exchangeId);
    return deleteExchange;
  } catch (error) {
    throw error;
  }
};

const acceptExchange = async (exchangeId: number) => {
  try {
    const exchange = await exchangeRepository.getById(exchangeId);
    if (!exchange) {
      const error: CustomError = new Error("Not Found");
      error.status = 404;
      error.data = {
        message: "교환내역을 찾지 못했습니다.",
      };
      throw error;
    }

    if (exchange.shop.remainingCount <= 0) {
      const error: CustomError = new Error("Unprocessable Entity");
      error.status = 422;
      error.data = {
        message: "거래가능한 수량이 없습니다.",
      };
      throw error;
    }

    const { updateShopItem, ownerCard } =
      await exchangeRepository.acceptExchange(exchange);

    if (ownerCard && updateShopItem) {
      if (updateShopItem.remainingCount <= 0) {
        //모든 교환 신청자데이터
        const allExchangeUsers = await exchangeRepository.getByShopId(
          updateShopItem.id
        );
        //교환이 승인된 신청자를 제외
        const notificationUsers = allExchangeUsers.filter(
          (item) => item.id !== exchangeId
        );
        //성사된 제안자를 제외한 리스트의 모든 유저에게 알림생성
        notificationUsers.map((exchange) =>
          createNotificationFromType(4, exchange)
        );
      }
      //승인된 싱청자에게 성사 알림생성
      createNotificationFromType(2, exchange);
      //해당 상품의 모든 교환제안을 삭제해야 하는지 의문...
      await exchangeRepository.deleteExchange(exchangeId);
    }
    return ownerCard;
  } catch (error) {
    throw error;
  }
};

const refuseExchange = async (exchangeId: number, userId: number) => {
  try {
    const exchange = await exchangeRepository.getById(exchangeId);
    if (!exchange) {
      const error: CustomError = new Error("Not Found");
      error.status = 404;
      error.data = {
        message: "교환내역을 찾지 못했습니다.",
      };
      throw error;
    }
    if (exchange.shop.userId !== userId) {
      const error: CustomError = new Error("Unauthorized");
      error.status = 401;
      error.data = {
        message: "판매자만 교환거절을 할 수 있습니다.",
      };
      throw error;
    }
    //신청자에게 교환거절 알림생성
    createNotificationFromType(3, exchange);
    await exchangeRepository.deleteExchange(exchangeId);
    return true;
  } catch (error) {
    throw error;
  }
};

const getByUserId = async (userId: number, data: QueryString) => {
  const { limit, cursor, keyword } = data;
  const where = whereConditions(userId, keyword);
  const exchanges = await exchangeRepository.getByUserId(cursor, limit, where);

  if (!exchanges) {
    const error: CustomError = new Error("Not Found");
    error.status = 404;
    error.message = "신청내역을 찾을 수 없습니다.";
    throw error;
  }
  //추가적인 데이터가 있는지 확인
  const nextExchanges = exchanges.length > limit;
  //추가 데이터가 있다면 커서값을 주고 데이터에서 리미트에 맞춰 돌려준다
  const nextCursor = nextExchanges ? exchanges[limit - 1].id : "";

  return {
    list: exchanges.slice(0, limit),
    nextCursor,
  };
};

const getByShopId = async (shopId: number) => {
  const exchanges = await exchangeRepository.getByShopId(shopId);

  if (!exchanges) {
    const error: CustomError = new Error("Not Found");
    error.status = 404;
    error.message = "신청내역을 찾을 수 없습니다.";
    throw error;
  }

  return exchanges;
};

export default {
  createExchange,
  updateExchange,
  deleteExchange,
  refuseExchange,
  getByUserId,
  getByShopId,
  acceptExchange,
};
