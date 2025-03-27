async function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    // Hash the password
    const hashedPassword = md5(password);

    try {
        // Fetch users.json from GitHub
        const response = await fetch("https://raw.githubusercontent.com/jkelley86/DoItAllBears/main/data/users.json");
        const data = await response.json();

        // Check if the user exists
        const user = data.users.find(user => user.username === username && user.password === hashedPassword);

        if (user) {
            alert("Login successful!");
            closeLoginPopup();
            // You can store the login state in localStorage
            localStorage.setItem("loggedInUser", username);
        } else {
            alert("Invalid credentials!");
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
        alert("Error logging in. Please try again.");
    }
}

// Auto-close login if already logged in
window.onload = function() {
    if (localStorage.getItem("loggedInUser")) {
        document.getElementById("loginPopup").style.display = "none";
    }
};
