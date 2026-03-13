document.addEventListener('DOMContentLoaded', () => {
    // --- PIPEDA Cookie Consent Logic ---
    const cookieBanner = document.getElementById('cookie-banner');
    const acceptBtn = document.getElementById('accept-cookies');
    const declineBtn = document.getElementById('decline-cookies');

    // Check localStorage for consent
    if (!localStorage.getItem('pipeda_consent')) {
        cookieBanner.classList.remove('hidden');
    }

    acceptBtn.addEventListener('click', () => {
        localStorage.setItem('pipeda_consent', 'accepted');
        cookieBanner.style.transform = 'translateY(150%)';
        setTimeout(() => cookieBanner.classList.add('hidden'), 500);
    });

    declineBtn.addEventListener('click', () => {
        localStorage.setItem('pipeda_consent', 'declined');
        cookieBanner.style.transform = 'translateY(150%)';
        setTimeout(() => cookieBanner.classList.add('hidden'), 500);
    });

    // --- CASL Newsletter Form Submission ---
    const newsletterForm = document.getElementById('newsletter-form');
    const formMsg = document.getElementById('form-msg');

    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const consentCheckbox = document.getElementById('casl-consent');
        
        if (!consentCheckbox.checked) {
            formMsg.textContent = "You must explicitly consent to receive emails under CASL regulations.";
            formMsg.style.color = "var(--color-primary)";
            formMsg.classList.remove('hidden');
            return;
        }

        // Simulate API call
        const submitBtn = newsletterForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Subscribing...';
        submitBtn.disabled = true;

        setTimeout(() => {
            formMsg.textContent = "Successfully subscribed! You can opt-out at any time.";
            formMsg.style.color = "var(--color-pine)";
            formMsg.classList.remove('hidden');
            newsletterForm.reset();
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, 1200);
    });

    // --- Automated Recipe Fetching (TheMealDB) ---
    const API_FILTER_CANADIAN = 'https://www.themealdb.com/api/json/v1/1/filter.php?a=Canadian';
    const API_LOOKUP = 'https://www.themealdb.com/api/json/v1/1/lookup.php?i=';

    const heroTitle = document.getElementById('hero-title');
    const heroDesc = document.getElementById('hero-desc');
    const heroBg = document.getElementById('hero-bg');
    
    const recipeImg = document.getElementById('recipe-img');
    const recipeName = document.getElementById('recipe-name');
    const ingredientsList = document.getElementById('ingredients-list');
    const instructionsText = document.getElementById('instructions-text');
    const refreshBtn = document.getElementById('refresh-recipe');

    let canadianMealsCache = [];

    async function loadRecipe() {
        try {
            // Remove skeleton loading soon, add it first
            addSkeletons();

            // Fetch list of Canadian meals if cache is empty
            if (canadianMealsCache.length === 0) {
                const res = await fetch(API_FILTER_CANADIAN);
                const data = await res.json();
                canadianMealsCache = data.meals;
            }

            // Pick a random Canadian meal from the filtered list
            const randomMeal = canadianMealsCache[Math.floor(Math.random() * canadianMealsCache.length)];
            
            // Fetch full details of the random meal
            const detailRes = await fetch(`${API_LOOKUP}${randomMeal.idMeal}`);
            const detailData = await detailRes.json();
            const meal = detailData.meals[0];

            populateRecipe(meal);
        } catch (error) {
            console.error("Error fetching recipe:", error);
            heroTitle.textContent = "Unable to load today's recipe.";
            heroTitle.classList.remove('skeleton-text');
        }
    }

    function addSkeletons() {
        heroTitle.classList.add('skeleton-text');
        heroDesc.classList.add('skeleton-text');
        recipeName.classList.add('skeleton-text');
        recipeImg.classList.add('skeleton');
        heroTitle.textContent = 'Loading deliciousness...';
        heroDesc.textContent = '';
        recipeName.textContent = 'Recipe Name';
    }

    function populateRecipe(meal) {
        // Remove Skeletons
        heroTitle.classList.remove('skeleton-text');
        heroDesc.classList.remove('skeleton-text');
        recipeName.classList.remove('skeleton-text');
        recipeImg.classList.remove('skeleton');

        // Populate Header Data
        const title = meal.strMeal;
        heroTitle.textContent = title;
        recipeName.textContent = title;
        
        let tags = meal.strTags ? meal.strTags.split(',').join(' • ') : 'Authentic Cuisine';
        heroDesc.textContent = `Explore this classic Canadian dish. ${tags}`;

        // Populate Images
        heroBg.style.backgroundImage = `url('${meal.strMealThumb}')`;
        recipeImg.src = meal.strMealThumb;
        recipeImg.alt = `Photo of ${title}`; // Accessibility requirement

        // Populate Ingredients
        ingredientsList.innerHTML = '';
        for (let i = 1; i <= 20; i++) {
            const ingredient = meal[`strIngredient${i}`];
            const measure = meal[`strMeasure${i}`];
            
            if (ingredient && ingredient.trim() !== "") {
                const li = document.createElement('li');
                li.textContent = `${measure.trim()} ${ingredient.charAt(0).toUpperCase() + ingredient.slice(1)}`;
                ingredientsList.appendChild(li);
            }
        }

        // Formatted Instructions (Split by period or newline for better readability)
        const instructions = meal.strInstructions.split(/\r?\n/).filter(step => step.trim() !== "");
        instructionsText.innerHTML = '';
        instructions.forEach(step => {
            const p = document.createElement('p');
            p.textContent = step;
            p.style.marginBottom = "1rem";
            instructionsText.appendChild(p);
        });
    }

    // Refresh rotation
    refreshBtn.addEventListener('click', () => {
        document.getElementById('recipe-details').scrollIntoView({behavior: 'smooth'});
        loadRecipe();
    });

    // Initial Load
    loadRecipe();

    // Setup sticky header effect
    const header = document.querySelector('.main-header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.background = 'rgba(253, 251, 247, 0.95)';
            header.style.boxShadow = 'var(--shadow-sm)';
        } else {
            header.style.background = 'rgba(253, 251, 247, 0.85)';
            header.style.boxShadow = 'none';
        }
    });
});
