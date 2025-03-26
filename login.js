async function signup(username, password) {
    try {
        const response = await fetch("https://script.google.com/macros/s/AKfycbxtr9HojPf8eKF6TTPQU0vqEhvV-262Su8BWbDj_38q6-faVZ-iRoheW6v00euOEwNB/exec", {
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
