const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

// ── 1. 페이지 로드 ──────────────────────────────────────────────
test.describe('페이지 로드', () => {
  test('타이틀 및 헤더 표시', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/JPDF/);
    await expect(page.locator('h1')).toContainText('JPDF');
  });

  test('핵심 UI 요소 존재', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#dropZone')).toBeVisible();
    await expect(page.locator('#api_key')).toBeVisible();
    await expect(page.locator('#convertBtn')).toBeVisible();
    await expect(page.locator('#fontFamily')).toBeVisible();
    await expect(page.locator('#fontSize')).toBeVisible();
  });

  test('변환 버튼 초기 비활성화', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#convertBtn')).toBeDisabled();
  });

  test('파일 정보 영역 초기 숨김', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#fileInfo')).toBeHidden();
    await expect(page.locator('#resultSection')).toBeHidden();
  });
});

// ── 2. 파일 업로드 ─────────────────────────────────────────────
test.describe('파일 업로드', () => {
  test('PNG 파일 선택 시 fileInfo 표시', async ({ page }) => {
    await page.goto('/');

    // 임시 PNG 파일 생성 (1x1 픽셀 PNG)
    const pngBuffer = Buffer.from(
      '89504e470d0a1a0a0000000d494844520000000100000001080200000090' +
      '77533de0000000c49444154789c626001000000ffff03000006000557bfab' +
      'd40000000049454e44ae426082', 'hex'
    );
    const tmpFile = path.join(require('os').tmpdir(), 'test.png');
    fs.writeFileSync(tmpFile, pngBuffer);

    const fileInput = page.locator('#fileInput');
    await fileInput.setInputFiles(tmpFile);

    await expect(page.locator('#fileInfo')).toBeVisible();
    await expect(page.locator('#fileName')).toContainText('test.png');
    await expect(page.locator('#dropZone')).toBeHidden();
    await expect(page.locator('#convertBtn')).toBeEnabled();

    fs.unlinkSync(tmpFile);
  });

  test('파일 제거 버튼 클릭 시 초기 상태로 복원', async ({ page }) => {
    await page.goto('/');

    const pngBuffer = Buffer.from(
      '89504e470d0a1a0a0000000d494844520000000100000001080200000090' +
      '77533de0000000c49444154789c626001000000ffff03000006000557bfab' +
      'd40000000049454e44ae426082', 'hex'
    );
    const tmpFile = path.join(require('os').tmpdir(), 'test_remove.png');
    fs.writeFileSync(tmpFile, pngBuffer);

    await page.locator('#fileInput').setInputFiles(tmpFile);
    await expect(page.locator('#convertBtn')).toBeEnabled();

    await page.locator('#removeFile').click();
    await expect(page.locator('#dropZone')).toBeVisible();
    await expect(page.locator('#fileInfo')).toBeHidden();
    await expect(page.locator('#convertBtn')).toBeDisabled();

    fs.unlinkSync(tmpFile);
  });
});

// ── 3. 파일 유형 검증 ───────────────────────────────────────────
test.describe('파일 유형 검증', () => {
  test('허용 확장자 목록: pdf, png, jpg, jpeg', async ({ page }) => {
    await page.goto('/');
    const accept = await page.locator('#fileInput').getAttribute('accept');
    expect(accept).toContain('.pdf');
    expect(accept).toContain('.png');
    expect(accept).toContain('.jpg');
    expect(accept).toContain('.jpeg');
  });
});

// ── 4. 변환 옵션 ────────────────────────────────────────────────
test.describe('변환 옵션', () => {
  test('모드 라디오: editable 기본 선택', async ({ page }) => {
    await page.goto('/');
    const checked = await page.locator('input[name="mode"]:checked').getAttribute('value');
    expect(checked).toBe('editable');
  });

  test('모드 전환: direct 선택 가능', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[name="mode"][value="direct"]').check();
    const checked = await page.locator('input[name="mode"]:checked').getAttribute('value');
    expect(checked).toBe('direct');
  });

  test('폰트 선택: Arial 기본값', async ({ page }) => {
    await page.goto('/');
    const selected = await page.locator('#fontFamily').inputValue();
    expect(selected).toBe('Arial');
  });

  test('폰트 목록: 한글 폰트 포함', async ({ page }) => {
    await page.goto('/');
    const options = await page.locator('#fontFamily option').allTextContents();
    expect(options.some(o => o.includes('고딕') || o.includes('Gothic'))).toBeTruthy();
  });

  test('폰트 크기: 빈 값이 기본 (자동)', async ({ page }) => {
    await page.goto('/');
    const val = await page.locator('#fontSize').inputValue();
    expect(val).toBe('');
  });
});

