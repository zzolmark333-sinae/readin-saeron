// 메모가 없을 때 쓰는 시기별 정보형 글감 (월 = 1~12)
export const TOPICS: { months: number[]; topic: string }[] = [
  { months: [1, 2], topic: "새 학년 준비: 학년이 올라가기 전 독서 습관 점검하기" },
  { months: [2, 3], topic: "신학기 상담 시즌: 우리 아이 독서 단계, 어떻게 확인할까" },
  { months: [3, 4], topic: "새 교과서 속 글, 읽기 힘들어하는 아이 돕는 법" },
  { months: [4, 5, 9, 10], topic: "시험기간 국어: 교과서 지문을 '읽는 법'부터 바꾸기" },
  { months: [5, 6, 11, 12], topic: "서·논술형 평가 대비: 조건에 맞게 쓰는 연습" },
  { months: [6, 7], topic: "여름방학 독서 계획: 짧게, 나누고, 꾸준히(3S)" },
  { months: [7, 8], topic: "방학 특강 안내와 방학 한 달 문해력 루틴" },
  { months: [8, 9], topic: "2학기 시작: 방학 동안 흐트러진 읽기 리듬 되찾기" },
  { months: [10, 11], topic: "가을 독서: 편식 없이 영역을 넓히는 책 고르기" },
  { months: [12, 1], topic: "겨울방학 독서 계획과 다음 학기 국어 예습" },
  { months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], topic: "책은 많이 읽는데 이해를 못 하는 아이: '많이'보다 '바르게'" },
  { months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], topic: "휴대폰만 보는 아이, 자기 전 10분 독서 루틴 만들기" },
  { months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], topic: "그림책에서 글밥 있는 책으로 넘어가는 징검다리 책" },
  { months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], topic: "책은 좋아하는데 국어 성적이 안 오르는 이유" },
];

export function pickTopic(month: number, usedTitles: string[]) {
  const recent = usedTitles.join(" ");
  const fits = TOPICS.filter((t) => t.months.includes(month));
  return (fits.find((t) => !recent.includes(t.topic.slice(0, 8))) ?? fits[0]).topic;
}
