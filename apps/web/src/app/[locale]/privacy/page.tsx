import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

interface PrivacyPageProps {
  params: Promise<{ locale: string }>;
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">개인정보 처리방침</h1>
        <p className="text-sm text-muted-foreground">시행일: 2026-02-09</p>
      </header>

      <div className="mt-8 space-y-8 text-sm leading-6">
        <section className="space-y-2">
          <p>
            NOD(이하 "서비스")는 이용자의 개인정보를 소중하게 생각하며, 관련 법령을 준수합니다. 본
            개인정보 처리방침은 서비스가 어떤 정보를 수집하고, 어떻게 이용하며, 누구와 공유하는지,
            그리고 이용자가 어떤 권리를 가지는지 설명합니다.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">1. 수집하는 개인정보</h2>
          <p>서비스는 아래 정보를 수집할 수 있습니다.</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              계정 정보: 이메일, 이름/프로필 이미지(소셜 로그인 제공자가 제공하는 범위 내), 인증
              토큰
            </li>
            <li>
              콘텐츠 정보: 사용자가 저장한 아티클 URL, 제목, 본문(추출된 텍스트), 요약/노트 및 관련
              메타데이터
            </li>
            <li>사용 정보: 기능 사용 기록(예: 저장/요약 횟수), 오류/진단 정보</li>
            <li>
              결제 정보: 유료 플랜 이용 시 결제 처리/구독 관리를 위한 정보(결제 제공자에 의해 처리)
            </li>
            <li>웹 분석 정보: 웹사이트 이용 통계(예: Google Analytics를 통한 페이지뷰/이벤트)</li>
          </ul>
          <p className="text-muted-foreground">
            크롬 확장 프로그램을 사용하는 경우, 사용자가 저장을 실행한 페이지의 URL 및 본문 텍스트를
            추출하여 서비스로 전송할 수 있습니다.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">2. 개인정보의 이용 목적</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>회원 식별 및 로그인/세션 관리</li>
            <li>아티클 저장, 요약 생성, 검색(유사도 기반 검색 포함) 등 핵심 기능 제공</li>
            <li>요금제/결제/구독 관리</li>
            <li>서비스 품질 개선, 오류 분석, 보안 및 부정 사용 방지</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">3. 개인정보의 제3자 제공 및 처리 위탁</h2>
          <p>
            서비스는 원칙적으로 이용자의 개인정보를 외부에 판매하지 않습니다. 다만 서비스 제공을
            위해 아래와 같은 수탁자/서비스 제공자를 이용할 수 있습니다.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>클라우드 인프라/호스팅: 서비스 운영 및 데이터 저장/처리</li>
            <li>인증/로그인: 소셜 로그인(OAuth) 제공자 및 인증 서비스</li>
            <li>
              AI 처리: 요약/임베딩 생성을 위해 일부 콘텐츠(제목/본문 등)가 AI 제공자(OpenAI 또는
              Google Gemini 등)로 전송되어 처리될 수 있음
            </li>
            <li>결제/구독: Paddle 등 결제 처리 서비스</li>
            <li>분석/모니터링: Google Analytics 등</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">4. 보관 및 파기</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>원칙적으로 개인정보는 목적 달성 시 지체 없이 파기합니다.</li>
            <li>
              이용자가 계정을 삭제하거나 삭제를 요청하는 경우, 관련 데이터는 합리적인 기간 내
              삭제됩니다.
            </li>
            <li>단, 법령에 따라 보관이 필요한 경우 해당 기간 동안 안전하게 보관합니다.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">5. 이용자의 권리</h2>
          <p>
            이용자는 자신의 개인정보에 대해 열람/정정/삭제/처리정지 등을 요청할 수 있습니다. 요청은
            아래 문의처로 접수해 주세요.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">6. 쿠키 및 유사 기술</h2>
          <p>
            서비스는 로그인 유지, 환경설정, 분석 등을 위해 쿠키 및 유사 기술을 사용할 수 있습니다.
            브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나, 일부 기능이 제한될 수 있습니다.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">7. 보안</h2>
          <p>
            서비스는 개인정보 보호를 위해 접근 통제, 전송 구간 암호화 등 합리적인 보호조치를
            적용합니다.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">8. 문의처</h2>
          <p>
            개인정보 처리와 관련한 문의는 아래로 연락해 주세요.
            <br />
            이메일: support@nod-archive.com
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">9. 변경</h2>
          <p>
            본 방침은 변경될 수 있으며, 중요한 변경이 있는 경우 서비스 내 공지 또는 별도 안내를 통해
            고지합니다.
          </p>
        </section>
      </div>
    </main>
  );
}
