from pathlib import Path

from app.measure import directory_bytes


def test_directory_bytes_counts_only_file_content(tmp_path: Path) -> None:
    (tmp_path / "nested").mkdir()
    (tmp_path / "first.bin").write_bytes(b"abc")
    (tmp_path / "nested" / "second.bin").write_bytes(b"12345")

    assert directory_bytes(tmp_path) == 8
