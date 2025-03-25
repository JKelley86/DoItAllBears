const API_KEY = "f33dc1a81c030c80b177fde30a5a23d0";
const API_URL = "https://api.themoviedb.org/3/tv";
const IMAGE_URL = "https://image.tmdb.org/t/p/w500";

// Get TV show ID from URL
const urlParams = new URLSearchParams(window.location.search);
const tvId = urlParams.get("id");

async function fetchTvDetails() {
    const response = await fetch(`${API_URL}/${tvId}?api_key=${API_KEY}&language=en-US&append_to_response=credits`);
    const data = await response.json();

    document.getElementById("tv-title").innerText = data.name;
    document.getElementById("tv-poster").src = IMAGE_URL + data.poster_path;
    document.getElementById("tv-overview").innerText = data.overview;
    document.getElementById("tv-rating").innerText = data.vote_average;
    document.getElementById("tv-seasons").innerText = data.number_of_seasons;
    document.getElementById("tv-episodes").innerText = data.number_of_episodes;

    // Set rating bar width
    const ratingBarFill = document.getElementById("rating-bar-fill");
    ratingBarFill.style.width = `${data.vote_average * 10}%`;

    // Genres
    document.getElementById("tv-genres").innerText = data.genres.map(genre => genre.name).join(", ");

    // Creator (Filter crew members)
    const creator = data.created_by.map(person => person.name).join(", ");
    document.getElementById("tv-creator").innerText = creator ? creator : "Unknown";

    // Cast
    const castContainer = document.getElementById("tv-cast");
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

// Fetch TV show details on page load
fetchTvDetails();
