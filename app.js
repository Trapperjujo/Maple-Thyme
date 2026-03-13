document.addEventListener('DOMContentLoaded', () => {
    // --- PIPEDA Cookie Consent Logic ---
    const cookieBanner = document.getElementById('cookie-banner');
    if (cookieBanner) {
        const acceptBtn = document.getElementById('accept-cookies');
        const declineBtn = document.getElementById('decline-cookies');

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
    }

    // --- CASL Newsletter Form Submission ---
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
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
    }

    // --- Automated Recipe Fetching & Routing ---
    const API_FILTER_CANADIAN = 'https://www.themealdb.com/api/json/v1/1/filter.php?a=Canadian';
    const API_LOOKUP = 'https://www.themealdb.com/api/json/v1/1/lookup.php?i=';

    const homeView = document.getElementById('home-view');
    const recipeView = document.getElementById('recipe-view');

    async function initRouter() {
        const urlParams = new URLSearchParams(window.location.search);
        const recipeId = urlParams.get('id');

        if (recipeId) {
            // Render Recipe Detail View
            if(homeView) homeView.classList.add('hidden');
            if(recipeView) recipeView.classList.remove('hidden');
            document.title = "Loading Recipe | Maple & Thyme";
            await loadRecipeDetail(recipeId);
        } else {
            // Render Home View
            if(homeView) homeView.classList.remove('hidden');
            if(recipeView) recipeView.classList.add('hidden');
            await loadHomepage();
        }
    }

    // 1. Homepage Rendering
    async function loadHomepage() {
        try {
            const res = await fetch(API_FILTER_CANADIAN);
            const data = await res.json();
            const meals = data.meals;

            if (!meals || meals.length === 0) return;

            // Pick a random meal for Hero
            const featuredIndex = Math.floor(Math.random() * meals.length);
            const featuredMeal = meals[featuredIndex];
            populateHero(featuredMeal);

            // Populate Grid with the remaining (or random assortment)
            const gridMeals = meals.filter((_, i) => i !== featuredIndex).slice(0, 9);
            populateGrid(gridMeals);

        } catch (error) {
            console.error("Error fetching homepage recipes:", error);
            const heroTitle = document.getElementById('hero-title');
            if(heroTitle) {
                heroTitle.textContent = "Culinary connection lost.";
                heroTitle.classList.remove('skeleton-text');
            }
        }
    }

    function populateHero(meal) {
        const title = document.getElementById('hero-title');
        const desc = document.getElementById('hero-desc');
        const bg = document.getElementById('hero-bg');
        const link = document.getElementById('hero-link');

        if(title) {
            title.textContent = meal.strMeal;
            title.classList.remove('skeleton-text');
        }
        if(desc) {
            desc.textContent = "Dive into our hand-picked national favorite. An authentic taste of Canada.";
            desc.classList.remove('skeleton-text', 'skeleton-desc');
        }
        if(bg) bg.style.backgroundImage = `url('${meal.strMealThumb}')`;
        if(link) link.href = `?id=${meal.idMeal}`;
    }

    function populateGrid(meals) {
        const grid = document.getElementById('recipe-grid');
        if(!grid) return;
        
        grid.innerHTML = ''; // Clear skeletons
        
        meals.forEach(meal => {
            const card = document.createElement('article');
            card.className = 'recipe-card';
            card.innerHTML = `
                <a href="?id=${meal.idMeal}" class="recipe-card-img-wrapper">
                    <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="recipe-card-img">
                </a>
                <div class="recipe-card-content">
                    <span class="recipe-card-tags">Authentic Canadian</span>
                    <h3 class="recipe-card-title">
                        <a href="?id=${meal.idMeal}">${meal.strMeal}</a>
                    </h3>
                    <a href="?id=${meal.idMeal}" class="recipe-card-btn">Make this Recipe</a>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    // 2. Single Recipe Rendering
    async function loadRecipeDetail(id) {
        try {
            const res = await fetch(`${API_LOOKUP}${id}`);
            const data = await res.json();
            const meal = data.meals[0];

            if(!meal) {
                document.getElementById('recipe-name').textContent = "Recipe Not Found";
                return;
            }

            // Populate Document
            document.title = `${meal.strMeal} | Maple & Thyme`;

            const nameEl = document.getElementById('recipe-name');
            const imgEl = document.getElementById('recipe-img');
            const ingList = document.getElementById('ingredients-list');
            const instText = document.getElementById('instructions-text');

            nameEl.textContent = meal.strMeal;
            nameEl.classList.remove('skeleton-text');
            
            imgEl.src = meal.strMealThumb;
            imgEl.alt = meal.strMeal;
            imgEl.classList.remove('skeleton');

            // Populate Ingredients
            ingList.innerHTML = '';
            for (let i = 1; i <= 20; i++) {
                const ingredient = meal[`strIngredient${i}`];
                const measure = meal[`strMeasure${i}`];
                
                if (ingredient && ingredient.trim() !== "") {
                    const li = document.createElement('li');
                    li.textContent = `${measure.trim()} ${ingredient.charAt(0).toUpperCase() + ingredient.slice(1)}`;
                    ingList.appendChild(li);
                }
            }

            // Formatted Instructions 
            const instructions = meal.strInstructions.split(/\r?\n/).filter(step => step.trim() !== "");
            instText.innerHTML = '';
            instructions.forEach(step => {
                const p = document.createElement('p');
                p.textContent = step;
                p.style.marginBottom = "1rem";
                instText.appendChild(p);
            });

        } catch (error) {
            console.error("Error fetching recipe details:", error);
            const nameEl = document.getElementById('recipe-name');
            if(nameEl) {
                nameEl.textContent = "Error loading recipe.";
                nameEl.classList.remove('skeleton-text');
            }
        }
    }

    // Setup sticky header effect
    const header = document.querySelector('.main-header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.style.background = 'rgba(253, 251, 247, 0.95)';
                header.style.boxShadow = 'var(--shadow-sm)';
            } else {
                header.style.background = 'rgba(253, 251, 247, 0.85)';
                header.style.boxShadow = 'none';
            }
        });
    }

    // Boot router
    initRouter();
});
