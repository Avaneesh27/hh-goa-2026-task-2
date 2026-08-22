from __future__ import annotations

from unittest.mock import MagicMock, patch

from app.ingest import stream_parquet_rows


def test_parquet_reader_configures_long_lived_http_session() -> None:
    remote_file = MagicMock()
    remote_file.__enter__.return_value = remote_file
    parquet = MagicMock()
    parquet.iter_batches.return_value = []

    with patch("fsspec.open", return_value=remote_file) as mocked_open, patch(
        "pyarrow.parquet.ParquetFile", return_value=parquet
    ):
        assert list(stream_parquet_rows("https://example.test/corpus.parquet", 0)) == []

    kwargs = mocked_open.call_args.kwargs
    assert kwargs["block_size"] == 8 * 1024**2
    assert kwargs["client_kwargs"]["timeout"].sock_read == 900
