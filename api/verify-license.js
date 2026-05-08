export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { licenseKey } = req.body;
  if (!licenseKey) {
    return res.status(400).json({ valid: false, error: "License key is required" });
  }

  const key = licenseKey.trim().toUpperCase();

  // Owner test key
  if (key === "TUGBA-TEST-2025-CAROUSEL") {
    return res.status(200).json({ valid: true });
  }

  // Gumroad license keys are always in format: XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX
  const gumroadFormat = /^[A-F0-9]{8}-[A-F0-9]{8}-[A-F0-9]{8}-[A-F0-9]{8}$/;
  if (gumroadFormat.test(key)) {
    return res.status(200).json({ valid: true });
  }

  return res.status(200).json({ valid: false, error: "Invalid license key. Check your Gumroad email." });
}
