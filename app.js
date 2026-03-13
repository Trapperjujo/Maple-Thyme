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

    // Note: The CASL Newsletter Form is now handled 100% natively by HTML5 and Formspree 
    // to prevent any Javascript event propagation conflicts. (See index.html)

    // --- Automated Recipe Fetching & Routing ---
    const API_ENDPOINTS = [
        'https://www.themealdb.com/api/json/v1/1/filter.php?a=Canadian',
        'https://www.themealdb.com/api/json/v1/1/filter.php?a=American',
        'https://www.themealdb.com/api/json/v1/1/filter.php?a=British',
        'https://www.themealdb.com/api/json/v1/1/filter.php?a=French'
    ];
    const LOCAL_DB = 'data/recipes.json';
    const API_LOOKUP = 'https://www.themealdb.com/api/json/v1/1/lookup.php?i=';

    const homeView = document.getElementById('home-view');
    const recipeView = document.getElementById('recipe-view');

    // Global store for instantaneous searching and filtering
    let globalMealCatalog = [];
    let currentFilteredMeals = [];

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
            
            // Reset tags for homepage
            document.title = "Maple & Thyme | Authentic Canadian Recipes";
            
            const metaDescription = "Discover automated, delicious Canadian recipes. Fully compliant with PIPEDA, CASL, and Health Canada guidelines.";
            let descTag = document.querySelector('meta[name="description"]');
            if(descTag) descTag.setAttribute("content", metaDescription);

            let canonicalTag = document.getElementById('canonical-url');
            if(canonicalTag) canonicalTag.setAttribute("href", "https://mapleandthyme.ca/");

            let ogTitle = document.querySelector('meta[property="og:title"]');
            if(ogTitle) ogTitle.setAttribute("content", "Maple & Thyme | Authentic Canadian Recipes");

            let ogDesc = document.querySelector('meta[property="og:description"]');
            if(ogDesc) ogDesc.setAttribute("content", metaDescription);

            let ogUrl = document.querySelector('meta[property="og:url"]');
            if(ogUrl) ogUrl.setAttribute("content", "https://mapleandthyme.ca/");

            let ogImage = document.querySelector('meta[property="og:image"]');
            if(ogImage) ogImage.setAttribute("content", "https://images.unsplash.com/photo-1549488344-c689fccc09ee?q=80&w=2070&auto=format&fit=crop");
            
            let schemaTag = document.getElementById('structured-data-dynamic');
            if(schemaTag) schemaTag.textContent = "";

            await loadHomepage();
        }
    }

    // 1. Homepage Rendering
    async function loadHomepage() {
        try {
            // Concurrent fetching for high-speed aggregation
            const fetchPromises = API_ENDPOINTS.map(url => fetch(url).then(res => res.json()).catch(() => ({ meals: [] })));
            // Append the local premium DB to the fetch pool
            fetchPromises.push(fetch(LOCAL_DB).then(res => res.json()).catch(() => ({ meals: [] })));

            const results = await Promise.all(fetchPromises);
            
            // Merge all parsed meals into a single massive array
            let allMeals = [];
            results.forEach(data => {
                if (data && data.meals) {
                    allMeals = allMeals.concat(data.meals);
                }
            });

            if (allMeals.length === 0) return;

            // Store globally for Search/Filter
            globalMealCatalog = allMeals;

            // --- Deterministic Daily Rotator (Date-Seeded PRNG) ---
            // Generates a seed based strictly on the calendar day to ensure it rotates exactly at midnight
            const today = new Date();
            const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
            
            // Simple PRNG function mapping seed to deterministic pseudo-random float
            function seededRandom(seed) {
                let x = Math.sin(seed++) * 10000;
                return x - Math.floor(x);
            }

            // Shuffle the complete meal array deterministically
            let currentSeed = dateSeed;
            let shuffledMeals = [...allMeals];
            for (let i = shuffledMeals.length - 1; i > 0; i--) {
                const j = Math.floor(seededRandom(currentSeed++) * (i + 1));
                [shuffledMeals[i], shuffledMeals[j]] = [shuffledMeals[j], shuffledMeals[i]];
            }

            // The Hero is always the first item generated by today's mathematical seed
            const featuredMeal = shuffledMeals[0];
            populateHero(featuredMeal);

            // Populate Grid with the subsequent items
            currentFilteredMeals = shuffledMeals.slice(1);
            // Only show up to 30 items initially to prevent DOM overload
            populateGrid(currentFilteredMeals.slice(0, 30));

            // Attach Search and Filter Event Listeners
            initSearchAndFilter();

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
        
        let counter = 0;
        meals.forEach(meal => {
            // Inject a native ad card every 4 items
            if (counter > 0 && counter % 4 === 0) {
                const adCard = document.createElement('div');
                adCard.className = 'ad-container ad-infeed';
                adCard.innerHTML = `
                    <span class="ad-label">Advertisement</span>
                    <div class="ad-placeholder" style="width: 100%; height: 250px;">
                        <!-- Google AdSense In-Feed Native Ad Goes Here -->
                        [ Native Ad Placeholder ]
                    </div>
                `;
                grid.appendChild(adCard);
            }

            const card = document.createElement('article');
            card.className = 'recipe-card';
            card.innerHTML = `
                <a href="?id=${meal.idMeal}" class="recipe-card-img-wrapper">
                    <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="recipe-card-img">
                </a>
                <div class="recipe-card-content">
                    <span class="recipe-card-tags">Rustic Classics</span>
                    <h3 class="recipe-card-title">
                        <a href="?id=${meal.idMeal}">${meal.strMeal}</a>
                    </h3>
                    <a href="?id=${meal.idMeal}" class="recipe-card-btn">Make this Recipe</a>
                </div>
            `;
            grid.appendChild(card);
            counter++;
        });
    }

    // --- Search & Filter Logic ---
    function initSearchAndFilter() {
        const searchInput = document.getElementById('recipe-search');
        const categorySelect = document.getElementById('recipe-category');

        if (!searchInput || !categorySelect) return;

        function applyFilters() {
            const searchTerm = searchInput.value.toLowerCase().trim();
            const categoryValue = categorySelect.value; // E.g., 'All', 'Canadian', 'Dessert'

            const results = currentFilteredMeals.filter(meal => {
                // 1. Text Search (Matches Recipe Title)
                const matchesSearch = meal.strMeal.toLowerCase().includes(searchTerm);

                // 2. Category Filter
                let matchesCategory = true;
                if (categoryValue !== 'All') {
                    if (categoryValue === 'Canadian') {
                        matchesCategory = (meal.strArea === 'Canadian');
                    } else if (categoryValue === 'Sandwich') {
                        matchesCategory = (meal.strTags && meal.strTags.includes('Sandwich'));
                    } else {
                        // Matches exact category like Dessert, Beef, Seafood
                        matchesCategory = (meal.strCategory === categoryValue);
                    }
                }

                return matchesSearch && matchesCategory;
            });

            // Re-render the grid with the filtered results (limit to 30 for performance)
            populateGrid(results.slice(0, 30));
            
            // Show a "no results" message if empty
            if (results.length === 0) {
                const grid = document.getElementById('recipe-grid');
                grid.innerHTML = '<p class="error-msg" style="grid-column: 1/-1; text-align: center; color: var(--color-text-light);">No recipes found matching your criteria. Try adjusting your search.</p>';
            }
        }

        searchInput.addEventListener('input', applyFilters);
        categorySelect.addEventListener('change', applyFilters);
    }

    // 2. Single Recipe Rendering
    async function loadRecipeDetail(id) {
        try {
            let meal = null;
            
            // Intercept custom local JSON recipes (ID series starts with '900')
            if (id.toString().startsWith('900')) {
                const res = await fetch(LOCAL_DB);
                const data = await res.json();
                meal = data.meals.find(m => m.idMeal === id);
            } else {
                // Otherwise fallback to global API lookup
                const res = await fetch(`${API_LOOKUP}${id}`);
                const data = await res.json();
                meal = data.meals ? data.meals[0] : null;
            }

            if(!meal) {
                document.getElementById('recipe-name').textContent = "Recipe Not Found";
                return;
            }

            // Populate Document
            document.title = `${meal.strMeal} | Maple & Thyme`;

            // --- Dynamic SEO Meta Tags Update ---
            const canonicalUrl = `https://mapleandthyme.ca/?id=${meal.idMeal}`;
            const metaDescription = `Learn how to make authentic Canadian ${meal.strMeal}. Get the full recipe, ingredients, and step-by-step instructions.`;
            
            // Update Base Meta
            let descTag = document.querySelector('meta[name="description"]');
            if(descTag) descTag.setAttribute("content", metaDescription);

            // Update Canonical
            let canonicalTag = document.getElementById('canonical-url');
            if(canonicalTag) canonicalTag.setAttribute("href", canonicalUrl);

            // Update Open Graph Tags
            let ogTitle = document.querySelector('meta[property="og:title"]');
            if(ogTitle) ogTitle.setAttribute("content", `${meal.strMeal} | Maple & Thyme`);
            
            let ogDesc = document.querySelector('meta[property="og:description"]');
            if(ogDesc) ogDesc.setAttribute("content", metaDescription);

            let ogUrl = document.querySelector('meta[property="og:url"]');
            if(ogUrl) ogUrl.setAttribute("content", canonicalUrl);

            let ogImage = document.querySelector('meta[property="og:image"]');
            if(ogImage) {
                ogImage.setAttribute("content", meal.strMealThumb);
            }

            // Update JSON-LD Schema (Recipe)
            let schemaTag = document.getElementById('structured-data-dynamic');
            if (schemaTag) {
                // Determine ingredients array
                let ingredients = [];
                for (let i = 1; i <= 20; i++) {
                    const ing = meal[`strIngredient${i}`];
                    const meas = meal[`strMeasure${i}`];
                    if (ing && ing.trim() !== "") {
                        ingredients.push(`${meas.trim()} ${ing.trim()}`);
                    }
                }
                
                // Format instructions
                let instructions = meal.strInstructions.split(/\r?\n/).filter(step => step.trim() !== "").map(step => {
                    return { "@type": "HowToStep", "text": step.replace(/^\d+\.\s*\**\w*\**\s*/, "") }; // Clean up numbering if present for schema
                });

                const recipeSchema = {
                    "@context": "https://schema.org/",
                    "@type": "Recipe",
                    "name": meal.strMeal,
                    "image": [ meal.strMealThumb ],
                    "author": {
                        "@type": "Organization",
                        "name": "Maple & Thyme"
                    },
                    "description": metaDescription,
                    "recipeIngredient": ingredients,
                    "recipeInstructions": instructions
                };
                schemaTag.textContent = JSON.stringify(recipeSchema, null, 2);
            }

            const nameEl = document.getElementById('recipe-name');
            const imgEl = document.getElementById('recipe-img');
            const ingList = document.getElementById('ingredients-list');
            const instText = document.getElementById('instructions-text');

            nameEl.textContent = meal.strMeal;
            nameEl.classList.remove('skeleton-text');
            
            imgEl.src = meal.strMealThumb;
            imgEl.alt = meal.strMeal;
            imgEl.classList.remove('skeleton');

            // Populate Ingredients (with Affiliate Marketing simulation)
            ingList.innerHTML = '';
            for (let i = 1; i <= 20; i++) {
                const ingredient = meal[`strIngredient${i}`];
                const measure = meal[`strMeasure${i}`];
                
                if (ingredient && ingredient.trim() !== "") {
                    const li = document.createElement('li');
                    const ingName = ingredient.charAt(0).toUpperCase() + ingredient.slice(1);
                    
                    // Inject Official Affiliate linking: Wrap ingredient in a tracked Amazon search
                    const affiliateLink = `https://www.amazon.ca/s?k=${encodeURIComponent(ingName)}&tag=maplethyme-20`;
                    
                    li.innerHTML = `${measure.trim()} <a href="${affiliateLink}" target="_blank" rel="noopener sponsored" class="affiliate-link">${ingName}</a>`;
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
