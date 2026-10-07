import assert from 'assert';
import {
  fetchStorefrontProducts,
  fetchTotalProductCount,
  getCatalogCategoryCounts,
  getCatalogBrandCounts,
  resolveCategoryName,
} from '../lib/commerce';

async function runStorefrontPaginationTests() {
  console.log('\n======================================================');
  console.log('BAEMEDS STOREFRONT 50-BY-50 PAGINATION TEST SUITE');
  console.log('======================================================\n');

  // Test 1: Total product count
  console.log('1. Testing Authoritative Total Product Count...');
  const totalCount = await fetchTotalProductCount();
  console.log(`  Count received: ${totalCount}`);
  assert(totalCount >= 3100, 'Total product count must be at least 3,100');
  console.log(`  ✔ Total product count verified: ${totalCount} products`);

  // Test 2: Page 1 chunk (first 50 products)
  console.log('\n2. Testing Page 1 Retrieval (50 products)...');
  const page1 = await fetchStorefrontProducts({ page: 1, pageSize: 50 });
  assert.strictEqual(page1.products.length, 50, 'Page 1 must return exactly 50 products');
  assert.strictEqual(page1.total, totalCount, 'Total count must match totalCount');
  const expectedTotalPages = Math.ceil(totalCount / 50);
  assert.strictEqual(page1.totalPages, expectedTotalPages, `Total pages must be ${expectedTotalPages}`);
  assert.strictEqual(page1.page, 1, 'Current page must be 1');
  console.log(`  ✔ Page 1 returned ${page1.products.length} products. First ID: ${page1.products[0].id}`);

  // Test 3: Page 2 chunk (next 50 products)
  console.log('\n3. Testing Page 2 Retrieval (next 50 products)...');
  const page2 = await fetchStorefrontProducts({ page: 2, pageSize: 50 });
  assert.strictEqual(page2.products.length, 50, 'Page 2 must return exactly 50 products');
  assert.strictEqual(page2.total, totalCount, 'Total count must remain consistent');
  assert.strictEqual(page2.page, 2, 'Current page must be 2');
  assert.notStrictEqual(page1.products[0].id, page2.products[0].id, 'Page 1 and Page 2 products must be non-overlapping');
  console.log(`  ✔ Page 2 returned ${page2.products.length} products. First ID: ${page2.products[0].id}`);

  // Test 4: Last Page chunk
  console.log(`\n4. Testing Final Page Retrieval (Page ${expectedTotalPages})...`);
  const lastPage = await fetchStorefrontProducts({ page: expectedTotalPages, pageSize: 50 });
  const expectedLastPageCount = totalCount - ((expectedTotalPages - 1) * 50);
  assert.strictEqual(lastPage.products.length, expectedLastPageCount, `Last page must return remaining ${expectedLastPageCount} products`);
  assert.strictEqual(lastPage.total, totalCount, 'Total count must remain consistent');
  console.log(`  ✔ Last page returned ${lastPage.products.length} products.`);

  // Test 5: Category Filter with 50-chunking
  console.log('\n5. Testing Category Filter (CPAP Masks & Accessories: 554 total)...');
  const cpapMasksPage1 = await fetchStorefrontProducts({ page: 1, pageSize: 50, category: 'CPAP Masks & Accessories' });
  assert.strictEqual(cpapMasksPage1.products.length, 50, 'CPAP Masks Page 1 must return 50 products');
  assert.strictEqual(cpapMasksPage1.total, 554, 'CPAP Masks & Accessories total count must be 554');
  console.log(`  ✔ CPAP Masks & Accessories returned 50 items on page 1 of ${cpapMasksPage1.totalPages} (Total: ${cpapMasksPage1.total})`);

  // Test 5B: CPAP Machines Dedicated Category Filter
  console.log('\n5B. Testing Dedicated CPAP Machines Filter (25 total)...');
  const cpapPage1 = await fetchStorefrontProducts({ page: 1, pageSize: 50, category: 'CPAP Machines' });
  assert.strictEqual(cpapPage1.products.length, 25, 'CPAP Page 1 must return 25 products');
  assert.strictEqual(cpapPage1.total, 25, 'CPAP Machines total count must be 25');
  console.log(`  ✔ CPAP Machines returned 25 standalone machines (Total: ${cpapPage1.total})`);

  // Test 5C: Oxygen Concentrators Category Filter
  console.log('\n5C. Testing Oxygen Concentrators Category Filter...');
  const o2Page = await fetchStorefrontProducts({ page: 1, pageSize: 50, category: 'Oxygen Concentrators' });
  assert(o2Page.total >= 16, 'Oxygen Concentrators total count must be >= 16');
  console.log(`  ✔ Oxygen Concentrators returned ${o2Page.products.length} flagship machines (Total: ${o2Page.total})`);

  // Test 6: Search Filter with 50-chunking
  console.log('\n6. Testing Search Query Filter ("wheelchair")...');
  const searchResult = await fetchStorefrontProducts({ page: 1, pageSize: 50, search: 'wheelchair' });
  assert(searchResult.total > 0, 'Search must return results');
  assert(searchResult.products.length <= 50, 'Search page must not exceed 50 products');
  console.log(`  ✔ Search returned ${searchResult.products.length} products on page 1 (Total matching: ${searchResult.total})`);

  // Test 7: Category and Brand metadata counters
  console.log('\n7. Testing Catalog Metadata Counters...');
  const catCounts = getCatalogCategoryCounts();
  assert.strictEqual(catCounts['CPAP Machines'], 25, 'CPAP Machines category count must be 25');
  assert.strictEqual(catCounts['CPAP Masks & Accessories'], 554, 'CPAP Masks category count must be 554');
  assert.strictEqual(catCounts['Wheelchairs'], 200, 'Wheelchairs category count must be 200');
  assert.strictEqual(catCounts['Wheelchair Parts & Accessories'], 776, 'Wheelchair Parts category count must be 776');
  const brandCounts = getCatalogBrandCounts();
  assert(brandCounts.length > 50, 'Brand counts must include all catalog manufacturers');
  console.log(`  ✔ Categories: CPAP Machines = ${catCounts['CPAP Machines']}, CPAP Masks = ${catCounts['CPAP Masks & Accessories']}, Wheelchairs = ${catCounts['Wheelchairs']}, Parts = ${catCounts['Wheelchair Parts & Accessories']}`);
  console.log(`  ✔ Catalog Brands: ${brandCounts.length} distinct manufacturers identified.`);

  console.log('\n======================================================');
  console.log('ALL 7 STOREFRONT 50-BY-50 PAGINATION TESTS PASSED!');
  console.log('======================================================\n');
}

runStorefrontPaginationTests().catch((err) => {
  console.error('Test failure:', err);
  process.exit(1);
});
