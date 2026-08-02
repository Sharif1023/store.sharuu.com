-- Storefront/admin improvements, 2026-08-02
-- Settings are stored in a JSON column, so no new table columns are required.
-- This adds the new keys to an existing settings document without overwriting current values.

UPDATE store_settings
SET data = JSON_SET(
  COALESCE(data, JSON_OBJECT()),
  '$.browserLogo',
  COALESCE(JSON_UNQUOTE(JSON_EXTRACT(data, '$.browserLogo')), ''),
  '$.shippingAreaNote',
  COALESCE(JSON_UNQUOTE(JSON_EXTRACT(data, '$.shippingAreaNote')), ''),
  '$.paymentMethodNote',
  COALESCE(JSON_UNQUOTE(JSON_EXTRACT(data, '$.paymentMethodNote')), '')
)
WHERE id = 1;
