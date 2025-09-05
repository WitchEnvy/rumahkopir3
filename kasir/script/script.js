const url = "https://script.google.com/macros/s/AKfycbz21TyyJOPAvoAB3bi4mv9QIPuK9S3AddK7LJW4dhwuP18hPKyuK9cqbnjzdTTLNLBO0A/exec?action=produk";

let cart = [];

// Helper format Rupiah
function formatRupiah(angka) {
  return angka.toLocaleString("id-ID");
}

// Load produk dari Google Sheets
async function loadProduk() {
  const response = await fetch(url);
  const data = await response.json();
  const produkList = document.getElementById("produkList");

  produkList.innerHTML = ""; // Clear dulu

  data.forEach(p => {
    const hargaNum = parseInt(p.harga); // ✅ Ubah ke angka

    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      ${p.promo ? `<div class="promo">${p.promo}</div>` : ""}
      <img src="${p.foto}" alt="${p.nama}">
      <h4>${p.nama}</h4>
      <p class="harga">Rp ${formatRupiah(hargaNum)}</p> 
      <span class="stok ${p.stokStatus.toLowerCase()}">${p.stokStatus}</span>
    `;
    div.addEventListener("click", () => addToCart({
      nama: p.nama,
      harga: hargaNum
    }));
    produkList.appendChild(div);
  });
}

// Tambah produk ke keranjang
function addToCart(product) {
  const found = cart.find(item => item.nama === product.nama);
  if (found) {
    found.qty++;
  } else {
    cart.push({ nama: product.nama, harga: parseInt(product.harga), qty: 1 });
  }
  renderCart();
}

// Tampilkan keranjang
function renderCart() {
  const cartItems = document.getElementById("cartItems");
  const cartTotal = document.getElementById("cartTotal");
  cartItems.innerHTML = "";

  let total = 0;
  cart.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "cart-item";
    const subtotal = item.harga * item.qty;
    total += subtotal;

    div.innerHTML = `
      <span>${item.nama} x${item.qty}</span>
      <span>Rp ${formatRupiah(subtotal)}</span>
    `;

    // Klik item untuk mengurangi jumlah
    div.addEventListener("click", () => {
      item.qty--;
      if (item.qty <= 0) {
        cart.splice(index, 1);
      }
      renderCart();
    });

    cartItems.appendChild(div);
  });

  cartTotal.textContent = formatRupiah(total);
}

// Simpan transaksi ke Google Sheets
document.getElementById("saveButton").addEventListener("click", async () => {
  const total = parseInt(cart.reduce((sum, item) => sum + item.harga * item.qty, 0));

  if (total <= 0) {
    alert("Keranjang masih kosong!");
    return;
  }

  const today = new Date();
  const tanggal = today.toLocaleDateString("id-ID");
  const baseUrl = "https://script.google.com/macros/s/AKfycbz21TyyJOPAvoAB3bi4mv9QIPuK9S3AddK7LJW4dhwuP18hPKyuK9cqbnjzdTTLNLBO0A/exec";

  try {
    const res = await fetch(`${baseUrl}?action=tambahPemasukan&tanggal=${encodeURIComponent(tanggal)}&jumlah=${total}`);
    const data = await res.json();

    if (data.success) {
      showNotif();
      cart = [];
      renderCart();
    } else {
      alert("Gagal menyimpan: " + data.message);
    }
  } catch (err) {
    alert("Error koneksi: " + err.message);
  }
});

// Notifikasi berhasil
function showNotif() {
  const box = document.getElementById("notifBox");
  box.style.display = "block";

  setTimeout(() => {
    box.style.display = "none";
  }, 2000);
}

// Pencarian produk
document.getElementById("searchBox").addEventListener("input", function () {
  const filter = this.value.toLowerCase();
  const items = document.querySelectorAll("#produkList .item");

  items.forEach(item => {
    const nama = item.querySelector("h4").textContent.toLowerCase();
    item.style.display = nama.includes(filter) ? "block" : "none";
  });
});

loadProduk();
