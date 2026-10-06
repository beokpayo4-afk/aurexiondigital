import { useParams } from "react-router-dom";

import { SolutionView } from "@/components/solutions/SolutionView";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Button } from "@/components/ui/Button";
import { solutionBySlug } from "@/constants/solutions";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageTitle } from "@/hooks/usePageTitle";
import { getService } from "@/services/catalogService";

export function SolutionDetailPage() {
  const { slug = "" } = useParams();
  const known = solutionBySlug(slug);
  const service = useAsyncData(() => getService(slug), [slug]);
  const title = service.data?.name ?? known?.title ?? "Solution";
  usePageTitle(title, service.data?.summary ?? undefined);

  return (
    <>
      {service.loading ? (
        <section className="bg-paper">
          <Container className="py-20">
            <LoadingState label="Loading service" />
          </Container>
        </section>
      ) : null}
      {service.error ? (
        <section className="bg-paper">
          <Container className="py-20">
            <ErrorState message={service.error} onRetry={service.reload} />
          </Container>
        </section>
      ) : null}
      {!service.loading && !service.error && service.data === null ? (
        <section className="bg-paper">
          <Container className="py-20">
            <EmptyState
              title="This service is not published"
              description="The page is ready. The service record appears here after it is published."
              action={
                <Button to="/solutions" tone="light">
                  All solutions
                </Button>
              }
            />
          </Container>
        </section>
      ) : null}
      {service.data ? <SolutionView service={service.data} /> : null}
    </>
  );
}
