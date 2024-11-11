import { NumericalBotVersion } from "aws-sdk/clients/lexmodelsv2.js";
import notificationRepository from "../repositorys/notificationRepository.js";
import { CustomError } from "../utils/interface/customError.js";
import { Notification } from "@prisma/client";

interface NotificationData {
  userId: number;
  content: string;
}

/* 알림 경과시간 계산 */
const calculateTime = (createAt: Date) => {
  const now = new Date();
  const createdTime = new Date(createAt);
  const timeDiff = now.getDate() - createdTime.getDate(); // 밀리초 단위 차이

  const seconds = Math.floor(timeDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return `${years}년 전`;
  if (months > 0) return `${months}개월 전`;
  if (weeks > 0) return `${weeks}주일 전`;
  if (days > 0) return `${days}일 전`;
  if (hours > 0) return `${hours}시간 전`;
  if (minutes > 0) return `${minutes}분 전`;
  return `${seconds}초 전`;
};

/* 알림 생성 */
const createNotification = async (data: NotificationData) => {
  return await notificationRepository.createNotification(data);
};

/* 현재까지 온 (전체) 알림 조회 */
const getAllNotifications = async (userId: number) => {
  const notifications = await notificationRepository.getAllNotifications(
    userId
  );

  return notifications.map((notification) => ({
    ...notification,
    timeAgo: calculateTime(notification.createAt), // 알림 경과 시간 추가
  }));
};

/* 특정 알림 조회 */
const getNotificationById = async (id: number) => {
  const notification = await notificationRepository.getNotificationById(id);
  if (!notification) {
    const error: CustomError = new Error("Not Found");
    error.status = 404;
    error.data = {
      message: "알림을 찾을 수 없습니다.",
    };
    throw error;
  }

  // 경과 시간 추가
  return {
    ...notification,
    timeAgo: calculateTime(notification.createAt),
  };
};

/* 알림 업데이트 */
const updateNotification = async (id: number) => {
  const notification = await notificationRepository.getNotificationById(id);

  if (!notification) {
    const error: CustomError = new Error("Not Found");
    error.status = 404;
    error.data = {
      message: "알림을 찾을 수 없습니다.",
    };
    throw error;
  }

  return await notificationRepository.updateNotification(id);
};

/* 알림 삭제 */
const deleteNotification = async (id: number) => {
  const notification = await notificationRepository.getNotificationById(id);

  if (!notification) {
    const error: CustomError = new Error("Not Found");
    error.status = 404;
    error.data = {
      message: "알림을 찾을 수 없습니다.",
    };
    throw error;
  }

  return await notificationRepository.deleteNotification(id);
};

export default {
  createNotification,
  deleteNotification,
  getAllNotifications,
  updateNotification,
  getNotificationById,
};
