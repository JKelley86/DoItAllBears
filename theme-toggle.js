// Get the theme toggle button and body element
const themeToggleButton = document.getElementById('theme-toggle');
const body = document.body;

// Check if a theme is already stored in localStorage
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    body.classList.add('dark-theme');
} else {
    body.classList.remove('dark-theme');
}

// Add an event listener for the theme toggle button
themeToggleButton.addEventListener('click', () => {
    // Toggle the theme on the body element
    body.classList.toggle('dark-theme');

    // Save the user's theme preference in localStorage
    if (body.classList.contains('dark-theme')) {
        localStorage.setItem('theme', 'dark');
    } else {
        localStorage.setItem('theme', 'light');
    }
});
