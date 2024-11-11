import { Request, Response, NextFunction } from "express";

// 상점에 포토카드를 등록할 때의 유효성 검사
const shopValidation = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { price, totalCount }: { price: number; totalCount: number } = req.body;

  if (!price || price < 0) {
    res.status(400).json({ message: "가격을 입력해주세요." });
    return; // 반환 후 다음 미들웨어로 넘어가지 않도록 합니다.
  }

  if (!totalCount || totalCount <= 0) {
    res.status(400).json({ message: "판매 수량을 입력해주세요." });
    return;
  }

  next(); // 모든 조건을 만족할 때만 다음 미들웨어로 넘어갑니다.
};

// 판매할 포토카드를 수정할 때의 유효성 검사
const shopEditValidation = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const {
    price,
    totalCount,
    remainingCount,
    exchangeDescription,
  }: {
    price: number;
    totalCount: number;
    remainingCount: number;
    exchangeDescription?: string;
  } = req.body;

  if (!price || price < 0) {
    res.status(400).json({ message: "가격을 입력해주세요." });
    return;
  }

  if (!totalCount || totalCount <= 0) {
    res.status(400).json({ message: "판매 수량을 입력해주세요." });
    return;
  } else if (totalCount < remainingCount) {
    res.status(400).json({ message: "남은 카드의 수량을 확인해주세요." });
    return;
  }

  if (exchangeDescription && exchangeDescription.length > 30) {
    res
      .status(400)
      .json({ message: `교환 희망 설명은 30자 이하로 입력해주세요.` });
    return;
  }

  next(); // 모든 조건을 만족할 때만 다음 미들웨어로 넘어갑니다.
};

export { shopValidation, shopEditValidation };
