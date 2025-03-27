async function login() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const messageBox = document.getElementById("login-message");

    if (!username || !password) {
        messageBox.textContent = "Please fill in both fields.";
        messageBox.style.color = "red";
        return;
    }

    // Hash the password using MD5
    const hashedPassword = md5(password);

    try {
        // Fetch users.json from GitHub
        const response = await fetch("https://raw.githubusercontent.com/jkelley86/DoItAllBears/main/data/users.json");
        if (!response.ok) throw new Error("Failed to fetch user data.");

        const data = await response.json();
        const user = data.users.find(user => user.username === username && user.password === hashedPassword);

        if (user) {
            messageBox.textContent = "Login successful!";
            messageBox.style.color = "green";

            // Store the logged-in user in localStorage
            localStorage.setItem("loggedInUser", username);

            // Close login popup after 1 second
            setTimeout(() => {
                closeLoginPopup();
                closeSidebar();
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
    document.getElementById("sidebar").classList.remove("open");
}

// Auto-close login popup if user is already logged in
window.onload = function() {
    const loggedInUser = localStorage.getItem("loggedInUser");
    if (loggedInUser) {
        document.getElementById("loginPopup").style.display = "none";
    }
};
