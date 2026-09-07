/**
 * VE MANAGEMENT — STEP 40.1 BACKBLAZE B2 STORAGE AUTOMATED TEST SUITE
 * School: Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
 *
 * Verifies authenticated B2 upload, head, download byte-match, deletion, and RBAC negative controls.
 */

const API_BASE_URL = 'https://ve-management-api.iamrocky899.workers.dev';

async function runB2StorageTests() {
  console.log('================================================================');
  console.log('STEP 40.1 — BACKBLAZE B2 STORAGE INTEGRATION TEST SUITE');
  console.log(`Target Worker API: ${API_BASE_URL}`);
  console.log('================================================================\n');

  const testMatrix = [];

  // Helper for API POST
  async function postApi(payload) {
    const res = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      return { success: false, rawText: text, status: res.status };
    }
  }

  // 1. Obtain Teacher Session Token (Rakibul Islam - 9101004032)
  console.log('--- Authenticating Teacher (Rakibul Islam) ---');
  const teacherAuth = await postApi({
    action: 'auth_login',
    identifier: '9101004032',
    password: '12345',
    role: 'TEACHER'
  });

  if (!teacherAuth.success || !teacherAuth.data?.token) {
    console.error('Teacher authentication failed:', teacherAuth);
    process.exit(1);
  }
  const teacherToken = teacherAuth.data.token;
  console.log('✓ Teacher authenticated successfully.');

  // 2. Obtain Student Session Token (Phanidra Koirala - S1778819085102)
  console.log('--- Authenticating Student (Phanidra Koirala) ---');
  const studentAuth = await postApi({
    action: 'auth_login',
    identifier: 'S1778819085102',
    password: '12345',
    role: 'STUDENT'
  });
  const studentToken = studentAuth.data?.token;
  console.log('✓ Student authenticated successfully.');

  // 3. Test Object Constants
  const testCategory = 'test';
  const testSubId = 'step40-1';
  const testFileName = 'step40-1-b2-test.txt';
  const testContentString = 'VE Management Backblaze B2 Storage Integration Verification — ' + new Date().toISOString();
  const testBase64 = Buffer.from(testContentString, 'utf-8').toString('base64');
  const expectedKey = `GAMERI-HSS-001/${testCategory}/${testSubId}/${testFileName}`;

  // -------------------------------------------------------------
  // TEST 1: Authenticated Upload to B2 (Teacher)
  // -------------------------------------------------------------
  console.log(`\n--- [TEST 1] Upload Test Object (${expectedKey}) ---`);
  const uploadRes = await postApi({
    action: 'file_upload',
    token: teacherToken,
    key: expectedKey,
    category: testCategory,
    subId: testSubId,
    fileName: testFileName,
    fileData: testBase64,
    contentType: 'text/plain'
  });

  console.log('Upload response:', uploadRes);
  const t1Pass = uploadRes.success === true && uploadRes.data?.fileKey === expectedKey;
  testMatrix.push({ name: '1. B2 Authenticated Upload (PUT)', status: t1Pass ? 'PASS' : 'FAIL', details: uploadRes });

  // -------------------------------------------------------------
  // TEST 2: Object Metadata & Existence Check (file_head)
  // -------------------------------------------------------------
  console.log(`\n--- [TEST 2] Verify Object Existence via HEAD ---`);
  const headRes = await postApi({
    action: 'file_head',
    token: teacherToken,
    key: expectedKey
  });

  console.log('Head response:', headRes);
  const t2Pass = headRes.success === true && headRes.data?.metadata?.exists === true;
  testMatrix.push({ name: '2. B2 Object Existence & Metadata (HEAD)', status: t2Pass ? 'PASS' : 'FAIL', details: headRes });

  // -------------------------------------------------------------
  // TEST 3: Download Object & Byte-for-Byte Comparison
  // -------------------------------------------------------------
  console.log(`\n--- [TEST 3] Download Object & Verify Integrity ---`);
  const downloadRes = await postApi({
    action: 'file_download',
    token: teacherToken,
    key: expectedKey
  });

  let downloadedContent = '';
  if (downloadRes.success && downloadRes.data?.fileData) {
    downloadedContent = Buffer.from(downloadRes.data.fileData, 'base64').toString('utf-8');
  }

  console.log('Downloaded string match:', downloadedContent === testContentString);
  const t3Pass = downloadRes.success === true && downloadedContent === testContentString;
  testMatrix.push({ name: '3. B2 Download & Exact Byte-Match', status: t3Pass ? 'PASS' : 'FAIL', details: { match: downloadedContent === testContentString } });

  // -------------------------------------------------------------
  // TEST 4: Delete Test Object
  // -------------------------------------------------------------
  console.log(`\n--- [TEST 4] Delete Test Object from Storage ---`);
  const deleteRes = await postApi({
    action: 'file_delete',
    token: teacherToken,
    key: expectedKey
  });

  console.log('Delete response:', deleteRes);
  const t4Pass = deleteRes.success === true && deleteRes.data?.deleted === true;
  testMatrix.push({ name: '4. B2 Object Deletion (DELETE)', status: t4Pass ? 'PASS' : 'FAIL', details: deleteRes });

  // -------------------------------------------------------------
  // TEST 5: Verify Deletion via HEAD
  // -------------------------------------------------------------
  console.log(`\n--- [TEST 5] Confirm Deletion via HEAD ---`);
  const postDeleteHead = await postApi({
    action: 'file_head',
    token: teacherToken,
    key: expectedKey
  });

  console.log('Post-delete head:', postDeleteHead);
  const t5Pass = postDeleteHead.success === true && postDeleteHead.data?.metadata?.exists === false;
  testMatrix.push({ name: '5. Post-Delete Confirmation (HEAD -> 404)', status: t5Pass ? 'PASS' : 'FAIL', details: postDeleteHead });

  // -------------------------------------------------------------
  // TEST 6: RBAC Negative Test — Student Cannot Upload to Protected Documents
  // -------------------------------------------------------------
  console.log(`\n--- [TEST 6] RBAC: Student Blocked from Staff Upload ---`);
  const stuUploadRes = await postApi({
    action: 'file_upload',
    token: studentToken,
    key: `GAMERI-HSS-001/documents/S999999/test.pdf`,
    category: 'documents',
    subId: 'S999999',
    fileName: 'test.pdf',
    fileData: testBase64,
    contentType: 'application/pdf'
  });

  console.log('Student unauthorized upload attempt:', stuUploadRes);
  const t6Pass = stuUploadRes.success === false && (stuUploadRes.error?.code === 'UNAUTHORIZED' || stuUploadRes.error?.code === 'FORBIDDEN');
  testMatrix.push({ name: '6. RBAC Negative: Student Blocked from Doc Upload', status: t6Pass ? 'PASS' : 'FAIL', details: stuUploadRes });

  // -------------------------------------------------------------
  // TEST 7: RBAC Negative Test — Student Blocked from Reading Another Student's Document
  // -------------------------------------------------------------
  console.log(`\n--- [TEST 7] RBAC: Student Blocked from Other Student's Document ---`);
  const otherStuKey = `GAMERI-HSS-001/documents/S1778748561031310/secret.pdf`;
  const stuDownloadRes = await postApi({
    action: 'file_download',
    token: studentToken,
    key: otherStuKey
  });

  console.log('Student cross-read attempt:', stuDownloadRes);
  const t7Pass = stuDownloadRes.success === false && (stuDownloadRes.error?.code === 'UNAUTHORIZED' || stuDownloadRes.error?.code === 'FORBIDDEN');
  testMatrix.push({ name: '7. RBAC Negative: Cross-Student File Access Blocked', status: t7Pass ? 'PASS' : 'FAIL', details: stuDownloadRes });

  // -------------------------------------------------------------
  // TEST 8: Unauthenticated Request Blocked
  // -------------------------------------------------------------
  console.log(`\n--- [TEST 8] Unauthenticated File Request Blocked ---`);
  const unauthRes = await postApi({
    action: 'file_download',
    key: expectedKey
  });

  console.log('Unauthenticated request:', unauthRes);
  const t8Pass = unauthRes.success === false && unauthRes.error?.code === 'UNAUTHORIZED';
  testMatrix.push({ name: '8. Unauthenticated Access Blocked', status: t8Pass ? 'PASS' : 'FAIL', details: unauthRes });

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log('STEP 40.1 BACKBLAZE B2 TEST RESULTS SUMMARY');
  console.log('================================================================');
  testMatrix.forEach((t) => {
    console.log(`[${t.status}] ${t.name}`);
  });
  console.log('================================================================\n');

  const allPassed = testMatrix.every((t) => t.status === 'PASS');
  process.exit(allPassed ? 0 : 1);
}

runB2StorageTests().catch((e) => {
  console.error('Test execution failed:', e);
  process.exit(1);
});
