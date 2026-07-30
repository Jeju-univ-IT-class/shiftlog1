export default function NoticeCard({ text, time }) {
  return (
    <div className="p-4 bg-pure-white border border-line-gray rounded-[12px] flex flex-col gap-1">
      <span className="text-body-mobile text-on-background">{text}</span>
      <span className="text-xs text-mid-gray">{time}</span>
    </div>
  );
}
