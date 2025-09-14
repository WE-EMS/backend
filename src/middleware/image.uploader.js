import { S3Client } from "@aws-sdk/client-s3";
import multer from "multer";
import multerS3 from "multer-s3";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { ApiError } from "./error.js";

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
const allowedMimeTypes = [
    'image/png',
    'image/jpg',
    'image/jpeg',
    'image/bmp',
    'image/gif'
];

// 업로드 디렉토리 타입 정의
const UPLOAD_DIRECTORIES = {
    HELP_REQUEST: 'help-requests',
    USER_PROFILE: 'user-profiles',
    STORE: 'store-items'
};

// 기본 이미지 업로더 팩토리 함수
const createImageUploader = (directory) => {
    return multer({
        storage: multerS3({
            s3: s3,
            bucket: AWS_S3_BUCKET_NAME,
            contentType: multerS3.AUTO_CONTENT_TYPE,
            key: (req, file, callback) => {
                const extension = path.extname(file.originalname).toLowerCase();
                const uuid = uuidv4();

                // extension 확인
                if (!allowedExtensions.includes(extension)) {
                    return callback(new ApiError({
                        statusCode: 400,
                        errorCode: "FILE_UPLOAD_ERROR",
                        reason: `지원하지 않는 파일 확장자입니다. 허용된 확장자: ${allowedExtensions.join(', ')}`
                    }));
                }

                // 파일명에서 특수문자 제거 및 안전한 파일명 생성
                const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '');
                const fileName = `${directory}/${new Date().getFullYear()}/${uuid}_${safeName}`;

                callback(null, fileName);
            },
            metadata: (req, file, callback) => {
                callback(null, {
                    'uploaded-by': 'we-ems-api',
                    'upload-date': new Date().toISOString(),
                    'directory': directory
                });
            }
        }),
        limits: {
            fileSize: 5 * 1024 * 1024,
            files: 1
        },
        fileFilter: (req, file, callback) => {
            if (allowedMimeTypes.includes(file.mimetype)) {
                callback(null, true);
            } else {
                callback(new ApiError({
                    statusCode: 400,
                    errorCode: "FILE_UPLOAD_ERROR",
                    reason: `지원하지 않는 파일 타입입니다. 허용된 타입: ${allowedMimeTypes.join(', ')}`
                }));
            }
        }
    });
};

// 각 용도별 업로더 생성
export const helpRequestImageUploader = createImageUploader(UPLOAD_DIRECTORIES.HELP_REQUEST);
export const userProfileImageUploader = createImageUploader(UPLOAD_DIRECTORIES.USER_PROFILE);
export const storeImageUploader = createImageUploader(UPLOAD_DIRECTORIES.STORE);

// 기본 업로더 (하위 호환성을 위해)
export const imageUploader = createImageUploader('general');