import { createHash } from "crypto";

const SANDBOX_BASE = "https://sandbox.interswitchng.com";
const PRODUCTION_BASE = "https://api.interswitchgroup.com";

function getBase() {
  return process.env.INTERSWITCH_ENV === "production" ? PRODUCTION_BASE : SANDBOX_BASE;
}

export function getClientId() {
  return process.env.INTERSWITCH_CLIENT_ID || "";
}

export function getClientSecret() {
  return process.env.INTERSWITCH_SECRET_KEY || "";
}

export function getMerchantCode(): string {
  if (process.env.INTERSWITCH_MERCHANT_CODE) return process.env.INTERSWITCH_MERCHANT_CODE;
  // Interswitch merchant codes are the first 4-8 chars of the CLIENT_ID
  return (process.env.INTERSWITCH_CLIENT_ID || "").slice(0, 6);
}

export function getPayItemId(): string {
  return process.env.INTERSWITCH_PAY_ITEM_ID || "Default_Payable_MX25";
}

export function generateTransactionRef(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `CL-${timestamp}-${random}`;
}

export function buildPaymentHash(params: {
  txnref: string;
  amount: string;
  siteRedirectURL: string;
}): string {
  const merchantCode = getMerchantCode();
  const payItemID = getPayItemId();
  const secretKey = getClientSecret();
  const raw = `${params.txnref}${params.amount}${merchantCode}${payItemID}${params.siteRedirectURL}${secretKey}`;
  return createHash("sha512").update(raw).digest("hex");
}

export function buildPaymentFormData(params: {
  txnref: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  redirectUrl: string;
  payItemName: string;
}): Record<string, string> {
  const amountInKobo = String(params.amount);
  const hash = buildPaymentHash({
    txnref: params.txnref,
    amount: amountInKobo,
    siteRedirectURL: params.redirectUrl,
  });

  return {
    merchantcode: getMerchantCode(),
    payItemID: getPayItemId(),
    amount: amountInKobo,
    siteRedirectURL: params.redirectUrl,
    transactionreference: params.txnref,
    currency: "566",
    customerEmail: params.customerEmail,
    customerName: params.customerName,
    payItemName: params.payItemName,
    hash,
  };
}

export function getPaymentPageUrl(): string {
  return `${getBase()}/collections/w/pay`;
}

let _accessToken: string | null = null;
let _tokenExpiry = 0;

export async function getAccessToken(): Promise<string> {
  if (_accessToken && Date.now() < _tokenExpiry) return _accessToken;

  const clientId = getClientId();
  const clientSecret = getClientSecret();

  if (!clientId || !clientSecret) throw new Error("Interswitch credentials not configured");

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const resp = await fetch(`${getBase()}/passport/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=profile",
  });

  const text = await resp.text();
  console.log("[Interswitch] Token response:", resp.status, text.slice(0, 200));

  if (!resp.ok) {
    throw new Error(`Interswitch token error: ${resp.status} ${text}`);
  }

  const data = JSON.parse(text);
  _accessToken = data.access_token;
  _tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return _accessToken!;
}

/**
 * Attempt to create a checkout session using the Interswitch Collections API.
 * Falls back to the Webpay form data if the API does not return a checkout URL.
 */
export async function createCheckoutSession(params: {
  txnref: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  redirectUrl: string;
  description: string;
}): Promise<{ mode: "api" | "form"; paymentUrl: string; formData?: Record<string, string> }> {
  try {
    const token = await getAccessToken();

    // Try the Interswitch Collections API (QPay / Passport approach)
    const resp = await fetch(`${getBase()}/collections/api/v1/purchases`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: params.amount,
        transactionReference: params.txnref,
        currency: "566",
        customerId: params.customerEmail,
        redirectUrl: params.redirectUrl,
        description: params.description,
      }),
    });

    const raw = await resp.text();
    console.log("[Interswitch] Checkout API response:", resp.status, raw.slice(0, 500));

    if (resp.ok) {
      const data = JSON.parse(raw);
      const url = data.checkoutUrl || data.redirectUrl || data.paymentUrl || data.payment_url;
      if (url) {
        return { mode: "api", paymentUrl: url };
      }
    }
  } catch (err) {
    console.warn("[Interswitch] API checkout failed, falling back to Webpay form:", err);
  }

  // Fallback: Webpay form POST approach
  const formData = buildPaymentFormData({
    txnref: params.txnref,
    amount: params.amount,
    customerEmail: params.customerEmail,
    customerName: params.customerName,
    redirectUrl: params.redirectUrl,
    payItemName: params.description,
  });

  return {
    mode: "form",
    paymentUrl: getPaymentPageUrl(),
    formData,
  };
}

export async function verifyTransaction(txnref: string, amount: number): Promise<{
  status: "success" | "failed" | "pending";
  responseCode: string;
  responseDescription: string;
}> {
  try {
    const token = await getAccessToken();
    const merchantCode = getMerchantCode();
    const url = `${getBase()}/collections/api/v1/purchases?amount=${amount}&merchantCode=${merchantCode}&transactionReference=${txnref}`;

    console.log("[Interswitch] Verifying:", url);
    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const raw = await resp.text();
    console.log("[Interswitch] Verify response:", resp.status, raw.slice(0, 300));

    if (!resp.ok) {
      return { status: "failed", responseCode: String(resp.status), responseDescription: "Verification request failed" };
    }

    const data = JSON.parse(raw);
    const code = data.responseCode || data.ResponseCode || "";

    if (code === "00") {
      return { status: "success", responseCode: code, responseDescription: data.responseDescription || "Approved" };
    } else if (code === "T0") {
      return { status: "pending", responseCode: code, responseDescription: "Transaction pending" };
    } else {
      return { status: "failed", responseCode: code, responseDescription: data.responseDescription || "Failed" };
    }
  } catch (err) {
    console.error("Interswitch verify error:", err);
    return { status: "failed", responseCode: "XX", responseDescription: "Verification failed" };
  }
}
