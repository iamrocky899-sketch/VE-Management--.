/**
 * Test AWS SigV4 Canonical Request and Signature Computation
 */
const crypto = require('crypto');

function sha256Hex(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function hmacSha256(key, data) {
  return crypto.createHmac('sha256', key).update(data).digest();
}

function getFormattedDates(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getUTCFullYear();
  const month = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const hours = pad(d.getUTCHours());
  const minutes = pad(d.getUTCMinutes());
  const seconds = pad(d.getUTCSeconds());

  const dateStamp = `${year}${month}${day}`;
  const amzDate = `${dateStamp}T${hours}${minutes}${seconds}Z`;
  return { dateStamp, amzDate };
}

async function testSigV4() {
  const method = 'PUT';
  const bucketName = 've-management-files';
  const key = 'GAMERI-HSS-001/test/step40-1/step40-1-b2-test.txt';
  const host = 's3.us-east-005.backblazeb2.com';
  const region = 'us-east-005';
  const service = 's3';
  const body = 'VE Management Backblaze B2 Storage Integration Verification';
  const contentType = 'text/plain';

  const { dateStamp, amzDate } = getFormattedDates();
  const payloadHash = sha256Hex(body);

  const pathSegments = [bucketName, ...key.split('/')].map(encodeURIComponent);
  const canonicalUri = '/' + pathSegments.join('/');

  const reqHeaders = {
    'content-length': String(Buffer.byteLength(body)),
    'content-type': contentType,
    'host': host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate
  };

  const headerKeys = Object.keys(reqHeaders).sort();
  const canonicalHeaders = headerKeys.map(k => `${k}:${reqHeaders[k]}\n`).join('');
  const signedHeaders = headerKeys.join(';');

  const canonicalRequest = [
    method.toUpperCase(),
    canonicalUri,
    '', // query string
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');

  console.log('--- Canonical Request ---');
  console.log(JSON.stringify(canonicalRequest));
  console.log('\n--- Canonical Request Formatted ---');
  console.log(canonicalRequest);

  const canonicalRequestHash = sha256Hex(canonicalRequest);
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    canonicalRequestHash
  ].join('\n');

  console.log('\n--- String to Sign ---');
  console.log(stringToSign);
}

testSigV4();
