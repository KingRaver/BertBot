import { Client } from "@notionhq/client";
import type { NotionConfig } from "@types/config";
import { assertNonEmpty } from "@utils/validators";
import { AppError, ErrorCode } from "@utils/errors";

interface NotionToolInput {
  action:
    | "search"
    | "getPage"
    | "createPage"
    | "appendBlock"
    | "updatePage"
    | "queryDatabase";
  query?: string;
  pageId?: string;
  blockId?: string;
  databaseId?: string;
  parentId?: string;
  title?: string;
  titleProperty?: string;
  properties?: Record<string, unknown>;
  children?: unknown[];
  filter?: Record<string, unknown>;
  sorts?: unknown[];
  pageSize?: number;
}

const MAX_PAGE_SIZE = 20;

export function createNotionTool(config: NotionConfig) {
  const apiKey = assertNonEmpty(config.apiKey, "NOTION_API_KEY");
  const client = new Client({ auth: apiKey });

  return async function runNotionTool(input: string): Promise<string> {
    let payload: NotionToolInput;
    try {
      payload = JSON.parse(input) as NotionToolInput;
    } catch (error) {
      throw new AppError("Invalid JSON for notion tool", ErrorCode.INVALID_JSON);
    }

    const action = payload.action;
    if (!action) {
      throw new AppError("Missing action for notion tool", ErrorCode.INVALID_INPUT);
    }

    try {
      switch (action) {
        case "search":
          return JSON.stringify(await search(client, payload));
        case "getPage":
          return JSON.stringify(await getPage(client, payload));
        case "createPage":
          return JSON.stringify(await createPage(client, payload, config));
        case "appendBlock":
          return JSON.stringify(await appendBlock(client, payload));
        case "updatePage":
          return JSON.stringify(await updatePage(client, payload));
        case "queryDatabase":
          return JSON.stringify(await queryDatabase(client, payload));
        default:
          throw new AppError(`Unknown notion action: ${action}`, ErrorCode.INVALID_INPUT);
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Notion API error", ErrorCode.TOOL_ERROR, error, true);
    }
  };
}

async function search(client: Client, payload: NotionToolInput) {
  const pageSize = normalizePageSize(payload.pageSize);
  const response = await client.search({
    query: payload.query,
    page_size: pageSize
  });

  return {
    object: response.object,
    results: response.results.map(summarizeNotionObject),
    next_cursor: response.next_cursor,
    has_more: response.has_more
  };
}

async function getPage(client: Client, payload: NotionToolInput) {
  const pageId = requireField(payload.pageId, "pageId");
  const page = await client.pages.retrieve({ page_id: pageId });
  return summarizeNotionObject(page as any, true);
}

async function createPage(client: Client, payload: NotionToolInput, config: NotionConfig) {
  const title = requireField(payload.title, "title");

  const parent = buildParent(payload, config);
  if (!parent) {
    throw new AppError("Missing parent for createPage", ErrorCode.INVALID_INPUT);
  }

  const properties = payload.properties ?? {};
  const titleProperty = payload.titleProperty ?? "title";
  if (!(titleProperty in properties)) {
    properties[titleProperty] = {
      title: [{ text: { content: title } }]
    };
  }

  const response = await client.pages.create({
    parent,
    properties,
    children: payload.children as any
  });

  return summarizeNotionObject(response as any, true);
}

async function appendBlock(client: Client, payload: NotionToolInput) {
  const blockId = requireField(payload.blockId ?? payload.pageId, "blockId");
  const children = payload.children ?? [];
  const response = await client.blocks.children.append({
    block_id: blockId,
    children: children as any
  });
  return {
    object: response.object,
    results: response.results.map(summarizeNotionObject),
    next_cursor: response.next_cursor,
    has_more: response.has_more
  };
}

async function updatePage(client: Client, payload: NotionToolInput) {
  const pageId = requireField(payload.pageId, "pageId");
  const properties = requireField(payload.properties, "properties") as Record<string, unknown>;
  const response = await client.pages.update({
    page_id: pageId,
    properties
  });
  return summarizeNotionObject(response as any, true);
}

async function queryDatabase(client: Client, payload: NotionToolInput) {
  const databaseId = requireField(payload.databaseId, "databaseId");
  const pageSize = normalizePageSize(payload.pageSize);
  const response = await client.databases.query({
    database_id: databaseId,
    filter: payload.filter as any,
    sorts: payload.sorts as any,
    page_size: pageSize
  });

  return {
    object: response.object,
    results: response.results.map(summarizeNotionObject),
    next_cursor: response.next_cursor,
    has_more: response.has_more
  };
}

function summarizeNotionObject(obj: any, includeProperties = false) {
  const title = extractTitle(obj);
  const summary: Record<string, unknown> = {
    object: obj.object,
    id: obj.id,
    url: obj.url,
    title,
    last_edited_time: obj.last_edited_time,
    parent: obj.parent
  };

  if (includeProperties && obj.properties) {
    summary.properties = simplifyProperties(obj.properties);
  }

  return summary;
}

function extractTitle(obj: any): string | undefined {
  const properties = obj.properties;
  if (!properties) {
    return undefined;
  }
  for (const key of Object.keys(properties)) {
    const prop = properties[key];
    if (prop?.type === "title") {
      return (prop.title ?? []).map((t: any) => t.plain_text ?? "").join("");
    }
  }
  return undefined;
}

function simplifyProperties(properties: Record<string, any>) {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (!value || typeof value !== "object") {
      result[key] = value;
      continue;
    }
    const type = value.type;
    const field = (value as any)[type];
    result[key] = { type, value: simplifyPropertyValue(field) };
  }
  return result;
}

function simplifyPropertyValue(value: any): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => simplifyPropertyValue(item));
  }
  if (value && typeof value === "object") {
    if (value.plain_text) {
      return value.plain_text;
    }
    if (value.name) {
      return value.name;
    }
    if (value.id) {
      return value.id;
    }
    return value;
  }
  return value;
}

function buildParent(payload: NotionToolInput, config: NotionConfig) {
  if (payload.databaseId || config.databaseId) {
    return { database_id: payload.databaseId ?? config.databaseId } as const;
  }
  if (payload.parentId || config.defaultParentId) {
    return { page_id: payload.parentId ?? config.defaultParentId } as const;
  }
  return undefined;
}

function requireField<T>(value: T | undefined, name: string): T {
  if (!value) {
    throw new AppError(`Missing ${name}`, ErrorCode.INVALID_INPUT);
  }
  return value;
}

function normalizePageSize(value?: number) {
  if (!value || value <= 0) {
    return 10;
  }
  return Math.min(value, MAX_PAGE_SIZE);
}
