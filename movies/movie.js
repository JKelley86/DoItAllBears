const API_KEY = "f33dc1a81c030c80b177fde30a5a23d0";
const API_URL = "https://api.themoviedb.org/3/movie";
const IMAGE_URL = "https://image.tmdb.org/t/p/w500";

// Get movie ID from URL
const urlParams = new URLSearchParams(window.location.search);
const movieId = urlParams.get("id");

async function fetchMovieDetails() {
    const response = await fetch(`${API_URL}/${movieId}?api_key=${API_KEY}&language=en-US&append_to_response=credits`);
    const data = await response.json();

    document.getElementById("movie-title").innerText = data.title;
    document.getElementById("movie-poster").src = IMAGE_URL + data.poster_path;
    document.getElementById("movie-overview").innerText = data.overview;
    document.getElementById("movie-rating").innerText = data.vote_average;
    document.getElementById("movie-runtime").innerText = data.runtime;
    document.getElementById("movie-budget").innerText = data.budget.toLocaleString();
    document.getElementById("movie-revenue").innerText = data.revenue.toLocaleString();

    // Set rating bar width
    const ratingBarFill = document.getElementById("rating-bar-fill");
    ratingBarFill.style.width = `${data.vote_average * 10}%`;

    // Genres
    document.getElementById("movie-genres").innerText = data.genres.map(genre => genre.name).join(", ");

    // Director (Filter crew members)
    const director = data.credits.crew.find(person => person.job === "Director");
    document.getElementById("movie-director").innerText = director ? director.name : "Unknown";

    // Cast
    const castContainer = document.getElementById("movie-cast");
    castContainer.innerHTML = ""; // Clear previous cast

    data.credits.cast.slice(0, 6).forEach(actor => { // Show top 6 actors
        const actorElement = document.createElement("div");
        actorElement.classList.add("actor");
        actorElement.innerHTML = `
            <img src="${actor.profile_path ? IMAGE_URL + actor.profile_path : 'https://via.placeholder.com/150'}" alt="${actor.name}">
            <p>${actor.name}</p>
            <span>as ${actor.character}</span>
        `;
        castContainer.appendChild(actorElement);
    });
}

// Fetch movie details on page load
fetchMovieDetails();

