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

