import { Construction } from 'lucide-react';

export function Placeholder({ title }: { title: string }) {
  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-96 text-center" dir="rtl">
      <div className="w-14 h-14 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
        <Construction className="h-7 w-7 text-blue-300" />
      </div>
      <h1 className="text-xl font-bold text-gray-800">{title}</h1>
      <p className="text-gray-400 text-sm mt-1">מודול זה יהיה זמין בקרוב.</p>
    </div>
  );
}
