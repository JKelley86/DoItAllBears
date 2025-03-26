const API_URL = "https://script.google.com/macros/s/AKfycbxtr9HojPf8eKF6TTPQU0vqEhvV-262Su8BWbDj_38q6-faVZ-iRoheW6v00euOEwNB/exec";  // Replace with your actual Google Apps Script URL

async function signup() {
    let username = document.getElementById("signup-username").value;
    let password = document.getElementById("signup-password").value;

    let response = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ action: "signup", username, password }),
        headers: { "Content-Type": "application/json" }
    });

    let result = await response.json();
    document.getElementById("message").innerText = result.message;
}

async function login() {
    let username = document.getElementById("login-username").value;
    let password = document.getElementById("login-password").value;

    let response = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ action: "login", username, password }),
        headers: { "Content-Type": "application/json" }
    });

    let result = await response.json();
    document.getElementById("message").innerText = result.message;

    if (result.success) {
        alert("Login successful!"); 
        // Redirect or show logged-in page
    }
}
