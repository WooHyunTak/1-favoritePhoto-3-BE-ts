import express from "express";
import userService from "../services/userService";
import userValidation from "../middlewares/users/userValidation";
import asyncHandle from "../utils/error/asyncHandle";
import cookiesConfig from "../config/cookiesConfig";
import passport from "../config/passportConfig";
import exchangeService from "../services/exchangeService";
import cardService from "../services/cardService";
import shopService from "../services/shopService";
import { userSockets } from "../utils/socket/socket";
import { io } from "../app.js";

const router = express.Router();

router.post(
  "/signup",
  userValidation,
  asyncHandle(async (req, res, next) => {
    try {
      const { email, password, nickname } = req.body;

      const user = await userService.create({
        email,
        password,
        nickname,
      });

      return res.status(201).send(user);
    } catch (error) {
      next(error);
    }
  })
);

router.post(
  "/login",
  asyncHandle(async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await userService.getUser({ email, password });

      const accessToken = userService.createToken(user);
      const refreshToken = userService.createToken(user, "refresh");
      const nextUser = await userService.updateUser(user.id, { refreshToken });

      res.cookie("access-token", accessToken, cookiesConfig.accessTokenOption);
      res.cookie(
        "refresh-token",
        refreshToken,
        cookiesConfig.refreshTokenOption
      );

      res.status(200).send(nextUser);
    } catch (error) {
      next(error);
    }
  })
);

router.delete(
  "/logout",
  passport.authenticate("access-token", { session: false }),
  asyncHandle(async (req, res, next) => {
    try {
      const { id: userId } = req.user;
      await userService.updateUser(userId, {
        refreshToken: "",
      });
      res.cookie("access-token", null, cookiesConfig.clearAccessTokenOption);
      res.cookie("refresh-token", null, cookiesConfig.clearRefreshTokenOption);
      res.status(200).send({ message: "로그아웃 되었습니다" });
    } catch (error) {
      next(error);
    }
  })
);

router.get(
  "/me",
  passport.authenticate("access-token", { session: false }),
  asyncHandle(async (req, res, next) => {
    try {
      const { id: userId } = req.user;
      const user = await userService.getUserById(userId);

      res.status(200).send(user);
    } catch (error) {
      next(error);
    }
  })
);

router.post(
  "/check-email",
  asyncHandle(async (req, res, next) => {
    try {
      const { email } = req.body;
      const user = await userService.getUserByEmail(email);
      if (user) {
        res.status(400).send({
          isApprove: false,
          data: {
            message: "사용중인 이메일입니다.",
            email,
          },
        });
      } else {
        res.status(200).send({
          isApprove: true,
          data: {
            message: "사용가능한 이메일입니다.",
            email,
          },
        });
      }
    } catch (error) {
      next(error);
    }
  })
);

router.post(
  "/check-nickname",
  asyncHandle(async (req, res, next) => {
    try {
      const { nickname } = req.body;
      const user = await userService.getUserByNickname(nickname);
      if (user) {
        res.status(400).send({
          isApprove: false,
          data: {
            message: "사용중인 닉네임입니다.",
            nickname,
          },
        });
      } else {
        res.status(200).send({
          isApprove: true,
          data: {
            message: "사용가능한 닉네임입니다.",
            nickname,
          },
        });
      }
    } catch (error) {
      next(error);
    }
  })
);

router.get(
  "/refresh-token",
  (req, res, next) => {
    passport.authenticate("refresh-token", { session: false }, (err, user) => {
      if (err || !user) {
        return res.status(403).send({ message: "토근만료" });
      }
      req.user = user;
      next();
    })(req, res, next);
  },
  asyncHandle(async (req, res, next) => {
    try {
      const { id: userId } = req.user;
      const cookieString = req.headers.cookie;

      const refreshToken = cookieString
        .split("; ")
        .find((cookie) => cookie.startsWith("refresh-token="))
        .split("=")[1];

      if (!refreshToken) {
        return res.status(403).send({ message: "리프레쉬 토큰이 없습니다." });
      }
      const validationToken = await userService.refreshToken(
        userId,
        refreshToken
      );
      if (validationToken) {
        const accessToken = userService.createToken(req.user);
        const newRefreshToken = userService.createToken(req.user, "refresh");
        const nextUser = await userService.updateUser(req.user.id, {
          refreshToken: newRefreshToken,
        });

        res.cookie(
          "access-token",
          accessToken,
          cookiesConfig.accessTokenOption
        );
        res.cookie(
          "refresh-token",
          newRefreshToken,
          cookiesConfig.refreshTokenOption
        );

        res.status(200).send(nextUser);
      }
    } catch (error) {
      next(error);
    }
  })
);

