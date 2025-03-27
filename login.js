async function login() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const messageBox = document.getElementById("login-message");

    if (!username || !password) {
        messageBox.textContent = "Please fill in both fields.";
        messageBox.style.color = "red";
        return;
    }

    try {
        // 🔹 Fetch users.json from GitHub
        const response = await fetch("https://jkelley86.github.io/DoItAllBears/users.json", {
            headers: { "Cache-Control": "no-cache" } // Prevents fetching outdated versions
        });

        if (!response.ok) throw new Error("Failed to fetch user data.");
        const data = await response.json();

        // 🔹 Find user and check if password matches
        const user = data.users.find(user => user.username === username && user.password === password);

        if (user) {
            messageBox.textContent = "Login successful!";
            messageBox.style.color = "green";

            // 🔹 Store the logged-in user in localStorage
            localStorage.setItem("loggedInUser", username);

            // 🔹 Close popup & sidebar after 1 second
            setTimeout(() => {
                closeLoginPopup();
                closeSidebar(); // Ensures sidebar closes
            }, 1000);
        } else {
            messageBox.textContent = "Invalid username or password.";
            messageBox.style.color = "red";
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
        messageBox.textContent = "Error logging in. Try again.";
        messageBox.style.color = "red";
    }
}

function openLoginPopup() {
    document.getElementById("loginPopup").style.display = "flex";
}

function closeLoginPopup() {
    document.getElementById("loginPopup").style.display = "none";
}

function closeSidebar() {
    document.getElementById("sidebar").classList.remove("open"); // 🔹 Close sidebar
}

// Auto-close login popup if user is already logged in
window.onload = function () {
    const loggedInUser = localStorage.getItem("loggedInUser");
    if (loggedInUser) {
        document.getElementById("loginPopup").style.display = "none";
    }
};
