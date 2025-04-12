// Import Firebase v9+ modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

// Your Firebase config (tetap sama)
const firebaseConfig = {
  apiKey: "AIzaSyCjWoCpYuI_6FioPdzIns4m5MvqlHi_G8c",
  authDomain: "location-tracker-d5deb.firebaseapp.com",
  projectId: "location-tracker-d5deb",
  storageBucket: "location-tracker-d5deb.firebasestorage.app",
  messagingSenderId: "721420387193",
  appId: "1:721420387193:web:c039623b66fa6f0d0c25a8",
  measurementId: "G-WJNL7BP9G4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Dapatkan referensi ke elemen HTML
const generateButton = document.getElementById('generateButton');
const originalUrlInput = document.getElementById('originalUrl');
const linkContainer = document.getElementById('linkContainer');

// Tambahkan event listener ke tombol
generateButton.addEventListener('click', generateLink);

// Generate a unique link
async function generateLink() {
  const originalUrlValue = originalUrlInput.value;

  // Validasi sederhana: pastikan URL tidak kosong
  if (!originalUrlValue) {
    alert("Silakan masukkan URL asli terlebih dahulu.");
    return;
  }

  // Validasi URL (opsional tapi bagus)
  try {
    new URL(originalUrlValue); // Coba buat objek URL, error jika tidak valid
  } catch (_) {
    alert("Format URL tidak valid.");
    return;
  }

  const uniqueId = Math.random().toString(36).substring(2, 9); // Sedikit lebih panjang & buang '0.'
  const trackLink = `${window.location.origin}/track.html?id=${uniqueId}`;

  linkContainer.innerHTML = `
    <p>Share this trackable link:</p>
    <a href="${trackLink}" target="_blank">${trackLink}</a>
    <p>It will redirect to: ${originalUrlValue}</p>
  `;

  // Simpan link asli dan waktu pembuatan ke Firestore
  await saveLinkToDatabase(uniqueId, originalUrlValue);
}

// Save to Firestore (v9 syntax)
async function saveLinkToDatabase(uniqueId, originalUrl) {
  try {
    // Gunakan uniqueId sebagai ID dokumen di koleksi 'links'
    await setDoc(doc(db, "links", uniqueId), {
      originalUrl: originalUrl, // Simpan URL asli
      created: new Date().toISOString() // Simpan waktu pembuatan
    });
    console.log("Link data saved successfully for ID:", uniqueId);
  } catch (e) {
    console.error("Error saving link: ", e);
    linkContainer.innerHTML += `<p style="color:red;">Error saving link data to database.</p>`;
  }
}