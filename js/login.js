import { 
  signInWithEmailAndPassword, 
  signInWithPopup 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  doc, 
  setDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const msg = document.getElementById("loginMessage");
  const localBtn = document.getElementById("btnLocalSignIn");
  const googleBtn = document.getElementById("btnGoogleSignIn");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  const showStatus = (text, isSuccess = false) => {
    if (!msg) return;
    msg.classList.remove("warning", "success", "hidden");
    msg.classList.add(isSuccess ? "success" : "warning");
    msg.textContent = text;
  };

  // Helper function to create or update user profile record in Firestore
  async function saveUserToDatabase(user) {
    if (!window.db) {
      console.error("Firestore instance (window.db) is not initialized.");
      return;
    }

    const userRef = doc(window.db, "users", user.uid);
    await setDoc(
      userRef,
      {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
        lastLogin: serverTimestamp(),
      },
      { merge: true } // Preserves existing fields when logging in again
    );
  }

  // 1. Email/Password Authentication
  const handleLocalSignIn = async () => {
    const email = emailInput?.value.trim();
    const password = passwordInput?.value.trim();

    if (!email || !password) {
      showStatus("Please fill in both email and password.");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(window.auth, email, password);
      await saveUserToDatabase(userCredential.user);

      showStatus("Log in successful! Redirecting...", true);
      setTimeout(() => {
        window.location.href = "../User/user-home.html";
      }, 1000);
    } catch (error) {
      showStatus(`Login failed: ${error.message}`);
    }
  };

  localBtn?.addEventListener("click", handleLocalSignIn);

  // 2. Google OAuth Provider Authentication
  googleBtn?.addEventListener("click", async () => {
    try {
      const result = await signInWithPopup(window.auth, window.googleProvider);
      await saveUserToDatabase(result.user);

      showStatus("Google login successful! Redirecting...", true);
      setTimeout(() => {
        window.location.href = "../User/user-home.html";
      }, 1000);
    } catch (error) {
      showStatus(`Google login failed: ${error.message}`);
    }
  });
});