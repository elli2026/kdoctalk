# K-Doc Talk 배포 가이드

## 빠른 배포 (5분)

### 1단계: GitHub 레포 생성
```bash
cd kdoctalk
git init
git add .
git commit -m "K-Doc Talk v1.0"
git remote add origin https://github.com/elli2026/kdoctalk.git
git push -u origin main
```

### 2단계: Vercel 배포
1. https://vercel.com 접속 → Import Git Repository
2. `elli2026/kdoctalk` 선택
3. Environment Variables 에 추가:
   - Name: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-api03-...` (본인 Anthropic API 키)
4. Deploy 클릭

### 3단계: 도메인 연결
1. Vercel 프로젝트 Settings → Domains
2. `talk.kdocfinder.com` 입력
3. Gabia DNS에서 CNAME 레코드 추가:
   - 호스트: `talk`
   - 값: `cname.vercel-dns.com`

### 완료!
핸드폰으로 https://talk.kdocfinder.com 접속 → 음성+스피커 모두 동작

## 파일 구조
```
kdoctalk/
├── index.html          # 메인 UI (STT + TTS + 채팅)
├── api/
│   └── translate.js    # Claude API 번역 서버리스 함수
├── vercel.json         # Vercel 라우팅 설정
├── .env.example        # 환경변수 예시
└── README.md           # 이 파일
```
