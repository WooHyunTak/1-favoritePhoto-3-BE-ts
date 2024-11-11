import pointRepository from "../repositorys/pointRepository.js";
import { getRandomPoint } from "../utils/random/random.js"; // 랜덤 유틸리티 가져옴
import createNotificationFromType from "../utils/notification/createByType.js";
import { User } from "@prisma/client";

/* 포인트 뽑기 */
const drawPoints = async (userId: number) => {
  const user = await pointRepository.getUserById(userId); // 사용자 정보 가져오기
  const currentTime = new Date(); // 현재 시간을 가져옴

  if (!user) return;

  // 마지막 뽑기 시간 1사건 자났는지 확인!!
  const timeDiff = currentTime.getTime() - user.drawtime.getTime();
  if (timeDiff < 3600000) {
    throw new Error("1시간에 1번만 뽑을 수 있습니다.");
  }

  const drawResult = getRandomPoint(); // 랜덤 포인트 생성
  const updatedUser = await pointRepository.drawPoints(userId, drawResult);

  // 알림 생성
  await createNotificationFromType(10, {
    userId: user.id, // 사용자 ID
    nickname: user.nickname, // 로그인한 사용자의 닉네임
    point: drawResult, // 획득한 포인트
  });

  return filterSensitiveUserData(updatedUser);
};

const filterSensitiveUserData = (user: User) => {
  //리스폰스의 민감한 정보를 빼고 보낸다
  const { password, refreshToken, ...rest } = user;
  return rest;
};

export default {
  drawPoints,
};
