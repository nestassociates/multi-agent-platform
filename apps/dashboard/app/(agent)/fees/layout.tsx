export default function FeesEditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Remove the default padding from the parent layout for full-bleed editor
  // Parent layout has: p-4 md:p-6 gap-4 md:gap-8
  // We need: -m-4 md:-m-6 to offset horizontal/vertical padding
  // And: -mt-4 md:-mt-8 to also offset the gap from header
  return (
    <div className="-m-4 md:-m-6 -mt-4 md:-mt-8">
      {children}
    </div>
  );
}
