# Modern UI Examples for Gabay

## Card Layout with RTL Support
```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export const CongregantForm = () => {
  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="text-xl text-indigo-900">הוספת מתפלל חדש</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="שם פרטי" placeholder="ישראל" />
          <Input label="שם משפחה" placeholder="ישראלי" />
        </div>
        <Input label="טלפון" placeholder="050-0000000" />
        
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="ghost">ביטול</Button>
          <Button variant="primary" className="bg-[#2E3A59] hover:bg-[#1e263b]">
            שמור מתפלל
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
```

## Empty State with Lucide Icons
```tsx
import { Search } from 'lucide-react';

export const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="bg-slate-50 p-6 rounded-full mb-4">
      <Search className="w-12 h-12 text-slate-300" />
    </div>
    <h3 className="text-lg font-medium text-slate-900">לא נמצאו תוצאות</h3>
    <p className="text-slate-500 max-w-xs mx-auto mt-2">
      נסה לשנות את מסנני החיפוש או להוסיף רשומה חדשה.
    </p>
  </div>
);
```
