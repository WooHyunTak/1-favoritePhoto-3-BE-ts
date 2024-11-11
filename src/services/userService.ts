import userRepository from "../repositorys/userRepository.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { User } from "@prisma/client";
import { JWT_SECRET } from "../env";
import { CustomError } from "../utils/interface/customError.js";

interface searchItem {
  limit?: number;
  cursor?: number;
  keyword: string;
  userId?: number;
  grade: string;
  genre: string;
  salesType: string;
  isSoldOut: string;
}

interface whereConditions {
  keyword?: string;
  genre?: string;
  grade?: string;
  OR?: Object;
  name?: Object;
  userId?: number;
  shop?: Object;
  exchange?: Object;
  salesType?: string;
  isSoldOut?: string;
}

interface UserData {
  email: string;
  password: string;
  nickname: string;
  refreshToken?: string;
}

type ResponseUser = Omit<User, "password" | "refreshToken">;

const whereConditions = ({
  keyword,
  userId,
  grade,
  genre,
  salesType,
  isSoldOut,
}: whereConditions) => {
  const where: whereConditions = {
    userId,
    name: { contains: keyword, mode: "insensitive" },
  };
  if (genre) {
    where.genre = genre;
  }

  if (grade) {
    where.grade = grade;
  }
  let salesTypeWhere = { ...where };

  switch (salesType) {
    case "sales":
      if (isSoldOut !== "true") {
        salesTypeWhere.shop = {
          some: {
            remainingCount: {
              gt: 0, // remainingCount가 0 이상인 경우
            },
          }, // Shop과 관계가 있는 카드
        };
      } else {
        salesTypeWhere.shop = {
          some: {
            remainingCount: {
              lte: 0, // remainingCount가 0 이하인 경우
            },
          }, // Shop과 관계가 있는 카드
        };
      }

      break;
    case "exchange":
      salesTypeWhere.exchange = {
        some: {}, // Exchange와 관계가 있는 카드
      };
      break;
    default:
      salesTypeWhere.OR = [
        {
          shop: {
            some: {},
          },
        },
        {
          exchange: {
            some: {},
          },
        },
      ];
  }
  return salesTypeWhere;
};

const createToken = (user: ResponseUser, type?: string) => {
  const payload = { userId: user.id, email: user.email }; //jwt 토근 정도에 사용자의 id, email 정보를 담는다.
  const options = { expiresIn: type ? "1w" : "1h" }; //refresh 토큰의 경우 1주일, access 토근은 1시간의 유효성을 둔다
  return jwt.sign(payload, JWT_SECRET as string, options);
};

const getUser = async (email: string, password: string) => {
  const user = await userRepository.getByEmail(email);
  if (!user) {
    const error: CustomError = new Error("Mot found");
    error.status = 404;
    error.data = {
      message: "등록된 사용자가 없습니다.",
      email,
    };
    throw error;
  }

  await verifyPassword(password, user.password);
  return filterSensitiveUserData(user);
};

const getUserByEmail = async (email: string) => {
  const user = await userRepository.getByEmail(email);
  if (!user) {
    return null;
  }
  return filterSensitiveUserData(user);
};

const getUserByNickname = async (nickname: string) => {
  const user = await userRepository.getByNickname(nickname);
  if (!user) {
    return null;
  }
  return filterSensitiveUserData(user);
};

const getUserById = async (userId: number) => {
  const user = await userRepository.getById(userId);

  if (!user) {
    const error: CustomError = new Error("Mot found");
    error.status = 404;
    error.data = {
      message: "등록된 사용자가 없습니다.",
      userId,
    };
    throw error;
  }

  return filterSensitiveUserData(user);
};

const refreshToken = async (userId: number, refreshToken: string) => {
  const user = await userRepository.getById(userId);

  if (!user) {
    const error: CustomError = new Error("Mot found");
    error.status = 404;
    error.data = {
      message: "등록된 사용자가 없습니다.",
    };
    throw error;
  }

  if (refreshToken !== user.refreshToken) {
    const error: CustomError = new Error("Forbidden");
    error.status = 403;
    error.data = {
      message: "리프레쉬 토큰이 유효하지 않습니다.",
    };
    throw error;
  }
  return user;
};

