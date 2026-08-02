# Sharuu Project Update — 02 August 2026

এই version-এ নিচের পরিবর্তনগুলো করা হয়েছে:

1. Admin Settings > General থেকে আলাদা Browser Logo / Favicon URL বা image upload করা যাবে। ফাঁকা রাখলে Store Logo ব্যবহার হবে।
2. Admin Settings > Shipping এবং Payment tab থেকে checkout heading note control করা যাবে। Note ফাঁকা থাকলে আগের মতো শুধু heading দেখা যাবে।
3. “Settings saved successfully.” success message ৩ সেকেন্ড পরে নিজে থেকে চলে যাবে।
4. পুরো admin panel-এর font system একরকম ও consistent করা হয়েছে, বিশেষ করে Categories page।
5. Orders page-এর উপরে category-wise filter এবং category order count যোগ করা হয়েছে। নতুন order item-এর category/subcategory database JSON-এ save হবে। পুরোনো order current product data দিয়ে filter হবে।
6. Home/Shop product cards responsive অবস্থায় সমান height রাখা হয়েছে; বড় title সর্বোচ্চ দুই লাইনে থাকবে।
7. Announcement text ধীরে ধীরে continuous scroll করবে।
8. নতুন order number এখন `SH-1234567` format-এর ৭ digit হবে এবং save করার আগে uniqueness check হবে।
9. Missing `vite.config.js` এবং default `public/logo.png` যোগ করা হয়েছে।

## Existing database upgrade

Existing database ব্যবহার করলে project root থেকে চালান:

```bash
npm run db:migrate:v5
```

অথবা শুধু নতুন settings keys যোগ করতে এই SQL file চালাতে পারেন:

```text
server/sql/2026-08-02-storefront-admin-improvements.sql
```

Settings data JSON/LONGTEXT-এ থাকার কারণে নতুন table column প্রয়োজন হয়নি।

## Verification

- Express/server syntax check: passed
- React JSX/JavaScript syntax check: passed
- CSS parse check: passed
- 7-digit order number format test: passed

এই sandbox-এর internal npm registry-তে `@tailwindcss/vite` package unavailable থাকায় এখানে dependency install এবং full Vite build execute করা যায়নি।
