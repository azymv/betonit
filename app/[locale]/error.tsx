"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Логирование ошибки на сервер, если нужно
    console.error(error);
  }, [error]);

  return (
    <div className="container max-w-md mx-auto text-center py-24">
      <h1 className="text-4xl font-bold text-red-500 mb-4">Ошибка</h1>
      <p className="text-muted-foreground mb-8">
        Извините, произошла ошибка при загрузке страницы.
      </p>
      <Button size="lg" onClick={reset}>
        Попробовать еще раз
      </Button>
    </div>
  );
}