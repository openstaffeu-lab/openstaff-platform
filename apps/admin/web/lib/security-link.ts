export type LinkSecurityStatus = "approved" | "rejected" | "pending";

export type LinkSecurityResult = {
  status: LinkSecurityStatus;
  normalizedUrl: string;
  message: string;
  reasons: string[];
};

const suspiciousTerms = [
  "phishing",
  "malware",
  "casino",
  "crypto-airdrop",
  "free-money",
  "password-reset",
  "login-verify",
  "account-verify",
];

const blockedExtensions = [
  ".exe",
  ".bat",
  ".cmd",
  ".scr",
  ".msi",
  ".apk",
  ".zip",
  ".rar",
  ".7z",
];

export function validateExternalLink(input: string): LinkSecurityResult {
  const rawUrl = input.trim();

  if (!rawUrl) {
    return {
      status: "pending",
      normalizedUrl: "",
      message: "No external link added.",
      reasons: [],
    };
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return {
      status: "rejected",
      normalizedUrl: rawUrl,
      message: "Invalid URL format.",
      reasons: ["The link must be a valid URL."],
    };
  }

  const protocol = parsedUrl.protocol.toLowerCase();
  const normalizedUrl = parsedUrl.toString();
  const lowerUrl = normalizedUrl.toLowerCase();

  const reasons: string[] = [];

  if (protocol !== "https:" && protocol !== "http:") {
    reasons.push("Only HTTP and HTTPS links are allowed.");
  }

  if (protocol === "http:") {
    reasons.push("HTTP link detected. HTTPS is recommended.");
  }

  for (const term of suspiciousTerms) {
    if (lowerUrl.includes(term)) {
      reasons.push(`Suspicious term detected: ${term}`);
    }
  }

  for (const extension of blockedExtensions) {
    if (lowerUrl.includes(extension)) {
      reasons.push(`Blocked file extension detected: ${extension}`);
    }
  }

  if (reasons.some((reason) => reason.includes("Only HTTP and HTTPS"))) {
    return {
      status: "rejected",
      normalizedUrl,
      message: "External link rejected by OpenStaff security policy.",
      reasons,
    };
  }

  if (reasons.some((reason) => reason.includes("Suspicious term") || reason.includes("Blocked file"))) {
    return {
      status: "rejected",
      normalizedUrl,
      message: "External link rejected because it looks unsafe.",
      reasons,
    };
  }

  if (protocol === "http:") {
    return {
      status: "pending",
      normalizedUrl,
      message: "Link accepted for manual security review. HTTPS is recommended.",
      reasons,
    };
  }

  return {
    status: "approved",
    normalizedUrl,
    message: "Link approved by OpenStaff link security check.",
    reasons,
  };
}