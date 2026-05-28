# 영수증 지출관리 앱

영수증 이미지를 업로드하면 **Upstage Information Extraction** 으로 가맹점·금액·날짜·카테고리를 자동 인식해 등록 폼에 채워주고, 카테고리·기간별 지출을 한눈에 볼 수 있는 풀스택 웹 애플리케이션.

## 기술 스택

- **Backend**: FastAPI · SQLAlchemy 2.x · pydantic-settings · httpx
  - 로컬: SQLite / 배포: Postgres (Vercel Postgres, Neon, Supabase 등)
- **Frontend**: React 18 · Vite · Tailwind CSS · Axios
- **AI**: Upstage Information Extraction (`/v1/information-extraction`) — 영수증 이미지에서 JSON 스키마 기반으로 구조화된 정보 추출
- **Deploy**: Vercel (모노레포 + Python Serverless Function)

## 폴더 구조

```
receipt/
├── api/                          # FastAPI 앱 (Vercel 서버리스 진입점)
│   ├── index.py                  # FastAPI `app` + 라우터 마운트
│   ├── config.py                 # 환경변수 (DATABASE_URL, UPSTAGE_API_KEY)
│   ├── database.py               # SQLAlchemy engine / SessionLocal / get_db
│   ├── models.py                 # Receipt 모델
│   ├── schemas.py                # Pydantic 입출력 스키마
│   └── routers/
│       ├── receipts.py           # /api/receipts CRUD
│       └── ocr.py                # /api/ocr (Upstage IE 프록시 + 카테고리 정규화)
│
├── frontend/                     # React + Vite + Tailwind
│   ├── src/
│   │   ├── api/client.js         # axios 인스턴스 (/api)
│   │   ├── components/
│   │   │   ├── ReceiptOcrUpload.jsx   # 이미지 업로드 + IE 호출
│   │   │   └── ReceiptForm.jsx        # 등록 폼 (IE 결과 자동 prefill)
│   │   ├── App.jsx               # 페이지 조립 + prefill 상태 연결
│   │   ├── main.jsx
│   │   └── index.css             # Tailwind 디렉티브
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js            # 개발 시 /api → http://localhost:8000 프록시
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── samples/
│   └── receipt7.png              # 데모용 영수증 (가상 데이터)
│
├── requirements.txt              # Python 의존성 (Vercel 인식)
├── vercel.json                   # 빌드/라우팅
├── .env.example
└── README.md
```

## 로컬 실행

### 1) 백엔드 (FastAPI)

PowerShell에서 프로젝트 루트(`C:\Users\KOSTA\Documents\receipt`)에서:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
# .env 파일에 UPSTAGE_API_KEY 값을 채워 넣어주세요
uvicorn api.index:app --reload --port 8000
```

- API 본체: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- 헬스체크: http://localhost:8000/api/health → `{"status":"ok"}`

### 2) 프론트엔드 (React)

별도 터미널에서:

```powershell
cd frontend
npm install
npm run dev
```

- 화면: http://localhost:5173
- Vite dev server가 `/api/*` 요청을 백엔드(`localhost:8000`)로 프록시합니다.

## 사용 흐름

1. **영수증 이미지 분석** 카드에서 영수증 사진(JPEG/PNG/PDF 등) 업로드 → **영수증 분석** 클릭
2. Upstage IE가 4개 필드(`store_name`, `total_amount`, `purchased_at`, `category`)를 JSON 스키마에 따라 추출
3. **영수증 등록** 폼이 자동으로 채워짐 → 필요 시 수정 후 **저장**
4. `POST /api/receipts` 로 DB 적재

## API 엔드포인트

### `POST /api/ocr`
영수증 이미지를 Upstage Information Extraction 으로 분석.

- 요청: `multipart/form-data`, `file` 필드 (지원: JPEG/PNG/BMP/TIFF/HEIC/PDF, 최대 10MB)
- 응답:
  ```json
  {
    "store_name": "GS25 역삼타워점",
    "amount": "11400",
    "purchased_at": "2026-05-20",
    "category": "식비"
  }
  ```
- `category` 는 다음 7종으로 정규화됨: `식비 / 교통 / 쇼핑 / 의료 / 문화 / 통신 / 기타`

### `POST /api/receipts`
영수증 등록. 요청 본문: `{store_name, amount, purchased_at, category, memo?}`.

### `GET /api/receipts`
전체 영수증 목록 (날짜 내림차순).

### `GET|PUT|DELETE /api/receipts/{id}`
단건 조회/수정/삭제.

## Upstage API 설정

1. https://console.upstage.ai/ 가입 후 **API Keys** 메뉴에서 키 발급.
2. 로컬: `.env` 에 `UPSTAGE_API_KEY=...` 추가.
3. 배포: Vercel 대시보드 → Project Settings → Environment Variables 에 동일하게 추가.

## Vercel 배포

1. GitHub 등에 푸시하고 Vercel 프로젝트로 연결.
2. Vercel 대시보드에서 환경변수 설정:
   - `DATABASE_URL` — 예: `postgresql+psycopg://user:password@host:5432/dbname`
   - `UPSTAGE_API_KEY` — Upstage 콘솔에서 발급한 키
3. `vercel.json` 설정에 따라:
   - 프론트엔드는 `frontend/` 에서 빌드되어 `frontend/dist` 가 정적 호스팅.
   - `/api/*` 요청은 `api/index.py` (FastAPI) 서버리스 함수로 라우팅.
4. `pip install -r requirements.txt` 는 Vercel이 자동으로 수행.

## 데이터 모델

`receipts` 테이블:

| 필드           | 타입          | 설명                       |
|----------------|---------------|----------------------------|
| `id`           | int (PK)      | 자동 증가                  |
| `store_name`   | string(100)   | 가맹점명                   |
| `amount`       | numeric(12,2) | 금액                       |
| `category`     | string(50)    | 분류 (식비/교통/쇼핑 등)   |
| `purchased_at` | date          | 사용 일자                  |
| `memo`         | string(500)?  | 메모 (선택)                |
| `created_at`   | datetime      | 자동 입력                  |

## 진행 상황

- [x] 영수증 이미지 → Upstage IE 자동 추출
- [x] 추출 결과를 등록 폼에 자동 prefill
- [x] 영수증 등록 (POST)
- [ ] 영수증 목록 + 카테고리/기간 필터
- [ ] 월간 합계 · 카테고리별 통계 화면
- [ ] Vercel 첫 배포
- [ ] (선택) Alembic 마이그레이션 도입

## 메모

- 단일 사용자 전용 앱 — 회원가입/로그인 없음.
- DB 스키마는 현재 `Base.metadata.create_all` 로 자동 생성. 운영 전환 시 Alembic 도입 검토.
