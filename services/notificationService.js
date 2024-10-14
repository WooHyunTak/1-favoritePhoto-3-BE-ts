//services\notificationService.js

import notificationRepository from "../repositorys/notificationRepository.js";

const createNotification = async (data) => {
  try {
    return await notificationRepository.createNotification(data);
  } catch (error) {
    const serviceError = new Error("알림 생성 중 오류 발생");
    serviceError.status = 500; // 기본 상태 코드
    serviceError.data = {
      originalError: error.message,
      inputData: data, // 입력 데이터 포함
    };
    throw serviceError;
  }
};

const getAllNotifications = async (userId) => {
  try {
    return await notificationRepository.getAllNotifications(userId);
  } catch (error) {
    const serviceError = new Error("알림 조회 중 오류 발생");
    serviceError.status = 500;
    serviceError.data = {
      originalError: error.message,
      userId, // 사용자 ID 포함
    };
    throw serviceError;
  }
};

const getNotificationsByType = async (userId, type) => {
  try {
    return await notificationRepository.getNotificationsByType(userId, type);
  } catch (error) {
    const serviceError = new Error("알림 조회 중 오류 발생");
    serviceError.status = 500;
    serviceError.data = {
      originalError: error.message,
      userId,
      type, // 알림 타입 포함
    };
    throw serviceError;
  }
};

/* 알림 업데이트 */
const updateNotification = async (id, data) => {
  try {
    const notification = await notificationRepository.getNotificationById(
      parseInt(id, 10)
    );
    if (!notification) {
      const error = new Error("알림을 찾을 수 없습니다.");
      error.status = 404; // 404 상태 코드 설정
      error.data = {
        notificationId: id, // 알림 ID 포함
      };
      throw error;
    }
    return await notificationRepository.updateNotification({
      id: parseInt(id, 10), // id 객체로 전달
      data,
    });
  } catch (error) {
    const serviceError = new Error("알림 업데이트 중 오류 발생");
    serviceError.status = 500;
    serviceError.data = {
      originalError: error.message,
      notificationId: id,
      updateData: data, // 업데이트 데이터 포함
    };
    throw serviceError;
  }
};

const deleteNotification = async (id) => {
  try {
    const notification = await notificationRepository.getNotificationById(id);
    if (!notification) {
      const error = new Error("알림을 찾을 수 없습니다.");
      error.status = 404; // 404 상태 코드 설정
      error.data = {
        notificationId: id, // 알림 ID 포함
      };
      throw error;
    }
    return await notificationRepository.deleteNotification(id);
  } catch (error) {
    const serviceError = new Error("알림 삭제 중 오류 발생");
    serviceError.status = 500;
    serviceError.data = {
      originalError: error.message,
      notificationId: id, // 알림 ID 포함
    };
    throw serviceError;
  }
};

export default {
  createNotification,
  deleteNotification,
  getAllNotifications,
  updateNotification,
  getNotificationsByType,
};
