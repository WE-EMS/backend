export class CreateReviewBaseDto {
    constructor({ rating, content }) {
        this.rating = Number(rating);
        this.content = typeof content === 'string' ? content : null;
    }
    validateBase() {
        if (!this.rating || this.rating < 1 || this.rating > 5) {
            const e = new Error('rating은 1~5 사이의 정수여야 합니다.');
            e.status = 400; e.code = 'VALIDATION_ERROR'; throw e;
        }
    }
}

export class CreateHelpReviewDto extends CreateReviewBaseDto {
    constructor({ helpId, rating, content }) {
        super({ rating, content });
        this.helpId = Number(helpId);
    }
    validate() {
        if (!this.helpId || Number.isNaN(this.helpId)) {
            const e = new Error('helpId는 숫자여야 합니다.');
            e.status = 400; e.code = 'VALIDATION_ERROR'; throw e;
        }
        this.validateBase();
    }
}

export class CreateAssignmentReviewDto extends CreateReviewBaseDto {
    constructor({ assignmentId, rating, content }) {
        super({ rating, content });
        this.assignmentId = Number(assignmentId);
    }
    validate() {
        if (!this.assignmentId || Number.isNaN(this.assignmentId)) {
            const e = new Error('assignmentId는 숫자여야 합니다.');
            e.status = 400; e.code = 'VALIDATION_ERROR'; throw e;
        }
        this.validateBase();
    }
}
