export default function StartupLoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="relative flex h-screen items-center justify-center overflow-hidden bg-background">
      {/* Background illustration */}
      <div className="absolute inset-0 z-0">
        <img
          src="/assets/generated/wholesale-lens-opening-bg.dim_1920x1080.png"
          alt=""
          className="h-full w-full object-cover opacity-20"
          loading="eager"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center space-y-8 px-4">
        {/* Logo */}
        <div className="flex flex-col items-center space-y-4">
          <img
            src="/assets/generated/wholesale-lens-mark.dim_512x512.png"
            alt="Wholesale Lens"
            className="h-20 w-20 animate-pulse"
            loading="eager"
            decoding="async"
          />
          <img
            src="/assets/generated/wholesale-lens-wordmark.dim_1200x300.png"
            alt="Wholesale Lens"
            className="h-8 w-auto"
            loading="eager"
            decoding="async"
          />
        </div>

        {/* Loading indicator */}
        <div className="space-y-4">
          <div className="relative mx-auto">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary mx-auto" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-foreground">{message}</p>
            <p className="text-sm text-muted-foreground">Setting up your workspace</p>
          </div>
        </div>
      </div>
    </div>
  );
}
