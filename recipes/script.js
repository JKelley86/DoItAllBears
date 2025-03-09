        function shareRecipe() {
            const recipeTitle = document.querySelector("h1").textContent;
            const recipeURL = window.location.href;
            const shareText = `Check out this recipe: ${recipeTitle}\n${recipeURL}`;

            if (navigator.share) {
                navigator.share({
                    title: recipeTitle,
                    text: shareText,
                    url: recipeURL
                })
                .catch((error) => console.log("Error sharing: ", error));
            } else {
                alert("Sharing is not supported on this device.");
            }
        }
window.onload = function() {
    const modal = document.getElementById('nutrition-modal');
    modal.style.display = 'none'; // Ensure modal is hidden on page load
}

function toggleInfo() {
    const modal = document.getElementById('nutrition-modal');
    if (modal.style.display === 'none' || modal.style.display === '') {
        modal.style.display = 'flex';
    } else {
        modal.style.display = 'none';
    }
}
