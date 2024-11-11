import { ErrorRequestHandler, Response } from "express";
import { CustomError } from "../../utils/interface/customError";

const errorHandler: ErrorRequestHandler = (
  err: CustomError,
  req,
  res,
  next
) => {
  const status = err.status ?? 500;

  const error = {
    RequestURL: req.path,
    method: req.method,
    message: err.message ?? "Internal Server Error",
    data: err.data ?? undefined,
    date: new Date(),
  };
  console.log(error);
  res.status(status).send(error);
};

export default errorHandler;
