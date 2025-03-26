const API_URL = "https://script.google.com/macros/library/d/1M52NfXPWlEFMAILoCX1FCGnylKNEUcIt1qwZiJ12kOOXnzH9BFCQxqYJ/1";  // Replace with your actual Google Apps Script URL

async function signup(username, password) {
    const response = await fetch("YOUR_NEW_DEPLOYMENT_URL", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            action: "signup",
            username: username,
            password: password
        })
    });

    const data = await response.json();
    console.log(data);
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
