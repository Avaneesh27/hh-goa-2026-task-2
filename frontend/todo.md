# Motion Expansion Tasks

- [x] Define scroll-triggered story beats that reinforce the voice-to-evidence journey.
- [x] Add a lightweight layered 3D field that moves with scroll and pointer position.
- [x] Expand the page with new evidence, processing, and trust-oriented visual elements.
- [x] Preserve reduced-motion behavior, contrast, focus states, and mobile readability.
- [x] Review desktop and mobile composition before requesting user approval.

# Scroll Sequence Background Tasks

- [x] Inspect the uploaded frames and identify their visual progression, dimensions, and usable range.
- [x] Select and optimize an appropriate set of frames for smooth browser playback.
- [x] Upload the selected assets to project storage and build scroll-synchronized background playback.
- [x] Review desktop and mobile motion, readability, reduced-motion behavior, and loading cost.

# Full-Sequence Parallax Rebuild Tasks

- [x] Inventory every supplied frame and generate optimized web assets for the complete sequence.
- [x] Replace the curated sequence with frame-accurate playback across the entire supplied animation.
- [x] Recompose the primary site experience as a pinned parallax narrative around the microphone animation.
- [x] Verify the full sequence completes before the page releases to supporting content on desktop and mobile.

# No-Gap Parallax Fix

- [x] Keep the microphone stage viewport-fixed until the complete frame sequence finishes.
- [x] Remove the empty release interval and hand off directly to the product content.
- [x] Verify continuous scrolling on desktop and mobile.
- [ ] Run and document a full mobile scroll verification from sequence start through the final handoff to product content.

# Brighter 100-Frame Sequence Refinement

- [x] Limit the active parallax playhead to the first 100 uploaded frames.
- [x] Brighten the microphone imagery and reduce dark overlay intensity.
- [x] Smooth the scroll-linked frame progression and verify it on desktop and mobile.

# Playback Chrome Cleanup

- [x] Remove the playhead caption, stage/progress tracker, frame number, and bottom stage marker from the animation.
- [x] Verify the cleaned composition on desktop and mobile.

# Natural Editorial Cleanup

- [x] Remove every decorative text overlap and blue highlight block that obscures copy.
- [x] Normalize headline size, line-height, contrast, and spacing across all sections.
- [x] Simplify surface effects so the page reads as a composed product interface rather than generated decoration.
- [x] Verify desktop and mobile text legibility before requesting approval.

# Reversible Scroll Animation Polish

- [x] Replace discrete frame updates with a continuously interpolated reversible playhead.
- [x] Increase forward and reverse frame buffering to prevent loading flashes.
- [x] Verify smooth down-scroll and up-scroll playback on desktop and mobile.

# Backend-Only Full-Corpus RAG Build

- [x] Preserve the approved frontend without further changes unless the user explicitly requests them.
- [x] Validate corpus size, storage, compute, and deployment constraints for complete MSMARCO-XI ingestion.
- [x] Upgrade the project with secure backend and database support for the RAG API.
- [x] Integrate Sarvam speech-to-text through a server-side secret only.
- [x] Implement deterministic local hybrid retrieval, extractive answering, citations, and abstention without an LLM.
- [x] Add a seeded local hybrid-retrieval integration test covering dense search, lexical search, fusion, reranking, citations, and abstention.
- [x] Return structured backend outcomes when the vector collection, lexical index, or local ranking models are unavailable.
- [x] Add a seeded hybrid-path abstention test using the real dense, lexical, fusion, and reranking flow.
- [x] Test a reranker-load failure and verify deterministic fallback ranking returns a structured response.
- [x] Verify that ingestion writes the named-vector and payload contract required by runtime retrieval.
- [x] Build resumable ingestion for every requested dataset row, with durable progress and index integrity checks.
- [x] Read back a locally indexed Qdrant point and lexical row to validate the exact runtime vector and payload contract.
- [x] Validate the parser against real sampled MSMARCO-XI configuration metadata and published row schema from Hugging Face.
- [x] Test checkpoint recovery by resuming after an interrupted batch and verifying index integrity and reject accounting.
- [ ] Benchmark retrieval quality and backend behavior before final delivery.

