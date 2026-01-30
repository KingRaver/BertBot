interface HttpToolInput {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

export async function runHttpTool(input: string): Promise<string> {
  const payload = JSON.parse(input) as HttpToolInput;
  const response = await fetch(payload.url, {
    method: payload.method ?? "GET",
    headers: payload.headers,
    body: payload.body
  });

  return await response.text();
}
