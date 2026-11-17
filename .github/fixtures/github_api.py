"""Loopback-only HTTPS GitHub fixture for the composite action smoke test."""

import json
import re
import ssl
import sys
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit


MAX_BODY_BYTES = 1024 * 1024
FIXTURE_AUTHORIZATION = "Bearer fixture-token"
PAGE_INFO = {"hasNextPage": False, "endCursor": None}
PUBLIC_REPOSITORY = {"visibility": "PUBLIC", "isPrivate": False}
PRIVATE_REPOSITORY = {"visibility": "PRIVATE", "isPrivate": True}


def handler_for(username):
    class Handler(BaseHTTPRequestHandler):
        # Close each connection so malformed or rejected bodies cannot be reused.
        protocol_version = "HTTP/1.0"

        def setup(self):
            super().setup()
            self.connection.settimeout(5)

        def log_message(self, _format, *_args):
            # Request bodies, headers, and credentials never enter workflow logs.
            pass

        def send_error(self, code, message=None, explain=None):
            self.reject(code)

        def respond(self, status, payload):
            encoded = json.dumps(payload, separators=(",", ":")).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(encoded)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(encoded)

        def reject(self, status=400):
            self.respond(status, {"error": "Fixture request rejected."})

        def authenticated(self):
            values = self.headers.get_all("Authorization", [])
            return values == [FIXTURE_AUTHORIZATION]

        def do_GET(self):
            path = urlsplit(self.path).path
            if path == "/health":
                self.respond(200, {"status": "ok"})
            elif path == f"/users/{username}":
                # A privileged GitHub token must never reach the public profile.
                if self.headers.get_all("Authorization"):
                    self.reject(403)
                    return
                self.respond(200, {
                    "login": username,
                    "created_at": "2020-01-01T00:00:00Z",
                    "followers": 5,
                })
            elif path == f"/users/{username}/orgs":
                if not self.authenticated():
                    self.reject(401)
                    return
                self.respond(200, [])
            else:
                self.reject(404)

        def do_POST(self):
            if urlsplit(self.path).path != "/graphql":
                self.reject(404)
                return
            if not self.authenticated():
                self.reject(401)
                return
            lengths = self.headers.get_all("Content-Length", [])
            if (
                self.headers.get_all("Transfer-Encoding")
                or len(lengths) != 1
                or not re.fullmatch(r"[0-9]{1,10}", lengths[0])
            ):
                self.reject()
                return
            length = int(lengths[0])
            if length > MAX_BODY_BYTES:
                self.reject(413)
                return
            try:
                raw = self.rfile.read(length)
                if len(raw) != length:
                    raise ValueError("Incomplete request")
                payload = json.loads(raw)
                query = payload["query"]
                variables = payload.get("variables", {})
                if not isinstance(query, str) or not isinstance(variables, dict):
                    raise ValueError("Invalid GraphQL payload")
                operation = re.match(r"\s*query\s+([_A-Za-z][_0-9A-Za-z]*)\b", query)
                if not operation:
                    raise ValueError("Unexpected GraphQL operation")
                name = operation[1]
                if payload.get("operationName", name) != name:
                    raise ValueError("Unexpected operation name")
                if name != "TrophyViewer" and variables.get("username") != username:
                    raise ValueError("Unexpected GraphQL username")
            except (KeyError, TypeError, ValueError, OSError):
                self.reject()
                return

            if name == "TrophyViewer":
                if query != "query TrophyViewer { viewer { login } }":
                    self.reject()
                    return
                data = {"viewer": {"login": username}}
            elif name == "publicUserRepositories":
                if "privacy: $privacy" not in query or variables.get("privacy") not in ("PUBLIC", None):
                    self.reject()
                    return
                repository = {
                    **PUBLIC_REPOSITORY,
                    "id": "fixture-public-repository",
                    "languages": {"nodes": [{"name": "TypeScript"}]},
                    "stargazers": {"totalCount": 7},
                    "createdAt": "2020-01-01T00:00:00Z",
                }
                private_repository = {
                    **PRIVATE_REPOSITORY,
                    "id": "fixture-private-repository",
                    "languages": {"nodes": [{"name": "Python"}]},
                    "stargazers": {"totalCount": 11},
                    "createdAt": "2021-01-01T00:00:00Z",
                }
                data = {"user": {"repositories": {
                    "nodes": [repository] + ([private_repository] if variables.get("privacy") is None else []),
                    "pageInfo": PAGE_INFO,
                }}}
            elif name == "publicUserActivity":
                data = {"user": {"contributionsCollection": {
                    "commitContributionsByRepository": [{
                        "repository": PUBLIC_REPOSITORY,
                        "contributions": {"nodes": [{"commitCount": 9}]},
                    }, {
                        "repository": PRIVATE_REPOSITORY,
                        "contributions": {"nodes": [{"commitCount": 11}]},
                    }],
                }}}
            elif name in {
                "publicUserReviews", "publicUserIssues", "publicUserPullRequests",
            }:
                search = variables.get("search", "")
                qualifier = "reviewed-by" if name == "publicUserReviews" else "author"
                kind = "is:issue" if name == "publicUserIssues" else "is:pr"
                if not isinstance(search, str) or f"{qualifier}:{username}" not in search.split() or kind not in search.split():
                    self.reject()
                    return
                nodes = []
                if "is:public" not in search.split():
                    node = {"id": "fixture-private-activity", "repository": PRIVATE_REPOSITORY}
                    if name == "publicUserIssues":
                        node["state"] = "OPEN"
                    elif name == "publicUserReviews":
                        node["reviews"] = {"nodes": [{
                            "id": "fixture-private-review",
                            "state": "APPROVED",
                            "submittedAt": datetime.now(timezone.utc).isoformat(),
                            "author": {"login": username},
                        }]}
                    nodes.append(node)
                data = {"search": {"nodes": nodes, "pageInfo": PAGE_INFO}}
            else:
                self.reject()
                return
            self.respond(200, {"data": data})

    return Handler


def main():
    if len(sys.argv) != 4 or not re.fullmatch(
        r"[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?", sys.argv[3]
    ):
        print("Usage: github_api.py CERTIFICATE PRIVATE_KEY USERNAME", file=sys.stderr)
        return 2
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.minimum_version = ssl.TLSVersion.TLSv1_2
    context.load_cert_chain(sys.argv[1], sys.argv[2])
    with ThreadingHTTPServer(("127.0.0.1", 8443), handler_for(sys.argv[3])) as server:
        server.socket = context.wrap_socket(server.socket, server_side=True)
        try:
            server.serve_forever(poll_interval=0.2)
        except KeyboardInterrupt:
            pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
