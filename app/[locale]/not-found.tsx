"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;

  return (
    <div className="container max-w-md mx-auto text-center py-24">
      <h1 className="text-6xl font-bold text-blue-500 mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-4">Страница не найдена</h2>
      <p className="text-muted-foreground mb-8">
        Запрашиваемая страница не существует или была перемещена.
      </p>
      <Button size="lg" asChild>
        <Link href={`/${locale}`}>
          Вернуться на главную
        </Link>
      </Button>
    </div>
  );
}