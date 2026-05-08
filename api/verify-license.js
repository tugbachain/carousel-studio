export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { licenseKey } = req.body;
  if (!licenseKey) {
    return res.status(400).json({ valid: false, error: "License key is required" });
  }

  const key = licenseKey.trim().toUpperCase();

  // Test key for development/owner use
  if (key === "TUGBA-TEST-2025-CAROUSEL") {
    return res.status(200).json({ valid: true });
  }

  const params = new URLSearchParams({
    product_id: "__Z7D7kl6ybTpahoDeXOdQ==",
    license_key: licenseKey.trim(),
  });

  try {
    const upstream = await fetch("https://api.gumroad.com/v2/licenses/verify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await upstream.json();

    if (data.success) {
      return res.status(200).json({ valid: true });
    }

    return res.status(200).json({ valid: false, error: data.message || "Invalid license key" });
  } catch {
    return res.status(500).json({ valid: false, error: "Verification failed. Try again." });
  }
}
