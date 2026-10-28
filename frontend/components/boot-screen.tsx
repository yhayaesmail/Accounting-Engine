import { BrandLoader } from "./logo";

export function BootScreen({ label }: { label: string }) {
  return (
    <div className="boot-screen">
      <BrandLoader label={label} size="lg" />
    </div>
  );
}
