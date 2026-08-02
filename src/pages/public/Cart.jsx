import {
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useStore } from '../../contexts/StoreContext';
import { formatMoney } from '../../lib/utils';

/**
 * Customer যে product options select করেছে,
 * যেমন Size, Color ইত্যাদি দেখাবে।
 */
function SelectedOptions({ item }) {
  const selectedOptions =
    item.selectedOptionLabels ||
    item.selectedOptions ||
    {};

  let entries = [];

  if (Array.isArray(selectedOptions)) {
    entries = selectedOptions.map((option, index) => [
      option?.label ||
        option?.name ||
        `Option ${index + 1}`,

      option?.value ||
        option?.selectedValue ||
        option?.labelValue ||
        '',
    ]);
  } else if (
    selectedOptions &&
    typeof selectedOptions === 'object'
  ) {
    entries = Object.entries(selectedOptions);
  }

  const validEntries = entries.filter(
    ([label, value]) =>
      label &&
      value !== undefined &&
      value !== null &&
      String(value).trim() !== '',
  );

  if (!validEntries.length) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
      {validEntries.map(([label, value]) => (
        <p
          key={`${label}-${value}`}
          className="m-0 text-sm leading-5"
        >
          <span className="font-medium">
            {label}:
          </span>{' '}
          <span>{String(value)}</span>
        </p>
      ))}
    </div>
  );
}

