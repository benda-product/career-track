'use client';

import { FormEvent, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function AdminSearchForm({
  initialQuery,
  placeholder,
  onSearch,
}: {
  initialQuery: string;
  placeholder: string;
  onSearch: (query: string) => void;
}) {
  const [value, setValue] = useState(initialQuery);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSearch(value.trim());
  };

  return (
    <form onSubmit={submit} className="flex w-full max-w-md gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          className="h-9 bg-slate-50 pl-9 text-xs"
        />
      </div>
      <Button type="submit" size="sm">
        Search
      </Button>
    </form>
  );
}
