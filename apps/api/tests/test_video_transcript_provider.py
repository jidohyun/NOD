from types import SimpleNamespace

from youtube_transcript_api.proxies import GenericProxyConfig, WebshareProxyConfig

from src.lib.video_transcript import provider


def test_build_youtube_proxy_config_returns_none_without_settings(
    monkeypatch,
) -> None:
    monkeypatch.setattr(
        provider,
        "settings",
        SimpleNamespace(
            VIDEO_TRANSCRIPT_PROXY_WEBSHARE_USERNAME=None,
            VIDEO_TRANSCRIPT_PROXY_WEBSHARE_PASSWORD=None,
            VIDEO_TRANSCRIPT_PROXY_WEBSHARE_LOCATIONS="",
            VIDEO_TRANSCRIPT_PROXY_RETRIES_WHEN_BLOCKED=10,
            VIDEO_TRANSCRIPT_PROXY_HTTP_URL=None,
            VIDEO_TRANSCRIPT_PROXY_HTTPS_URL=None,
        ),
    )

    assert provider.build_youtube_proxy_config() is None


def test_build_youtube_proxy_config_uses_generic_proxy(monkeypatch) -> None:
    monkeypatch.setattr(
        provider,
        "settings",
        SimpleNamespace(
            VIDEO_TRANSCRIPT_PROXY_WEBSHARE_USERNAME=None,
            VIDEO_TRANSCRIPT_PROXY_WEBSHARE_PASSWORD=None,
            VIDEO_TRANSCRIPT_PROXY_WEBSHARE_LOCATIONS="",
            VIDEO_TRANSCRIPT_PROXY_RETRIES_WHEN_BLOCKED=10,
            VIDEO_TRANSCRIPT_PROXY_HTTP_URL="http://proxy.internal:8080",
            VIDEO_TRANSCRIPT_PROXY_HTTPS_URL=None,
        ),
    )

    proxy_config = provider.build_youtube_proxy_config()

    assert isinstance(proxy_config, GenericProxyConfig)
    assert proxy_config.to_requests_dict() == {
        "http": "http://proxy.internal:8080",
        "https": "http://proxy.internal:8080",
    }


def test_build_youtube_proxy_config_prefers_webshare(monkeypatch) -> None:
    monkeypatch.setattr(
        provider,
        "settings",
        SimpleNamespace(
            VIDEO_TRANSCRIPT_PROXY_WEBSHARE_USERNAME="user",
            VIDEO_TRANSCRIPT_PROXY_WEBSHARE_PASSWORD="proxy-pass",  # noqa: S106
            VIDEO_TRANSCRIPT_PROXY_WEBSHARE_LOCATIONS="kr, jp",
            VIDEO_TRANSCRIPT_PROXY_RETRIES_WHEN_BLOCKED=7,
            VIDEO_TRANSCRIPT_PROXY_HTTP_URL="http://proxy.internal:8080",
            VIDEO_TRANSCRIPT_PROXY_HTTPS_URL="https://proxy.internal:8443",
        ),
    )

    proxy_config = provider.build_youtube_proxy_config()

    assert isinstance(proxy_config, WebshareProxyConfig)
    assert proxy_config.to_requests_dict() == {
        "http": "http://user-KR-JP-rotate:proxy-pass@p.webshare.io:80/",
        "https": "http://user-KR-JP-rotate:proxy-pass@p.webshare.io:80/",
    }
    assert proxy_config.retries_when_blocked == 7
