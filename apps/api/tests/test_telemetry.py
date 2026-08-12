import pytest

from src.lib import telemetry


class _FakeTracerProvider:
    def __init__(self, *_args: object, **_kwargs: object) -> None:
        self.processors: list[object] = []

    def add_span_processor(self, processor: object) -> None:
        self.processors.append(processor)


@pytest.mark.asyncio
async def test_configure_telemetry_adds_console_exporter_for_local(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    provider = _FakeTracerProvider()

    monkeypatch.setattr(telemetry.settings, "PROJECT_ENV", "local")
    monkeypatch.setattr(telemetry.settings, "OTEL_EXPORTER_OTLP_ENDPOINT", None)
    monkeypatch.setattr(telemetry, "TracerProvider", lambda resource: provider)
    monkeypatch.setattr(telemetry.trace, "set_tracer_provider", lambda _provider: None)

    telemetry.configure_telemetry()

    assert len(provider.processors) == 1
