import express from "express";
import purchaseService from "../services/purchaseService";
import asyncHandle from "../utils/error/asyncHandle";
import passport from "../config/passportConfig";
import { Request, Response, NextFunction } from "express";

const router = express.Router();

router.post(
  "/:shopId",
  passport.authenticate("access-token", { session: false }),
  asyncHandle(
    async (
      req: Request & { user?: { id: number } },
      res: Response,
      next: NextFunction
    ) => {
      try {
        const { user } = req;
        const buyerId = user?.id || "";
        if (!buyerId) {
          return res.status(401).send({ message: "유저가 없습니다." });
        }
        const { count }: { count: number } = req.body;
        const shopId = parseInt(req.params.shopId);

        const purchase = await purchaseService.createPurchase(
          buyerId,
          count,
          shopId
        );
        res.status(201).send({ success: true, purchase });
      } catch (error) {
        next(error);
      }
    }
  )
);
export default router;
