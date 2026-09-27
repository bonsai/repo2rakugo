interface Env {
  GITHUB_TOKEN: string;
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
}

interface JobSpec {
  source: {
    type: "github";
    url: string;
  };
  generation?: {
    style?: string;
    length?: string;
  };
  outputs: Array<"json" | "mp3">;
  delivery: {
    type: "email";
    email: string;
  };
}

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type"
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...CORS_HEADERS
    }
  });
}

function isValidRepoUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      url.hostname === "github.com" &&
      url.pathname.split("/").filter(Boolean).length === 2;
  } catch {
    return false;
  }
}

function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function createJobId(): string {
  return crypto.randomUUID();
}

async function dispatch(env: Env, jobId: string, spec: JobSpec): Promise<void> {
  const url = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/dispatches`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "accept": "application/vnd.github+json",
      "authorization": `Bearer ${env.GITHUB_TOKEN}`,
      "content-type": "application/json",
      "user-agent": "repo2rakugo-worker"
    },
    body: JSON.stringify({
      event_type: "repo2rakugo",
      client_payload: {
        job_id: jobId,
        spec
      }
    })
  });

  if (!response.ok) {
    throw new Error(`GitHub dispatch failed: ${response.status}`);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
      });
    }

    if (request.method === "GET" && url.pathname === "/") {
      return json({
        service: "repo2rakugo-api",
        status: "ok"
      });
    }

    if (request.method === "POST" && url.pathname === "/v1/jobs") {
      let spec: JobSpec;

      try {
        spec = await request.json() as JobSpec;
      } catch {
        return json({ error: "invalid_json" }, 400);
      }

      if (
        !isValidRepoUrl(spec?.source?.url) ||
        spec?.source?.type !== "github" ||
        !isValidEmail(spec?.delivery?.email) ||
        spec?.delivery?.type !== "email" ||
        !Array.isArray(spec?.outputs) ||
        spec.outputs.length === 0
      ) {
        return json({ error: "invalid_job_spec" }, 400);
      }

      const jobId = createJobId();

      try {
        await dispatch(env, jobId, spec);
      } catch {
        return json({ error: "dispatch_failed", job_id: jobId }, 502);
      }

      return json({
        job_id: jobId,
        status: "queued"
      }, 202);
    }

    if (request.method === "GET" && url.pathname.startsWith("/v1/jobs/")) {
      const jobId = url.pathname.slice("/v1/jobs/".length);
      if (!jobId) return json({ error: "missing_job_id" }, 400);
      return json({
        job_id: jobId,
        status: "queued"
      });
    }

    return json({ error: "not_found" }, 404);
  }
};
