import { EServiceKindError } from "./EServiceKindError.ts";

export class ServiceError extends Error {
  constructor(message: string, kind: EServiceKindError) {
    super(message);
    this.message = message;
    this.name = "ServiceError";
    this.cause = kind;
  }

  get code(): number {
    switch (this.cause) {
      case EServiceKindError.RATE_LIMIT:
        return 419;
      case EServiceKindError.NOT_FOUND:
        return 404;
      default:
        return 400;
    }
  }
}
