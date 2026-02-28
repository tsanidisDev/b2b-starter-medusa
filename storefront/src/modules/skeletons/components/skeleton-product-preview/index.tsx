import { Container } from "@medusajs/ui"

const SkeletonProductPreview = () => {
  return (
    <div className="animate-pulse">
      <Container className="aspect-[3/5] w-full bg-muted/30 bg-ui-bg-subtle" />
    </div>
  )
}

export default SkeletonProductPreview
