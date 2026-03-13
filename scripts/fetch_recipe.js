const fs = require('fs');
const path = require('path');
const https = require('https');

// Paths to our local DB
const DB_PATH = path.join(__dirname, '..', 'data', 'recipes.json');

// Fetch a random meal from API
function fetchRandomMeal() {
    return new Promise((resolve, reject) => {
        https.get('https://www.themealdb.com/api/json/v1/1/random.php', (res) => {
            let data = '';

            // A chunk of data has been received.
            res.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received.
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(data);
                    if (parsedData.meals && parsedData.meals.length > 0) {
                        resolve(parsedData.meals[0]);
                    } else {
                        reject(new Error("No meals found in API response"));
                    }
                } catch (e) {
                    reject(e);
                }
            });

        }).on("error", (err) => {
            reject(err);
        });
    });
}

async function main() {
    try {
        console.log("Fetching new random recipe from API...");
        const newMeal = await fetchRandomMeal();
        
        console.log(`Fetched recipe: ${newMeal.strMeal}`);

        // Read our current local database
        let dbData = { meals: [] };
        if (fs.existsSync(DB_PATH)) {
            const rawData = fs.readFileSync(DB_PATH, 'utf8');
            dbData = JSON.parse(rawData);
        } else {
            console.error("Local database not found at:", DB_PATH);
            process.exit(1);
        }

        // Check if the recipe ID already exists in our database
        // The API returns strings for IDs, we check against our existing records
        const exists = dbData.meals.some(meal => meal.idMeal === newMeal.idMeal || meal.strMeal === newMeal.strMeal);
        
        if (exists) {
            console.log("Recipe already exists in database. Skipping addition.");
            return;
        }

        // Assign Custom Internal Premium ID (Start with 900)
        let maxId = 900000;
        dbData.meals.forEach(meal => {
            const idInt = parseInt(meal.idMeal);
            if (!isNaN(idInt) && idInt > maxId) {
                maxId = idInt;
            }
        });
        
        // Ensure new meal holds our custom premium ID format
        newMeal.idMeal = (maxId + 1).toString();

        // Add tags if missing to fit our app filter formatting
        if (!newMeal.strTags || newMeal.strTags === "") {
            newMeal.strTags = "Daily Drop";
        }

        // Append the newly fetched recipe
        dbData.meals.push(newMeal);

        // Write the updated array back to our JSON file
        fs.writeFileSync(DB_PATH, JSON.stringify(dbData, null, 2), 'utf8');
        console.log(`Successfully added '${newMeal.strMeal}' with internal ID ${newMeal.idMeal} to recipes.json`);

    } catch (error) {
        console.error("Failed to append daily post:", error);
        process.exit(1);
    }
}

main();
