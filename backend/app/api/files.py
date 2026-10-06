from pathlib import Path

from fastapi.responses import FileResponse

_MEDIA_TYPES = {
    ".pdf": "application/pdf",
    ".zip": "application/zip",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".txt": "text/plain",
    ".csv": "text/csv",
    ".mp4": "video/mp4",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}


def download_response(path: Path) -> FileResponse:
    suffix = path.suffix.lower()
    media_type = _MEDIA_TYPES.get(suffix, "application/octet-stream")
    filename = f"download{suffix}" if suffix in _MEDIA_TYPES else "download.bin"
    return FileResponse(path, media_type=media_type, filename=filename, content_disposition_type="attachment")
