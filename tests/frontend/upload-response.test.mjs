import test from 'node:test';
import assert from 'node:assert/strict';
import { uploadUrl } from '../../resources/js/lib/upload-response.ts';

test('accepts a valid uploaded image URL', async () => {
  const url = '/media/1/12345678-abcd-1234-abcd-123456789abc.jpg';
  assert.equal(await uploadUrl(Response.json({ url }, { status: 201 })), url);
});

test('PHP HTML prepended to JSON gives a safe actionable error', async () => {
  const response = new Response('<br /><b>Notice</b>: internal server path\n{"url":"/media/1/image.jpg"}', { status: 201, headers: { 'Content-Type': 'application/json' } });
  await assert.rejects(uploadUrl(response), error => {
    assert.match(error.message, /استجابة الخادم/);
    assert.doesNotMatch(error.message, /Unexpected token|internal server path|<br/);
    return true;
  });
});

test('session failures do not attempt to parse PHP or login HTML', async () => {
  await assert.rejects(uploadUrl(new Response('<br /><b>Notice</b>', { status: 419 })), /جلسة الدخول/);
});

test('reports file limits and rate limits without assuming JSON', async () => {
  await assert.rejects(uploadUrl(new Response('<html>too large</html>', { status: 413 })), /4 ميغابايت/);
  await assert.rejects(uploadUrl(new Response('', { status: 429 })), /انتظر دقيقة/);
});

test('preserves Laravel image validation errors', async () => {
  await assert.rejects(uploadUrl(Response.json({ errors: { image: ['اختر صورة صالحة.'] } }, { status: 422 })), /اختر صورة صالحة/);
});

test('rejects success responses that contain no valid local image URL', async () => {
  for (const payload of [null, {}, { url: 'javascript:alert(1)' }, { url: '//external.example/image.jpg' }]) {
    await assert.rejects(uploadUrl(Response.json(payload)));
  }
});
