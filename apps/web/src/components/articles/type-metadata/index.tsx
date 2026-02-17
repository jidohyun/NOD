"use client";

import { AcademicPaperMetadata } from "./academic-paper-metadata";
import { GeneralNewsMetadata } from "./general-news-metadata";
import { GitHubRepoMetadata } from "./github-repo-metadata";
import { OfficialDocsMetadata } from "./official-docs-metadata";
import { TechBlogMetadata } from "./tech-blog-metadata";
import { VideoPodcastMetadata } from "./video-podcast-metadata";

const METADATA_COMPONENTS: Record<
  string,
  React.ComponentType<{ metadata: Record<string, unknown> }>
> = {
  tech_blog: TechBlogMetadata,
  academic_paper: AcademicPaperMetadata,
  general_news: GeneralNewsMetadata,
  github_repo: GitHubRepoMetadata,
  official_docs: OfficialDocsMetadata,
  video_podcast: VideoPodcastMetadata,
};

interface TypeMetadataSectionProps {
  contentType: string;
  metadata: Record<string, unknown>;
}

export function TypeMetadataSection({ contentType, metadata }: TypeMetadataSectionProps) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return null;
  }

  const Component = METADATA_COMPONENTS[contentType];
  if (!Component) {
    return null;
  }

  return <Component metadata={metadata} />;
}