# Dedicated-Server Deployment

- [x] Produce a server specification, storage plan, and deployment topology for the full index.
- [x] Package the backend, vector service, sparse index, and ingestion worker for durable dedicated-server deployment.
- [x] Document secure secret handling, restart behavior, index snapshots, and recovery procedures.

# RTX 4050 Local Deployment

- [ ] Confirm the user’s NVIDIA driver, CUDA availability, system RAM, and free SSD capacity.
- [ ] Connect the user’s computer and a working folder for GPU-local deployment.
- [ ] Add GPU-aware container configuration and local operating instructions.
- [ ] Run the full 14-shard ingestion and real-validation benchmark on the user’s computer.

# Windows RTX 4050 Capacity Decision

- [ ] Select a safe all-corpus strategy: add storage, use an external index host, or limit the local corpus scope.
- [ ] Bind a Windows working folder after the user selects the deployment strategy.
- [x] Recalculate storage from the dataset’s passage-level structure before accepting any local full-corpus build.
- [x] Confirm the 500 GB local-space constraint is insufficient before starting any complete all-row ingestion.

# 50 GB Submission-Mode Local RAG

- [x] Set a hard disk ceiling and RAM-safe batch limits for the RTX 4050 local runtime.
- [x] Define an explicit scoped-corpus cap that fits the 24-hour, 50 GB submission environment.
- [x] Benchmark representative submission-mode disk growth and throughput before accepting the 50,000-row-per-shard cap.
- [ ] Update and verify the canonical submission launcher with the measured cap and reserve, or document its replacement by the local-only launcher.
- [x] Create Windows GPU runtime instructions and a one-command guarded local startup path.
- [ ] Run and document a Windows-bound-folder smoke test of the guarded launcher, including preflight, measurement, cap selection, and ingestion start.

# Restored All-Row Local Corpus Objective

- [ ] Inspect the bound Windows folder, GPU availability, RAM, and actual free space before full-corpus startup.
- [ ] Confirm the drive has capacity for the all-row index and recovery headroom before removing the submission cap.
- [ ] Start and monitor all 11,451,314 requested rows with durable checkpoints and index-health reporting.

# Bound Windows Preflight Blockers

