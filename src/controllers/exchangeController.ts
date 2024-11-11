import express from "express";
import asyncHandle from "../utils/error/asyncHandle.js";
import passport from "../config/passportConfig.js";
import exchangeService from "../services/exchangeService.js";
import exchangeValidation from "../middlewares/exchange/exchangeValidation.js";

const router = express.Router();

router.post(
  "/:id/request",
  exchangeValidation,
  passport.authenticate("access-token", { session: false }),
  asyncHandle(async (req, res, next) => {
    try {
      const { id: userId } = req.user as { id: number };
      const { id: shopId } = req.params;
      const { myCardId, description, count } = req.body;

      const exchange = await exchangeService.createExchange({
        shopId: parseInt(shopId),
        cardId: parseInt(myCardId),
        count: parseInt(count),
        description,
        userId,
      });

      res.status(201).send(exchange);
    } catch (error) {
      next(error);
    }
  })
);

router.post(
  "/:id/accept",
  passport.authenticate("access-token", { session: false }),
  asyncHandle(async (req, res, next) => {
    try {
      const { id: exchangeId } = req.params;

      const response = await exchangeService.acceptExchange(
        parseInt(exchangeId)
      );
      //승인자의 id로 새로 생성된 card 객체 반환
      res.status(200).send(response);
    } catch (error) {
      next(error);
    }
  })
);

router.post(
  "/:id/refuse",
  passport.authenticate("access-token", { session: false }),
  asyncHandle(async (req, res, next) => {
    try {
      const { id: userId } = req.user as { id: number };
      const { id: exchangeId } = req.params;

      const response = await exchangeService.refuseExchange(
        parseInt(exchangeId),
        userId
      );
      if (response) {
        res.status(200).send({ message: "교환제안 거절" });
      }
    } catch (error) {
      next(error);
    }
  })
);

router.delete(
  "/:id",
  passport.authenticate("access-token", { session: false }),
  asyncHandle(async (req, res, next) => {
    try {
      const { id: userId } = req.user as { id: number };
      const { id: exchangeId } = req.params;

      const response = await exchangeService.deleteExchange(
        parseInt(exchangeId),
        userId
      );
      res.status(204).send(response);
    } catch (error) {
      next(error);
    }
  })
);

export default router;
