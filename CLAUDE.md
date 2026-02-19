# JPDF - PDF/이미지 → 편집 가능 PPTX 변환기

Python (Flask/Streamlit) + OCR (Google Vision / PaddleOCR) + OpenCV + python-pptx

## 실행 명령어

| 명령 | 설명 |
|------|------|
| `pip install -r requirements.txt` | 의존성 설치 |
| `python app.py` | Flask 웹앱 (localhost:5000) |
| `python jpdf.py input.pdf -o out.pptx` | CLI 변환 |
| `streamlit run webapp/app.py` | Streamlit 웹앱 |

## 프로젝트 구조

| 경로 | 역할 |
|------|------|
| `jpdf.py` | 변환 엔진 (Google Vision OCR + OpenCV inpainting) |
| `app.py` | Flask 웹 서버 |
| `webapp/` | Streamlit 앱 (PaddleOCR 기반, 별도 모듈) |
| `templates/index.html` | Flask UI |
| `static/style.css` | 스타일 |

## 설정

- API 키: `.env.local` → `GOOGLE_VISION_API_KEY`
- 업로드 제한: 50MB (`app.py:20`)
- 지원 포맷: PDF, PNG, JPG, JPEG

## 핵심 규칙

- 두 OCR 엔진 공존: `jpdf.py`는 Google Vision, `webapp/`은 PaddleOCR → 혼용 금지
- 한글 인코딩: Windows에서 `sys.stdout.reconfigure(encoding='utf-8')` 필수
- 임시 파일: `uploads/`, `outputs/` 디렉토리 사용 (gitignore 포함)
