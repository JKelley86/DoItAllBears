async function signup(username, password) {
    try {
        const response = await fetch("https://script.google.com/macros/s/AKfycbxn5PpI1xuOjDHbZy3z_JUJtSs384KhplxAqKkpoVKkicEo5CHY5a5E-83WYUuPsCFU/exec", {
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

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error("Error:", error);
    }
}
