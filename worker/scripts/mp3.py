"""
Ses dosyası üretimi ve sıkıştırma.

EMA 24 kHz mono ses üretiyor. Uzun haberlerde varsayılan MP3 kodlama
(~128 kbps) veritabanına sığmıyor (tek satır sınırı ~6 MB) ve indirmek de
yavaş. ffmpeg varsa ses 24 kHz / 48 kbps'e çevrilir: konuşma için kalite
yeterli, dosya dörtte birine iner.
"""

import os
import shutil
import subprocess
import tempfile


def has_ffmpeg() -> bool:
    return shutil.which("ffmpeg") is not None


def encode_pcm(pcm, sample_rate: int = 24000, bitrate: str = "48k") -> bytes:
    """
    PCM (numpy dizisi) -> sıkıştırılmış MP3 baytları.
    ffmpeg yoksa soundfile'ın varsayılan kodlamasına düşer.
    """
    if has_ffmpeg():
        try:
            with tempfile.NamedTemporaryFile(suffix=".raw", delete=False) as raw:
                raw.write(pcm.astype("<i2").tobytes())
                raw_path = raw.name
            out_path = raw_path + ".mp3"
            cmd = [
                "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                "-f", "s16le", "-ar", str(sample_rate), "-ac", "1", "-i", raw_path,
                "-codec:a", "libmp3lame", "-b:a", bitrate, "-ar", str(sample_rate),
                out_path,
            ]
            subprocess.run(cmd, check=True, timeout=240)
            with open(out_path, "rb") as f:
                data = f.read()
            os.unlink(raw_path)
            os.unlink(out_path)
            return data
        except Exception:
            pass

    # ffmpeg yoksa: soundfile ile yaz
    import io

    import soundfile as sf

    buf = io.BytesIO()
    sf.write(buf, pcm, sample_rate, format="MP3")
    return buf.getvalue()
