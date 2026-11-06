// Sample Mart（架空のECサイト）: クーポン利用の検証用ダミーサイト
const ITEM = { name: 'サンプル商品A', price: 2000 };
const COUPONS = [
  { name: '500円OFFクーポン', type: 'amount', value: 500, min: 0, usable: true },
  { name: '10%OFFクーポン', type: 'rate', value: 10, min: 0, usable: true },
  { name: '1,000円OFFクーポン（3,000円以上）', type: 'amount', value: 1000, min: 3000, usable: true },
  { name: '送料無料クーポン', type: 'shipping', value: 0, min: 0, usable: false },
];
 
const yen = n => n.toLocaleString('ja-JP') + '円';
function load() {
  try { return JSON.parse(localStorage.getItem('sm_state')) || {}; } catch (e) { return {}; }
}
function save(s) {
  try { localStorage.setItem('sm_state', JSON.stringify(s)); } catch (e) {}
}
function subtotal(s) { return ITEM.price * (s.qty || 0); }
function couponState(c, s) {
  if (!c.usable) return { ok: false, msg: 'この商品には使えません' };
  if (subtotal(s) < c.min) return { ok: false, msg: yen(c.min) + '以上の購入で使えます' };
  return { ok: true, msg: '' };
}
function discount(s) {
  if (s.coupon == null) return 0;
  const c = COUPONS[s.coupon];
  if (!couponState(c, s).ok) return 0;
  return c.type === 'rate' ? Math.floor(subtotal(s) * c.value / 100) : c.value;
}
const $ = sel => document.querySelector(sel);
const later = (ms, fn) => setTimeout(fn, ms);
 
const pages = {
  item() {
    $('[data-testid="item-name"]').textContent = ITEM.name;
    $('[data-testid="item-price"]').textContent = yen(ITEM.price);
    $('[data-testid="add-to-cart-button"]').addEventListener('click', () => {
      const s = load(); s.qty = 1; s.coupon = null; save(s);
      later(500, () => { $('[data-testid="added-to-cart-message"]').hidden = false; });
    });
  },
  cart() {
    const s = load();
    if (!s.qty) { $('[data-testid="cart-empty"]').hidden = false; return; }
    $('[data-testid="cart-list"]').hidden = false;
    const sel = $('[data-testid="quantity-select"]');
    const render = () => { $('[data-testid="cart-subtotal"]').textContent = yen(subtotal(load())); };
    sel.value = String(s.qty);
    sel.addEventListener('change', () => { const t = load(); t.qty = Number(sel.value); t.coupon = null; save(t); render(); });
    $('[data-testid="cart-item-name"]').textContent = ITEM.name;
    render();
  },
  confirm() {
    // 注文内容は少し遅れて表示される（待ちが必要な画面）
    later(800, () => {
      const s = load();
      $('[data-testid="loading"]').hidden = true;
      $('[data-testid="order-summary"]').hidden = false;
      $('[data-testid="confirm-subtotal"]').textContent = yen(subtotal(s));
      $('[data-testid="coupon-discount"]').textContent = '-' + yen(discount(s));
      $('[data-testid="total-price"]').textContent = yen(subtotal(s) - discount(s));
      $('[data-testid="coupon-usage-status"]').textContent =
        s.coupon == null ? 'クーポン未使用' : COUPONS[s.coupon].name + 'を利用中';
    });
  },
  coupon() {
    later(600, () => {
      const s = load();
      const list = $('[data-testid="coupon-list"]');
      COUPONS.forEach((c, i) => {
        const st = couponState(c, s);
        const row = document.createElement('li');
        row.className = 'coupon-row' + (st.ok ? '' : ' disabled');
        row.dataset.testid = 'coupon-row';
        row.dataset.index = String(i + 1);
        row.innerHTML =
          `<label><input type="checkbox" data-testid="coupon-check-box" ${st.ok ? '' : 'disabled'} ${s.coupon === i ? 'checked' : ''}>` +
          `<span data-testid="coupon-name">${c.name}</span></label>` +
          (st.ok ? '' : `<p class="note" data-testid="coupon-unavailable-message">${st.msg}</p>`);
        list.appendChild(row);
      });
      list.addEventListener('change', e => {
        if (e.target.checked) list.querySelectorAll('input').forEach(x => { if (x !== e.target) x.checked = false; });
      });
      $('[data-testid="loading"]').hidden = true;
      $('[data-testid="coupon-title"]').hidden = false;
      list.hidden = false;
    });
    $('[data-testid="next-button"]').addEventListener('click', () => {
      const s = load();
      const checked = [...document.querySelectorAll('[data-testid="coupon-row"]')]
        .find(r => r.querySelector('input').checked);
      s.coupon = checked ? Number(checked.dataset.index) - 1 : null;
      save(s); location.href = 'confirm.html';
    });
    $('[data-testid="cancel-button"]').addEventListener('click', () => { location.href = 'confirm.html'; });
  },
  complete() {
    $('[data-testid="order-number"]').textContent = 'SM-' + String(Date.now()).slice(-8);
    save({});
  },
};
document.addEventListener('DOMContentLoaded', () => { const p = document.body.dataset.page; if (pages[p]) pages[p](); });