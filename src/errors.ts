export class TwoFactorRequired extends Error {
    constructor(msg: string) {
        super(msg)

        // explicity define prototype as stated in https://github.com/Microsoft/TypeScript-wiki/blob/main/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, TwoFactorRequired.prototype)
    }
}
