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
V.add({ id: "1", name: "Cetak Sablon DTF", price: 35000, unit: "A3", image: "x", qty: 3 });
V.add({ id: "2", name: "Kaos Custom DTF", price: 75000, unit: "pcs", image: "x", qty: 1 });
V.add({ id: "1", name: "Cetak Sablon DTF", price: 35000, unit: "A3", image: "x", qty: 2 }); // merge -> qty 5
check("count() = 6 (3+2+1)", V.count() === 6);
check("total() = 3*35000*? -> 5*35000 + 75000 = 250000", V.total() === 5 * 35000 + 75000);
check("item 1 qty = 5", V.get()[0].qty === 5);

console.log("== Uji 2: setQty / remove / min-qty ==");
V.setQty("2", 4);
check("setQty('2',4) -> qty 4", V.get().find(i => i.id === "2").qty === 4);
V.setQty("1", 0); // <=0 harus hapus
check("setQty 0 menghapus item", V.get().length === 1);
V.remove("2");
check("remove -> kosong", V.get().length === 0);
check("count 0", V.count() === 0);

console.log("== Uji 3: format Rupiah ==");
check("formatRupiah(35000) = 'Rp 35.000'", V.formatRupiah(35000) === "Rp 35.000");
check("formatRupiah(250000) = 'Rp 250.000'", V.formatRupiah(250000) === "Rp 250.000");

console.log("== Uji 4: pesan WhatsApp ==");
V.clear();
V.add({ id: "1", name: "Cetak Sablon DTF", price: 35000, unit: "A3", image: "x", qty: 2 });
V.add({ id: "3", name: "Kaos Custom DTF", price: 75000, unit: "pcs", image: "x", qty: 1 });
const msg = V.buildWaMessage();
check("pesan memuat nama produk 1", msg.includes("Cetak Sablon DTF"));
check("pesan memuat nama produk 2", msg.includes("Kaos Custom DTF"));
check("pesan memuat qty 2", msg.includes("Qty      : 2"));
check("pesan memuat subtotal 70.000", msg.includes("70.000"));
check("pesan memuat TOTAL PESANAN", msg.includes("TOTAL PESANAN"));
check("total di pesan = 145.000", msg.includes("145.000"));
const url = V.waCheckoutUrl();
check("URL wa.me benar", url.startsWith("https://wa.me/6282134340609?text="));
check("URL ter-encode", url.includes("%0A"));

console.log("\nRESULT: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
