# Omni Tracker

주식·크립토 자산을 한 곳에서 관리하는 self-hosted 포트폴리오 트래커입니다.

## Features

- 거래소 API 연동 (Binance, Bybit, Upbit, OKX, Bitget) — 잔액 자동 조회
- 주식 보유종목 수동 관리 + Yahoo Finance 실시간 시세
- 크립토 보유종목 수동 관리 + Binance 실시간 시세 (스테이블코인 포함)
- 포트폴리오 전체 밸런스 및 수익 현황
- 종목별·전체 포트폴리오 리밸런싱 (목표 비중 설정 / 프리셋 저장·불러오기)
- BTC·ETH 현물 ETF 시세 (Yahoo Finance)
- 크립토 뉴스 피드
- 백업 / 복원 (JSON 파일)
- 프로필 사진 업로드
- 알림 센터

## Self-hosted 배포 (Docker)

서버에 소스코드 없이 `docker-compose.yml`과 `.env` 파일만으로 배포할 수 있습니다.

### 1. docker-compose.yml 작성

```yaml
services:
  omnitracker:
    image: ghcr.io/lazerfit/omnitracker:latest
    container_name: omnitracker
    ports:
      - "3000:3000"
    volumes:
      - ./data:/data
      - ./uploads:/app/public/uploads
    environment:
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
      - DB_PATH=/data/db.sqlite
      # Optional: pre-configure admin credentials on first run.
      # If omitted, the first visit will prompt for account setup.
      # - ADMIN_USERNAME=admin
      # - ADMIN_PASSWORD=your_secure_password
    restart: unless-stopped
```

### 2. .env 파일 작성

암호화 키를 생성해서 `.env`에 입력합니다.

```bash
openssl rand -hex 32
```

```env
ENCRYPTION_KEY=여기에_생성된_64자_hex_키_입력
```

### 3. 실행

```bash
docker compose up -d
```

브라우저에서 `http://localhost:3000` 접속.

### 업데이트

```bash
docker compose pull && docker compose up -d
```

### 데이터 지속성

| 호스트 경로 | 컨테이너 경로 | 내용 |
|------------|--------------|------|
| `./data`    | `/data`      | SQLite DB |
| `./uploads` | `/app/public/uploads` | 프로필 사진 |

컨테이너를 재시작하거나 이미지를 업데이트해도 데이터는 유지됩니다.

## 로컬 개발

```bash
bun install
cp .env.example .env   # ENCRYPTION_KEY 설정
bun run dev            # http://localhost:3001
```

```bash
bun run build   # 프로덕션 빌드
bun run lint    # ESLint
bunx prettier --write .  # 코드 포맷
```

> **패키지 매니저:** `bun` 전용 (`bun.lock` 존재 — npm/yarn/pnpm 사용 금지)
