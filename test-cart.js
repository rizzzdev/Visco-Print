/* Validasi cepat logika keranjang (js/cart.js) di Node */
"use strict";

const fs = require("fs");

/* ---- Shim browser globals ---- */
const store = {};
global.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
};
const fakeEl = () => ({ classList: { toggle: () => {} }, remove: () => {}, querySelector: () => null, querySelectorAll: () => [], appendChild: () => {}, setAttribute: () => {} });
global.document = {
    querySelectorAll: () => [],
    querySelector: () => null,
    createElement: () => fakeEl(),
    body: fakeEl(),
};
global.window = global;

/* ---- Muat modul cart ---- */
eval(fs.readFileSync("js/cart.js", "utf8"));

const V = global.window.Viscart;
let pass = 0, fail = 0;
function check(name, cond) {
    if (cond) { pass++; console.log("  ✓ " + name); }
    else { fail++; console.log("  ✗ FAIL: " + name); }
}

console.log("== Uji 1: add + qty merge + total ==");
V.clear();
// ID dan Harga DISESUAIKAN dengan product.html asli (DTF A3 = 30.000)
V.add({ id: "1", name: "Cetak Sablon DTF", price: 30000, unit: "A3", image: "x", qty: 3 });
// ID diubah menjadi "3" menyesuaikan produk asli Kaos Custom (Harga = 75.000)
V.add({ id: "3", name: "Kaos Custom DTF", price: 75000, unit: "pcs", image: "x", qty: 1 });
V.add({ id: "1", name: "Cetak Sablon DTF", price: 30000, unit: "A3", image: "x", qty: 2 }); // merge -> qty 5
check("count() = 6 (3+2+1)", V.count() === 6);
// Hitungan: (5 x 30.000) + (1 x 75.000) = 150.000 + 75.000 = 225.000
check("total() = 5*30000 + 75000 = 225000", V.total() === 5 * 30000 + 75000);
check("item 1 qty = 5", V.get()[0].qty === 5);

console.log("== Uji 2: setQty / remove / min-qty ==");
V.setQty("3", 4);
check("setQty('3',4) -> qty 4", V.get().find(i => i.id === "3").qty === 4);
V.setQty("1", 0); // <=0 harus hapus
check("setQty 0 menghapus item", V.get().length === 1);
V.remove("3");
check("remove -> kosong", V.get().length === 0);
check("count 0", V.count() === 0);

console.log("== Uji 3: format Rupiah ==");
check("formatRupiah(30000) = 'Rp 30.000'", V.formatRupiah(30000) === "Rp 30.000");
check("formatRupiah(250000) = 'Rp 250.000'", V.formatRupiah(250000) === "Rp 250.000");

console.log("== Uji 4: pesan WhatsApp ==");
V.clear();
V.add({ id: "1", name: "Cetak Sablon DTF", price: 30000, unit: "A3", image: "x", qty: 2 });
V.add({ id: "3", name: "Kaos Custom DTF", price: 75000, unit: "pcs", image: "x", qty: 1 });
const msg = V.buildWaMessage();
check("pesan memuat nama produk 1", msg.includes("Cetak Sablon DTF"));
check("pesan memuat nama produk 2 (ID 3)", msg.includes("Kaos Custom DTF"));
check("pesan memuat qty 2", msg.includes("Qty      : 2"));
// 2 pcs Cetak Sablon DTF x 30.000 = 60.000
check("pesan memuat subtotal 60.000", msg.includes("60.000"));
check("pesan memuat TOTAL PESANAN", msg.includes("TOTAL PESANAN"));
// 60.000 + 75.000 = 135.000
check("total di pesan = 135.000", msg.includes("135.000"));
const url = V.waCheckoutUrl();
check("URL wa.me benar", url.startsWith("https://wa.me/6282134340609?text="));
check("URL ter-encode", url.includes("%0A"));

console.log("\nRESULT: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);