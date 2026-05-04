export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { licenseKey } = req.body;
  if (!licenseKey) {
    return res.status(400).json({ valid: false, error: "License key is required" });
  }

  const params = new URLSearchParams({
    product_permalink: "carousel-ai-studio",
    license_key: licenseKey.trim(),
  });

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
}
