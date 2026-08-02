import bcrypt from 'bcryptjs';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { fileURLToPath } from 'node:url';

import { pool } from '../config/db.js';
import { env } from '../config/env.js';
import { requireAdmin } from '../middleware/auth.js';
import {
  getCategories,
  getCoupons,
  getOrders,
  getPages,
  getProducts,
  getSettings,
  saveCategory,
  saveCoupon,
  saveOrder,
  savePage,
  saveProduct,
  saveSettings,
} from '../services/store.js';
import {
  asyncHandler,
  HttpError,
  ok,
  parseJson,
} from '../utils/http.js';

const router = express.Router();

router.use(requireAdmin);

const currentDir = path.dirname(
  fileURLToPath(import.meta.url),
);

const uploadDir = path.resolve(
  currentDir,
  '../uploads/products',
);

fs.mkdirSync(uploadDir, {
  recursive: true,
});

const storage = multer.diskStorage({
  destination: (
    _request,
    _file,
    callback,
  ) => callback(null, uploadDir),

  filename: (
    _request,
    file,
    callback,
  ) => {
    const extension =
      path
        .extname(file.originalname)
        .toLowerCase() || '.jpg';

    callback(
      null,
      `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 9)}${extension}`,
    );
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 12,
  },

  fileFilter: (
    _request,
    file,
    callback,
  ) => {
    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/x-icon',
      'image/vnd.microsoft.icon',
    ];

    if (!allowed.includes(file.mimetype)) {
      return callback(
        new HttpError(
          400,
          'Only JPG, PNG, WEBP, GIF and ICO images are allowed.',
        ),
      );
    }

    callback(null, true);
  },
});

const isValidImageUrl = value =>
  /^https?:\/\//i.test(value) ||
  value.startsWith('/uploads/');

const normalizeProductMedia = product => {
  const candidates = [
    ...(Array.isArray(product.media)
      ? product.media
      : []),

    ...(!product.media?.length &&
    product.image
      ? [
          {
            url: product.image,
          },
        ]
      : []),

    ...(!product.media?.length &&
    Array.isArray(product.images)
      ? product.images.map(url => ({
          url,
        }))
      : []),
  ];

  const seen = new Set();

  const media = candidates
    .map((item, index) => ({
      ...item,

      id:
        item?.id ||
        `media-${Date.now()}-${index}`,

      url: String(
        item?.url || '',
      ).trim(),

      altText: String(
        item?.altText ||
          product.name ||
          'Product image',
      ),

      type: 'image',
    }))
    .filter(item => {
      if (!item.url) {
        return false;
      }

      if (seen.has(item.url)) {
        return false;
      }

      seen.add(item.url);

      return true;
    });

  if (!media.length) {
    throw new HttpError(
      400,
      'At least one product image is required.',
    );
  }

  for (const item of media) {
    if (!isValidImageUrl(item.url)) {
      throw new HttpError(
        400,
        'Product image URLs must start with http:// or https://.',
      );
    }
  }

  const foundPrimaryIndex =
    media.findIndex(
      item => item.isPrimary,
    );

  const primaryIndex =
    foundPrimaryIndex >= 0
      ? foundPrimaryIndex
      : 0;

  product.media = media.map(
    (item, index) => ({
      ...item,
      isPrimary:
        index === primaryIndex,
      sortOrder: index,
    }),
  );

  product.image =
    product.media[primaryIndex].url;

  product.images =
    product.media.map(
      item => item.url,
    );

  return product;
};

const normalizeSocialLinks = value => {
  const items = Array.isArray(value)
    ? value
    : Object.entries(value || {}).map(
        ([platform, url]) => ({
          platform,
          url,
          active: true,
        }),
      );

  return items
    .map((item, index) => ({
      id: String(
        item?.id ||
          `social-${index + 1}`,
      ),

      platform: String(
        item?.platform || '',
      ).trim(),

      url: String(
        item?.url || '',
      ).trim(),

      active:
        item?.active !== false,
    }))
    .filter(
      item =>
        item.platform &&
        item.url,
    );
};