export default function Cart() {
  const {
    items,
    subtotal,
    updateQuantity,
    removeItem,
  } = useCart();

  const { settings } = useStore();

  const currencySymbol =
    settings?.currencySymbol || '৳';

  /**
   * Empty cart
   */
  if (!items.length) {
    return (
      <main className="page container">
        <div className="empty-state">
          <ShoppingBag
            size={42}
            className="mx-auto mb-4"
          />

          <h1>Your cart is empty</h1>

          <p>
            Add something you love to continue.
          </p>

          <Link
            className="btn btn-primary"
            to="/shop"
          >
            Shop now
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page container">
      {/* Page heading */}
      <div className="page-heading">
        <span className="eyebrow">
          Shopping bag
        </span>

        <h1>Your Cart</h1>

        <p>
          Review quantities and selected options.
        </p>
      </div>

      <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* Cart products */}
        <section className="overflow-hidden rounded-md border bg-white">
          {/* Desktop table heading */}
          <div className="hidden grid-cols-[minmax(350px,2.5fr)_120px_190px_120px_90px] border-b lg:grid">
            <div className="flex min-h-14 items-center justify-center border-r px-5 text-center font-bold">
              Products
            </div>

            <div className="flex min-h-14 items-center justify-center border-r px-4 text-center font-bold">
              Price
            </div>

            <div className="flex min-h-14 items-center justify-center border-r px-4 text-center font-bold">
              Quantity
            </div>

            <div className="flex min-h-14 items-center justify-center border-r px-4 text-center font-bold">
              Total
            </div>

            <div className="flex min-h-14 items-center justify-center px-3 text-center font-bold">
              Remove
            </div>
          </div>

          {/* Cart items */}
          <div>
            {items.map((item, index) => {
              const quantity =
                Number(item.quantity) || 1;

              const unitPrice =
                Number(item.unitPrice) || 0;

              const itemTotal =
                unitPrice * quantity;

              const productLink = item.slug
                ? `/product/${item.slug}`
                : '/shop';

              const cartItemKey =
                item.cartItemId ||
                item.key ||
                item.id ||
                index;

              return (
                <article
                  key={cartItemKey}
                  className="border-b last:border-b-0"
                >
                  {/* Desktop design */}
                  <div className="hidden min-h-[150px] grid-cols-[minmax(350px,2.5fr)_120px_190px_120px_90px] lg:grid">
                    {/* Product details */}
                    <div className="flex min-w-0 items-center gap-5 border-r px-6 py-5">
                      <Link
                        to={productLink}
                        className="block h-[105px] w-[82px] shrink-0 overflow-hidden"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      </Link>

                      <div className="min-w-0">
                        <Link
                          to={productLink}
                          className="block text-base font-medium leading-6 no-underline"
                        >
                          {item.name}
                        </Link>

                        {item.sku && (
                          <p className="mt-1 mb-0 text-xs opacity-60">
                            SKU: {item.sku}
                          </p>
                        )}

                        <SelectedOptions item={item} />
                      </div>
                    </div>

                    {/* Unit price */}
                    <div className="flex items-center justify-center border-r px-3 text-center">
                      <strong className="font-medium">
                        {formatMoney(
                          unitPrice,
                          currencySymbol,
                        )}
                      </strong>
                    </div>

                    {/* Quantity */}
                    <div className="flex items-center justify-center border-r px-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          disabled={quantity <= 1}
                          aria-label={`Decrease quantity of ${item.name}`}
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              quantity - 1,
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded border-0 bg-[var(--primary)] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Minus size={16} />
                        </button>

                        <span
                          className="min-w-7 text-center font-medium"
                          aria-live="polite"
                        >
                          {quantity}
                        </span>

                        <button
                          type="button"
                          aria-label={`Increase quantity of ${item.name}`}
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              quantity + 1,
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded border-0 bg-[var(--primary)] text-white transition hover:opacity-90"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Item total */}
                    <div className="flex items-center justify-center border-r px-3 text-center">
                      <strong className="font-medium">
                        {formatMoney(
                          itemTotal,
                          currencySymbol,
                        )}
                      </strong>
                    </div>

                    {/* Remove button */}
                    <div className="flex items-center justify-center px-3">
                      <button
                        type="button"
                        title="Remove product"
                        aria-label={`Remove ${item.name} from cart`}
                        onClick={() =>
                          removeItem(item.id)
                        }
                        className="flex h-10 w-10 items-center justify-center border-0 bg-transparent transition hover:opacity-60"
                      >
                        <Trash2 size={19} />
                      </button>
                    </div>
                  </div>

                  {/* Mobile and tablet design */}
                  <div className="p-4 sm:p-5 lg:hidden">
                    <div className="flex items-start gap-4">
                      {/* Product image */}
                      <Link
                        to={productLink}
                        className="block h-28 w-24 shrink-0 overflow-hidden sm:h-32 sm:w-28"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      </Link>

                      {/* Product information */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <Link
                            to={productLink}
                            className="block text-sm font-medium leading-5 no-underline sm:text-base sm:leading-6"
                          >
                            {item.name}
                          </Link>

                          <button
                            type="button"
                            title="Remove product"
                            aria-label={`Remove ${item.name} from cart`}
                            onClick={() =>
                              removeItem(item.id)
                            }
                            className="flex h-9 w-9 shrink-0 items-center justify-center border-0 bg-transparent"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        {item.sku && (
                          <p className="mt-1 mb-0 text-xs opacity-60">
                            SKU: {item.sku}
                          </p>
                        )}

                        <SelectedOptions item={item} />

                        <strong className="mt-3 block text-sm">
                          {formatMoney(
                            unitPrice,
                            currencySymbol,
                          )}
                        </strong>
                      </div>
                    </div>

                    {/* Mobile quantity and total */}
                    <div className="mt-5 grid grid-cols-2 gap-4 border-t pt-4">
                      <div>
                        <span className="mb-2 block text-xs font-medium opacity-60">
                          Quantity
                        </span>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            disabled={quantity <= 1}
                            aria-label={`Decrease quantity of ${item.name}`}
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                quantity - 1,
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center rounded border-0 bg-[var(--primary)] text-white disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Minus size={15} />
                          </button>

                          <span className="min-w-6 text-center font-medium">
                            {quantity}
                          </span>

                          <button
                            type="button"
                            aria-label={`Increase quantity of ${item.name}`}
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                quantity + 1,
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center rounded border-0 bg-[var(--primary)] text-white"
                          >
                            <Plus size={15} />
                          </button>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="mb-2 block text-xs font-medium opacity-60">
                          Total
                        </span>

                        <strong className="text-base">
                          {formatMoney(
                            itemTotal,
                            currencySymbol,
                          )}
                        </strong>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Cart summary */}
        <aside className="overflow-hidden rounded-md border bg-white xl:sticky xl:top-24">
          <div className="border-b px-5 py-4">
            <h2 className="m-0 text-2xl font-semibold">
              Cart Summary
            </h2>
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between gap-5 py-2">
              <span className="font-medium">
                Subtotal
              </span>

              <strong>
                {formatMoney(
                  subtotal,
                  currencySymbol,
                )}
              </strong>
            </div>

            <div className="flex items-start justify-between gap-5 py-3">
              <span className="font-medium">
                Shipping
              </span>

              <span className="max-w-40 text-right text-sm opacity-60">
                Calculated at checkout
              </span>
            </div>

            <div className="my-4 border-t" />

            <div className="mb-6 flex items-center justify-between gap-5">
              <span className="text-lg font-semibold">
                Total
              </span>

              <strong className="text-xl">
                {formatMoney(
                  subtotal,
                  currencySymbol,
                )}
              </strong>
            </div>

            {/* Existing project button color থাকবে */}
            <Link
              className="btn btn-primary full flex min-h-12 items-center justify-center"
              to="/checkout"
            >
              Proceed to Checkout
            </Link>

            <Link
              className="text-link mx-auto mt-5 block w-fit"
              to="/shop"
            >
              Continue shopping
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}