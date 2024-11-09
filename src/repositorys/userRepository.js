import prismaClient from "../utils/prismaClient.js";

const getMySales = (data) => {
  const { where, limit, cursor } = data;
  return prismaClient.card.findMany({
    where,
    take: limit + 1, //추가적인 데이터가 있는지 확인을 위함
    skip: cursor ? 1 : undefined,
    cursor: cursor ? { id: cursor } : undefined,
    include: {
      user: {
        select: {
          nickname: true,
        },
      },
      shop: {
        select: {
          id: true,
          cardId: true,
          remainingCount: true,
        },
      },
      exchange: {
        select: {
          id: true,
          count: true,
          shopId: true,
          cardId: true,
        },
      },
    },
  });
};

const getMySalesCount = async (data) => {
  const { where, userId } = data;
  //각 등급의 수를 그룹화
  const gradeCountsPromise = await prismaClient.card.groupBy({
    where,
    by: ["grade"],
    _count: {
      id: true,
    },
  });

  //각 장르의 수를 그룹화
  const genreCountsPromise = await prismaClient.card.groupBy({
    where,
    by: ["genre"],
    _count: {
      id: true,
    },
  });

  //각 판매방법의 수를 그룹화
  const exchangeTypeCountsPromise = await prismaClient.exchange.count({
    where: {
      userId,
    },
  });
  const shopTypeCountsPromise = await prismaClient.shop.count({
    where: {
      userId,
    },
  });
  const shopTypeSoldOutCountsPromise = await prismaClient.shop.count({
    where: {
      userId,
      remainingCount: {
        lte: 0, // remainingCount가 0 이하인 경우
      },
    },
  });

  const [gradeCounts, genreCounts, exchangeCounts, shopCounts, isSoldOut] =
    await Promise.all([
      gradeCountsPromise,
      genreCountsPromise,
      exchangeTypeCountsPromise,
      shopTypeCountsPromise,
      shopTypeSoldOutCountsPromise,
    ]);

  // 그룹화한 등금을 원하는 JSON 형태로 변환
  const formattedGradeCounts = gradeCounts.reduce((acc, curr) => {
    acc[curr.grade] = curr._count.id;
    return acc;
  }, {});

  // 그룹화한 장르을 원하는 JSON 형태로 변환
  const formattedGenreCounts = genreCounts.reduce((acc, curr) => {
    acc[curr.genre] = curr._count.id;
    return acc;
  }, {});

  return {
    totalCount: shopCounts + exchangeCounts,
    gradeCount: formattedGradeCounts,
    genreCount: formattedGenreCounts,
    typeCount: {
      shop: {
        count: shopCounts,
        isSoldOut,
      },
      exchange: exchangeCounts,
    },
  };
};

const getMyCardCount = async (userId) => {
  //사용자의 id로 등록된 총 카드의 수
  const totalCount = await prismaClient.card.count({
    where: {
      userId,
    },
  });
  //각 등급의 수를 그룹화
  const gradeCounts = await prismaClient.card.groupBy({
    where: {
      userId,
    },
    by: ["grade"],
    _count: {
      id: true,
    },
  });
  // 그룹화한 등금을 원하는 JSON 형태로 변환
  const formattedGradeCounts = gradeCounts.reduce((acc, curr) => {
    acc[curr.grade] = curr._count.id;
    return acc;
  }, {});

  //각 장르의 수를 그룹화
  const genreCounts = await prismaClient.card.groupBy({
    where: {
      userId,
    },
    by: ["genre"],
    _count: {
      id: true,
    },
  });
  // 그룹화한 장르을 원하는 JSON 형태로 변환
  const formattedGenreCounts = genreCounts.reduce((acc, curr) => {
    acc[curr.genre] = curr._count.id;
    return acc;
  }, {});

  return {
    totalCount,
    gradeCount: formattedGradeCounts,
    genreCount: formattedGenreCounts,
  };
};

const getByEmail = (email) => {
  return prismaClient.user.findUnique({
    where: {
      email,
    },
  });
};

const getByNickname = (nickname) => {
  return prismaClient.user.findFirst({
    where: {
      nickname,
    },
  });
};

const getById = (id) => {
  return prismaClient.user.findUnique({
    where: {
      id,
    },
  });
};

const create = (data) => {
  return prismaClient.user.create({
    data,
  });
};

const update = (id, data) => {
  return prismaClient.user.update({
    where: {
      id,
    },
    data,
  });
};

const deleteUser = (id) => {
  return prismaClient.user.update({
    where: {
      id,
    },
    data: {
      isdeleted: true,
    },
  });
};

export default {
  getMySales,
  getMySalesCount,
  getByEmail,
  getByNickname,
  getMyCardCount,
  getById,
  create,
  update,
  deleteUser,
};