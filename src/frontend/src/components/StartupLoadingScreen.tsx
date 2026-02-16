export default function StartupLoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary/20 border-t-primary mx-auto" />
        </div>
        <div className="space-y-2">
          <p className="text-lg font-medium text-foreground">{message}</p>
          <p className="text-sm text-muted-foreground">Please wait a moment</p>
        </div>
      </div>
    </div>
  );
}
