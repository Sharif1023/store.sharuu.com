import {
  ChevronDown,
  ChevronUp,
  FileText,
  Search,
  Trash2,
} from 'lucide-react';
import {
  Fragment,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Link } from 'react-router-dom';

import { useStore } from '../../contexts/StoreContext';
import { formatMoney } from '../../lib/utils';

const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'completed',
  'cancelled',
  'refunded',
];

const PAYMENT_STATUSES = [
  'unpaid',
  'pending',
  'paid',
  'failed',
  'refunded',
];

const SHIPPING_STATUSES = [
  'unfulfilled',
  'processing',
  'packed',
  'shipped',
  'in_transit',
  'delivered',
  'returned',
  'cancelled',
];

const labelFor = value =>
  String(value || '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, letter =>
      letter.toUpperCase(),
    );

const sortCategories = (a, b) =>
  Number(a.sortOrder || 0) -
    Number(b.sortOrder || 0) ||
  String(a.name || '').localeCompare(
    String(b.name || ''),
  );

const formatDateTime = value => {
  if (!value) return 'Not available';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
};

const textOrDash = value => {
  const text = String(value || '').trim();
  return text || '—';
};

const getOptionText = item =>
  Object.entries(
    item?.selectedOptionLabels || {},
  )
    .map(
      ([label, value]) =>
        `${label}: ${value}`,
    )
    .join(', ');

function DetailCard({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {title}
      </h3>
      <div className="grid gap-2.5 text-sm">
        {children}
      </div>
    </section>
  );
}

function DetailRow({
  label,
  value,
  important = false,
  multiline = false,
}) {
  return (
    <div className="grid gap-1 border-b border-slate-100 pb-2.5 last:border-b-0 last:pb-0 sm:grid-cols-[130px_minmax(0,1fr)] sm:gap-4">
      <span className="text-xs font-bold text-slate-500">
        {label}
      </span>
      <strong
        className={[
          'min-w-0 break-words text-sm',
          important
            ? 'rounded-lg bg-amber-50 px-2.5 py-2 font-black text-amber-900 ring-1 ring-amber-200'
            : 'font-bold text-slate-800',
          multiline ? 'whitespace-pre-wrap' : '',
        ].join(' ')}
      >
        {textOrDash(value)}
      </strong>
    </div>
  );
}

