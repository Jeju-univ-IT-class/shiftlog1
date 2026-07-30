// 이번 슬라이스는 관리자 화면에서 데이터를 관리하기 전이라
// 매장 PIN / 체크리스트 / 특이사항 / 근태 기록을 가상 데이터로 고정해둡니다.
// 나중에 관리자 CRUD 슬라이스에서 이 파일 대신 Supabase 조회로 교체하면 됩니다.

export const store = {
  id: "store-1",
  storeName: "테스트 매장",
  workerPin: "1234",
  ownerPin: "0000",
};

// 오픈/미들/마감 체크리스트는 각각 별개의 데이터입니다.
// 업로드해주신 체크리스트 5항목은 원본 파일명이 closing_checklist.html이었기 때문에
// "마감" 체크리스트로 그대로 넣었습니다. 오픈/미들은 관리자가 추가하기 전까지
// 임시 항목으로 채워둡니다.
export const tasksByShift = {
  오픈: [
    { id: "open-1", title: "오픈 조명 점검" },
    { id: "open-2", title: "테이블 세팅 확인" },
    { id: "open-3", title: "현금 시재 확인" },
  ],
  미들: [
    { id: "mid-1", title: "재고 중간 점검" },
    { id: "mid-2", title: "홀 정리 정돈" },
  ],
  마감: [
    { id: "close-1", title: "홀 테이블 청소" },
    { id: "close-2", title: "주방 식기 건조" },
    { id: "close-3", title: "분리수거 및 쓰레기 배출" },
    { id: "close-4", title: "냉장고 성에 제거 확인" },
    { id: "close-5", title: "바닥 물걸레 청소" },
  ],
};

export const notices = [
  { id: "notice-1", text: "재고 부족합니다", time: "방금 전" },
  { id: "notice-2", text: "기계 고장났습니다.", time: "10분 전" },
];
