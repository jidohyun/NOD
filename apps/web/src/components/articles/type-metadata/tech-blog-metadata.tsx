interface Props {
  metadata: Record<string, unknown>;
}

export function TechBlogMetadata({ metadata }: Props) {
  const techStack = (metadata.tech_stack as string[]) || [];
  const difficulty = (metadata.difficulty_level as string) || "";

  if (techStack.length === 0 && !difficulty) return null;

  return (
    <div className="space-y-3">
      {difficulty ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Difficulty:</span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              difficulty === "beginner"
                ? "bg-green-100 text-green-800"
                : difficulty === "advanced"
                  ? "bg-red-100 text-red-800"
                  : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {difficulty}
          </span>
        </div>
      ) : null}
      {techStack.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {techStack.map((tech) => (
            <span
              key={tech}
              className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
            >
              {tech}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