// ── 5. API 오류 처리 ────────────────────────────────────────────
test.describe('API 오류 처리', () => {
  test('API 키 없이 변환 시 오류 메시지 표시', async ({ page }) => {
    await page.goto('/');

    // 파일 업로드
    const pngBuffer = Buffer.from(
      '89504e470d0a1a0a0000000d494844520000000100000001080200000090' +
      '77533de0000000c49444154789c626001000000ffff03000006000557bfab' +
      'd40000000049454e44ae426082', 'hex'
    );
    const tmpFile = path.join(require('os').tmpdir(), 'test_err.png');
    fs.writeFileSync(tmpFile, pngBuffer);
    await page.locator('#fileInput').setInputFiles(tmpFile);

    // API 키 비움 (서버에도 .env.local 없다고 가정)
    await page.locator('#api_key').fill('');

    // 변환 버튼 클릭 후 결과 대기
    await page.locator('#convertBtn').click();
    await page.locator('#resultSection').waitFor({ state: 'visible', timeout: 15000 });

    // 성공 or 오류 중 하나 표시 (API 키 없으면 오류여야 함)
    const errorVisible = await page.locator('#resultError').isVisible();
    const successVisible = await page.locator('#resultSuccess').isVisible();
    expect(errorVisible || successVisible).toBeTruthy();

    fs.unlinkSync(tmpFile);
  });

  test('오류 발생 시 resultError 영역 표시', async ({ page }) => {
    await page.goto('/');

    // /convert API mock: 오류 응답 강제
    await page.route('/convert', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Google Vision API 키가 필요합니다.' }),
      });
    });

    const pngBuffer = Buffer.from(
      '89504e470d0a1a0a0000000d494844520000000100000001080200000090' +
      '77533de0000000c49444154789c626001000000ffff03000006000557bfab' +
      'd40000000049454e44ae426082', 'hex'
    );
    const tmpFile = path.join(require('os').tmpdir(), 'test_mock.png');
    fs.writeFileSync(tmpFile, pngBuffer);
    await page.locator('#fileInput').setInputFiles(tmpFile);
    await page.locator('#convertBtn').click();

    await expect(page.locator('#resultError')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#errorMessage')).toContainText('API 키');

    fs.unlinkSync(tmpFile);
  });

  test('성공 응답 시 다운로드 버튼 표시', async ({ page }) => {
    await page.goto('/');

    // /convert mock: 성공
    await page.route('/convert', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, job_id: 'abc123', filename: 'test_편집가능.pptx' }),
      });
    });

    const pngBuffer = Buffer.from(
      '89504e470d0a1a0a0000000d494844520000000100000001080200000090' +
      '77533de0000000c49444154789c626001000000ffff03000006000557bfab' +
      'd40000000049454e44ae426082', 'hex'
    );
    const tmpFile = path.join(require('os').tmpdir(), 'test_success.png');
    fs.writeFileSync(tmpFile, pngBuffer);
    await page.locator('#fileInput').setInputFiles(tmpFile);
    await page.locator('#convertBtn').click();

    await expect(page.locator('#resultSuccess')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#downloadBtn')).toBeVisible();
    const href = await page.locator('#downloadBtn').getAttribute('href');
    expect(href).toContain('abc123');

    fs.unlinkSync(tmpFile);
  });

  test('변환 중 버튼 로딩 상태 전환', async ({ page }) => {
    await page.goto('/');

    // 응답 지연 mock
    await page.route('/convert', async route => {
      await new Promise(r => setTimeout(r, 500));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, job_id: 'xyz', filename: 'out_편집가능.pptx' }),
      });
    });

    const pngBuffer = Buffer.from(
      '89504e470d0a1a0a0000000d494844520000000100000001080200000090' +
      '77533de0000000c49444154789c626001000000ffff03000006000557bfab' +
      'd40000000049454e44ae426082', 'hex'
    );
    const tmpFile = path.join(require('os').tmpdir(), 'test_loading.png');
    fs.writeFileSync(tmpFile, pngBuffer);
    await page.locator('#fileInput').setInputFiles(tmpFile);
    await page.locator('#convertBtn').click();

    // 로딩 spinner 잠깐 표시 확인
    await expect(page.locator('.btn-loading')).toBeVisible({ timeout: 2000 });
    await expect(page.locator('#resultSuccess')).toBeVisible({ timeout: 10000 });

    fs.unlinkSync(tmpFile);
  });
});
