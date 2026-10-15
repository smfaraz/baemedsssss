import couponHandler from '../api/coupon';

async function runCouponTests() {
  console.log('Testing Coupon API...');

  // Test 1: Valid percentage coupon WELCOME10
  const req1 = new Request('https://www.baemeds.com/api/coupon', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'WELCOME10', subtotal: 100 }),
  });
  const res1 = await couponHandler.fetch(req1);
  const data1 = await res1.json();
  if (!data1.valid || data1.discountAmount !== 10) {
    throw new Error(`Test 1 Failed: ${JSON.stringify(data1)}`);
  }
  console.log('✔ Test 1: WELCOME10 gives $10 off on $100 subtotal');

  // Test 2: Valid fixed coupon CLINICAL25 with subtotal >= 200
  const req2 = new Request('https://www.baemeds.com/api/coupon', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'CLINICAL25', subtotal: 250 }),
  });
  const res2 = await couponHandler.fetch(req2);
  const data2 = await res2.json();
  if (!data2.valid || data2.discountAmount !== 25) {
    throw new Error(`Test 2 Failed: ${JSON.stringify(data2)}`);
  }
  console.log('✔ Test 2: CLINICAL25 gives $25 off on $250 subtotal');

  // Test 3: CLINICAL25 with subtotal < 200 fails with min order requirement
  const req3 = new Request('https://www.baemeds.com/api/coupon', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'CLINICAL25', subtotal: 150 }),
  });
  const res3 = await couponHandler.fetch(req3);
  const data3 = await res3.json();
  if (data3.valid !== false || !data3.error.includes('minimum order')) {
    throw new Error(`Test 3 Failed: ${JSON.stringify(data3)}`);
  }
  console.log('✔ Test 3: CLINICAL25 properly enforces minimum order amount');

  // Test 4: Invalid coupon code
  const req4 = new Request('https://www.baemeds.com/api/coupon', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'FAKEDISCOUNT99', subtotal: 100 }),
  });
  const res4 = await couponHandler.fetch(req4);
  const data4 = await res4.json();
  if (data4.valid !== false) {
    throw new Error(`Test 4 Failed: ${JSON.stringify(data4)}`);
  }
  console.log('✔ Test 4: Unrecognized coupon is properly rejected');

  console.log('ALL COUPON TESTS PASSED!');
}

runCouponTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
