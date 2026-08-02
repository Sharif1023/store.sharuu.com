import {
  FileText,
  Search,
} from 'lucide-react';
import {
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

export default function Orders() {
  const {
    orders,
    products,
    categories,
    settings,
    loadAdmin,
    adminLoaded,
    updateOrder,
  } = useStore();

  const [query, setQuery] =
    useState('');
  const [status, setStatus] =
    useState('');
  const [categoryId, setCategoryId] =
    useState('');
  const [updating, setUpdating] =
    useState('');
  const [error, setError] =
    useState('');

  useEffect(() => {
    if (!adminLoaded) {
      loadAdmin().catch(() => {});
    }
  }, [
    adminLoaded,
    loadAdmin,
  ]);

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
      const subcategory =
        categoryById.get(
          ids.subcategoryId,
        );

      return (
        ids.categoryId ===
          String(selectedCategoryId) ||
        ids.subcategoryId ===
          String(selectedCategoryId) ||
        String(
          subcategory?.parentId || '',
        ) === String(selectedCategoryId)
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

  const rows = useMemo(
    () =>
      orders.filter(order => {
        const text =
          `${order.orderNumber} ${order.customer?.name} ${order.customer?.phone}`
            .toLowerCase();

        return (
          text.includes(
            query.toLowerCase(),
          ) &&
          (!status ||
            order.status === status) &&
          orderMatchesCategory(
            order,
            categoryId,
          )
        );
      }),
    [
      orders,
      query,
      status,
      categoryId,
      productById,
      categoryById,
    ],
  );

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
      setError(requestError.message);
    } finally {
      setUpdating('');
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
            Filter orders by product category,
            search details and update every status
            immediately.
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
              setQuery(
                event.target.value,
              )
            }
            placeholder="Order number, name or phone..."
          />
        </label>

        <select
          value={status}
          onChange={event =>
            setStatus(
              event.target.value,
            )
          }
        >
          <option value="">
            All status
          </option>
          {ORDER_STATUSES.map(
            option => (
              <option
                key={option}
                value={option}
              >
                {labelFor(option)}
              </option>
            ),
          )}
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
                <th>Invoice</th>
              </tr>
            </thead>

            <tbody>
              {rows.map(
                (order, index) => (
                  <tr key={order.id}>
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
                        {new Date(
                          order.createdAt,
                        ).toLocaleString()}
                      </small>
                    </td>
                    <td>
                      <strong>
                        {order.customer?.name}
                      </strong>
                      <small>
                        {order.customer?.phone}
                      </small>
                    </td>
                    <td>
                      <strong>
                        {formatMoney(
                          order.total,
                          settings?.currencySymbol,
                        )}
                      </strong>
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
                      <Link
                        className="btn btn-primary btn-small"
                        to={`/admin/orders/${order.id}/invoice`}
                      >
                        <FileText
                          size={15}
                        />
                        Invoice
                      </Link>
                    </td>
                  </tr>
                ),
              )}

              {!rows.length && (
                <tr>
                  <td
                    colSpan="8"
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