- [ ] Repair the NVIDIA driver/NVML state so `nvidia-smi` can access the RTX 4050.
- [ ] Install a supported local Python runtime and Docker Desktop with Linux containers.
- [ ] Add or select sufficient storage before starting an all-row index; 479 GiB free is not a safe full-corpus budget.
- [ ] Validate transcription, retrieval, extractive answer, citation, and abstention on the capped local index.
- [ ] Reassess the bound Windows drive after the user’s reported storage expansion and confirm full-index recovery headroom.
- [ ] Store model caches and backend runtime artifacts on C drive only; reserve F drive for Qdrant vector-index data.
- [ ] Harden Windows remote Parquet reads against long HTTP range-request timeouts before measuring or starting ingestion.
- [ ] Execute all remaining runtime, measurement, indexing, and validation work on the bound Windows machine only.
- [ ] Prefer the fastest stable Windows-local corpus-read and indexing route over slow remote range streaming for the submission run.
- [ ] Resume the full 11,451,314-row Windows-only MSMARCO-XI build after the user’s connection check, using measured safety stops.
- [ ] Prefer fully downloaded Windows-local Parquet shards over remote range reads once each shard is available.
- [ ] Verify each completed Windows-local Parquet shard can be parsed before using it for measurement or ingestion.
- [ ] Validate the complete official Windows-local shard set placed in `F:\hh-goa-rag-data\raw-shards\train` before beginning the all-row build.
- [ ] Restore RTX 4050 CUDA availability and verify at least 4 TB usable Windows-local storage before the complete all-row build.
- [ ] Execute authorized Windows deployment steps directly while retaining measured data-integrity, GPU-availability, and disk-capacity safeguards.
- [ ] Complete the user-approved official NVIDIA App installation and validate post-restart CUDA availability on Windows.
- [ ] Obtain a Windows-verifiable signed NVIDIA driver installer before execution; the downloaded NVIDIA App binary reported no Authenticode signature.
- [ ] Verify NVML and PyTorch CUDA after the user-confirmed Windows driver restart.
- [ ] Recheck NVML after the user-confirmed elevated NVIDIA Display Container service restart.
- [ ] Verify NVML, CUDA, and GPU compute after the user-confirmed NVIDIA driver update.
- [ ] Resume post-update GPU verification after the Windows desktop connection is restored.
- [x] Verify CUDA-enabled PyTorch detects the RTX 4050 and completes an on-device tensor computation.
- [ ] Resolve the separate `nvidia-smi` NVML utility failure; GPU compute is verified through CUDA despite this command-path issue.
- [ ] Use only the existing Windows storage for the maximum safe GPU-backed corpus index, with a hard recovery reserve.
- [x] Add a Windows local-only shard ingestion option so completed Parquet files can be indexed without remote fallback.
- [x] Create and run a Windows local-only GPU launcher with a 60 GiB disk reserve and durable output log.
- [x] Allow informational Python stderr logging in the local-only launcher without treating it as a fatal PowerShell error.
- [x] Exclude incomplete local Parquet files from local-only shard selection before guarded ingestion.
- [x] Document a clean end-to-end local-only launcher pass showing preflight, checkpoint movement, stable logging, and the 60 GiB reserve.
- [x] Run a controlled 64-record versus 256-record guarded write-batch benchmark and document comparable checkpoint, elapsed-time, and free-space evidence.
- [x] Perform a controlled restart from a nonzero real checkpoint and verify cumulative indexed-passage and rejected-row counters are retained.
- [x] Diagnose and validate a real-corpus positive extractive answer with citations, in addition to the confirmed abstention path.
- [x] Audit the active Windows indexer, disk reserve, and completed official local shard inventory before expansion.
- [x] Download the next official MSMARCO-XI shard sequentially to a temporary file without remote-index fallback.
- [x] Validate each newly completed official Parquet shard before it becomes eligible for local-only ingestion.
- [ ] Continue the guarded 115,000-rows-per-shard local-only ingestion across every validated local shard.
- [ ] Record safe multi-shard corpus coverage and the remaining physical limit of the existing Windows storage.
- [ ] Acquire and validate each remaining official shard sequentially before extending the local-only corpus again.
- [x] Explicitly verify the scheduled detached worker survives remote terminal closure while retaining checkpoint and disk safeguards.
- [x] Verify sustained checkpoint movement from the detached local worker before resuming further shard-download orchestration.
- [x] Define four independently checkpointed 25% portions of the 115,000-row safe per-shard cap.
- [ ] Run and verify the first detached 25% ingestion portion before advancing to portions two through four.
- [ ] Execute portions two, three, and four only after their preceding checkpoint and 60 GiB reserve checks pass.
- [x] Pause the active detached portion worker and preserve the current checkpoint, validated local shards, index data, and disabled later-portion tasks for user-initiated resumption.
- [x] Resume the preserved detached portion-1 worker from its existing 8,110-row checkpoint and verify safe forward movement.
- [x] Audit the Windows worker, partial Hindi shard, durable checkpoint, and F-drive reserve after reconnection before further ingestion actions.
- [ ] Prevent the detached portion-1 ingestion task from terminating with a Ctrl+C interruption and verify a stable restart from row 12,612.
- [ ] Benchmark the highest safe GPU embedding and write-batch configuration without removing the 60 GiB disk guard.
- [ ] Run the highest stable throughput configuration and measure actual five-hour indexed-row output against the requested 3,000,000-row target.
- [ ] Prioritize balanced indexed coverage across every language shard before increasing any single-language depth.
- [ ] Complete the deadline-driven official-shard acquisition, validation, and multilingual coverage record without removing the disk reserve.
- [x] Pause all accelerated Windows-local indexing and official-shard download processes while preserving durable state for resumption.
- [x] Copy the approved frozen frontend source and local setup notes into the requested Windows HHGOARAG2026 folder without altering the live project.

# High-Utilization RTX 4050 Policy

- [x] Enable CUDA for local embedding and reranking while retaining a hard disk reserve and controlled batch size.
- [x] Set the submission corpus cap and stop conditions before connecting the Windows machine.
