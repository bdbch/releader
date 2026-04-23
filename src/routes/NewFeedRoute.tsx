import { RouteLayout } from "@/routes/RouteLayout";

export function NewFeedRoute() {
  return (
    <RouteLayout title="New Feed">
      <section className="border-b px-6 py-5 text-[13px] text-muted-foreground">
        Feed creation form will appear here.
      </section>
    </RouteLayout>
  );
}
