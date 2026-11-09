import { leagueJourney, portalStatusLabels, type JourneyMilestone } from "../../lib/home-portal";

export function LeagueJourney({
  milestones = leagueJourney,
}: {
  milestones?: readonly JourneyMilestone[];
}) {
  return (
    <section
      className="portal-journey portal-section site-container"
      aria-labelledby="journey-title"
    >
      <h2 id="journey-title">
        O LEGADO
        <br />
        <span>COMEÇA AGORA.</span>
      </h2>
      <ol className="journey-track">
        {milestones.map((milestone) => (
          <li key={milestone.id} data-status={milestone.content.status}>
            <h3>{milestone.title}</h3>
            <p>
              {milestone.content.status === "available"
                ? milestone.content.data.description
                : portalStatusLabels[milestone.content.status]}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
