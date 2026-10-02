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
  assert.strictEqual(totalCount, 3114, 'Total product count must be exactly 3,114');
  console.log('  ✔ Total product count verified: exactly 3,114 products');

  // Test 2: Page 1 chunk (first 50 products)
  console.log('\n2. Testing Page 1 Retrieval (50 products)...');
  const page1 = await fetchStorefrontProducts({ page: 1, pageSize: 50 });
  assert.strictEqual(page1.products.length, 50, 'Page 1 must return exactly 50 products');
  assert.strictEqual(page1.total, 3114, 'Total count must be 3,114');
  assert.strictEqual(page1.totalPages, 63, 'Total pages for 3,114 items at 50/page must be 63');
  assert.strictEqual(page1.page, 1, 'Current page must be 1');
  console.log(`  ✔ Page 1 returned ${page1.products.length} products. First ID: ${page1.products[0].id}`);

  // Test 3: Page 2 chunk (next 50 products)
  console.log('\n3. Testing Page 2 Retrieval (next 50 products)...');
  const page2 = await fetchStorefrontProducts({ page: 2, pageSize: 50 });
  assert.strictEqual(page2.products.length, 50, 'Page 2 must return exactly 50 products');
  assert.strictEqual(page2.total, 3114, 'Total count must remain 3,114');
  assert.strictEqual(page2.page, 2, 'Current page must be 2');
  assert.notStrictEqual(page1.products[0].id, page2.products[0].id, 'Page 1 and Page 2 products must be non-overlapping');
  console.log(`  ✔ Page 2 returned ${page2.products.length} products. First ID: ${page2.products[0].id}`);

  // Test 4: Last Page chunk (Page 63)
  console.log('\n4. Testing Final Page Retrieval (Page 63)...');
  const page63 = await fetchStorefrontProducts({ page: 63, pageSize: 50 });
  // 3,114 - (62 * 50) = 14 products
  assert.strictEqual(page63.products.length, 14, 'Page 63 must return remaining 14 products');
  assert.strictEqual(page63.total, 3114, 'Total count must remain 3,114');
  console.log(`  ✔ Page 63 returned ${page63.products.length} products.`);

  // Test 5: Category Filter with 50-chunking
  console.log('\n5. Testing Category Filter (CPAP Machines: 577 total)...');
  const cpapPage1 = await fetchStorefrontProducts({ page: 1, pageSize: 50, category: 'CPAP Machines' });
  assert.strictEqual(cpapPage1.products.length, 50, 'CPAP Page 1 must return 50 products');
  assert.strictEqual(cpapPage1.total, 577, 'CPAP Machines total count must be 577');
  assert.strictEqual(cpapPage1.totalPages, 12, '577 items at 50/page must produce 12 pages');
  console.log(`  ✔ CPAP Machines returned 50 items on page 1 of 12 (Total: ${cpapPage1.total})`);

  // Test 5B: Oxygen Concentrators Category Filter
  console.log('\n5B. Testing Oxygen Concentrators Category Filter (15 total)...');
  const o2Page = await fetchStorefrontProducts({ page: 1, pageSize: 50, category: 'Oxygen Concentrators' });
  assert.strictEqual(o2Page.products.length, 15, 'Oxygen Concentrators must return 15 products');
  assert.strictEqual(o2Page.total, 15, 'Oxygen Concentrators total count must be 15');
  console.log(`  ✔ Oxygen Concentrators returned 15 flagship machines (Total: ${o2Page.total})`);

  // Test 6: Search Filter with 50-chunking
  console.log('\n6. Testing Search Query Filter ("wheelchair")...');
  const searchResult = await fetchStorefrontProducts({ page: 1, pageSize: 50, search: 'wheelchair' });
  assert(searchResult.total > 0, 'Search must return results');
  assert(searchResult.products.length <= 50, 'Search page must not exceed 50 products');
  console.log(`  ✔ Search returned ${searchResult.products.length} products on page 1 (Total matching: ${searchResult.total})`);

  // Test 7: Category and Brand metadata counters
  console.log('\n7. Testing Catalog Metadata Counters...');
  const catCounts = getCatalogCategoryCounts();
  assert.strictEqual(catCounts['CPAP Machines'], 577, 'CPAP Machines category count must be 577');
  assert.strictEqual(catCounts['Wheelchairs'], 1183, 'Wheelchairs category count must be 1,183');
  const brandCounts = getCatalogBrandCounts();
  assert(brandCounts.length > 50, 'Brand counts must include all catalog manufacturers');
  console.log(`  ✔ Categories: CPAP = ${catCounts['CPAP Machines']}, Wheelchairs = ${catCounts['Wheelchairs']}`);
  console.log(`  ✔ Catalog Brands: ${brandCounts.length} distinct manufacturers identified.`);

  console.log('\n======================================================');
  console.log('ALL 7 STOREFRONT 50-BY-50 PAGINATION TESTS PASSED!');
  console.log('======================================================\n');
}

runStorefrontPaginationTests().catch((err) => {
  console.error('Test failure:', err);
  process.exit(1);
});
