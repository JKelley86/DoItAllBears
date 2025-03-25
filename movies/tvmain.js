const API_KEY = "f33dc1a81c030c80b177fde30a5a23d0";
const TV_API_URL = `https://api.themoviedb.org/3/tv/on_the_air?api_key=${API_KEY}&language=en-US&page=1`;
const TV_SEARCH_URL = `https://api.themoviedb.org/3/search/tv?api_key=${API_KEY}&language=en-US&query=`;
const IMAGE_URL = "https://image.tmdb.org/t/p/w500";

const tvContainer = document.getElementById("movie-container"); // Renamed to tvContainer for clarity
const searchInput = document.getElementById("search-input");
const loadMoreButton = document.getElementById("load-more-button");

let currentPage = 1;
let currentQuery = "";

async function fetchTvShows(url) {
    console.log("Fetching TV shows from URL:", url); // Debug log
    const response = await fetch(url);
    const data = await response.json();
    
    data.results.forEach(tvShow => {
        const tvShowElement = document.createElement("div");
        tvShowElement.classList.add("movie"); // Keeping the class name for consistency
        tvShowElement.innerHTML = `
            <img src="${IMAGE_URL + tvShow.poster_path}" alt="${tvShow.name}">
        `;

        // Redirect to tv.html with TV show ID
        tvShowElement.addEventListener("click", () => {
            window.location.href = `tv.html?id=${tvShow.id}`;
        });

        tvContainer.appendChild(tvShowElement);
    });
}

// Fetch TV shows on load
fetchTvShows(TV_API_URL);

// Live search function
searchInput.addEventListener("input", () => {
    currentQuery = searchInput.value;
    tvContainer.innerHTML = ""; // Clear container
    currentPage = 1;
    if (currentQuery) {
        fetchTvShows(`${TV_SEARCH_URL}${currentQuery}&page=${currentPage}`);
    } else {
        fetchTvShows(TV_API_URL);
    }
});

// Load more function
loadMoreButton.addEventListener("click", () => {
    console.log("Load More button clicked"); // Debug log
    currentPage++;
    const url = currentQuery ? `${TV_SEARCH_URL}${currentQuery}&page=${currentPage}` : `${TV_API_URL}&page=${currentPage}`;
    fetchTvShows(url);
});

function navigateTo(page) {
    window.location.href = page;
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('open');
}

// Close sidebar if clicked outside of it
document.addEventListener('click', function(event) {
    const sidebar = document.getElementById('sidebar');
    const menuButton = document.querySelector('.menu-btn');
    if (!sidebar.contains(event.target) && !menuButton.contains(event.target)) {
        sidebar.classList.remove('open');
    }
});

function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    document.getElementById('clock').textContent = timeString;
}

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

fetch('navbar.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('main-container').innerHTML += data;
    });
fetch('sidebar.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('sidebar-nav').innerHTML = data;
    });

setInterval(updateClock, 1000);
updateClock();
