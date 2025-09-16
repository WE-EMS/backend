import multer from "multer";

// 도메인 에러 표준화
export class ApiError extends Error {
    constructor({ statusCode = 400, errorCode = "BAD_REQUEST", reason = null, data = null } = {}) {
        super(reason || errorCode);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.reason = reason;
        this.data = data;
    }
}

// Multer 에러 전용 핸들러
export const multerErrorHandler = (err, req, res, next) => {
    if (!(err instanceof multer.MulterError)) return next(err);

    if (err.code === "LIMIT_FILE_SIZE") {
        return res.error({ errorCode: "FILE_TOO_LARGE", reason: "파일 크기가 5MB를 초과합니다.", statusCode: 413 });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
        return res.error({ errorCode: "TOO_MANY_FILES", reason: "한 번에 하나의 파일만 업로드할 수 있습니다.", statusCode: 400 });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return res.error({ errorCode: "UNEXPECTED_FILE", reason: "예상하지 못한 파일 필드입니다. 'image' 필드를 사용하세요.", statusCode: 400 });
    }
    return next(err);
};

// 전역 에러 핸들러
export const errorHandler = (err, req, res, next) => {
    if (res.headersSent) return next(err);

    const statusCode = err.statusCode || 500;
    const errorCode = err.errorCode || "INTERNAL_SERVER_ERROR";
    const reason = err.reason || err.message || "서버에서 오류가 발생했습니다.";
    const data = err.data || null;

    console.error("Global error handler:", err);
    return res.status(statusCode).json({
        resultType: "FAIL",
        error: { errorCode, reason, data },
        success: null,
    });
};

// 404 핸들러
export const notFoundHandler = (req, res) => {
    return res.status(404).json({
        resultType: "FAIL",
        error: { errorCode: "NOT_FOUND", reason: "요청한 리소스를 찾을 수 없습니다.", data: null },
        success: null,
    });
};

// 4XX
export const unauthorized = (reason = "로그인이 필요합니다.") =>
    new ApiError({ statusCode: 401, errorCode: "UNAUTHORIZED", reason });

export const forbidden = (reason = "권한이 없습니다.") =>
    new ApiError({ statusCode: 403, errorCode: "FORBIDDEN", reason });

export const notFound = (reason = "리소스를 찾을 수 없습니다.") =>
    new ApiError({ statusCode: 404, errorCode: "NOT_FOUND", reason });

export const conflict = (reason = "충돌이 발생했습니다.") =>
    new ApiError({ statusCode: 409, errorCode: "CONFLICT", reason });

export const badRequest = (reason = "잘못된 요청입니다.") =>
    new ApiError({ statusCode: 400, errorCode: "BAD_REQUEST", reason });

// 5XX
export const internalError = (reason = "서버 내부 오류", errorCode = "INTERNAL_SERVER_ERROR") =>
    new ApiError({ statusCode: 500, errorCode, reason });

// try/catch 없애는 비동기 래퍼
export const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// 공통 인증 가드 (필요한 라우트에서만 사용)
export const authRequired = (req, res, next) =>
    req.user ? next() : next(unauthorized());