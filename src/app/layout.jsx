import "./globals.css";

export const metadata = {
  title: "오늘도 이상무!",
  description: "알바생 출퇴근 · 마감 체크리스트 인증 서비스",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className="bg-pure-white text-on-background min-h-screen">
        {children}
      </body>
    </html>
  );
}
