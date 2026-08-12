const ADMIN_USER_IDS_SPLIT_RE = /[,\n]/;

let cachedRaw = "";
let cachedAdminUserIds = new Set<string>();

function parseJsonAdminUserIds(raw: string): Set<string> | null {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return null;
    }
    return new Set(
      parsed
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean)
    );
  } catch {
    return null;
  }
}

function parseAdminUserIds(raw: string): Set<string> {
  const trimmed = raw.trim();
  if (!trimmed) {
    return new Set<string>();
  }

  if (trimmed.startsWith("[")) {
    const jsonValue = parseJsonAdminUserIds(trimmed);
    if (jsonValue) {
      return jsonValue;
    }
  }

  return new Set(
    trimmed
      .split(ADMIN_USER_IDS_SPLIT_RE)
      .map((value) => value.trim())
      .filter(Boolean)
  );
}

export function getAdminUserIds(): Set<string> {
  const raw = process.env.ADMIN_USER_IDS ?? "";
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedAdminUserIds = parseAdminUserIds(raw);
  }
  return cachedAdminUserIds;
}

export function isAdminUserId(userId: string | null | undefined): boolean {
  if (!userId) {
    return false;
  }
  return getAdminUserIds().has(userId);
}