function OrderDetails({
  order,
  currencySymbol,
}) {
  const items = Array.isArray(order.items)
    ? order.items
    : [];

  return (
    <div className="grid gap-5 rounded-3xl bg-slate-50 p-4 sm:p-6">
      <div className="grid gap-4 xl:grid-cols-3">
        <DetailCard title="Customer information">
          <DetailRow
            label="Full name"
            value={order.customer?.name}
          />
          <DetailRow
            label="Phone"
            value={order.customer?.phone}
          />
          <DetailRow
            label="Email"
            value={order.customer?.email}
          />
          <DetailRow
            label="Full address"
            value={order.customer?.address}
            multiline
          />
        </DetailCard>

        <DetailCard title="Shipping and payment">
          <DetailRow
            label="Shipping area"
            value={order.shippingAreaName}
          />
          <DetailRow
            label="Shipping area ID"
            value={order.shippingAreaId}
          />
          <DetailRow
            label="Payment method"
            value={order.paymentMethodName}
          />
          <DetailRow
            label="Payment method ID"
            value={order.paymentMethodId}
          />
          <DetailRow
            label="Transaction ID"
            value={order.transactionId}
            important={Boolean(
              String(
                order.transactionId || '',
              ).trim(),
            )}
          />
        </DetailCard>

        <DetailCard title="Order totals">
          <DetailRow
            label="Subtotal"
            value={formatMoney(
              order.subtotal,
              currencySymbol,
            )}
          />
          <DetailRow
            label="Shipping fee"
            value={formatMoney(
              order.shippingFee,
              currencySymbol,
            )}
          />
          <DetailRow
            label="Coupon code"
            value={order.couponCode}
          />
          <DetailRow
            label="Discount"
            value={formatMoney(
              order.discount,
              currencySymbol,
            )}
          />
          <DetailRow
            label="Grand total"
            value={formatMoney(
              order.total,
              currencySymbol,
            )}
            important
          />
        </DetailCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <DetailCard title="Order note">
          <DetailRow
            label="Customer note"
            value={order.note}
            multiline
            important={Boolean(
              String(order.note || '').trim(),
            )}
          />
        </DetailCard>

        <DetailCard title="Database and time information">
          <DetailRow
            label="Order ID"
            value={order.id}
          />
          <DetailRow
            label="Order number"
            value={order.orderNumber}
          />
          <DetailRow
            label="Created"
            value={formatDateTime(
              order.createdAt,
            )}
          />
          <DetailRow
            label="Last updated"
            value={formatDateTime(
              order.updatedAt,
            )}
          />
        </DetailCard>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3 sm:px-5">
          <h3 className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            Ordered products ({items.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-black">
                  Product
                </th>
                <th className="px-4 py-3 font-black">
                  SKU
                </th>
                <th className="px-4 py-3 font-black">
                  Selected options
                </th>
                <th className="px-4 py-3 text-right font-black">
                  Qty
                </th>
                <th className="px-4 py-3 text-right font-black">
                  Unit price
                </th>
                <th className="px-4 py-3 text-right font-black">
                  Line total
                </th>
              </tr>
            </thead>

            <tbody>
              {items.map((item, index) => (
                <tr
                  key={
                    item.id ||
                    `${item.productId}-${item.variantId}-${index}`
                  }
                  className="border-t border-slate-100"
                >
                  <td className="px-4 py-3 align-middle">
                    <div className="flex items-center gap-3">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name || 'Product'}
                          className="h-12 w-12 shrink-0 rounded-xl border border-slate-200 object-cover"
                        />
                      ) : (
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-[10px] font-bold text-slate-400">
                          No image
                        </span>
                      )}

                      <div className="min-w-0">
                        <strong className="block break-words text-sm font-black text-slate-900">
                          {textOrDash(item.name)}
                        </strong>
                        <small className="mt-1 block break-all text-xs text-slate-500">
                          Product ID: {textOrDash(item.productId)}
                        </small>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-sm font-bold text-slate-700">
                    {textOrDash(item.sku)}
                  </td>

                  <td className="max-w-[260px] px-4 py-3 text-sm font-bold text-slate-700">
                    {textOrDash(
                      getOptionText(item),
                    )}
                  </td>

                  <td className="px-4 py-3 text-right text-sm font-black text-slate-900">
                    {Number(item.quantity || 0)}
                  </td>

                  <td className="px-4 py-3 text-right text-sm font-bold text-slate-700">
                    {formatMoney(
                      item.unitPrice,
                      currencySymbol,
                    )}
                  </td>

                  <td className="px-4 py-3 text-right text-sm font-black text-slate-900">
                    {formatMoney(
                      item.lineTotal ??
                        Number(
                          item.unitPrice || 0,
                        ) *
                          Number(
                            item.quantity || 0,
                          ),
                      currencySymbol,
                    )}
                  </td>
                </tr>
              ))}

              {!items.length && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-8 text-center text-sm font-bold text-slate-500"
                  >
                    No product information was found for this order.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default function Orders() {
  const {
    orders,
    products,
    categories,
    settings,
    loadAdmin,
    adminLoaded,
    updateOrder,
    deleteOrder,
  } = useStore();

  const [query, setQuery] =
    useState('');
  const [status, setStatus] =
    useState('');
  const [categoryId, setCategoryId] =
    useState('');
  const [expandedOrderId, setExpandedOrderId] =
    useState('');
  const [updating, setUpdating] =
    useState('');
  const [deleting, setDeleting] =
    useState('');
  const [error, setError] =
    useState('');

  useEffect(() => {
    if (!adminLoaded) {
      loadAdmin().catch(() => {});
    }
  }, [adminLoaded, loadAdmin]);

  const currencySymbol =
    settings?.currencySymbol || '৳';

  const rootCategories = useMemo(
    () =>
      categories
        .filter(item => !item.parentId)
        .sort(sortCategories),
    [categories],
  );

  const productById = useMemo(
    () =>
      new Map(
        products.map(product => [
          String(product.id),
          product,
        ]),
      ),
    [products],
  );

  const categoryById = useMemo(
    () =>
      new Map(
        categories.map(category => [
          String(category.id),
          category,
        ]),
      ),
    [categories],
  );

  const itemCategoryIds = item => {
    const product = productById.get(
      String(item.productId || ''),
    );

    return {
      categoryId: String(
        item.categoryId ||
          product?.categoryId ||
          '',
      ),
      subcategoryId: String(
        item.subcategoryId ||
          product?.subcategoryId ||
          '',
      ),
    };
  };

  const orderMatchesCategory = (
    order,
    selectedCategoryId,
  ) => {
    if (!selectedCategoryId) return true;

    return (order.items || []).some(item => {
      const ids = itemCategoryIds(item);
      const subcategory = categoryById.get(
        ids.subcategoryId,
      );

      return (
        ids.categoryId ===
          String(selectedCategoryId) ||
        ids.subcategoryId ===
          String(selectedCategoryId) ||
        String(subcategory?.parentId || '') ===
          String(selectedCategoryId)
      );
    });
  };

  const categoryCounts = useMemo(
    () =>
      Object.fromEntries(
        rootCategories.map(category => [
          category.id,
          orders.filter(order =>
            orderMatchesCategory(
              order,
              category.id,
            ),
          ).length,
        ]),
      ),
    [
      orders,
      rootCategories,
      productById,
      categoryById,
    ],
  );

  const rows = useMemo(() => {
    const normalizedQuery = query
      .trim()
      .toLowerCase();

    return orders.filter(order => {
      const searchableText = [
        order.orderNumber,
        order.id,
        order.customer?.name,
        order.customer?.phone,
        order.customer?.email,
        order.customer?.address,
        order.shippingAreaName,
        order.paymentMethodName,
        order.transactionId,
        order.note,
        order.couponCode,
        ...(order.items || []).flatMap(item => [
          item.name,
          item.sku,
          getOptionText(item),
        ]),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return (
        searchableText.includes(
          normalizedQuery,
        ) &&
        (!status ||
          order.status === status) &&
        orderMatchesCategory(
          order,
          categoryId,
        )
      );
    });
  }, [
    orders,
    query,
    status,
    categoryId,
    productById,
    categoryById,
  ]);

  const change = async (
    order,
    key,
    value,
  ) => {
    const updateKey =
      `${order.id}:${key}`;

    setUpdating(updateKey);
    setError('');

    try {
      await updateOrder(order.id, {
        [key]: value,
      });
    } catch (requestError) {
      setError(
        requestError?.message ||
          'Order could not be updated.',
      );
    } finally {
      setUpdating('');
    }
  };

  const permanentlyDelete = async order => {
    const confirmed = window.confirm(
      `Delete order ${order.orderNumber} permanently?\n\nThis will remove the order from the admin list and database. This action cannot be undone.`,
    );

    if (!confirmed) return;

    setDeleting(order.id);
    setError('');

    try {
      await deleteOrder(order.id);

      if (
        String(expandedOrderId) ===
        String(order.id)
      ) {
        setExpandedOrderId('');
      }
    } catch (requestError) {
      setError(
        requestError?.message ||
          'Order could not be deleted.',
      );
    } finally {
      setDeleting('');
    }
  };

  const statusSelect = (
    order,
    key,
    value,
    options,
  ) => (
    <div
      className={`order-status-control status-${value}`}
    >
      <span
        className="order-status-dot"
        aria-hidden="true"
      />
      <select
        value={value}
        disabled={
          updating ===
          `${order.id}:${key}`
        }
        onChange={event =>
          change(
            order,
            key,
            event.target.value,
          )
        }
        aria-label={`${labelFor(key)} for ${order.orderNumber}`}
      >
        {options.map(option => (
          <option
            key={option}
            value={option}
          >
            {labelFor(option)}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div>
      <div className="admin-page-heading">
        <div>
          <span className="eyebrow">
            Fulfilment
          </span>
          <h1>Orders</h1>
          <p>
            View every checkout detail, payment
            transaction ID, customer note and
            ordered product from one place.
          </p>
        </div>
      </div>

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      <div
        className="order-category-filter"
        role="group"
        aria-label="Filter orders by category"
      >
        <button
          type="button"
          className={!categoryId ? 'active' : ''}
          onClick={() => setCategoryId('')}
        >
          <span>All Orders</span>
          <b>{orders.length}</b>
        </button>

        {rootCategories.map(category => (
          <button
            type="button"
            key={category.id}
            className={
              String(categoryId) ===
              String(category.id)
                ? 'active'
                : ''
            }
            onClick={() =>
              setCategoryId(category.id)
            }
            title={category.name}
          >
            <span>{category.name}</span>
            <b>
              {categoryCounts[
                category.id
              ] || 0}
            </b>
          </button>
        ))}
      </div>

      <div className="admin-toolbar">
        <label className="search-field">
          <Search size={17} />
          <input
            value={query}
            onChange={event =>
              setQuery(event.target.value)
            }
            placeholder="Search order, customer, transaction ID or note..."
          />
        </label>

        <select
          value={status}
          onChange={event =>
            setStatus(event.target.value)
          }
        >
          <option value="">
            All status
          </option>
          {ORDER_STATUSES.map(option => (
            <option
              key={option}
              value={option}
            >
              {labelFor(option)}
            </option>
          ))}
        </select>

        <span className="admin-result-count">
          {rows.length}{' '}
          {rows.length === 1
            ? 'order'
            : 'orders'}
        </span>
      </div>

      <section className="admin-panel table-panel orders-panel">
        <div className="admin-table-wrap">
          <table className="admin-table orders-table">
            <thead>
              <tr>
                <th className="number-heading">
                  #
                </th>
                <th>Order</th>
                <th>Customer</th>
                <th>Total</th>
                <th>
                  <span className="order-heading-pill order">
                    Order Status
                  </span>
                </th>
                <th>
                  <span className="order-heading-pill payment">
                    Payment
                  </span>
                </th>
                <th>
                  <span className="order-heading-pill shipping">
                    Shipping
                  </span>
                </th>
                <th>Details</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((order, index) => {
                const expanded =
                  String(expandedOrderId) ===
                  String(order.id);

                return (
                  <Fragment key={order.id}>
                    <tr>
                      <td>
                        <span className="order-row-number">
                          {index + 1}
                        </span>
                      </td>

                      <td>
                        <strong className="order-number">
                          {order.orderNumber}
                        </strong>
                        <small>
                          {formatDateTime(
                            order.createdAt,
                          )}
                        </small>
                      </td>

                      <td>
                        <strong>
                          {textOrDash(
                            order.customer?.name,
                          )}
                        </strong>
                        <small>
                          {textOrDash(
                            order.customer?.phone,
                          )}
                        </small>
                        {order.customer?.email && (
                          <small className="break-all">
                            {order.customer.email}
                          </small>
                        )}
                      </td>

                      <td>
                        <strong>
                          {formatMoney(
                            order.total,
                            currencySymbol,
                          )}
                        </strong>
                        {order.transactionId && (
                          <small className="max-w-[180px] break-all font-bold text-amber-700">
                            TxID: {order.transactionId}
                          </small>
                        )}
                      </td>

                      <td>
                        {statusSelect(
                          order,
                          'status',
                          order.status,
                          ORDER_STATUSES,
                        )}
                      </td>

                      <td>
                        {statusSelect(
                          order,
                          'paymentStatus',
                          order.paymentStatus,
                          PAYMENT_STATUSES,
                        )}
                      </td>

                      <td>
                        {statusSelect(
                          order,
                          'shippingStatus',
                          order.shippingStatus,
                          SHIPPING_STATUSES,
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedOrderId(
                              expanded
                                ? ''
                                : order.id,
                            )
                          }
                          className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-black text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                          aria-expanded={expanded}
                        >
                          {expanded ? (
                            <ChevronUp size={15} />
                          ) : (
                            <ChevronDown size={15} />
                          )}
                          {expanded ? 'Hide' : 'View'}
                        </button>
                      </td>

                      <td>
                        <div className="flex min-w-max flex-wrap items-center gap-2">
                          <Link
                            className="btn btn-primary btn-small"
                            to={`/admin/orders/${order.id}/invoice`}
                          >
                            <FileText size={15} />
                            Invoice
                          </Link>

                          <button
                            type="button"
                            disabled={
                              deleting === order.id
                            }
                            onClick={() =>
                              permanentlyDelete(order)
                            }
                            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-black text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 size={15} />
                            {deleting === order.id
                              ? 'Deleting...'
                              : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {expanded && (
                      <tr>
                        <td
                          colSpan="9"
                          className="!p-0"
                        >
                          <OrderDetails
                            order={order}
                            currencySymbol={
                              currencySymbol
                            }
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}

              {!rows.length && (
                <tr>
                  <td
                    colSpan="9"
                    className="orders-empty-cell"
                  >
                    No orders found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}