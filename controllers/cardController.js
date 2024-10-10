import express from "express"; // express 모듈 임포트
import * as cardService from "../services/cardService"; // 서비스 임포트

const router = express.Router(); // express 라우터 생성

// 카드 등록(생성)
router.post("/", async (req, res, next) => {
  try {
    const {
      name,
      price,
      grade,
      genre,
      description,
      totalCount,
      imageURL,
      userId,
    } = req.body;

    const newCard = await cardService.createCard({
      name,
      price,
      grade,
      genre,
      description,
      totalCount,
      remainingCount: totalCount, // 초기 남은 카드 수는 totalCount 수와 같게 설정
      imageURL,
      userId,
    });

    res.status(201).send({
      success: true,
      message: "카드가 성공적으로 생성되었습니다.",
      card: newCard,
    });
  } catch (error) {
    next(error); // 에러를 next로 전달
  }
});
// 카드 전체 조회(검색 기능 포함)
router.get("/", async (req, res, next) => {
  try {
    const { search } = req.query; // 쿼리 파라미터에서 검색어 추출
    const userId = req.body.userId; // 사용자 ID를 요청에서 가져옴

    const cards = await cardService.getUserCards(userId); // 사용자 카드 조회 (서비스에서 사용자 카드만 가져오는 함수 필요)

    // (일단 이름으로만 검색- 추후 수정) 검색어가 있을 경우 카드 이름으로만 필터링
    const filteredCards = search
      ? cards.filter(
          (card) => card.name.toLowerCase().includes(search.toLowerCase()) // 카드 이름 검색
        )
      : cards;

    res.status(200).send({ success: true, data: filteredCards });
  } catch (error) {
    next(error); // 에러를 next로 전달
  }
});

// 카드 상세 조회
router.get("/:id", async (req, res, next) => {
  const { id } = req.params; // URL 파라미터에서 카드 ID 추출

  try {
    const card = await cardService.getCardById(Number(id)); // 카드 ID로 카드 조회

    if (!card) {
      return res
        .status(404)
        .send({ success: false, message: "카드를 찾을 수 없습니다." });
    }

    res.status(200).send({ success: true, data: card });
  } catch (error) {
    next(error); // 에러를 next로 전달
  }
});

// 카드 삭제
router.delete("/:id", async (req, res, next) => {
  const { id } = req.params; // URL 파라미터에서 카드 ID 추출
  const userId = req.body.userId; // 사용자 ID를 요청에서 가져옴

  try {
    const card = await cardService.getCardById(Number(id)); // 카드 ID로 카드 조회

    if (!card) {
      return res
        .status(404)
        .send({ success: false, message: "포토카드를 찾을 수 없습니다." });
    }

    // 작성자 확인
    if (card.userId !== userId) {
      return res
        .status(403)
        .send({ success: false, message: "삭제 권한이 없습니다." });
    }

    await cardService.deleteCard(Number(id)); // 카드 삭제
    res
      .status(200)
      .send({ success: true, message: "카드가 성공적으로 삭제되었습니다." });
  } catch (error) {
    next(error); // 에러를 next로 전달
  }
});

// 라우터 내보내기
export default router;