router.get(
  "/my-cards",
  passport.authenticate("access-token", { session: false }),
  asyncHandle(async (req, res, next) => {
    try {
      const { id: userId } = req.user;
      //페이지네이션
      const { keyword = "", limit = 10, cursor = "" } = req.query;
      //정렬기준
      const { genre = "", grade = "" } = req.query;

      const cards = await cardService.getByUserId(userId, {
        keyword,
        limit: parseInt(limit),
        cursor: parseInt(cursor),
        genre,
        grade: grade.toUpperCase(),
      });

      res.status(200).send(cards);
    } catch (error) {
      next(error);
    }
  })
);

router.get(
  "/my-cards-count",
  passport.authenticate("access-token", { session: false }),
  asyncHandle(async (req, res, next) => {
    try {
      const { id: userId } = req.user;

      const counts = await userService.getByUserCardsCount(userId);

      res.status(200).send(counts);
    } catch (error) {
      next(error);
    }
  })
);

router.get(
  "/my-exchange",
  passport.authenticate("access-token", { session: false }),
  asyncHandle(async (req, res, next) => {
    try {
      const { id: userId } = req.user;
      const { keyword = "", limit = 10, cursor = "" } = req.query;

      const exchanges = await exchangeService.getByUserId(userId, {
        keyword,
        limit: parseInt(limit),
        cursor: parseInt(cursor),
      });

      res.status(200).send(exchanges);
      //교환 서비스함수 호출 필요
    } catch (error) {
      next(error);
    }
  })
);

router.get(
  "/my-sales",
  passport.authenticate("access-token", { session: false }),
  asyncHandle(async (req, res, next) => {
    try {
      const { id: userId } = req.user;

      const { limit = 10, cursor = "" } = req.query;
      const {
        grade = "",
        genre = "",
        salesType = "",
        isSoldOut = "false",
        keyword = "",
      } = req.query;

      const sales = await userService.getMySales(userId, {
        limit: parseInt(limit),
        cursor: parseInt(cursor),
        grade,
        genre,
        salesType,
        isSoldOut,
        keyword,
      });

      res.status(200).send(sales);
    } catch (error) {
      next(error);
    }
  })
);

//내가 판매중인 상품/교환 목록조회
router.get(
  "/my-sales-count",
  passport.authenticate("access-token", { session: false }),
  asyncHandle(async (req, res, next) => {
    try {
      const { id: userId } = req.user;

      const counts = await userService.getMySalesCount(userId);

      res.status(200).send(counts);
    } catch (error) {
      next(error);
    }
  })
);

// 판매중인 포토 카드 상세 조회 사용자 교환신청 조회 (구매쟈)
router.get(
  "/:shopId/exchange",
  passport.authenticate("access-token", { session: false }),
  asyncHandle(async (req, res) => {
    const { shopId } = req.params;
    const { id: userId } = req.user;
    const cardDetailsExchanges = await shopService.getExchangeByUserId(
      parseInt(shopId),
      parseInt(userId)
    );
    return res.status(200).json(cardDetailsExchanges);
  })
);

router.post(
  "/socket",
  asyncHandle(async (req, res, next) => {
    console.log("소켓 엔드포인트 인");
    console.log(userSockets);
    const { userId } = req.body;
    console.log(userId);
    const socketId = userSockets[userId];
    if (socketId) {
      io.to(socketId).emit("message", {
        content: "서버에서 메시지를 보냅니다",
      });
      console.log(`Message sent to user ${userId}: 서버에서 메시지를 보냅니다`);
    } else {
      console.log(`User ${userId} is not connected.`);
    }
  })
);

export default router;
