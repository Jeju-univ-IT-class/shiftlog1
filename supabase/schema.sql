-- ==========================================
-- 0. 기존 테이블 및 정책 초기화 (충돌 방지)
-- ==========================================
DROP TABLE IF EXISTS closing_details CASCADE;
DROP TABLE IF EXISTS closing_logs CASCADE;
DROP TABLE IF EXISTS notices CASCADE;
DROP TABLE IF EXISTS attendance_logs CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS stores CASCADE;

-- ==========================================
-- 1. 매장 (stores)
-- ==========================================
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name TEXT NOT NULL,
  worker_pin TEXT NOT NULL,
  owner_pin TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  allowed_radius INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX stores_worker_pin_idx ON stores (worker_pin);
CREATE UNIQUE INDEX stores_owner_pin_idx ON stores (owner_pin);

-- ==========================================
-- 2. 체크리스트 항목 (tasks)
-- ==========================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '마감', -- '오픈', '미들', '마감'
  is_photo_required BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 3. 근태 기록 (attendance_logs)
-- ==========================================
CREATE TABLE attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores (id) ON DELETE CASCADE,
  worker_name TEXT NOT NULL DEFAULT '근무자',
  user_name VARCHAR NULL,                            -- 알바생 이름 (호환성)
  clock_in_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),   -- 출근 시간
  clock_out_time TIMESTAMPTZ NULL,                   -- 퇴근 시간
  total_hours DOUBLE PRECISION NULL,
  checklist_complete BOOLEAN NULL,                   -- 체크리스트 완료 여부
  reason TEXT NULL,                                  -- 특이사항 내용
  reason_created_at TIMESTAMPTZ NULL,                -- 특이사항 작성 시간
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 4. 기타 메모 / 특이사항 (notices)
-- ==========================================
CREATE TABLE notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores (id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 5. 마감 로그 및 상세 (closing_logs & closing_details)
-- ==========================================
CREATE TABLE closing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores (id) ON DELETE CASCADE,
  attendance_id UUID REFERENCES attendance_logs (id) ON DELETE SET NULL,
  worker_name TEXT NOT NULL,
  note TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE closing_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id UUID REFERENCES closing_logs (id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks (id) ON DELETE CASCADE,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  photo_url TEXT NULL
);

-- ==========================================
-- 6. Row Level Security (RLS) 설정
-- ==========================================
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE closing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE closing_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public stores access" ON stores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public tasks access" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public attendance_logs access" ON attendance_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public notices access" ON notices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public closing_logs access" ON closing_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public closing_details access" ON closing_details FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- 7. 초기 시드 데이터
-- ==========================================
INSERT INTO stores (id, store_name, worker_pin, owner_pin, allowed_radius)
VALUES ('00000000-0000-0000-0000-000000000001', '테스트 매장', '1234', '0000', 50);

INSERT INTO tasks (store_id, title, category, display_order) VALUES
('00000000-0000-0000-0000-000000000001', '오픈 조명 점검', '오픈', 1),
('00000000-0000-0000-0000-000000000001', '테이블 세팅 확인', '오픈', 2),
('00000000-0000-0000-0000-000000000001', '현금 시재 확인', '오픈', 3),
('00000000-0000-0000-0000-000000000001', '재고 중간 점검', '미들', 1),
('00000000-0000-0000-0000-000000000001', '홀 정리 정돈', '미들', 2),
('00000000-0000-0000-0000-000000000001', '홀 테이블 청소', '마감', 1),
('00000000-0000-0000-0000-000000000001', '주방 식기 건조', '마감', 2),
('00000000-0000-0000-0000-000000000001', '분리수거 및 쓰레기 배출', '마감', 3),
('00000000-0000-0000-0000-000000000001', '냉장고 성에 제거 확인', '마감', 4),
('00000000-0000-0000-0000-000000000001', '바닥 물걸레 청소', '마감', 5);

INSERT INTO notices (store_id, text, created_at) VALUES
('00000000-0000-0000-0000-000000000001', '기계 고장났습니다.', NOW() - INTERVAL '10 minutes'),
('00000000-0000-0000-0000-000000000001', '재고 부족합니다', NOW() - INTERVAL '1 minute');