const getMySales = async (userId: number, data: searchItem) => {
  const {
    limit = 5,
    cursor,
    grade,
    genre,
    salesType,
    isSoldOut,
    keyword,
  } = data;
  const where = whereConditions({
    keyword,
    userId,
    grade,
    genre,
    salesType,
    isSoldOut,
  });
  const sales = await userRepository.getMySales({ where, limit, cursor });
  if (!sales) {
    const error: CustomError = new Error("Mot found");
    error.status = 404;
    error.data = {
      message: "나의 판매목록을 찾을 수 없습니다.",
    };
    throw error;
  }
  //추가적인 데이터가 있는지 확인
  const nextSales = sales.length > limit;
  //추가 데이터가 있다면 커서값을 주고 데이터에서 리미트에 맞춰 돌려준다
  const nextCursor = nextSales ? sales[limit - 1].id : "";

  const returnSales = sales.map((item) => {
    let salesType = null;
    let isSoldOut = false;

    if (item.shop.length > 0 && item.exchange.length > 0) {
      salesType = "sales/exchange";
      isSoldOut = item.shop.some((shop) => shop.remainingCount <= 0);
    } else if (item.exchange.length > 0) {
      salesType = "exchange";
    } else if (item.shop.length > 0) {
      salesType = "sales";
      isSoldOut = item.shop.some((shop) => shop.remainingCount <= 0);
    }

    return {
      ...item,
      salesType,
      isSoldOut,
    };
  });

  return {
    list: returnSales.slice(0, limit),
    nextCursor,
  };
};

const getMySalesCount = async (userId: number) => {
  const where = whereConditions({
    userId,
  });
  const sales = await userRepository.getMySalesCount({ where, userId });
  if (!sales) {
    const error: CustomError = new Error("Mot found");
    error.status = 404;
    error.data = {
      message: "나의 판매목록을 찾을 수 없습니다.",
    };
    throw error;
  }

  return sales;
};

const getByUserCardsCount = async (userId: number) => {
  const userCardCount = await userRepository.getMyCardCount(userId);
  if (!userCardCount) {
    const error: CustomError = new Error("Not Found");
    error.status = 404;
    error.data = {
      message: "카드정보를 찾을수 없습니다.",
    };
    throw error;
  }
  return userCardCount;
};

const create = async (data: UserData) => {
  const userByEmail = await userRepository.getByEmail(data.email);
  if (userByEmail) {
    //이미 사용중인 이메일인 경우 아래의 에러를 반환한다.
    const error: CustomError = new Error("Unprocessable Entity");
    error.status = 422;
    error.data = {
      message: "사용중인 이메일입니다.",
      email: userByEmail.email,
      column: "email",
    };
    throw error;
  }
  const userByNickname = await userRepository.getByNickname(data.nickname);
  if (userByNickname) {
    //이미 사용중인 이메일인 경우 아래의 에러를 반환한다.
    const error: CustomError = new Error("Unprocessable Entity");
    error.status = 422;
    error.data = {
      message: "사용중인 닉네임입니다.",
      nickname: userByNickname.nickname,
      column: "nickname",
    };
    throw error;
  }

  const hashedPassword = await hashingPassword(data.password);
  const createUser = await userRepository.create({
    ...data,
    password: hashedPassword,
  });

  return filterSensitiveUserData(createUser);
};

const updateUser = async (id: number, data: UserData) => {
  const user = await userRepository.update(id, data);

  return filterSensitiveUserData(user);
};

const updateRefreshToken = async (id: number, refreshToken: string) => {
  const user = await userRepository.updateToken(id, refreshToken);

  return filterSensitiveUserData(user);
};

const deleteUser = async (id: number) => {
  const user = await userRepository.deleteUser(id);

  return filterSensitiveUserData(user);
};

const hashingPassword = async (password: string) => {
  // 함수 추가
  return bcrypt.hash(password, 10);
};

const filterSensitiveUserData = (user: User) => {
  //리스폰스의 민감한 정보를 빼고 보낸다
  const { password, refreshToken, ...rest } = user;
  return rest;
};

const verifyPassword = async (inputPassword: string, savedPassword: string) => {
  const isValid = await bcrypt.compare(inputPassword, savedPassword); // 변경
  if (!isValid) {
    const error: CustomError = new Error("Unauthorized");
    error.status = 401;
    error.data = {
      message: "비밀번호가 일치 하지 않습니다.",
    };
    throw error;
  }
};

export default {
  createToken,
  getUser,
  getUserByEmail,
  getUserById,
  getUserByNickname,
  getMySales,
  getMySalesCount,
  refreshToken,
  getByUserCardsCount,
  create,
  updateUser,
  updateRefreshToken,
  deleteUser,
};
