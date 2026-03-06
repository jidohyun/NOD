import Image from "next/image";

interface AuthorProfileProps {
  locale: string;
}

const bios: Record<string, string> = {
  en: "Software Engineer building NOD, an AI-powered knowledge management tool. Passionate about making information accessible and organized.",
  ko: "AI 기반 지식 관리 도구 NOD를 개발하는 소프트웨어 엔지니어. 정보의 접근성과 체계적 정리에 열정을 가지고 있습니다.",
  ja: "AIを活用したナレッジ管理ツールNODを開発するソフトウェアエンジニア。情報のアクセシビリティと整理に情熱を注いでいます。",
  es: "Ingeniero de software creando NOD, una herramienta de gestion del conocimiento impulsada por IA.",
  "pt-BR": "Engenheiro de software criando o NOD, uma ferramenta de gestao do conhecimento com IA.",
  "zh-CN": "软件工程师，开发基于AI的知识管理工具NOD。致力于让信息更易获取和组织。",
  de: "Softwareentwickler von NOD, einem KI-gestutzten Wissensmanagement-Tool.",
  fr: "Ingenieur logiciel creant NOD, un outil de gestion des connaissances propulse par l'IA.",
};

const labels: Record<string, { writtenBy: string; role: string }> = {
  en: { writtenBy: "Written by", role: "Software Engineer" },
  ko: { writtenBy: "작성자", role: "소프트웨어 엔지니어" },
  ja: { writtenBy: "著者", role: "ソフトウェアエンジニア" },
  es: { writtenBy: "Escrito por", role: "Ingeniero de Software" },
  "pt-BR": { writtenBy: "Escrito por", role: "Engenheiro de Software" },
  "zh-CN": { writtenBy: "作者", role: "软件工程师" },
  de: { writtenBy: "Geschrieben von", role: "Softwareentwickler" },
  fr: { writtenBy: "Ecrit par", role: "Ingenieur logiciel" },
};

export function AuthorProfile({ locale }: AuthorProfileProps) {
  const bio = bios[locale] || bios.en;
  const label = labels[locale] || labels.en;

  return (
    <section
      className="mt-12 rounded-xl border border-cm-text/10 bg-cm-mint/20 p-6"
      itemScope
      itemType="https://schema.org/Person"
    >
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-cm-text/40">
        {label.writtenBy}
      </p>
      <div className="flex items-start gap-4">
        <Image
          src="https://github.com/jidohyun.png"
          alt="Dohyun Ji"
          width={56}
          height={56}
          className="rounded-full"
          loading="lazy"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-cm-text" itemProp="name">
              Dohyun Ji
            </h3>
            <a
              href="https://github.com/jidohyun"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cm-text/40 hover:text-cm-text transition-colors"
              aria-label="GitHub"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                role="img"
                aria-labelledby="github-icon-title"
              >
                <title id="github-icon-title">GitHub</title>
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          </div>
          <p className="text-sm text-cm-text/60" itemProp="jobTitle">
            {label.role}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-cm-text/70" itemProp="description">
            {bio}
          </p>
          <meta itemProp="url" content="https://nod-archive.com" />
        </div>
      </div>
    </section>
  );
}
