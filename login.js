async function login() {
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    let response = await fetch("https://script.google.com/macros/s/AKfycbz5lrdm90lpXCRpx68jcwZJdUiYL8xx5JoN4lOGwf00eVn1TW1Ayc3SouO6zgjr84pe/exec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action: "login",
            username: username,
            password: password
        })
    });

    let result = await response.json();

    if (result.success) {
        alert("Login successful!");
        // Redirect to a new page or store session data
        window.location.href = "dashboard.html";  
    } else {
        alert("Invalid username or password.");
    }
}
