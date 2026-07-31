import "./globals.css";

export const metadata = {
  title: "오늘도 이상무!",
  description: "알바생 출퇴근 · 마감 체크리스트 인증 서비스",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        {/* Google Material Symbols 아이콘 폰트 추가 */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="bg-pure-white text-on-background min-h-screen">
        {children}
      </body>
    </html>
  );
}