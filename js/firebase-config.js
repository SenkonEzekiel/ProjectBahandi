(function () {
  // 1. Firebase Configuration
  window.BAHANDI_FIREBASE_CONFIG = {
    apiKey: "AIzaSyDcAjMKFAnNBiFfIhekOPtRadiCb0Ly8Ng",
    authDomain: "projectbahandi-7149a.firebaseapp.com",
    projectId: "projectbahandi-7149a",
    storageBucket: "projectbahandi-7149a.firebasestorage.app",
    messagingSenderId: "1017170558784",
    appId: "1:1017170558784:web:9b2e36846c3397849304a5",
    measurementId: "G-Z83QP9KVRZ"
  };

  // 2. Global DB Helper Function
  window.getBahandiFirestoreDb = function () {
    if (typeof firebase === "undefined" || !window.BAHANDI_FIREBASE_CONFIG) {
      console.error("Firebase SDK or config missing.");
      return null;
    }

    var cfg = window.BAHANDI_FIREBASE_CONFIG;

    if (!cfg.authDomain || cfg.authDomain.indexOf("firebaseapp.com") === -1) {
      cfg.authDomain = cfg.projectId + ".firebaseapp.com";
    }

    if (!firebase.apps.length) {
      firebase.initializeApp(cfg);
    }

    return firebase.firestore();
  };

  // 3. Auto-initialize on load if Firebase SDK is present
  if (typeof firebase !== "undefined") {
    var db = window.getBahandiFirestoreDb();
    if (db) {
      db.collection("cultural_sites")
        .get()
        .then(function (snapshot) {
          console.log("🔥 Total documents found in Firestore:", snapshot.size);
        })
        .catch(function (err) {
          console.error("❌ Firestore connection failed:", err);
        });
    }
  }
})();