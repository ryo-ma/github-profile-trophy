import { EServiceKindError, ServiceError } from "../Types/index.ts";
import { Error400, Error404, Error419 } from "../error_page.ts";

interface ErrorPageProps {
  error: ServiceError;
  username: string;
}

export function ErrorPage({ error, username }: ErrorPageProps) {
  let cause: Error400 | Error404 | Error419 = new Error400();

  if (error.cause === EServiceKindError.RATE_LIMIT) {
    cause = new Error419();
  }

  if (error.cause === EServiceKindError.NOT_FOUND) {
    cause = new Error404(
      "Can not find a user with username: " + username,
    );
  }

  return cause;
}
