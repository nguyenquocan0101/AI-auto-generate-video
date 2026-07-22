import type { IncomingMessage, ServerResponse } from "node:http";

export interface RouteResult {
  status: number;
  body: unknown;
}

type RouteResponse = RouteResult | Promise<RouteResult>;

export interface StudioRouteApi {
  project(name: string): RouteResponse;
  projects(): RouteResponse;
  create(body: any): RouteResponse;
  generate(body: any): RouteResponse;
  save(body: any): RouteResponse;
  render(body: any): RouteResponse;
  job(id: string): RouteResponse;
}

function sendJson(response: ServerResponse, result: RouteResult): void {
  response.writeHead(result.status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(result.body));
}

async function readJson(request: IncomingMessage): Promise<any> {
  let body = "";
  for await (const chunk of request) {
    body += chunk.toString();
    if (body.length > 5_000_000) throw new Error("Request body is too large");
  }
  try {
    return JSON.parse(body || "{}");
  } catch {
    throw new Error("Invalid JSON body");
  }
}

export function createHttpRoutes(api: StudioRouteApi) {
  return async function handleApi(request: IncomingMessage, response: ServerResponse): Promise<boolean> {
    const url = new URL(request.url ?? "/", "http://localhost");
    try {
      if (url.pathname === "/api/project" && request.method === "GET") {
        sendJson(response, await api.project(url.searchParams.get("name") ?? ""));
        return true;
      }
      if (url.pathname === "/api/projects" && request.method === "GET") {
        sendJson(response, await api.projects());
        return true;
      }
      if (url.pathname === "/api/project/create" && request.method === "POST") {
        sendJson(response, await api.create(await readJson(request)));
        return true;
      }
      if (url.pathname === "/api/project/generate" && request.method === "POST") {
        sendJson(response, await api.generate(await readJson(request)));
        return true;
      }
      if (url.pathname === "/api/project/save" && request.method === "POST") {
        sendJson(response, await api.save(await readJson(request)));
        return true;
      }
      if (url.pathname === "/api/render" && request.method === "POST") {
        sendJson(response, await api.render(await readJson(request)));
        return true;
      }
      if (url.pathname.startsWith("/api/jobs/") && request.method === "GET") {
        sendJson(response, await api.job(url.pathname.slice("/api/jobs/".length)));
        return true;
      }
      return false;
    } catch (error) {
      sendJson(response, { status: 400, body: { error: error instanceof Error ? error.message : "Invalid request" } });
      return true;
    }
  };
}