/**
 * Admin bootstrap data
 */
router.get(
  '/bootstrap',

  asyncHandler(
    async (
      request,
      response,
    ) => {
      const [
        products,
        categories,
        coupons,
        pages,
        orders,
        settings,
        admins,
      ] = await Promise.all([
        getProducts(),
        getCategories(),
        getCoupons(),
        getPages(),
        getOrders(),
        getSettings(),

        pool.execute(
          `SELECT
            id,
            name,
            email,
            role
          FROM admin_users
          WHERE id=?
          LIMIT 1`,
          [request.admin.sub],
        ),
      ]);

      const admin =
        admins[0][0];

      ok(response, {
        products,
        categories,
        coupons,
        pages,
        orders,

        settings: {
          ...settings,

          adminEmail:
            admin?.email || '',
        },

        admin,
      });
    },
  ),
);

/**
 * Create or update product
 */
router.post(
  '/products',

  asyncHandler(
    async (
      request,
      response,
    ) => {
      const product =
        request.body || {};

      if (
        !product.id ||
        !String(
          product.name || '',
        ).trim() ||
        !product.categoryId ||
        !product.slug
      ) {
        throw new HttpError(
          400,
          'Product ID, name, slug and category are required.',
        );
      }

      normalizeProductMedia(
        product,
      );

      product.updatedAt =
        new Date().toISOString();

      const savedProduct =
        await saveProduct(
          product,
        );

      ok(
        response,
        savedProduct,
      );
    },
  ),
);

/**
 * Delete product
 */
router.delete(
  '/products/:id',

  asyncHandler(
    async (
      request,
      response,
    ) => {
      await pool.execute(
        `DELETE FROM products
         WHERE id=?`,
        [request.params.id],
      );

      ok(
        response,
        true,
        'Product deleted successfully.',
      );
    },
  ),
);

/**
 * Create or update category
 */
router.post(
  '/categories',

  asyncHandler(
    async (
      request,
      response,
    ) => {
      const category =
        request.body || {};

      if (
        !category.id ||
        !category.name ||
        !category.slug
      ) {
        throw new HttpError(
          400,
          'Category name and slug are required.',
        );
      }

      const savedCategory =
        await saveCategory(
          category,
        );

      ok(
        response,
        savedCategory,
      );
    },
  ),
);

/**
 * Update category order
 */
router.put(
  '/categories/order',

  asyncHandler(
    async (
      request,
      response,
    ) => {
      const categories =
        Array.isArray(
          request.body
            ?.categories,
        )
          ? request.body
              .categories
          : [];

      if (!categories.length) {
        throw new HttpError(
          400,
          'At least one category is required.',
        );
      }

      const ids =
        new Set();

      for (
        const item of categories
      ) {
        if (
          !item?.id ||
          ids.has(
            String(item.id),
          )
        ) {
          throw new HttpError(
            400,
            'Category order contains an invalid or duplicate ID.',
          );
        }

        ids.add(
          String(item.id),
        );
      }

      const connection =
        await pool.getConnection();

      try {
        await connection.beginTransaction();

        for (
          const [
            index,
            item,
          ] of categories.entries()
        ) {
          const [rows] =
            await connection.execute(
              `SELECT data
               FROM categories
               WHERE id=?
               LIMIT 1
               FOR UPDATE`,
              [item.id],
            );

          if (!rows[0]) {
            throw new HttpError(
              404,
              `Category not found: ${item.id}`,
            );
          }

          const category =
            parseJson(
              rows[0].data,
              {},
            );

          category.sortOrder =
            index + 1;

          await connection.execute(
            `UPDATE categories
             SET
               sort_order=?,
               data=?,
               updated_at=CURRENT_TIMESTAMP
             WHERE id=?`,
            [
              category.sortOrder,
              JSON.stringify(
                category,
              ),
              item.id,
            ],
          );
        }

        await connection.commit();
      } catch (error) {
        await connection.rollback();

        throw error;
      } finally {
        connection.release();
      }

      const updatedCategories =
        await getCategories();

      ok(
        response,
        updatedCategories,
      );
    },
  ),
);

