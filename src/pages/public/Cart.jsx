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
 * যেমন Size, Color, Age ইত্যাদি দেখাবে।
 */
function SelectedOptions({ item }) {
  const selectedOptions =
    item.selectedOptionLabels ||
    item.selectedOptions ||
    {};

  let entries = [];

  if (Array.isArray(selectedOptions)) {
    entries = selectedOptions.map(
      (option, index) => [
        option?.label ||
          option?.name ||
          `Option ${index + 1}`,

        option?.value ||
          option?.selectedValue ||
          option?.labelValue ||
          '',
      ],
    );
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
    <div className="mt-3 flex flex-wrap gap-2">
      {validEntries.map(([label, value]) => (
        <span
          key={`${label}-${value}`}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] leading-4 text-slate-600"
        >
          <strong className="font-black text-slate-900">
            {label}:
          </strong>{' '}
          {String(value)}
        </span>
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

  const primaryColor =
    settings?.primaryColor || '#0f172a';

  const secondaryColor =
    settings?.secondaryColor || '#d97706';

  const themeStyle = {
    '--store-primary': primaryColor,

    '--store-secondary':
      secondaryColor,

    '--store-secondary-soft':
      hexToRgba(
        secondaryColor,
        0.08,
      ),

    '--store-secondary-ring':
      hexToRgba(
        secondaryColor,
        0.12,
      ),

    '--store-secondary-shadow':
      hexToRgba(
        secondaryColor,
        0.24,
      ),
  };

  /**
   * Empty cart
   */
  if (!items.length) {
    return (
      <main
        style={themeStyle}
        className="min-h-[70vh] bg-[#f7f5f0] px-4 py-16 text-[var(--store-primary)]"
      >
        <div className="mx-auto grid min-h-[420px] w-full max-w-[900px] place-items-center rounded-[32px] border border-slate-200 bg-white px-6 text-center shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <div>
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--store-secondary-soft)] text-[var(--store-secondary)]">
              <ShoppingBag size={28} />
            </span>

            <h1 className="mt-6 font-serif text-4xl font-semibold tracking-[-0.03em] text-[var(--store-primary)] sm:text-5xl">
              Your cart is empty
            </h1>

            <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-slate-500 sm:text-base">
              Add something you love
              before continuing to
              checkout.
            </p>

            <Link
              to="/shop"
              className="mt-7 inline-flex min-h-[52px] items-center justify-center rounded-full bg-[var(--store-secondary)] px-7 text-sm font-black text-white shadow-[0_18px_40px_var(--store-secondary-shadow)] transition hover:-translate-y-0.5 hover:brightness-110"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      style={themeStyle}
      className="min-h-screen bg-[#f7f5f0] pb-20 text-[var(--store-primary)]"
    >
      <div className="mx-auto w-full max-w-[1180px] px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
        {/* Page heading */}
        <header className="mb-9 max-w-3xl sm:mb-12">
          <span className="inline-block border-l-2 border-[var(--store-secondary)] pl-3 text-[10px] font-black uppercase tracking-[0.25em] text-[var(--store-secondary)]">
            Shopping bag
          </span>

          <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight tracking-[-0.04em] text-[var(--store-primary)] sm:text-5xl lg:text-6xl">
            Review your cart
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
            Review your selected products,
            options and quantities before
            proceeding to checkout.
          </p>
        </header>

        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_370px]">
          {/* Cart products */}
          <section className="min-w-0 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)] sm:p-6 lg:p-7">
            <div className="mb-5 flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="font-serif text-2xl font-semibold tracking-[-0.02em] text-[var(--store-primary)]">
                  Cart items
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                  {items.length}{' '}
                  {items.length === 1
                    ? 'product'
                    : 'products'}{' '}
                  in your cart
                </p>
              </div>

              <span className="grid h-11 min-w-11 place-items-center rounded-full bg-[var(--store-secondary-soft)] px-3 text-sm font-black text-[var(--store-secondary)]">
                {items.length}
              </span>
            </div>

            <div className="space-y-3">
              {items.map(
                (item, index) => {
                  const quantity =
                    Number(
                      item.quantity,
                    ) || 1;

                  const unitPrice =
                    Number(
                      item.unitPrice,
                    ) || 0;

                  const itemTotal =
                    unitPrice *
                    quantity;

                  const productLink =
                    item.slug
                      ? `/product/${item.slug}`
                      : '/shop';

                  const cartItemKey =
                    item.cartItemId ||
                    item.key ||
                    item.id ||
                    index;

                  return (
                    <article
                      key={
                        cartItemKey
                      }
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-3 transition hover:border-slate-300 sm:p-4"
                    >
                      <div className="grid grid-cols-[82px_minmax(0,1fr)] gap-4 sm:grid-cols-[100px_minmax(0,1fr)_auto] sm:items-center sm:gap-5">
                        {/* Product image */}
                        <Link
                          to={
                            productLink
                          }
                          className="block h-[105px] w-[82px] shrink-0 overflow-hidden rounded-xl bg-white sm:h-[125px] sm:w-[100px] sm:rounded-2xl"
                        >
                          <img
                            src={
                              item.image
                            }
                            alt={
                              item.name
                            }
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        </Link>

                        {/* Product information */}
                        <div className="min-w-0">
                          <div className="flex items-start justify-between gap-3 sm:block">
                            <Link
                              to={
                                productLink
                              }
                              className="block min-w-0 text-sm font-black leading-5 text-[var(--store-primary)] transition hover:text-[var(--store-secondary)] sm:text-base sm:leading-6"
                            >
                              {
                                item.name
                              }
                            </Link>

                            {/* Mobile remove */}
                            <button
                              type="button"
                              title="Remove product"
                              aria-label={`Remove ${item.name} from cart`}
                              onClick={() =>
                                removeItem(
                                  item.id,
                                )
                              }
                              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-red-100 bg-red-50 text-red-500 transition hover:border-red-200 hover:bg-red-100 hover:text-red-700 sm:hidden"
                            >
                              <Trash2
                                size={
                                  17
                                }
                              />
                            </button>
                          </div>

                          {item.sku && (
                            <p className="mb-0 mt-1 text-xs text-slate-400">
                              SKU:{' '}
                              {
                                item.sku
                              }
                            </p>
                          )}

                          <SelectedOptions
                            item={
                              item
                            }
                          />

                          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                            <strong className="text-sm font-black text-[var(--store-primary)]">
                              {formatMoney(
                                unitPrice,
                                currencySymbol,
                              )}
                            </strong>

                            <span className="text-xs text-slate-400">
                              each
                            </span>
                          </div>
                        </div>

                        {/* Desktop controls */}
                        <div className="hidden min-w-[155px] flex-col items-end gap-4 sm:flex">
                          <button
                            type="button"
                            title="Remove product"
                            aria-label={`Remove ${item.name} from cart`}
                            onClick={() =>
                              removeItem(
                                item.id,
                              )
                            }
                            className="grid h-9 w-9 place-items-center rounded-xl border border-red-100 bg-red-50 text-red-500 transition hover:border-red-200 hover:bg-red-100 hover:text-red-700"
                          >
                            <Trash2
                              size={17}
                            />
                          </button>

                          <div className="flex items-center overflow-hidden rounded-full border border-slate-200 bg-white">
                            <button
                              type="button"
                              disabled={
                                quantity <=
                                1
                              }
                              aria-label={`Decrease quantity of ${item.name}`}
                              onClick={() =>
                                updateQuantity(
                                  item.id,
                                  quantity -
                                    1,
                                )
                              }
                              className="grid h-10 w-10 place-items-center text-slate-500 transition hover:bg-[var(--store-primary)] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Minus
                                size={
                                  14
                                }
                              />
                            </button>

                            <b
                              className="min-w-10 text-center text-sm font-black text-[var(--store-primary)]"
                              aria-live="polite"
                            >
                              {
                                quantity
                              }
                            </b>

                            <button
                              type="button"
                              aria-label={`Increase quantity of ${item.name}`}
                              onClick={() =>
                                updateQuantity(
                                  item.id,
                                  quantity +
                                    1,
                                )
                              }
                              className="grid h-10 w-10 place-items-center text-slate-500 transition hover:bg-[var(--store-primary)] hover:text-white"
                            >
                              <Plus
                                size={
                                  14
                                }
                              />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Mobile quantity and total */}
                      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 border-t border-slate-200 pt-4 sm:hidden">
                        <div>
                          <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                            Quantity
                          </span>

                          <div className="flex w-max items-center overflow-hidden rounded-full border border-slate-200 bg-white">
                            <button
                              type="button"
                              disabled={
                                quantity <=
                                1
                              }
                              aria-label={`Decrease quantity of ${item.name}`}
                              onClick={() =>
                                updateQuantity(
                                  item.id,
                                  quantity -
                                    1,
                                )
                              }
                              className="grid h-10 w-10 place-items-center text-slate-500 transition hover:bg-[var(--store-primary)] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Minus
                                size={
                                  14
                                }
                              />
                            </button>

                            <b className="min-w-10 text-center text-sm font-black text-[var(--store-primary)]">
                              {
                                quantity
                              }
                            </b>

                            <button
                              type="button"
                              aria-label={`Increase quantity of ${item.name}`}
                              onClick={() =>
                                updateQuantity(
                                  item.id,
                                  quantity +
                                    1,
                                )
                              }
                              className="grid h-10 w-10 place-items-center text-slate-500 transition hover:bg-[var(--store-primary)] hover:text-white"
                            >
                              <Plus
                                size={
                                  14
                                }
                              />
                            </button>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                            Total
                          </span>

                          <strong className="text-base font-black text-[var(--store-primary)]">
                            {formatMoney(
                              itemTotal,
                              currencySymbol,
                            )}
                          </strong>
                        </div>
                      </div>

                      {/* Desktop item total */}
                      <div className="mt-4 hidden items-center justify-between border-t border-slate-200 pt-4 sm:flex">
                        <span className="text-xs font-bold text-slate-500">
                          Item total
                        </span>

                        <strong className="text-base font-black text-[var(--store-primary)]">
                          {formatMoney(
                            itemTotal,
                            currencySymbol,
                          )}
                        </strong>
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          </section>

          {/* Cart summary */}
          <aside className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.09)] sm:p-6 lg:sticky lg:top-[145px]">
            <h2 className="font-serif text-3xl font-semibold tracking-[-0.03em] text-[var(--store-primary)]">
              Cart Summary
            </h2>

            <div className="mt-6 divide-y divide-slate-100 border-y border-slate-100">
              <SummaryRow
                label="Subtotal"
                value={formatMoney(
                  subtotal,
                  currencySymbol,
                )}
              />

              <SummaryRow
                label="Shipping"
                value="Calculated at checkout"
                valueClassName="max-w-[170px] text-right text-xs font-bold leading-5 text-slate-500"
              />
            </div>

            <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl bg-[var(--store-primary)] px-5 py-5 text-white">
              <span className="text-sm font-bold">
                Total
              </span>

              <strong className="text-xl font-black">
                {formatMoney(
                  subtotal,
                  currencySymbol,
                )}
              </strong>
            </div>

            <Link
              to="/checkout"
              className="mt-5 inline-flex min-h-14 w-full items-center justify-center rounded-full bg-[var(--store-secondary)] px-6 text-sm font-black text-white shadow-[0_18px_40px_var(--store-secondary-shadow)] transition hover:-translate-y-0.5 hover:brightness-110"
            >
              Proceed to Checkout
            </Link>

            <Link
              to="/shop"
              className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-full border border-slate-200 bg-white px-6 text-sm font-black text-[var(--store-primary)] transition hover:border-[var(--store-secondary)] hover:bg-[var(--store-secondary-soft)] hover:text-[var(--store-secondary)]"
            >
              Continue Shopping
            </Link>

            <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-slate-500">
              <ShoppingBag
                size={16}
                className="mt-0.5 shrink-0 text-[var(--store-secondary)]"
              />

              <span>
                Shipping charge and payment
                method will be selected on
                the checkout page.
              </span>
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}

function SummaryRow({
  label,
  value,
  valueClassName =
    'font-black text-[var(--store-primary)]',
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 text-sm">
      <span className="text-slate-500">
        {label}
      </span>

      <strong className={valueClassName}>
        {value}
      </strong>
    </div>
  );
}

function hexToRgba(
  hex,
  alpha = 1,
) {
  const cleaned = String(
    hex || '',
  )
    .replace('#', '')
    .trim();

  const normalized =
    cleaned.length === 3
      ? cleaned
          .split('')
          .map(
            character =>
              character +
              character,
          )
          .join('')
      : cleaned;

  if (
    !/^[0-9a-fA-F]{6}$/.test(
      normalized,
    )
  ) {
    return `rgba(217, 119, 6, ${alpha})`;
  }

  const number = Number.parseInt(
    normalized,
    16,
  );

  const red =
    (number >> 16) & 255;

  const green =
    (number >> 8) & 255;

  const blue =
    number & 255;

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}