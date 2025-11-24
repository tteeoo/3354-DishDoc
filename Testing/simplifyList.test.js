const simplifyList = require('./simplifyList');

// Helper: compare results ignoring order, with 1-decimal tolerance for amounts
function compareResults(actual, expected) {
	const mapA = new Map();
	for (const it of actual) {
		mapA.set(it.ingredient, { amount: it.amount, unit: it.unit });
	}
	const mapE = new Map();
	for (const it of expected) {
		mapE.set(it.ingredient, { amount: it.amount, unit: it.unit });
	}
	expect(mapA.size).toBe(mapE.size);
	for (const [ing, exp] of mapE.entries()) {
		expect(mapA.has(ing)).toBe(true);
		const got = mapA.get(ing);
		expect(got.unit).toBe(exp.unit);
		// compare to 1 decimal place (matches implementation rounding)
		expect(Number(got.amount)).toBeCloseTo(Number(exp.amount), 1);
	}
}

describe('simplifyList — 20 varied cases', () => {
	test('1) single tsp stays tsp', () => {
		const res = simplifyList([{ingredient: 'salt', amount: 1, unit: 'tsp'}]);
		compareResults(res, [{ ingredient: 'salt', amount: 1.0, unit: 'tsp' }]);
	});

	test('2) sum to tbsp (4 tsp -> 1.3 tbsp)', () => {
		const res = simplifyList([{ingredient: 'sugar', amount: 1, unit: 'tsp'}, {ingredient: 'sugar', amount: 3, unit: 'tsp'}]);
		compareResults(res, [{ ingredient: 'sugar', amount: 1.3, unit: 'tbsp' }]);
	});

	test('3) cup + tbsp combine to cups and round (1 cup + 6 tbsp -> 1.4 cup)', () => {
		const res = simplifyList([{ingredient: 'flour', amount: 1, unit: 'cup'}, {ingredient: 'flour', amount: 6, unit: 'tbsp'}]);
		compareResults(res, [{ ingredient: 'flour', amount: 1.4, unit: 'cup' }]);
	});

	test('4) fractional cup strings (1 1/2 + 1/2 -> 2.0 cup)', () => {
		const res = simplifyList([{ingredient: 'milk', amount: '1 1/2', unit: 'cup'}, {ingredient: 'milk', amount: '1/2', unit: 'cup'}]);
		compareResults(res, [{ ingredient: 'milk', amount: 2.0, unit: 'cup' }]);
	});

	test('5) mixed tsp/tbsp below tbsp threshold -> tsp (2.5 tsp)', () => {
		const res = simplifyList([
			{ ingredient: 'pepper', amount: 1, unit: 'tsp' },
			{ ingredient: 'pepper', amount: '1/2', unit: 'tbsp' }
		]);
		compareResults(res, [{ ingredient: 'pepper', amount: 2.5, unit: 'tsp' }]);
	});

	test('6) multiple unique ingredients with mixed units', () => {
		const res = simplifyList([
			{ ingredient: 'salt', amount: 1, unit: 'tsp' },
			{ ingredient: 'pepper', amount: 2, unit: 'tbsp' },
			{ ingredient: 'oregano', amount: 3, unit: 'tsp' }
		]);
		compareResults(res, [
			{ ingredient: 'salt', amount: 1.0, unit: 'tsp' },
			{ ingredient: 'pepper', amount: 2.0, unit: 'tbsp' },
			{ ingredient: 'oregano', amount: 1.0, unit: 'tbsp' }
		]);
	});

	test('7) zero amounts produce zero tsp', () => {
		const res = simplifyList([
			{ ingredient: 'vanilla', amount: 0, unit: 'tsp' },
			{ ingredient: 'vanilla', amount: '0', unit: 'tsp' }
		]);
		compareResults(res, [{ ingredient: 'vanilla', amount: 0.0, unit: 'tsp' }]);
	});

	test('8) exact 1 cup when total = 48 tsp', () => {
		const res = simplifyList([
			{ ingredient: 'a', amount: 1, unit: 'cup' },
			{ ingredient: 'a', amount: 0, unit: 'tsp' }
		]);
		compareResults(res, [{ ingredient: 'a', amount: 1.0, unit: 'cup' }]);
	});

	test('9) three tsp -> exactly 1.0 tbsp', () => {
		const res = simplifyList([
			{ ingredient: 'ginger', amount: 1, unit: 'tsp' },
			{ ingredient: 'ginger', amount: 1, unit: 'tsp' },
			{ ingredient: 'ginger', amount: 1, unit: 'tsp' }
		]);
		compareResults(res, [{ ingredient: 'ginger', amount: 1.0, unit: 'tbsp' }]);
	});

	test('10) fractional tbsp sum to 1 tbsp', () => {
		const res = simplifyList([
			{ ingredient: 'honey', amount: '3/4', unit: 'tbsp' },
			{ ingredient: 'honey', amount: '1/4', unit: 'tbsp' }
		]);
		compareResults(res, [{ ingredient: 'honey', amount: 1.0, unit: 'tbsp' }]);
	});

	test('11) case-insensitive ingredient merging', () => {
		const res = simplifyList([
			{ ingredient: 'Sugar', amount: 1, unit: 'tsp' },
			{ ingredient: 'sugar', amount: 2, unit: 'tsp' },
			{ ingredient: 'SUGAR', amount: 3, unit: 'tsp' }
		]);
		compareResults(res, [{ ingredient: 'sugar', amount: 2.0, unit: 'tbsp' }]);
	});

	test('12) mixed fractional and units across many ingredients', () => {
		const res = simplifyList([
			{ ingredient: 'a', amount: 1, unit: 'tsp' },
			{ ingredient: 'b', amount: '1/2', unit: 'tbsp' },
			{ ingredient: 'c', amount: '3/4', unit: 'tsp' },
			{ ingredient: 'a', amount: 2, unit: 'tbsp' },
			{ ingredient: 'd', amount: 1, unit: 'cup' },
			{ ingredient: 'b', amount: '3/4', unit: 'tbsp' }
		]);
		compareResults(res, [
			{ ingredient: 'a', amount: 2.3, unit: 'tbsp' },
			{ ingredient: 'b', amount: 1.3, unit: 'tbsp' },
			{ ingredient: 'c', amount: 0.8, unit: 'tsp' },
			{ ingredient: 'd', amount: 1.0, unit: 'cup' }
		]);
	});

	test('13) two cups sum to 2.0 cup', () => {
		const res = simplifyList([
			{ ingredient: 'x', amount: 1, unit: 'cup' },
			{ ingredient: 'x', amount: 1, unit: 'cup' }
		]);
		compareResults(res, [{ ingredient: 'x', amount: 2.0, unit: 'cup' }]);
	});

	test('14) fractional tsp rounding (1/3 + 2/3 -> 1.0 tsp)', () => {
		const res = simplifyList([
			{ ingredient: 'lem', amount: '1/3', unit: 'tsp' },
			{ ingredient: 'lem', amount: '2/3', unit: 'tsp' }
		]);
		compareResults(res, [{ ingredient: 'lem', amount: 1.0, unit: 'tsp' }]);
	});

	test('15) small decimal tsp values round as expected', () => {
		const res = simplifyList([
			{ ingredient: 'p', amount: 0.1, unit: 'tsp' },
			{ ingredient: 'p', amount: 0.2, unit: 'tsp' },
			{ ingredient: 'q', amount: 0.15, unit: 'tsp' }
		]);
		compareResults(res, [
			{ ingredient: 'p', amount: 0.3, unit: 'tsp' },
			{ ingredient: 'q', amount: 0.2, unit: 'tsp' }
		]);
	});

	test('16) string with space fraction in tbsp -> rounding to 1 decimal', () => {
		const res = simplifyList([
			{ ingredient: 'egg', amount: '1 1/4', unit: 'tbsp' }
		]);
		compareResults(res, [{ ingredient: 'egg', amount: 1.3, unit: 'tbsp' }]);
	});

	test('17) empty lists -> empty result', () => {
		const res = simplifyList([]);
		expect(res).toEqual([]);
	});

	test('18) mixed units with quarter-cup -> 13 tsp -> 4.3 tbsp', () => {
		const res = simplifyList([
			{ ingredient: 'a', amount: '1/4', unit: 'cup' },
			{ ingredient: 'a', amount: '1/4', unit: 'tbsp' },
			{ ingredient: 'a', amount: '1/4', unit: 'tsp' }
		]);
		compareResults(res, [{ ingredient: 'a', amount: 4.3, unit: 'tbsp' }]);
	});

	test('19) decimal tsp sum preserves decimal after rounding', () => {
		const res = simplifyList([
			{ ingredient: 'z', amount: 1.05, unit: 'tsp' },
			{ ingredient: 'z', amount: 1.05, unit: 'tsp' }
		]);
		compareResults(res, [{ ingredient: 'z', amount: 2.1, unit: 'tsp' }]);
	});

	test('20) mixed cups/tbsp/tsp across multiple ingredients', () => {
		const res = simplifyList([
			{ ingredient: 'corn', amount: 2, unit: 'tbsp' },
			{ ingredient: 'corn', amount: 1, unit: 'cup' },
			{ ingredient: 'salt', amount: 3, unit: 'tsp' },
			{ ingredient: 'pepper', amount: 1, unit: 'tbsp' }
		]);
		compareResults(res, [
			{ ingredient: 'corn', amount: 1.1, unit: 'cup' },
			{ ingredient: 'salt', amount: 1.0, unit: 'tbsp' },
			{ ingredient: 'pepper', amount: 1.0, unit: 'tbsp' }
		]);
	});
});

