// Converts all tsps, tbsps, and cups to tsps for easier calculation
function toTsp(amount, unit) {
    const conversion = {
        'tsp': 1,
        'tbsp': 3,
        'cup': 48
    };

    return amount * (conversion[unit]);
}

// Evaluates a fractional string like "1/2" or "3/4" to a decimal number
function evalFraction(fraction) {
    if (!fraction.includes('/')) {
        return parseFloat(fraction);
    }
    fraction = fraction.split('/');
    return parseFloat(fraction[0]) / parseFloat(fraction[1]);
}

// Simplifies a list of ingredients by summing amounts and converting units
function simplifyList(ingredient, amount, unit) {
    // Stores simplified ingredients
    const newList = new Map();

    // Process each ingredient
    for (let i = 0; i < ingredient.length; i++) {
        let ing = ingredient[i].toLowerCase();
        let amt = amount[i];
        let unt = unit[i];
        // Parse fractional amounts
        if (typeof amt === 'string') {
            if (amt.includes(' ')) {
                const parts = amt.split(' ');
                amt = parseInt(parts[0]) + evalFraction(parts[1]);
            } else {
                amt = evalFraction(amt);
            }
        }
        // Convert all to tsp
        amt = toTsp(amt, unt);
        // Sum amounts
        if (newList.has(ing)) {
            const oldAmt = newList.get(ing);
            newList.set(ing, oldAmt + amt);
        } else {
            newList.set(ing, amt);
        }
    }
    // Convert back to appropriate units
    const result = [];
    for (const [ing, totalAmt] of newList.entries()) {
        if (totalAmt >= 48) {
            result.push({ ingredient: ing, amount: Math.round(totalAmt / 48 * 10) / 10, unit: 'cup'});
        } else if (totalAmt >= 3) {
            result.push({ ingredient: ing, amount: Math.round(totalAmt / 3 * 10) / 10, unit: 'tbsp'});
        } else {
            result.push({ ingredient: ing, amount: Math.round(totalAmt * 10) / 10, unit: 'tsp'});
        }
    }
    return result;
}

module.exports = simplifyList;