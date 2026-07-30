# 오늘도 이상무! — html 프로토타입 기반 JS 구현

업로드해주신 Stitch `code.html` 6개 화면을 그대로 컴포넌트 구조로 옮긴 버전입니다.
TypeScript가 아니라 순수 JS(.jsx)로 작성했습니다.

## 화면 매핑

| 경로 | 원본 html | 설명 |
|---|---|---|
| `/` | 로그인 (LOGIN, ID 입력, 로그인 버튼) | 4자리 숫자만 입력받아 대조. PIN 도트/키패드 없음 |
| `/worker` | 메인 (출근/퇴근 토글 + 진행바 + 근무타임 + 메모 + 특이사항) | 알바생 메인 |
| `/worker/checklist` | 마감 체크리스트 (카메라만, close 버튼, 수정하기/확인) | 알바생용 읽기+체크 |
| `/worker/checklist/reason` | 미작성 사유 입력 (글자수, 토스트) | 미완료 항목 있을 때 이동 |
| `/admin` | (신규) 관리자 허브 | 체크리스트 관리 / 출퇴근 기록 조회 진입점 |
| `/admin/checklist` | 마감 체크리스트 편집 (edit/delete/camera, 항목 추가하기) | 사장님용 CRUD |
| `/admin/attendance` | 출퇴근 기록 (TopAppBar, 날짜, 지각 강조) | 사장님용 근태 조회 |

## PIN 로그인 (가상 데이터)

`src/lib/dummyData.js`에 매장 정보를 하드코딩해뒀습니다.

- 알바생 PIN: `1234`
- 사장님 PIN: `0000`

알바생 정보(이름 등)는 아직 관리자 화면에서 추가하는 기능이 없어서, 이번 슬라이스는
로그인 후 바로 `/worker` 또는 `/admin`으로 이동합니다. 나중에 관리자 CRUD 슬라이스에서
`dummyData.js`를 Supabase 조회로 교체하면 됩니다 (`supabase/schema.sql` 참고).

## 로컬 실행

```bash
npm install
npm run dev
```

`http://localhost:3000` 접속 후 `1234` → 알바생 메인, `0000` → 관리자 대시보드로 이동하는지 확인하세요.

## 다음에 이어갈 것

- 알바생 출퇴근 GPS 인증 (지금은 버튼 클릭만으로 상태 전환)
- 사진 촬영 실제 캡처/업로드 (`photo_camera` 버튼은 지금 콘솔 로그만 남김)
- 관리자 체크리스트 CRUD → Supabase 연동
- 매장 PIN 하드코딩 → Supabase `stores` 테이블 조회로 교체