/**
 * Delete category
 */
router.delete(
  '/categories/:id',

  asyncHandler(
    async (
      request,
      response,
    ) => {
      const categoryId =
        request.params.id;

      const [childRows] =
        await pool.execute(
          `SELECT COUNT(*) AS count
           FROM categories
           WHERE parent_id=?`,
          [categoryId],
        );

      const [productRows] =
        await pool.execute(
          `SELECT COUNT(*) AS count
           FROM products
           WHERE
             category_id=?
             OR subcategory_id=?`,
          [
            categoryId,
            categoryId,
          ],
        );

      if (
        Number(
          childRows[0].count,
        ) > 0 ||
        Number(
          productRows[0].count,
        ) > 0
      ) {
        throw new HttpError(
          409,
          'This category has subcategories or products. Reassign them first.',
        );
      }

      await pool.execute(
        `DELETE FROM categories
         WHERE id=?`,
        [categoryId],
      );

      ok(
        response,
        true,
        'Category deleted successfully.',
      );
    },
  ),
);

/**
 * Create or update coupon
 */
router.post(
  '/coupons',

  asyncHandler(
    async (
      request,
      response,
    ) => {
      const coupon =
        request.body || {};

      if (
        !coupon.id ||
        !coupon.code
      ) {
        throw new HttpError(
          400,
          'Coupon code is required.',
        );
      }

      coupon.code = String(
        coupon.code,
      ).toUpperCase();

      const savedCoupon =
        await saveCoupon(
          coupon,
        );

      ok(
        response,
        savedCoupon,
      );
    },
  ),
);

/**
 * Delete coupon
 */
router.delete(
  '/coupons/:id',

  asyncHandler(
    async (
      request,
      response,
    ) => {
      await pool.execute(
        `DELETE FROM coupons
         WHERE id=?`,
        [request.params.id],
      );

      ok(
        response,
        true,
        'Coupon deleted successfully.',
      );
    },
  ),
);

/**
 * Create or update CMS page
 */
router.post(
  '/pages',

  asyncHandler(
    async (
      request,
      response,
    ) => {
      const page =
        request.body || {};

      if (
        !page.id ||
        !page.title ||
        !page.slug
      ) {
        throw new HttpError(
          400,
          'Page title and slug are required.',
        );
      }

      const savedPage =
        await savePage(page);

      ok(
        response,
        savedPage,
      );
    },
  ),
);

/**
 * Delete CMS page
 */
router.delete(
  '/pages/:id',

  asyncHandler(
    async (
      request,
      response,
    ) => {
      await pool.execute(
        `DELETE FROM cms_pages
         WHERE id=?`,
        [request.params.id],
      );

      ok(
        response,
        true,
        'Page deleted successfully.',
      );
    },
  ),
);

/**
 * Update store settings
 */
router.post(
  '/settings',

  asyncHandler(
    async (
      request,
      response,
    ) => {
      const input = {
        ...(request.body || {}),
      };

      const adminEmail =
        String(
          input.adminEmail ||
            '',
        )
          .trim()
          .toLowerCase();

      const adminPassword =
        String(
          input.adminPassword ||
            '',
        );

      delete input.adminEmail;
      delete input.adminPassword;

      input.socialLinks =
        normalizeSocialLinks(
          input.socialLinks,
        );

      const loginSlug =
        String(
          input.adminLoginSlug ||
            'store-admin',
        ).trim() ||
        'store-admin';

      const reservedSlugs =
        new Set([
          'admin',
          'admin-access',
          'shop',
          'cart',
          'checkout',
          'track-order',
          'order-success',
          'page',
          'product',
        ]);

      if (
        reservedSlugs.has(
          loginSlug.toLowerCase(),
        )
      ) {
        throw new HttpError(
          400,
          'That login URL slug is reserved. Choose a different value.',
        );
      }

      input.adminLoginSlug =
        loginSlug;

      if (adminEmail) {
        const values = [
          adminEmail,
        ];

        let sql =
          'UPDATE admin_users SET email=?';

        if (adminPassword) {
          if (
            adminPassword.length <
            8
          ) {
            throw new HttpError(
              400,
              'Admin password must be at least 8 characters.',
            );
          }

          const passwordHash =
            await bcrypt.hash(
              adminPassword,
              12,
            );

          sql +=
            ', password_hash=?';

          values.push(
            passwordHash,
          );
        }

        sql += ' WHERE id=?';

        values.push(
          request.admin.sub,
        );

        await pool.execute(
          sql,
          values,
        );
      }

      const savedSettings =
        await saveSettings(
          input,
        );

      ok(response, {
        ...savedSettings,
        adminEmail,
      });
    },
  ),
);

