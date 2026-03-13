const content = `<p>When discussing Canadian culinary institutions, few items ignite as much passionate debate as the humble butter tart. This unassuming pastry, consisting of a flaky crust filled with a buttery, sugary, syrupy mixture, is a staple of bakeries and grandmothers' kitchens from coast to coast.</p><br><h3>The Great Raisin Debate</h3><p>The first dividing line in the butter tart landscape is the inclusion of raisins. Traditionalists argue that a true butter tart must contain raisins to add texture and cut the intense sweetness of the filling. Purists, however, insist that raisins are a distraction from the main event: the gooey, caramelized filling.</p><br><p>In our test kitchen, we found that both camps have valid points. A well-made tart with plumped raisins offers a delightful contrast, while a plain tart allows the pure essence of butter and brown sugar to shine.</p><p>We also love maple syrup and syrup.</p>`;

const keywords = [
    "maple syrup", "syrup", "butter tart", "baking sheet", "whisk", 
    "mixing bowl", "dutch oven", "cast iron", "vanilla extract",
    "whiskey", "dijon mustard", "measuring cups"
];

let htmlContent = content;
const seen = new Set();
const affiliateTag = "maplethyme-20";

// Sort keywords by length descending so "maple syrup" evaluates before "syrup"
const sortedKeywords = keywords.slice().sort((a, b) => b.length - a.length);

// Escape keywords for regex and join
const escapedKeywords = sortedKeywords.map(kw => kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
// Match HTML tags OR word-bounded keywords.
const pattern = new RegExp(`(<[^>]+>)|\\b(${escapedKeywords.join("|")})\\b`, 'gi');

console.log("Regex pattern:", pattern);

htmlContent = htmlContent.replace(pattern, (match, tag, keywordGroup) => {
    // If we matched an HTML tag, leave it completely untouched
    if (tag) return tag;
    
    // Track seen keywords (case-insensitive) to only link the first occurrence
    const lowerKw = keywordGroup.toLowerCase();
    if (seen.has(lowerKw)) return keywordGroup;
    seen.add(lowerKw);
    
    const affiliateUrl = `https://www.amazon.ca/s?k=${encodeURIComponent(lowerKw)}&tag=${affiliateTag}`;
    return `<a href="${affiliateUrl}" target="_blank" rel="noopener sponsored" class="affiliate-link">${keywordGroup}</a>`;
});

console.log("\n--- RESULT ---");
console.log(htmlContent);
