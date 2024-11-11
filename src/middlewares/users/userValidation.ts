import { Request, Response, NextFunction } from "express";

const userValidation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const emailPattern = /^[A-Za-z0-9_\.\-]+@[A-Za-z0-9\-]+\.[A-za-z0-9\-]+/;
  const passwordPattern =
    /^(?=.*[a-zA-Z])(?=.*[!@#$%^*+=-])(?=.*[0-9]).{8,15}$/;

  const { email, nickname, password } = req.body;

  if (!email || !nickname || !password) {
    res.status(400).send({
      message: "이메일, 닉네임, 비밀번호는 필수 값입니다.",
      data: {
        email,
        nickname,
        password,
      },
    });
  }

  if (!emailPattern.test(email)) {
    res.status(400).send({
      message: "이메일 형식을 확인해 주세요",
      data: {
        email,
      },
    });
  }

  if (!passwordPattern.test(password)) {
    res.status(400).send({
      message: "비밀번호는 영문 + 특수문자 + 숫자의 조합이 필요합니다.",
      data: {
        password,
      },
    });
  }

  if (
    typeof nickname !== "string" ||
    nickname.length < 1 ||
    nickname.length > 10
  ) {
    res.status(400).send({
      message: "닉네임은 1자 이상 10자 미만 입니다.",
      data: {
        nickname,
      },
    });
  }

  next();
};

export default userValidation;