/**
 * Update order status
 */
router.patch(
  '/orders/:id',

  asyncHandler(
    async (
      request,
      response,
    ) => {
      const orderId =
        request.params.id;

      const [rows] =
        await pool.execute(
          `SELECT data
           FROM orders
           WHERE id=?
           LIMIT 1`,
          [orderId],
        );

      if (!rows[0]) {
        throw new HttpError(
          404,
          'Order not found.',
        );
      }

      const order =
        parseJson(
          rows[0].data,
          {},
        );

      const allowedFields = [
        'status',
        'paymentStatus',
        'shippingStatus',
      ];

      for (
        const key of allowedFields
      ) {
        if (
          request.body?.[key]
        ) {
          order[key] =
            request.body[key];
        }
      }

      order.id =
        order.id || orderId;

      order.updatedAt =
        new Date().toISOString();

      const savedOrder =
        await saveOrder(order);

      ok(
        response,
        savedOrder,
        'Order updated successfully.',
      );
    },
  ),
);

/**
 * Permanently delete order
 *
 * Route:
 * DELETE /api/admin/orders/:id
 */
router.delete(
  '/orders/:id',

  asyncHandler(
    async (
      request,
      response,
    ) => {
      const orderId =
        String(
          request.params.id ||
            '',
        ).trim();

      if (!orderId) {
        throw new HttpError(
          400,
          'Order ID is required.',
        );
      }

      const connection =
        await pool.getConnection();

      try {
        await connection.beginTransaction();

        const [orderRows] =
          await connection.execute(
            `SELECT id
             FROM orders
             WHERE id=?
             LIMIT 1
             FOR UPDATE`,
            [orderId],
          );

        if (!orderRows[0]) {
          throw new HttpError(
            404,
            'Order not found.',
          );
        }

        /*
         * Delete order-related inventory
         * transaction records first.
         *
         * This prevents foreign-key
         * constraint errors.
         */
        await connection.execute(
          `DELETE FROM inventory_transactions
           WHERE order_id=?`,
          [orderId],
        );

        /*
         * Permanently delete the order.
         */
        const [deleteResult] =
          await connection.execute(
            `DELETE FROM orders
             WHERE id=?`,
            [orderId],
          );

        if (
          deleteResult.affectedRows !==
          1
        ) {
          throw new HttpError(
            500,
            'Order could not be deleted.',
          );
        }

        await connection.commit();

        ok(
          response,
          {
            id: orderId,
            deleted: true,
          },
          'Order deleted permanently.',
        );
      } catch (error) {
        await connection.rollback();

        throw error;
      } finally {
        connection.release();
      }
    },
  ),
);

/**
 * Upload product images
 */
router.post(
  '/uploads',

  upload.array(
    'images',
    12,
  ),

  (
    request,
    response,
  ) => {
    const files = (
      request.files || []
    ).map(file => ({
      url: `${env.uploadBaseUrl}/products/${file.filename}`,
      name: file.originalname,
      size: file.size,
    }));

    ok(
      response,
      files,
      'Images uploaded successfully.',
    );
  },
);

export default router;