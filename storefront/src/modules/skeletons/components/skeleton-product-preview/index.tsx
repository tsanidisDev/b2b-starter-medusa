const SkeletonProductPreview = () => {
  return (
    <div className="animate-pulse flex flex-col gap-3 rounded-[var(--radius)] border border-border bg-card overflow-hidden">
      {/* Image area */}
      <div className="aspect-square w-full bg-muted" />
      {/* Text lines */}
      <div className="flex flex-col gap-2 px-3 pb-3">
        <div className="h-3 w-3/4 rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
        <div className="h-4 w-1/3 rounded bg-muted mt-1" />
      </div>
    </div>
  )
}

export default SkeletonProductPreview
