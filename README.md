{
  "task_id": "task_xxxxxxxxxxxxxxxxxx",
  "user_language": "en"
}Confirm the order draft:json复制{
  "task_id": "task_xxxxxxxxxxxxxxxxxx",
  "confirmed": true,
  "message": "User approved the order draft."
}Submit production-side feedback:json复制{
  "task_id": "task_xxxxxxxxxxxxxxxxxx",
  "feasible": true,
  "confirmed_process": "hard enamel with gold electroplating",
  "quote": "6.80 CNY/unit x 200",
  "total_amount": "1360.00",
  "currency": "CNY",
  "sample_cost": "Manual confirmation required",
  "estimated_production_time": "12-15 days after sample approval",
  "estimated_shipping_time": "5-8 days",
  "risks": ["Color matching requires sample approval"]
}Confirm the operator quote and risks (human gate 2):json复制{
  "task_id": "task_xxxxxxxxxxxxxxxxxx",
  "accepted": true,
  "accepted_quote_id": "quote_xxxxxxxxxxxxxxxxxx",
  "accepted_risks": true,
  "message": "User accepted the quote and the stated risks."
}Create a mock payment link:json复制{
  "task_id": "task_xxxxxxxxxxxxxxxxxx",
  "accepted_quote_id": "quote_xxxxxxxxxxxxxxxxxx",
  "description": "Mock payment link for the accepted production quote"
}The amount and currency are read from the accepted quote snapshot on the server. The caller cannot supply them. Submitting a different accepted_quote_id than the one the user accepted is rejected.Confirm mock payment:json复制{
  "task_id": "task_xxxxxxxxxxxxxxxxxx",
  "payment_id": "pay_mock_xxxxxxxxx",
  "confirmed": true,
  "message": "Mock payment manually confirmed."
}Update production progress:json复制{
  "task_id": "task_xxxxxxxxxxxxxxxxxx",
  "stage": "production_in_progress",
  "message": "Production has started after payment confirmation.",
  "production_photos": ["https://example.com/production.jpg"]
}Submit shipment information:json复制{
  "task_id": "task_xxxxxxxxxxxxxxxxxx",
  "carrier": "Mock Air",
  "tracking_number": "TRACK123",
  "tracking_url": "https://example.com/track/TRACK123",
  "estimated_delivery": "5-8 days"
}Complete delivery:json复制{
  "task_id": "task_xxxxxxxxxxxxxxxxxx",
  "completion_notes": "Delivered and confirmed by the operator.",
  "proof_urls": ["https://example.com/delivery-proof.jpg"]
}Upload a sample result:json复制{
  "task_id": "task_xxxxxxxxxxxxxxxxxx",
  "sample_images": ["https://example.com/sample.jpg"],
  "quoted_price": "Price requires manual confirmation.",
  "production_time": "7-10 days after sample approval",
  "supplier_feedback": "Supplier recommends hard enamel for better finish.",
  "quality_notes": "Check plating and enamel color before bulk production."
}Safety Boundaries
No AI image generation.
No LLM or GPU inference.
No marketplace.
No payment processing.
Mock payment links are for workflow testing only and do not collect money.
No automatic ordering.
No arbitrary file read or write tools.
No shell execution tools.
No external network calls unless a future supplier API integration is explicitly requested.
No payment information storage.
No sensitive identity information storage.
All supplier pricing and feasibility must be manually confirmed.
Operator console routes require an authenticated, HTTP-only, same-site session cookie.
Local demo, user, and acceptance routes require the same operator session.
Failed operator logins are limited to five attempts per IP in a 15-minute window.
Production HTTP MCP requests require a bearer API key.
Demo and acceptance routes are disabled by default in production because they create test tasks.
Browser cross-origin access is disabled unless an exact CORS_ORIGIN allowlist is configured.
RoadmapThe next milestone is not a larger platform. It is one genuine closed-loop order initiated through an AI client and delivered by a human Reality Operator. See ROADMAP.md and PRODUCT_SPEC.md.LicenseMIT
