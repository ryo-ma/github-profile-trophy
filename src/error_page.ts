abstract class BaseError {
  readonly status!: number;
  readonly message!: string;
  constructor(readonly content?: string) {}
  render(): string {
    return `<!DOCTYPE html><html><body><h1>${this.status} - ${this.message}</h1>${
      this.content ?? ""
    }</body></html>`;
  }
}

export class Error400 extends BaseError {
  readonly status = 400;
  readonly message = "Bad Request";
}

export class Error404 extends BaseError {
  readonly status = 404;
  readonly message = "Not Found";
}
