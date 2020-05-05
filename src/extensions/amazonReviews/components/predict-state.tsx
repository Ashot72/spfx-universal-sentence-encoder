export default interface IPredictState {
    result: { value: string, similarReview: string, similarReviewScore: number, rating: number, probability: number }[];
    comment: string
    encoderLoaded: boolean
    training: boolean
    trained: boolean
    process: boolean
}