/* ============================================================
   Visco Print — Keranjang Belanja (shared module)
   Menyimpan produk, quantity, harga per satuan di localStorage.
   ============================================================ */
(function () {
    "use strict";

    var STORAGE_KEY = "viscoprint_cart";
    var WA_NUMBER = "6282134340609"; // Nomor WhatsApp Visco Print

    /* ---------- low level storage ---------- */
    function read() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            var items = raw ? JSON.parse(raw) : [];
            return Array.isArray(items) ? items : [];
        } catch (e) {
            return [];
        }
    }

    function write(items) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch (e) {
            /* localStorage penuh / tidak tersedia — abaikan */
        }
        emit();
    }

    /* ---------- public data ---------- */
    function get() {
        return read().map(function (it) {
            return {
                id: String(it.id),
                name: String(it.name || "Produk"),
                price: Number(it.price) || 0,
                unit: String(it.unit || "pcs"),
                qty: Math.min(999, Math.max(1, parseInt(it.qty, 10) || 1)),
                image: String(it.image || ""),
            };
        });
    }

    function add(item) {
        var items = read();
        var id = String(item.id);
        var qty = Math.min(999, Math.max(1, parseInt(item.qty, 10) || 1));
        var found = items.find(function (i) { return String(i.id) === id; });
        if (found) {
            found.qty = Math.min(999, (parseInt(found.qty, 10) || 1) + qty);
        } else {
            items.push({
                id: id,
                name: String(item.name || "Produk"),
                price: Number(item.price) || 0,
                unit: String(item.unit || "pcs"),
                qty: qty,
                image: String(item.image || ""),
            });
        }
        write(items);
    }

    function setQty(id, qty) {
        qty = parseInt(qty, 10);
        if (isNaN(qty) || qty <= 0) {
            remove(id);
            return;
        }
        var items = read();
        var found = items.find(function (i) { return String(i.id) === String(id); });
        if (found) {
            found.qty = Math.min(999, qty);
            write(items);
        }
    }

    function remove(id) {
        write(read().filter(function (i) { return String(i.id) !== String(id); }));
    }

    function clear() {
        write([]);
    }

    function count() {
        return get().reduce(function (acc, it) { return acc + it.qty; }, 0);
    }

    function total() {
        return get().reduce(function (acc, it) { return acc + it.price * it.qty; }, 0);
    }

    function formatRupiah(n) {
        return "Rp " + Math.round(Number(n) || 0).toLocaleString("id-ID");
    }

    /* ---------- WhatsApp checkout ---------- */
    function buildWaMessage() {
        var items = get();
        var msg = "Halo Visco Print! 👋\n";
        msg += "Saya ingin memesan:\n\n";

        items.forEach(function (it, i) {
            msg += (i + 1) + ". *" + it.name + "*\n";
            msg += "   Harga    : " + formatRupiah(it.price) + " /" + it.unit + "\n";
            msg += "   Qty      : " + it.qty + " " + it.unit + "\n";
            msg += "   Subtotal : " + formatRupiah(it.price * it.qty) + "\n\n";
        });

        msg += "--------------------------------\n";
        msg += "*TOTAL PESANAN: " + formatRupiah(total()) + "*\n\n";
        msg += "Mohon konfirmasi ketersediaan & estimasi ongkirnya ya. Terima kasih! 🙏";
        return msg;
    }

    function waCheckoutUrl() {
        return "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(buildWaMessage());
    }

    /* ---------- UI helpers ---------- */
    var listeners = [];

    function emit() {
        var snapshot = get();
        listeners.forEach(function (fn) {
            try { fn(snapshot); } catch (e) { /* abaikan error listener */ }
        });
    }

    function onChange(fn) {
        listeners.push(fn);
        return function () {
            var idx = listeners.indexOf(fn);
            if (idx >= 0) listeners.splice(idx, 1);
        };
    }

    // Perbarui semua badge keranjang (elemen [data-cart-badge])
    function updateBadges() {
        var c = count();
        document.querySelectorAll("[data-cart-badge]").forEach(function (el) {
            el.textContent = c > 99 ? "99+" : String(c);
            el.classList.toggle("hidden", c === 0);
        });
    }

    // Toast notifikasi sederhana
    function toast(msg) {
        var old = document.querySelector(".viscart-toast");
        if (old) old.remove();

        var el = document.createElement("div");
        el.className =
            "viscart-toast fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] " +
            "bg-ink text-white text-sm font-medium px-5 py-3 rounded-full shadow-2xl " +
            "flex items-center gap-2 transition-all duration-300 opacity-0 translate-y-3 pointer-events-none max-w-[92vw]";
        el.innerHTML =
            '<span class="material-symbols-outlined text-base text-green-400 shrink-0">check_circle</span>' +
            '<span class="whitespace-nowrap overflow-hidden text-ellipsis"></span>';
        el.querySelector("span:last-child").textContent = msg;
        document.body.appendChild(el);

        requestAnimationFrame(function () {
            el.classList.remove("opacity-0", "translate-y-3");
        });
        setTimeout(function () {
            el.classList.add("opacity-0", "translate-y-3");
            setTimeout(function () { el.remove(); }, 300);
        }, 2400);
    }

    /* ---------- bootstrap ---------- */
    updateBadges();
    onChange(updateBadges);

    window.Viscart = {
        get: get,
        add: add,
        setQty: setQty,
        remove: remove,
        clear: clear,
        count: count,
        total: total,
        formatRupiah: formatRupiah,
        buildWaMessage: buildWaMessage,
        waCheckoutUrl: waCheckoutUrl,
        onChange: onChange,
        updateBadges: updateBadges,
        toast: toast,
    };
})();
