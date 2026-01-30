interface HttpToolInput {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

// Maximum response size: 5MB
const MAX_RESPONSE_SIZE = 5 * 1024 * 1024;

// Request timeout: 30 seconds
const REQUEST_TIMEOUT = 30000;

// Private IP ranges to block (SSRF prevention)
const PRIVATE_IP_RANGES = [
  /^127\./,                     // 127.0.0.0/8 (loopback)
  /^10\./,                      // 10.0.0.0/8 (private)
  /^172\.(1[6-9]|2[0-9]|3[01])\./, // 172.16.0.0/12 (private)
  /^192\.168\./,                // 192.168.0.0/16 (private)
  /^169\.254\./,                // 169.254.0.0/16 (link-local)
  /^0\./,                       // 0.0.0.0/8
  /^::1$/,                      // IPv6 loopback
  /^fe80:/i,                    // IPv6 link-local
  /^fc00:/i,                    // IPv6 private
  /^fd00:/i                     // IPv6 private
];

function isValidUrl(urlString: string): { valid: boolean; error?: string; hostname?: string } {
  let url: URL;

  try {
    url = new URL(urlString);
  } catch (err) {
    return { valid: false, error: "Invalid URL format" };
  }

  // Only allow HTTP and HTTPS protocols
  if (!["http:", "https:"].includes(url.protocol)) {
    return { valid: false, error: `Protocol '${url.protocol}' is not allowed. Only http: and https: are supported` };
  }

  // Block localhost
  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname === "[::1]") {
    return { valid: false, error: "Access to localhost is blocked" };
  }

  // Check if hostname is an IP address
  const ipMatch = hostname.match(/^(\d+\.\d+\.\d+\.\d+)$/) || hostname.match(/^\[?([0-9a-f:]+)\]?$/i);
  if (ipMatch) {
    const ip = ipMatch[1];
    for (const range of PRIVATE_IP_RANGES) {
      if (range.test(ip)) {
        return { valid: false, error: `Access to private IP address '${ip}' is blocked` };
      }
    }
  }

  return { valid: true, hostname };
}

async function fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      // Disable automatic redirect following to prevent redirect-based SSRF
      redirect: "manual"
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function readResponseWithLimit(response: Response, limit: number): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) {
    return "";
  }

  const decoder = new TextDecoder();
  let result = "";
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.length;
      if (totalBytes > limit) {
        throw new Error(`Response size exceeds limit of ${limit} bytes`);
      }

      result += decoder.decode(value, { stream: true });
    }

    // Flush any remaining bytes
    result += decoder.decode();
    return result;
  } finally {
    reader.releaseLock();
  }
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

  // Validate URL
  const validation = isValidUrl(payload.url);
  if (!validation.valid) {
    throw new Error(`URL validation failed: ${validation.error}`);
  }

  try {
    const response = await fetchWithTimeout(
      payload.url,
      {
        method: payload.method ?? "GET",
        headers: payload.headers,
        body: payload.body
      },
      REQUEST_TIMEOUT
    );

    // Check for redirects and block them to prevent redirect-based SSRF
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      throw new Error(`Redirects are blocked for security. Attempted redirect to: ${location}`);
    }

    // Read response with size limit
    return await readResponseWithLimit(response, MAX_RESPONSE_SIZE);
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error(`Request timed out after ${REQUEST_TIMEOUT}ms`);
    }
    throw err;
  }
}
