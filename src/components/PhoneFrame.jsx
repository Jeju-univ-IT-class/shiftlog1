export default function PhoneFrame({ children, bg = "bg-pure-white" }) {
  return (
    <div className="min-h-screen w-full flex justify-center bg-background sm:py-8">
      <div
        className={`w-full sm:max-w-[390px] sm:min-h-[800px] sm:border sm:border-line-gray sm:rounded-2xl sm:shadow-lg overflow-hidden ${bg}`}
      >
        {children}
      </div>
    </div>
  );
}
