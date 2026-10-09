import { EServiceKindError, ServiceError } from "../Types/index.ts";
import { Error400, Error404, Error419, Error502 } from "../error_page.ts";

interface ErrorPageProps {
  error: ServiceError;
}

export function ErrorPage({ error }: ErrorPageProps) {
  let cause: Error400 | Error404 | Error419 | Error502 = new Error400();

  if (error.cause === EServiceKindError.RATE_LIMIT) {
    cause = new Error419();
  }

  if (error.cause === EServiceKindError.NOT_FOUND) {
    cause = new Error404(
      "Sorry, the user you are looking for was not found.",
    );
  }

  if (error.cause === EServiceKindError.UPSTREAM) {
    cause = new Error502("GitHub returned an unexpected response.");
  }

  return cause;
}
