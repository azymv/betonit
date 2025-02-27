"use client";

import { GlowingEffect } from "@/components/ui/glowing-effect";
import { useParams } from "next/navigation";

interface HowItWorksProps {
  title: string;
  steps: {
    number: number;
    title: string;
    description: string;
  }[];
}

export function HowItWorksSection({ title, steps }: HowItWorksProps) {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-8 text-center">{title}</h2>
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <StepItem
              key={index}
              number={step.number}
              title={step.title}
              description={step.description}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}

interface StepItemProps {
  number: number;
  title: string;
  description: string;
}

const StepItem = ({ number, title, description }: StepItemProps) => {
  const params = useParams();
  const locale = params.locale as string;
  
  // Determine font class based on locale
  const fontClass = locale === 'ru' ? 'font-roboto' : 'font-poppins';
  
  return (
    <li className="min-h-[14rem] list-none">
      <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-border p-2 md:rounded-[1.5rem] md:p-3">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={3}
        />
        <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] bg-background p-6 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)] md:p-6">
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            <div className="bg-primary/10 text-primary rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              {number}
            </div>
            <div className={`space-y-3 text-center ${fontClass}`}>
              <h3 className="pt-0.5 text-xl leading-[1.375rem] font-semibold tracking-[-0.04em] md:text-2xl md:leading-[1.875rem] text-balance text-foreground">
                {title}
              </h3>
              <p className="text-sm leading-[1.125rem] md:text-base md:leading-[1.375rem] text-muted-foreground">
                {description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}; 