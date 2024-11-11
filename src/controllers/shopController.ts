import express, { Request, Response, NextFunction } from "express";
import shopService from "../services/shopService";
import asyncHandle from "../utils/error/asyncHandle";
import {
  shopValidation,
  shopEditValidation,
} from "../middlewares/shop/shopValidation";
import passport from "../config/passportConfig";

const router = express.Router();

// 판매할 포토카드 등록하기
router.post(
  "/",
  passport.authenticate("access-token", { session: false }),
  shopValidation,
  asyncHandle(
    async (
      req: Request & { user?: { id: number } },
      res: Response,
      next: NextFunction
    ) => {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).send({ message: "유저가 없습니다." });
      }

      const {
        cardId,
        price,
        totalCount,
        exchangeGrade = "",
        exchangeGenre = "",
        exchangeDescription = "",
      } = req.body as {
        cardId: number;
        price: number;
        totalCount: number;
        exchangeGrade?: string;
        exchangeGenre?: string;
        exchangeDescription?: string;
      };

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
    }
  )
);

// 모든 판매중인 포토 카드 조회(로그인 없이 가능)
router.get(
  "/cards",
  asyncHandle(async (req: Request, res: Response) => {
    const {
      page = "1",
      pageSize = "10",
      search,
      grade,
      genre,
      isSoldOut,
      sortOrder = "createAt_DESC",
    } = req.query as {
      page?: string;
      pageSize?: string;
      search?: string;
      grade?: string;
      genre?: string;
      isSoldOut?: string;
      sortOrder?: string;
    };

    const shopCards = await shopService.getAllShop(
      { search, grade, genre, isSoldOut },
      sortOrder,
      parseInt(page, 10),
      parseInt(pageSize, 10)
    );

    return res.status(200).json(shopCards);
  })
);

// 판매중인 포토 카드 상세 조회
router.get(
  "/cards/:shopId",
  passport.authenticate("access-token", { session: false }),
  asyncHandle(async (req: Request, res: Response) => {
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
  asyncHandle(
    async (
      req: Request & { user?: { id: number } },
      res: Response,
      next: NextFunction
    ) => {
      const { shopId, cardId } = req.params;
      const {
        price,
        totalCount,
        exchangeGrade,
        exchangeGenre,
        exchangeDescription,
      } = req.body as {
        price: number;
        totalCount: number;
        exchangeGrade: string;
        exchangeGenre: string;
        exchangeDescription: string;
      };

      const updatedCard = await shopService.updateShopCard({
        shopId: parseInt(shopId, 10),
        cardId: parseInt(cardId, 10),
        price,
        totalCount,
        exchangeGrade,
        exchangeGenre,
        exchangeDescription,
        userId: req.user?.id as number,
      });

      return res.status(200).json(updatedCard);
    }
  )
);

// 판매중인 카드 판매 취소(판매 내리기)
router.delete(
  "/cards/:shopId",
  passport.authenticate("access-token", { session: false }),
  asyncHandle(
    async (
      req: Request & { user?: { id: number } },
      res: Response,
      next: NextFunction
    ) => {
      const { shopId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).send({ message: "유저가 없습니다." });
      }

      await shopService.deleteShopCard(parseInt(shopId, 10), userId);
      return res.status(200).json({ message: "카드의 판매가 취소되었습니다." });
    }
  )
);

// 교환 정보 조회
router.get(
  "/cards/:shopId/exchange",
  passport.authenticate("access-token", { session: false }),
  asyncHandle(async (req: Request, res: Response) => {
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
  asyncHandle(async (req: Request, res: Response) => {
    const { grade, genre, isSoldOut } = req.query as {
      grade?: string;
      genre?: string;
      isSoldOut?: string;
    };

    const counts = await shopService.getFilterCounts({
      grade,
      genre,
      isSoldOut,
    });

    return res.status(200).json(counts);
  })
);

export default router;
