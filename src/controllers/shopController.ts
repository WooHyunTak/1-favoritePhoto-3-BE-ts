import express from "express";
import shopService from "../services/shopService.js";
import asyncHandle from "../utils/error/asyncHandle.js";
import {
  shopValidation,
  shopEditValidation,
} from "../middlewares/shop/shopValidation.js";
import passport from "passport"; // passport 가져오기

const router = express.Router();

// 판매할 포토카드 등록하기
router.post(
  "/",
  passport.authenticate("access-token", { session: false }),
  shopValidation, // 요청 본문의 유효성을 검사하는 미들웨어
  asyncHandle(async (req, res) => {
    const userId = req.user.id;
    const {
      cardId,
      price,
      totalCount,
      exchangeGrade = "",
      exchangeGenre = "",
      exchangeDescription = "",
    } = req.body;

    // 카드 정보를 상점에 등록
    const newCard = await shopService.createShopCard({
      userId,
      cardId,
      price,
      totalCount,
      exchangeGrade,
      exchangeGenre,
      exchangeDescription,
    });
    return res.status(201).json(newCard);
  })
);

// 모든 판매중인 포토 카드 조회(로그인 없이 가능)
router.get(
  "/cards",
  asyncHandle(async (req, res) => {
    const {
      page = 1, // 페이지 번호
      pageSize = 10, // 페이지당 포토카드 10개 수
      search,
      grade,
      genre,
      isSoldOut,
      sortOrder = "createAt_DESC", // 기본값 설정
    } = req.query;

    const shopCards = await shopService.getAllShop(
      { search, grade, genre, isSoldOut }, // 필터를 전달
      sortOrder,
      parseInt(page), // 페이지 번호
      parseInt(pageSize) // 페이지 사이즈
    );

    return res.status(200).json(shopCards);
  })
);

// 판매중인 포토 카드 상세 조회
router.get(
  "/cards/:shopId",
  passport.authenticate("access-token", { session: false }),
  asyncHandle(async (req, res) => {
    const { shopId } = req.params;
    const cardDetails = await shopService.getShopByShopId(parseInt(shopId, 10));
    return res.status(200).json(cardDetails);
  })
);

// 판매 중인 카드 수정하기
router.patch(
  "/cards/:shopId/:cardId",
  passport.authenticate("access-token", { session: false }),
  shopEditValidation,
  asyncHandle(async (req, res) => {
    const { shopId, cardId } = req.params;
    const {
      price,
      totalCount,
      exchangeGrade,
      exchangeGenre,
      exchangeDescription,
    } = req.body;

    const updatedCard = await shopService.updateShopCard({
      shopId: parseInt(shopId, 10),
      cardId: parseInt(cardId, 10), // 카드 ID 추가
      price,
      totalCount,
      exchangeGrade,
      exchangeGenre,
      exchangeDescription,
      userId: req.user.id, // 수정 요청하는 사용자의 ID 추가
    });

    return res.status(200).json(updatedCard);
  })
);

// 판매중인 카드 판매 취소(판매 내리기)
router.delete(
  "/cards/:shopId",
  passport.authenticate("access-token", { session: false }),
  asyncHandle(async (req, res) => {
    const { shopId } = req.params;
    const userId = req.user.id;

    await shopService.deleteShopCard(
      parseInt(shopId, 10),
      userId // userId를 함께 전달
    );
    return res.status(200).json({ message: "카드의 판매가 취소되었습니다." });
  })
);

router.get(
  "/cards/:shopId/exchange",
  passport.authenticate("access-token", { session: false }),
  asyncHandle(async (req, res) => {
    const { shopId } = req.params;
    const shopDetails = await shopService.getExchangeByShopId(
      parseInt(shopId, 10)
    );
    return res.status(200).json(shopDetails);
  })
);

// 필터별 카드 개수 조회 API
router.get(
  "/counts",
  asyncHandle(async (req, res) => {
    const { grade, genre, isSoldOut } = req.query;

    const counts = await shopService.getFilterCounts({
      grade,
      genre,
      isSoldOut,
    });

    return res.status(200).json(counts);
  })
);

export default router;
