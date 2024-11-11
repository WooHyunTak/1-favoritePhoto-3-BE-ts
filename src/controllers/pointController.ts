import express from "express";
import pointService from "../services/pointService.js";
import passport from "../config/passportConfig.js";
import asyncHandle from "../utils/error/asyncHandle.js";
import { CustomError } from "../utils/interface/customError.js";

const router = express.Router();

/* 포인트 뽑기 */
router.post(
  "/draw",
  passport.authenticate("access-token", { session: false }),
  asyncHandle(async (req, res) => {
    try {
      const { id: userId } = req.user as { id: number };
      const updatedUser = await pointService.drawPoints(userId);
      return res.status(200).json(updatedUser);
    } catch (error) {
      return res.status(400).json({ message: "포인트 생성에 실패했습니다" });
    }
  })
);

export default router;
