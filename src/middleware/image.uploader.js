import { S3Client } from "@aws-sdk/client-s3";
import multer from "multer";
import multerS3 from "multer-s3";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// 커스텀 에러 생성 함수
const createError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.errorCode = "FILE_UPLOAD_ERROR";
    return error;
};

const { AWS_REGION, AWS_ACCESS_KEY, AWS_SECRET_KEY, AWS_S3_BUCKET_NAME } = process.env;

// AWS SDK v3 사용
const s3 = new S3Client({
    region: AWS_REGION,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY,
        secretAccessKey: AWS_SECRET_KEY,
    }
});

// 확장자 검사 목록
const allowedExtensions = [".png", ".jpg", ".jpeg", ".bmp", ".gif"];

export const imageUploader = multer({
    storage: multerS3({
        s3: s3, // S3 객체
        bucket: AWS_S3_BUCKET_NAME, // Bucket 이름
        contentType: multerS3.AUTO_CONTENT_TYPE, // Content-type, 자동으로 찾도록 설정
        key: (req, file, callback) => {
            // 파일명
            const uploadDirectory = req.query.directory ?? ""; // 기본 디렉토리 설정
            const extension = path.extname(file.originalname).toLowerCase(); // 파일 확장자 (소문자로 변환)
            const uuid = uuidv4(); // UUID 생성

            // extension 확인을 위한 코드 (확장자 검사용)
            if (!allowedExtensions.includes(extension)) {
                return callback(createError(`지원하지 않는 파일 확장자입니다. 허용된 확장자: ${allowedExtensions.join(', ')}`, 400));
            }

            // 파일명에서 특수문자 제거 및 안전한 파일명 생성
            const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '');
            const fileName = `${uploadDirectory}/${uuid}_${safeName}`;

            callback(null, fileName);
        },
        // acl: "public-read", // ACL 비활성화된 버킷에서는 사용 불가
        metadata: (req, file, callback) => {
            // 메타데이터 추가
            callback(null, {
                'uploaded-by': 'we-ems-api',
                'upload-date': new Date().toISOString()
            });
        }
    }),
    // 이미지 용량 제한 (5MB)
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1 // 한 번에 하나의 파일만 업로드
    },
    // 파일 필터 추가 (MIME 타입 검사)
    fileFilter: (req, file, callback) => {
        const allowedMimeTypes = [
            'image/png',
            'image/jpg',
            'image/jpeg',
            'image/bmp',
            'image/gif'
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
            callback(null, true);
        } else {
            callback(createError(`지원하지 않는 파일 타입입니다. 허용된 타입: ${allowedMimeTypes.join(', ')}`, 400));
        }
    }
});