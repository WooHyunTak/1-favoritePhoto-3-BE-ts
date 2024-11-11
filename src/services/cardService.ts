import cardRepository from "../repositorys/cardRepository";
import {
  CreateCardData,
  WhereConditionsParams,
  GetByUserIdParams,
} from "../utils/interface/card/cardInterfaces";

const whereConditions = (
  userId: number,
  { keyword, genre, grade }: WhereConditionsParams
) => {
  const where: Record<string, any> = { userId };
  if (keyword) {
    where.OR = [
      {
        name: { contains: keyword, mode: "insensitive" },
      },
    ];
  }
  if (genre) {
    where.genre = genre;
  }
  if (grade) {
    where.grade = grade;
  }
  return where;
};

// 나의 카드 조회
const getByUserId = async (userId: number, data: GetByUserIdParams) => {
  const { limit, cursor, keyword, genre, grade } = data;
  const where = whereConditions(userId, { keyword, genre, grade });

  const cards = await cardRepository.getByUserId({
    where,
    limit,
    cursor,
  });

  if (!cards || cards.length === 0) {
    const error = new Error("카드내역을 찾을 수 없습니다.");
    (error as any).status = 404; // Error 객체에 사용자 정의 속성을 추가
    throw error;
  }

  // 추가적인 데이터가 있는지 확인
  const nextCards = cards.length > limit;

  // 추가 데이터가 있다면 커서값을 주고 데이터에서 리미트에 맞춰 돌려준다
  const nextCursor = nextCards ? cards[limit - 1].id : "";

  return {
    list: cards.slice(0, limit),
    nextCursor,
  };
};

const createCard = async (data: CreateCardData) => {
  return await cardRepository.createCard(data);
};

export default { createCard, getByUserId };
