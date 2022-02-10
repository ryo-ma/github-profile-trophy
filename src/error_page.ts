abstract class BaseError {
  readonly status!: number;
  constructor(readonly content?: string) {}
  render(): string {
    return `<!DOCTYPE html><html><body><h1>${this.status}</h1>${this.content ?? ''}</body></html>`;
  }
}

export class Error400 extends BaseError {
  readonly status = 400;
}
