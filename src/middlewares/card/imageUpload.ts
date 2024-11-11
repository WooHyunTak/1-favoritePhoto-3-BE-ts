import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import multer from "multer";
import path from "path";
import sharp from "sharp";
import {
  AWS_ACCESS_KEY_ID,
  AWS_BUCKET_NAME,
  AWS_REGION,
  AWS_SECRET_ACCESS_KEY,
} from "../../env";
import { Request, Response, NextFunction } from "express";

// AWS S3 클라이언트 설정 (v3)
const s3 = new S3Client({
  region: AWS_REGION!,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID!,
    secretAccessKey: AWS_SECRET_ACCESS_KEY!,
  },
});

// 파일 필터 설정 (이미지 파일 형식만 허용)
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedExtensions = /jpeg|jpg|png/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error("이미지 파일 형식은 jpg, jpeg, png만 허용됩니다."));
  }
};

// multer의 메모리 저장소 설정 (파일을 메모리에 저장)
const storage = multer.memoryStorage();

const imageUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 }, // 파일 크기 제한: 5MB
});

// 이미지 업로드 핸들러 미들웨어 설정
const uploadToS3 = async (
  req: Request & {
    file?: Express.Multer.File & { location?: string };
  },
  res: Response,
  next: NextFunction
) => {
  if (!req.file) {
    return next(new Error("파일이 업로드되지 않았습니다."));
  }

  try {
    // 이미지 압축 (500KB 이하로 설정)
    const compressedImageBuffer = await sharp(req.file.buffer)
      .resize({ width: 800 }) // 리사이징. 가로 크기를 800으로 설정
      .jpeg({ quality: 80 }) // 압축률 설정 (품질을 80%로 설정)
      .toBuffer();

    const ext = path.extname(req.file.originalname).toLowerCase();
    const key = `${Date.now()}-${req.file.fieldname}${ext}`;

    // 압축된 이미지를 S3로 업로드
    await s3.send(
      new PutObjectCommand({
        Bucket: AWS_BUCKET_NAME!,
        Key: key!,
        Body: compressedImageBuffer!,
        ContentType: req.file.mimetype!,
      })
    );

    // 업로드된 파일 URL을 설정
    req.file.location = `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;

    next();
  } catch (error) {
    next(error);
  }
};

export { imageUpload, uploadToS3 };
