async function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    // Hash the input password (using MD5)
    const hashedPassword = md5(password);

    try {
        // Fetch users.json from GitHub
        const response = await fetch("https://raw.githubusercontent.com/jkelley86/DoItAllBears/main/data/users.json");
        const data = await response.json();

        // Check if the username & hashed password match
        const user = data.users.find(user => user.username === username && user.password === hashedPassword);

        if (user) {
            alert("Login successful!");
            // Redirect or perform actions after login
        } else {
            alert("Invalid credentials!");
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
        alert("Error logging in. Please try again.");
    }
}
