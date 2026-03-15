import pytest

from src.lib import telemetry


class _FakeTracerProvider:
    def __init__(self, *_args: object, **_kwargs: object) -> None:
        self.processors: list[object] = []

    def add_span_processor(self, processor: object) -> None:
        self.processors.append(processor)


@pytest.mark.asyncio
async def test_configure_telemetry_skips_console_exporter_under_pytest(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    provider = _FakeTracerProvider()

    monkeypatch.setattr(telemetry.settings, "PROJECT_ENV", "local")
    monkeypatch.setattr(telemetry.settings, "OTEL_EXPORTER_OTLP_ENDPOINT", None)
    monkeypatch.setattr(telemetry, "TracerProvider", lambda resource: provider)
    monkeypatch.setattr(telemetry.trace, "set_tracer_provider", lambda _provider: None)

    def _unexpected_console_exporter() -> object:
        raise AssertionError("ConsoleSpanExporter should not be created during pytest")

    monkeypatch.setattr(telemetry, "ConsoleSpanExporter", _unexpected_console_exporter)

    telemetry.configure_telemetry()

    assert provider.processors == []
