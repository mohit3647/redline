/** Copy text to the clipboard. Returns true when the browser accepted it. */
export interface CopyEnv {
  clipboard?: { writeText(text: string): Promise<void> };
  /** Used by the fallback: a hidden textarea and execCommand("copy"). */
  document?: Pick<Document, "createElement" | "body" | "execCommand">;
}

function browserEnv(): CopyEnv {
  return {
    clipboard: typeof navigator !== "undefined" ? navigator.clipboard : undefined,
    document: typeof document !== "undefined" ? document : undefined,
  };
}

export async function copyText(text: string, env: CopyEnv = browserEnv()): Promise<boolean> {
  if (env.clipboard) {
    try {
      await env.clipboard.writeText(text);
      return true;
    } catch {
      // Blocked or unavailable: try the fallback.
    }
  }
  const doc = env.document;
  if (!doc) return false;
  const area = doc.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  doc.body.appendChild(area);
  try {
    area.select();
    return doc.execCommand("copy");
  } catch {
    return false;
  } finally {
    doc.body.removeChild(area);
  }
}

export const COPIED_MESSAGE = "Copied";
export const COPY_FAILED_MESSAGE = "Could not copy. Select the text above and copy it by hand.";
