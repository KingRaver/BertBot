interface HttpToolInput {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

export async function runHttpTool(input: string): Promise<string> {
  let payload: HttpToolInput;
  try {
    payload = JSON.parse(input) as HttpToolInput;
  } catch (error) {
    throw new Error("Invalid JSON for http tool");
  }
  if (!payload.url) {
    throw new Error("Missing url for http tool");
  }
  const response = await fetch(payload.url, {
    method: payload.method ?? "GET",
    headers: payload.headers,
    body: payload.body
  });

  return await response.text();
}
