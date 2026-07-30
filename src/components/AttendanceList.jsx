export default function AttendanceList({ logs }) {
  return (
    <div className="flex flex-col gap-list-gap">
      {logs.map((log) => (
        <div
          key={log.id}
          className={`flex justify-between items-center p-card-padding bg-pure-white rounded transition-all active:bg-surface-gray ${
            log.late ? "border-2 border-primary" : "border border-line-gray"
          }`}
        >
          <div className="flex flex-col gap-1">
            <span className="font-body-mobile text-body-mobile font-bold text-primary">
              {log.name} / ID: {log.id}
            </span>
            <div className="flex items-center gap-1">
              {log.late ? (
                <span
                  className="material-symbols-outlined text-primary text-[14px]"
                  style={{ fontVariationSettings: '"FILL" 1' }}
                >
                  error
                </span>
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
              )}
              <span
                className={`font-caption text-caption ${
                  log.late ? "text-primary font-bold" : "text-mid-gray"
                }`}
              >
                {log.status}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1 font-caption text-caption text-primary">
              <span className="text-mid-gray">출근</span>
              <span className={log.late ? "font-bold underline decoration-2" : "font-semibold"}>
                {log.clockIn}
              </span>
            </div>
            <div className="flex items-center gap-1 font-caption text-caption text-primary">
              <span className="text-mid-gray">퇴근</span>
              <span className="font-semibold">{log.clockOut}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
