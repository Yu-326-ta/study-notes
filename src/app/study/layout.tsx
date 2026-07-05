export default function StudyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto min-h-full w-full max-w-lg px-4 py-4 lg:max-w-2xl lg:py-8">
      {children}
    </div>
  );
}
