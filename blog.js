document.addEventListener('DOMContentLoaded', () => {

    const DB_PATH = 'data/posts.json';
    const indexView = document.getElementById('blog-index-view');
    const singleView = document.getElementById('single-post-view');

    async function initBlogRouter() {
        const urlParams = new URLSearchParams(window.location.search);
        const postId = urlParams.get('post');

        try {
            const res = await fetch(DB_PATH);
            if (!res.ok) throw new Error("Could not fetch blog database");
            
            const data = await res.json();
            const posts = data.posts || [];

            if (postId) {
                // Find and render single post
                const post = posts.find(p => p.id === postId);
                if (post) {
                    renderSinglePost(post);
                } else {
                    renderError("Article not found.");
                }
            } else {
                // Render Index
                renderIndex(posts);
            }
        } catch (error) {
            console.error(error);
            renderError("Failed to connect to the editorial database.");
        }
    }

    function renderIndex(posts) {
        if (indexView) indexView.classList.remove('hidden');
        if (singleView) singleView.classList.add('hidden');
        document.title = "Blog | Maple & Thyme";

        const grid = document.getElementById('blog-grid');
        if (!grid) return;

        grid.innerHTML = ''; // clear skeletons

        if (posts.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No articles published yet. Check back soon!</p>';
            return;
        }

        posts.forEach(post => {
            const card = document.createElement('article');
            card.className = 'post-card';
            card.innerHTML = `
                <a href="?post=${post.id}">
                    <img src="${post.image}" alt="${post.title}" class="post-card-img">
                </a>
                <div class="post-card-content">
                    <span class="post-meta">${post.date} • By ${post.author}</span>
                    <h2 class="post-card-title">
                        <a href="?post=${post.id}">${post.title}</a>
                    </h2>
                    <p class="post-card-excerpt">${post.excerpt}</p>
                    <a href="?post=${post.id}" class="btn-secondary" style="align-self: flex-start; padding: 0.5rem 1rem; font-size: 0.9rem;">Read Article</a>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    function renderSinglePost(post) {
        if (indexView) indexView.classList.add('hidden');
        if (singleView) singleView.classList.remove('hidden');
        
        document.title = `${post.title} | Maple & Thyme`;

        // Hero
        const titleEl = document.getElementById('post-title');
        const metaEl = document.getElementById('post-meta');
        const imgEl = document.getElementById('post-hero-img');
        const bodyEl = document.getElementById('post-content-body');

        if(titleEl) {
            titleEl.textContent = post.title;
            titleEl.classList.remove('skeleton-text');
        }
        
        if(metaEl) {
            metaEl.textContent = `Published on ${post.date} by ${post.author}`;
            metaEl.classList.remove('skeleton-desc');
        }

        if(imgEl) {
            imgEl.src = post.image;
            imgEl.alt = post.title;
            imgEl.classList.remove('skeleton');
        }

        if(bodyEl) {
            // Setup Amazon Affiliate Auto-Linker
            const affiliateTag = "maplethyme-20";
            const keywords = [
                "maple syrup", "butter tart", "baking sheet", "whisk", 
                "mixing bowl", "dutch oven", "cast iron", "vanilla extract",
                "whiskey", "dijon mustard", "measuring cups"
            ];

            let htmlContent = post.content;

            // Iterate through our keyword dictionary and replace the first instance of each
            keywords.forEach(keyword => {
                // Regex to match the keyword cleanly (case-insensitive, whole word, not already in a link)
                // This prevents breaking existing HTML tags or linking inside an existing <a> tag.
                const regex = new RegExp(`(?<!<[^>]*)(\\b${keyword}\\b)(?![^<]*>)`, 'i');
                
                const affiliateUrl = `https://www.amazon.ca/s?k=${encodeURIComponent(keyword)}&tag=${affiliateTag}`;
                const replacement = `<a href="${affiliateUrl}" target="_blank" rel="noopener sponsored" class="affiliate-link">$&</a>`;
                
                htmlContent = htmlContent.replace(regex, replacement);
            });

            // Render auto-linked HTML
            bodyEl.innerHTML = htmlContent;
        }
    }

    function renderError(msg) {
        if (indexView) indexView.classList.remove('hidden');
        if (singleView) singleView.classList.add('hidden');
        const grid = document.getElementById('blog-grid');
        if(grid) grid.innerHTML = `<h2 style="grid-column: 1/-1; text-align: center; color: var(--color-primary);">${msg}</h2>`;
    }

    // Setup sticky header effect (reused from app.js)
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
    initBlogRouter();
});
