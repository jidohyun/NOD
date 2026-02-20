class VideoTranscriptError(Exception):
    pass


class UnsupportedVideoUrlError(VideoTranscriptError):
    pass


class TranscriptUnavailableError(VideoTranscriptError):
    pass


class TranscriptProviderError(VideoTranscriptError):
    def __init__(self, message: str, *, is_transient: bool) -> None:
        super().__init__(message)
        self.is_transient = is_transient
