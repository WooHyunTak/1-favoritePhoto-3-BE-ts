import prismaClient from "../utils/prismaClient";
import {
  CreateCardData,
  GetByUserIdParamsWith,
} from "../utils/interface/card/cardInterfaces";

const createCard = (data: CreateCardData) => {
  return prismaClient.card.create({
    data,
    include: {
      user: {
        select: {
          nickname: true,
          point: true,
          email: true,
          id: true,
        },
      },
    },
  });
};

const getByUserId = (data: GetByUserIdParamsWith) => {
  const { where, limit, cursor } = data;
  return prismaClient.card.findMany({
    where,
    take: limit + 1, //추가적인 데이터가 있는지 확인을 위함
    skip: cursor ? 1 : undefined,
    cursor: cursor ? { id: Number(cursor) } : undefined,
    include: {
      user: {
        select: {
          nickname: true,
        },
      },
    },
  });
};

export default { createCard, getByUserId };
