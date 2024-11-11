import prismaClient from "../utils/prismaClient.js";

// 포인트 뽑기(랜덤으로 뽑은 포인트 추가)
const drawPoints = async (userId: number, drawResult: number) => {
  return await prismaClient.user.update({
    where: { id: userId },
    data: {
      point: {
        increment: drawResult, // 기존 포인트에서 포인트 drawResult 만큼 증가시킴
      },
      drawtime: new Date(), // 현재 시간을 drawtime에 저장
    },
  });
};

// 유저 정보 조회
const getUserById = async (userId: number) => {
  return await prismaClient.user.findUnique({
    where: { id: userId },
  });
};

export default {
  drawPoints,
  getUserById,
};
