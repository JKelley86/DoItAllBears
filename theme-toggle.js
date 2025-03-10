    // Function to toggle the theme
    function toggleTheme() {
        // Toggle the 'light-mode' class on the body
        document.body.classList.toggle('light-mode');

        // Save the theme to localStorage
        localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
    }

    // Check localStorage for the theme preference on page load
    window.onload = function() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            document.body.classList.add('light-mode');
        } else if (savedTheme === 'dark') {
            document.body.classList.remove('light-mode');
        }
    }
