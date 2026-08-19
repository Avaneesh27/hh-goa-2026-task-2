# Multilingual Reinforcement Learning (RL) Training & Efficiency Narration

**Started At**: 2026-08-18 20:09:10
**Last Updated**: 2026-08-18 22:43:35

## 1. Key Milestones

### Baseline Multi-Language Efficiency (2026-08-18 20:10:03)
Initial baseline across Indic languages: Recall@1: 91.62%, Recall@5: 97.94%, MRR@10: 0.9433, p50 Latency: 4.67 ms.

```json
{
  "macro_recall_1": 91.62,
  "macro_recall_5": 97.94,
  "macro_mrr_10": 0.9433,
  "p50_latency_ms": 4.67,
  "p95_latency_ms": 13.25,
  "languages_evaluated": 7,
  "per_language": {
    "hi": {
      "name": "Hindi",
      "recall_1": 94.23,
      "recall_5": 99.04,
      "mrr_10": 0.9589,
      "latency_per_query_ms": 16.84
    },
    "bn": {
      "name": "Bengali",
      "recall_1": 91.35,
      "recall_5": 96.15,
      "mrr_10": 0.937,
      "latency_per_query_ms": 4.87
    },
    "mr": {
      "name": "Marathi",
      "recall_1": 92.31,
      "recall_5": 95.19,
      "mrr_10": 0.9374,
      "latency_per_query_ms": 4.67
    },
    "ta": {
      "name": "Tamil",
      "recall_1": 82.69,
      "recall_5": 99.04,
      "mrr_10": 0.8933,
      "latency_per_query_ms": 4.71
    },
    "te": {
      "name": "Telugu",
      "recall_1": 91.35,
      "recall_5": 97.12,
      "mrr_10": 0.9429,
      "latency_per_query_ms": 4.48
    },
    "gu": {
      "name": "Gujarati",
      "recall_1": 90.38,
      "recall_5": 99.04,
      "mrr_10": 0.9397,
      "latency_per_query_ms": 4.66
    },
    "en": {
      "name": "English",
      "recall_1": 99.04,
      "recall_5": 100.0,
      "mrr_10": 0.9936,
      "latency_per_query_ms": 4.09
    }
  }
}
```

### Final Post-RL Multi-Language Efficiency Benchmark (2026-08-18 22:43:35)
RL Policy Optimization Complete. Final Macro Recall@1: 7.35%, Recall@5: 18.97%, MRR@10: 0.1218, p50 Latency: 73.94 ms across 15 languages.

```json
{
  "macro_recall_1": 7.35,
  "macro_recall_5": 18.97,
  "macro_mrr_10": 0.1218,
  "p50_latency_ms": 73.94,
  "p95_latency_ms": 98.15,
  "languages_evaluated": 15,
  "per_language": {
    "hi": {
      "name": "Hindi",
      "recall_1": 9.68,
      "recall_5": 20.65,
      "mrr_10": 0.1431,
      "latency_per_query_ms": 123.05
    },
    "bn": {
      "name": "Bengali",
      "recall_1": 5.81,
      "recall_5": 21.94,
      "mrr_10": 0.1242,
      "latency_per_query_ms": 67.45
    },
    "mr": {
      "name": "Marathi",
      "recall_1": 3.87,
      "recall_5": 15.48,
      "mrr_10": 0.0889,
      "latency_per_query_ms": 51.7
    },
    "ta": {
      "name": "Tamil",
      "recall_1": 7.74,
      "recall_5": 18.06,
      "mrr_10": 0.1165,
      "latency_per_query_ms": 66.08
    },
    "te": {
      "name": "Telugu",
      "recall_1": 9.03,
      "recall_5": 17.42,
      "mrr_10": 0.1298,
      "latency_per_query_ms": 67.94
    },
    "gu": {
      "name": "Gujarati",
      "recall_1": 5.81,
      "recall_5": 17.42,
      "mrr_10": 0.1083,
      "latency_per_query_ms": 74.22
    },
    "kn": {
      "name": "Kannada",
      "recall_1": 5.16,
      "recall_5": 19.35,
      "mrr_10": 0.1098,
      "latency_per_query_ms": 76.92
    },
    "ml": {
      "name": "Malayalam",
      "recall_1": 7.1,
      "recall_5": 20.65,
      "mrr_10": 0.1332,
      "latency_per_query_ms": 82.43
    },
    "pa": {
      "name": "Punjabi",
      "recall_1": 5.16,
      "recall_5": 18.06,
      "mrr_10": 0.0995,
      "latency_per_query_ms": 71.41
    },
    "or": {
      "name": "Odia",
      "recall_1": 8.39,
      "recall_5": 20.0,
      "mrr_10": 0.1396,
      "latency_per_query_ms": 73.94
    },
    "as": {
      "name": "Assamese",
      "recall_1": 3.87,
      "recall_5": 14.84,
      "mrr_10": 0.0757,
      "latency_per_query_ms": 82.25
    },
    "ne": {
      "name": "Nepali",
      "recall_1": 8.39,
      "recall_5": 19.35,
      "mrr_10": 0.1273,
      "latency_per_query_ms": 71.53
    },
    "sa": {
      "name": "Sanskrit",
      "recall_1": 5.16,
      "recall_5": 14.19,
      "mrr_10": 0.087,
      "latency_per_query_ms": 87.47
    },
    "ur": {
      "name": "Urdu",
      "recall_1": 9.03,
      "recall_5": 19.35,
      "mrr_10": 0.135,
      "latency_per_query_ms": 76.07
    },
    "en": {
      "name": "English",
      "recall_1": 16.13,
      "recall_5": 27.74,
      "mrr_10": 0.2092,
      "latency_per_query_ms": 43.33
    }
  }
}
```

## 2. Chronological Step-by-Step Narration Log

| Timestamp | Elapsed | Task | Step | Key Metrics | Narrative Description |
| :--- | :--- | :--- | :---: | :--- | :--- |
| 2026-08-18 21:20:29 | 1:11:19 | RL Optimization (Epoch 1) | 1500 | **rl_loss**: 0.2081<br>**dpo_loss**: 0.2079<br>**reward_pos**: 0.9231 | Processed batch 1500/1602 [47.0% time elapsed]. Policy alignment margin: 1.1271, Positive Reward: 0.9231, DPO Loss: 0.2079, KL Div: 0.00423. |
| 2026-08-18 21:20:29 | 1:11:19 | Periodic RAG Efficiency Check | 1500 |  | Executing periodic multi-lingual efficiency evaluation at step 1500. |
| 2026-08-18 21:20:38 | 1:11:27 | Efficiency Check Results | 1500 | **recall_5**: 20.3300<br>**mrr_10**: 0.1371<br>**p50_latency_ms**: 6.5300 | Current Multilingual Policy Performance -> Recall@1: 8.65%, Recall@5: 20.33%, MRR@10: 0.1371, p50 Latency: 6.53 ms. |
| 2026-08-18 21:20:40 | 1:11:30 | Checkpoint & Model Persistence | 1500 |  | Saved intermediate RL checkpoint to 'checkpoints/rl_policy\rl_policy_step_1500.pt' and updated active model at 'models/msmarco-xi-multilingual-rl-biencoder'. |
| 2026-08-18 21:21:50 | 1:12:39 | RL Optimization (Epoch 1) | 1525 | **rl_loss**: 0.2785<br>**dpo_loss**: 0.2783<br>**reward_pos**: 0.8031 | Processed batch 1525/1602 [47.8% time elapsed]. Policy alignment margin: 0.9476, Positive Reward: 0.8031, DPO Loss: 0.2783, KL Div: 0.00425. |
| 2026-08-18 21:22:58 | 1:13:48 | RL Optimization (Epoch 1) | 1550 | **rl_loss**: 0.3075<br>**dpo_loss**: 0.3073<br>**reward_pos**: 0.8317 | Processed batch 1550/1602 [48.6% time elapsed]. Policy alignment margin: 0.7890, Positive Reward: 0.8317, DPO Loss: 0.3073, KL Div: 0.00422. |
| 2026-08-18 21:24:06 | 1:14:55 | RL Optimization (Epoch 1) | 1575 | **rl_loss**: 0.2209<br>**dpo_loss**: 0.2207<br>**reward_pos**: 0.9255 | Processed batch 1575/1602 [49.4% time elapsed]. Policy alignment margin: 1.1371, Positive Reward: 0.9255, DPO Loss: 0.2207, KL Div: 0.00430. |
| 2026-08-18 21:25:14 | 1:16:04 | RL Optimization (Epoch 1) | 1600 | **rl_loss**: 0.2778<br>**dpo_loss**: 0.2776<br>**reward_pos**: 0.8454 | Processed batch 1600/1602 [50.1% time elapsed]. Policy alignment margin: 0.9191, Positive Reward: 0.8454, DPO Loss: 0.2776, KL Div: 0.00416. |
| 2026-08-18 21:25:18 | 1:16:08 | RL Epoch 1 Completed | 1602 |  | Epoch 1 finished. Average Loss: 0.3414, Mean Positive Reward: 0.8263, Mean Negative Reward: 0.1578, Average Margin: 0.7173. |
| 2026-08-18 21:25:18 | 1:16:08 | RL Epoch 2 Launch | 1602 |  | Starting RL Training Epoch 2 covering all 15 languages (51,240 samples, 1602 batches). |
| 2026-08-18 21:26:18 | 1:17:08 | RL Optimization (Epoch 2) | 1625 | **rl_loss**: 0.1972<br>**dpo_loss**: 0.1970<br>**reward_pos**: 0.9323 | Processed batch 23/1602 [50.8% time elapsed]. Policy alignment margin: 1.1768, Positive Reward: 0.9323, DPO Loss: 0.1970, KL Div: 0.00407. |
| 2026-08-18 21:27:26 | 1:18:16 | RL Optimization (Epoch 2) | 1650 | **rl_loss**: 0.3013<br>**dpo_loss**: 0.3011<br>**reward_pos**: 0.8464 | Processed batch 48/1602 [51.6% time elapsed]. Policy alignment margin: 0.9194, Positive Reward: 0.8464, DPO Loss: 0.3011, KL Div: 0.00414. |
| 2026-08-18 21:27:26 | 1:18:16 | Periodic RAG Efficiency Check | 1650 |  | Executing periodic multi-lingual efficiency evaluation at step 1650. |
| 2026-08-18 21:27:35 | 1:18:25 | Efficiency Check Results | 1650 | **recall_5**: 24.0400<br>**mrr_10**: 0.1614<br>**p50_latency_ms**: 5.0900 | Current Multilingual Policy Performance -> Recall@1: 10.44%, Recall@5: 24.04%, MRR@10: 0.1614, p50 Latency: 5.09 ms. |
| 2026-08-18 21:28:43 | 1:19:32 | RL Optimization (Epoch 2) | 1675 | **rl_loss**: 0.2468<br>**dpo_loss**: 0.2466<br>**reward_pos**: 0.8772 | Processed batch 73/1602 [52.4% time elapsed]. Policy alignment margin: 1.0090, Positive Reward: 0.8772, DPO Loss: 0.2466, KL Div: 0.00425. |
| 2026-08-18 21:29:54 | 1:20:44 | RL Optimization (Epoch 2) | 1700 | **rl_loss**: 0.3239<br>**dpo_loss**: 0.3237<br>**reward_pos**: 0.8735 | Processed batch 98/1602 [53.2% time elapsed]. Policy alignment margin: 0.7723, Positive Reward: 0.8735, DPO Loss: 0.3237, KL Div: 0.00406. |
| 2026-08-18 21:31:04 | 1:21:54 | RL Optimization (Epoch 2) | 1725 | **rl_loss**: 0.2748<br>**dpo_loss**: 0.2746<br>**reward_pos**: 0.8666 | Processed batch 123/1602 [54.0% time elapsed]. Policy alignment margin: 1.0643, Positive Reward: 0.8666, DPO Loss: 0.2746, KL Div: 0.00431. |
| 2026-08-18 21:32:15 | 1:23:05 | RL Optimization (Epoch 2) | 1750 | **rl_loss**: 0.2756<br>**dpo_loss**: 0.2754<br>**reward_pos**: 0.8672 | Processed batch 148/1602 [54.8% time elapsed]. Policy alignment margin: 0.9879, Positive Reward: 0.8672, DPO Loss: 0.2754, KL Div: 0.00395. |
| 2026-08-18 21:33:23 | 1:24:13 | RL Optimization (Epoch 2) | 1775 | **rl_loss**: 0.2827<br>**dpo_loss**: 0.2825<br>**reward_pos**: 0.8778 | Processed batch 173/1602 [55.6% time elapsed]. Policy alignment margin: 0.9189, Positive Reward: 0.8778, DPO Loss: 0.2825, KL Div: 0.00422. |
| 2026-08-18 21:34:31 | 1:25:21 | RL Optimization (Epoch 2) | 1800 | **rl_loss**: 0.2267<br>**dpo_loss**: 0.2265<br>**reward_pos**: 0.9104 | Processed batch 198/1602 [56.3% time elapsed]. Policy alignment margin: 1.1102, Positive Reward: 0.9104, DPO Loss: 0.2265, KL Div: 0.00404. |
| 2026-08-18 21:34:31 | 1:25:21 | Periodic RAG Efficiency Check | 1800 |  | Executing periodic multi-lingual efficiency evaluation at step 1800. |
| 2026-08-18 21:34:40 | 1:25:30 | Efficiency Check Results | 1800 | **recall_5**: 23.4900<br>**mrr_10**: 0.1560<br>**p50_latency_ms**: 6.2900 | Current Multilingual Policy Performance -> Recall@1: 10.3%, Recall@5: 23.49%, MRR@10: 0.1560, p50 Latency: 6.29 ms. |
| 2026-08-18 21:34:43 | 1:25:32 | Checkpoint & Model Persistence | 1800 |  | Saved intermediate RL checkpoint to 'checkpoints/rl_policy\rl_policy_step_1800.pt' and updated active model at 'models/msmarco-xi-multilingual-rl-biencoder'. |
| 2026-08-18 21:35:53 | 1:26:43 | RL Optimization (Epoch 2) | 1825 | **rl_loss**: 0.2803<br>**dpo_loss**: 0.2801<br>**reward_pos**: 0.8493 | Processed batch 223/1602 [57.2% time elapsed]. Policy alignment margin: 0.9740, Positive Reward: 0.8493, DPO Loss: 0.2801, KL Div: 0.00430. |
| 2026-08-18 21:37:03 | 1:27:53 | RL Optimization (Epoch 2) | 1850 | **rl_loss**: 0.2227<br>**dpo_loss**: 0.2225<br>**reward_pos**: 0.8920 | Processed batch 248/1602 [58.0% time elapsed]. Policy alignment margin: 1.0903, Positive Reward: 0.8920, DPO Loss: 0.2225, KL Div: 0.00420. |
| 2026-08-18 21:38:14 | 1:29:04 | RL Optimization (Epoch 2) | 1875 | **rl_loss**: 0.2857<br>**dpo_loss**: 0.2855<br>**reward_pos**: 0.8874 | Processed batch 273/1602 [58.8% time elapsed]. Policy alignment margin: 0.9326, Positive Reward: 0.8874, DPO Loss: 0.2855, KL Div: 0.00449. |
| 2026-08-18 21:39:24 | 1:30:14 | RL Optimization (Epoch 2) | 1900 | **rl_loss**: 0.2357<br>**dpo_loss**: 0.2355<br>**reward_pos**: 0.9451 | Processed batch 298/1602 [59.6% time elapsed]. Policy alignment margin: 1.0512, Positive Reward: 0.9451, DPO Loss: 0.2355, KL Div: 0.00420. |
| 2026-08-18 21:40:35 | 1:31:24 | RL Optimization (Epoch 2) | 1925 | **rl_loss**: 0.2940<br>**dpo_loss**: 0.2937<br>**reward_pos**: 0.8325 | Processed batch 323/1602 [60.3% time elapsed]. Policy alignment margin: 0.8638, Positive Reward: 0.8325, DPO Loss: 0.2937, KL Div: 0.00433. |
| 2026-08-18 21:41:42 | 1:32:32 | RL Optimization (Epoch 2) | 1950 | **rl_loss**: 0.2475<br>**dpo_loss**: 0.2473<br>**reward_pos**: 0.8704 | Processed batch 348/1602 [61.1% time elapsed]. Policy alignment margin: 1.1084, Positive Reward: 0.8704, DPO Loss: 0.2473, KL Div: 0.00418. |
| 2026-08-18 21:41:42 | 1:32:32 | Periodic RAG Efficiency Check | 1950 |  | Executing periodic multi-lingual efficiency evaluation at step 1950. |
| 2026-08-18 21:41:51 | 1:32:41 | Efficiency Check Results | 1950 | **recall_5**: 21.5700<br>**mrr_10**: 0.1491<br>**p50_latency_ms**: 5.7600 | Current Multilingual Policy Performance -> Recall@1: 9.89%, Recall@5: 21.57%, MRR@10: 0.1491, p50 Latency: 5.76 ms. |
| 2026-08-18 21:42:59 | 1:33:49 | RL Optimization (Epoch 2) | 1975 | **rl_loss**: 0.2134<br>**dpo_loss**: 0.2132<br>**reward_pos**: 0.8734 | Processed batch 373/1602 [62.0% time elapsed]. Policy alignment margin: 1.1879, Positive Reward: 0.8734, DPO Loss: 0.2132, KL Div: 0.00434. |
| 2026-08-18 21:44:07 | 1:34:56 | RL Optimization (Epoch 2) | 2000 | **rl_loss**: 0.3186<br>**dpo_loss**: 0.3184<br>**reward_pos**: 0.8207 | Processed batch 398/1602 [62.7% time elapsed]. Policy alignment margin: 0.7837, Positive Reward: 0.8207, DPO Loss: 0.3184, KL Div: 0.00435. |
| 2026-08-18 21:45:17 | 1:36:07 | RL Optimization (Epoch 2) | 2025 | **rl_loss**: 0.2749<br>**dpo_loss**: 0.2746<br>**reward_pos**: 0.8924 | Processed batch 423/1602 [63.5% time elapsed]. Policy alignment margin: 0.9361, Positive Reward: 0.8924, DPO Loss: 0.2746, KL Div: 0.00427. |
| 2026-08-18 21:46:26 | 1:37:16 | RL Optimization (Epoch 2) | 2050 | **rl_loss**: 0.2680<br>**dpo_loss**: 0.2678<br>**reward_pos**: 0.8691 | Processed batch 448/1602 [64.3% time elapsed]. Policy alignment margin: 0.9083, Positive Reward: 0.8691, DPO Loss: 0.2678, KL Div: 0.00410. |
| 2026-08-18 21:47:37 | 1:38:27 | RL Optimization (Epoch 2) | 2075 | **rl_loss**: 0.2648<br>**dpo_loss**: 0.2646<br>**reward_pos**: 0.8681 | Processed batch 473/1602 [65.0% time elapsed]. Policy alignment margin: 1.0294, Positive Reward: 0.8681, DPO Loss: 0.2646, KL Div: 0.00429. |
| 2026-08-18 21:48:45 | 1:39:35 | RL Optimization (Epoch 2) | 2100 | **rl_loss**: 0.2704<br>**dpo_loss**: 0.2701<br>**reward_pos**: 0.8535 | Processed batch 498/1602 [65.8% time elapsed]. Policy alignment margin: 0.8319, Positive Reward: 0.8535, DPO Loss: 0.2701, KL Div: 0.00416. |
| 2026-08-18 21:48:45 | 1:39:35 | Periodic RAG Efficiency Check | 2100 |  | Executing periodic multi-lingual efficiency evaluation at step 2100. |
| 2026-08-18 21:48:54 | 1:39:43 | Efficiency Check Results | 2100 | **recall_5**: 21.5700<br>**mrr_10**: 0.1536<br>**p50_latency_ms**: 5.7800 | Current Multilingual Policy Performance -> Recall@1: 10.16%, Recall@5: 21.57%, MRR@10: 0.1536, p50 Latency: 5.78 ms. |
| 2026-08-18 21:48:56 | 1:39:46 | Checkpoint & Model Persistence | 2100 |  | Saved intermediate RL checkpoint to 'checkpoints/rl_policy\rl_policy_step_2100.pt' and updated active model at 'models/msmarco-xi-multilingual-rl-biencoder'. |
| 2026-08-18 21:50:08 | 1:40:58 | RL Optimization (Epoch 2) | 2125 | **rl_loss**: 0.2524<br>**dpo_loss**: 0.2521<br>**reward_pos**: 0.8703 | Processed batch 523/1602 [66.7% time elapsed]. Policy alignment margin: 1.0415, Positive Reward: 0.8703, DPO Loss: 0.2521, KL Div: 0.00425. |
| 2026-08-18 21:51:19 | 1:42:09 | RL Optimization (Epoch 2) | 2150 | **rl_loss**: 0.2250<br>**dpo_loss**: 0.2247<br>**reward_pos**: 0.9179 | Processed batch 548/1602 [67.5% time elapsed]. Policy alignment margin: 1.1719, Positive Reward: 0.9179, DPO Loss: 0.2247, KL Div: 0.00429. |
| 2026-08-18 21:52:28 | 1:43:18 | RL Optimization (Epoch 2) | 2175 | **rl_loss**: 0.2707<br>**dpo_loss**: 0.2705<br>**reward_pos**: 0.8540 | Processed batch 573/1602 [68.3% time elapsed]. Policy alignment margin: 0.9583, Positive Reward: 0.8540, DPO Loss: 0.2705, KL Div: 0.00425. |
| 2026-08-18 21:53:38 | 1:44:28 | RL Optimization (Epoch 2) | 2200 | **rl_loss**: 0.2688<br>**dpo_loss**: 0.2686<br>**reward_pos**: 0.8570 | Processed batch 598/1602 [69.1% time elapsed]. Policy alignment margin: 0.9934, Positive Reward: 0.8570, DPO Loss: 0.2686, KL Div: 0.00405. |
| 2026-08-18 21:54:46 | 1:45:36 | RL Optimization (Epoch 2) | 2225 | **rl_loss**: 0.3327<br>**dpo_loss**: 0.3325<br>**reward_pos**: 0.8219 | Processed batch 623/1602 [69.8% time elapsed]. Policy alignment margin: 0.8069, Positive Reward: 0.8219, DPO Loss: 0.3325, KL Div: 0.00408. |
| 2026-08-18 21:55:54 | 1:46:44 | RL Optimization (Epoch 2) | 2250 | **rl_loss**: 0.2433<br>**dpo_loss**: 0.2431<br>**reward_pos**: 0.9092 | Processed batch 648/1602 [70.6% time elapsed]. Policy alignment margin: 1.0640, Positive Reward: 0.9092, DPO Loss: 0.2431, KL Div: 0.00429. |
| 2026-08-18 21:55:54 | 1:46:44 | Periodic RAG Efficiency Check | 2250 |  | Executing periodic multi-lingual efficiency evaluation at step 2250. |
| 2026-08-18 21:56:03 | 1:46:53 | Efficiency Check Results | 2250 | **recall_5**: 23.2100<br>**mrr_10**: 0.1615<br>**p50_latency_ms**: 5.4400 | Current Multilingual Policy Performance -> Recall@1: 11.68%, Recall@5: 23.21%, MRR@10: 0.1615, p50 Latency: 5.44 ms. |
| 2026-08-18 21:57:14 | 1:48:04 | RL Optimization (Epoch 2) | 2275 | **rl_loss**: 0.2138<br>**dpo_loss**: 0.2136<br>**reward_pos**: 0.9184 | Processed batch 673/1602 [71.5% time elapsed]. Policy alignment margin: 1.1710, Positive Reward: 0.9184, DPO Loss: 0.2136, KL Div: 0.00410. |
| 2026-08-18 21:58:25 | 1:49:15 | RL Optimization (Epoch 2) | 2300 | **rl_loss**: 0.1991<br>**dpo_loss**: 0.1989<br>**reward_pos**: 0.9092 | Processed batch 698/1602 [72.2% time elapsed]. Policy alignment margin: 1.2443, Positive Reward: 0.9092, DPO Loss: 0.1989, KL Div: 0.00427. |
| 2026-08-18 21:59:33 | 1:50:23 | RL Optimization (Epoch 2) | 2325 | **rl_loss**: 0.2815<br>**dpo_loss**: 0.2813<br>**reward_pos**: 0.8724 | Processed batch 723/1602 [73.0% time elapsed]. Policy alignment margin: 0.9824, Positive Reward: 0.8724, DPO Loss: 0.2813, KL Div: 0.00437. |
| 2026-08-18 22:00:40 | 1:51:30 | RL Optimization (Epoch 2) | 2350 | **rl_loss**: 0.2071<br>**dpo_loss**: 0.2069<br>**reward_pos**: 0.8800 | Processed batch 748/1602 [73.7% time elapsed]. Policy alignment margin: 1.1398, Positive Reward: 0.8800, DPO Loss: 0.2069, KL Div: 0.00426. |
| 2026-08-18 22:01:47 | 1:52:37 | RL Optimization (Epoch 2) | 2375 | **rl_loss**: 0.3537<br>**dpo_loss**: 0.3535<br>**reward_pos**: 0.7657 | Processed batch 773/1602 [74.5% time elapsed]. Policy alignment margin: 0.6271, Positive Reward: 0.7657, DPO Loss: 0.3535, KL Div: 0.00433. |
| 2026-08-18 22:02:59 | 1:53:48 | RL Optimization (Epoch 2) | 2400 | **rl_loss**: 0.3118<br>**dpo_loss**: 0.3116<br>**reward_pos**: 0.8224 | Processed batch 798/1602 [75.3% time elapsed]. Policy alignment margin: 0.7911, Positive Reward: 0.8224, DPO Loss: 0.3116, KL Div: 0.00417. |
| 2026-08-18 22:02:59 | 1:53:48 | Periodic RAG Efficiency Check | 2400 |  | Executing periodic multi-lingual efficiency evaluation at step 2400. |
| 2026-08-18 22:03:07 | 1:53:57 | Efficiency Check Results | 2400 | **recall_5**: 21.9800<br>**mrr_10**: 0.1583<br>**p50_latency_ms**: 6.2500 | Current Multilingual Policy Performance -> Recall@1: 10.99%, Recall@5: 21.98%, MRR@10: 0.1583, p50 Latency: 6.25 ms. |
| 2026-08-18 22:03:10 | 1:54:00 | Checkpoint & Model Persistence | 2400 |  | Saved intermediate RL checkpoint to 'checkpoints/rl_policy\rl_policy_step_2400.pt' and updated active model at 'models/msmarco-xi-multilingual-rl-biencoder'. |
| 2026-08-18 22:04:17 | 1:55:07 | RL Optimization (Epoch 2) | 2425 | **rl_loss**: 0.2472<br>**dpo_loss**: 0.2469<br>**reward_pos**: 0.9067 | Processed batch 823/1602 [76.2% time elapsed]. Policy alignment margin: 1.0460, Positive Reward: 0.9067, DPO Loss: 0.2469, KL Div: 0.00438. |
| 2026-08-18 22:05:26 | 1:56:16 | RL Optimization (Epoch 2) | 2450 | **rl_loss**: 0.2718<br>**dpo_loss**: 0.2716<br>**reward_pos**: 0.8717 | Processed batch 848/1602 [76.9% time elapsed]. Policy alignment margin: 0.9416, Positive Reward: 0.8717, DPO Loss: 0.2716, KL Div: 0.00424. |
| 2026-08-18 22:06:33 | 1:57:23 | RL Optimization (Epoch 2) | 2475 | **rl_loss**: 0.2203<br>**dpo_loss**: 0.2201<br>**reward_pos**: 0.8734 | Processed batch 873/1602 [77.7% time elapsed]. Policy alignment margin: 1.0212, Positive Reward: 0.8734, DPO Loss: 0.2201, KL Div: 0.00439. |
| 2026-08-18 22:07:40 | 1:58:30 | RL Optimization (Epoch 2) | 2500 | **rl_loss**: 0.2982<br>**dpo_loss**: 0.2980<br>**reward_pos**: 0.8627 | Processed batch 898/1602 [78.4% time elapsed]. Policy alignment margin: 0.8673, Positive Reward: 0.8627, DPO Loss: 0.2980, KL Div: 0.00419. |
| 2026-08-18 22:08:50 | 1:59:40 | RL Optimization (Epoch 2) | 2525 | **rl_loss**: 0.1750<br>**dpo_loss**: 0.1748<br>**reward_pos**: 0.9158 | Processed batch 923/1602 [79.2% time elapsed]. Policy alignment margin: 1.2642, Positive Reward: 0.9158, DPO Loss: 0.1748, KL Div: 0.00441. |
| 2026-08-18 22:09:59 | 2:00:48 | RL Optimization (Epoch 2) | 2550 | **rl_loss**: 0.3017<br>**dpo_loss**: 0.3015<br>**reward_pos**: 0.8509 | Processed batch 948/1602 [79.9% time elapsed]. Policy alignment margin: 0.7887, Positive Reward: 0.8509, DPO Loss: 0.3015, KL Div: 0.00436. |
| 2026-08-18 22:09:59 | 2:00:48 | Periodic RAG Efficiency Check | 2550 |  | Executing periodic multi-lingual efficiency evaluation at step 2550. |
| 2026-08-18 22:10:07 | 2:00:57 | Efficiency Check Results | 2550 | **recall_5**: 21.2900<br>**mrr_10**: 0.1481<br>**p50_latency_ms**: 5.6600 | Current Multilingual Policy Performance -> Recall@1: 9.48%, Recall@5: 21.29%, MRR@10: 0.1481, p50 Latency: 5.66 ms. |
| 2026-08-18 22:11:19 | 2:02:09 | RL Optimization (Epoch 2) | 2575 | **rl_loss**: 0.1759<br>**dpo_loss**: 0.1756<br>**reward_pos**: 0.9688 | Processed batch 973/1602 [80.8% time elapsed]. Policy alignment margin: 1.2112, Positive Reward: 0.9688, DPO Loss: 0.1756, KL Div: 0.00418. |
| 2026-08-18 22:12:27 | 2:03:17 | RL Optimization (Epoch 2) | 2600 | **rl_loss**: 0.3471<br>**dpo_loss**: 0.3469<br>**reward_pos**: 0.8110 | Processed batch 998/1602 [81.6% time elapsed]. Policy alignment margin: 0.7585, Positive Reward: 0.8110, DPO Loss: 0.3469, KL Div: 0.00450. |
| 2026-08-18 22:13:37 | 2:04:26 | RL Optimization (Epoch 2) | 2625 | **rl_loss**: 0.2836<br>**dpo_loss**: 0.2834<br>**reward_pos**: 0.8693 | Processed batch 1023/1602 [82.4% time elapsed]. Policy alignment margin: 0.9789, Positive Reward: 0.8693, DPO Loss: 0.2834, KL Div: 0.00420. |
| 2026-08-18 22:14:45 | 2:05:35 | RL Optimization (Epoch 2) | 2650 | **rl_loss**: 0.2259<br>**dpo_loss**: 0.2257<br>**reward_pos**: 0.9218 | Processed batch 1048/1602 [83.1% time elapsed]. Policy alignment margin: 1.1857, Positive Reward: 0.9218, DPO Loss: 0.2257, KL Div: 0.00440. |
| 2026-08-18 22:15:55 | 2:06:44 | RL Optimization (Epoch 2) | 2675 | **rl_loss**: 0.2490<br>**dpo_loss**: 0.2488<br>**reward_pos**: 0.8955 | Processed batch 1073/1602 [83.9% time elapsed]. Policy alignment margin: 1.0794, Positive Reward: 0.8955, DPO Loss: 0.2488, KL Div: 0.00422. |
| 2026-08-18 22:17:09 | 2:07:59 | RL Optimization (Epoch 2) | 2700 | **rl_loss**: 0.2506<br>**dpo_loss**: 0.2504<br>**reward_pos**: 0.8711 | Processed batch 1098/1602 [84.7% time elapsed]. Policy alignment margin: 1.0069, Positive Reward: 0.8711, DPO Loss: 0.2504, KL Div: 0.00406. |
| 2026-08-18 22:17:09 | 2:07:59 | Periodic RAG Efficiency Check | 2700 |  | Executing periodic multi-lingual efficiency evaluation at step 2700. |
| 2026-08-18 22:17:17 | 2:08:07 | Efficiency Check Results | 2700 | **recall_5**: 20.6000<br>**mrr_10**: 0.1477<br>**p50_latency_ms**: 5.0600 | Current Multilingual Policy Performance -> Recall@1: 9.48%, Recall@5: 20.6%, MRR@10: 0.1477, p50 Latency: 5.06 ms. |
| 2026-08-18 22:17:19 | 2:08:09 | Checkpoint & Model Persistence | 2700 |  | Saved intermediate RL checkpoint to 'checkpoints/rl_policy\rl_policy_step_2700.pt' and updated active model at 'models/msmarco-xi-multilingual-rl-biencoder'. |
| 2026-08-18 22:18:31 | 2:09:21 | RL Optimization (Epoch 2) | 2725 | **rl_loss**: 0.2579<br>**dpo_loss**: 0.2577<br>**reward_pos**: 0.8692 | Processed batch 1123/1602 [85.6% time elapsed]. Policy alignment margin: 1.0323, Positive Reward: 0.8692, DPO Loss: 0.2577, KL Div: 0.00436. |
| 2026-08-18 22:19:42 | 2:10:31 | RL Optimization (Epoch 2) | 2750 | **rl_loss**: 0.2419<br>**dpo_loss**: 0.2417<br>**reward_pos**: 0.8750 | Processed batch 1148/1602 [86.4% time elapsed]. Policy alignment margin: 1.0731, Positive Reward: 0.8750, DPO Loss: 0.2417, KL Div: 0.00434. |
| 2026-08-18 22:20:51 | 2:11:41 | RL Optimization (Epoch 2) | 2775 | **rl_loss**: 0.2285<br>**dpo_loss**: 0.2282<br>**reward_pos**: 0.9064 | Processed batch 1173/1602 [87.2% time elapsed]. Policy alignment margin: 1.1216, Positive Reward: 0.9064, DPO Loss: 0.2282, KL Div: 0.00428. |
| 2026-08-18 22:22:06 | 2:12:55 | RL Optimization (Epoch 2) | 2800 | **rl_loss**: 0.2243<br>**dpo_loss**: 0.2241<br>**reward_pos**: 0.8973 | Processed batch 1198/1602 [88.0% time elapsed]. Policy alignment margin: 1.0949, Positive Reward: 0.8973, DPO Loss: 0.2241, KL Div: 0.00419. |
| 2026-08-18 22:23:15 | 2:14:04 | RL Optimization (Epoch 2) | 2825 | **rl_loss**: 0.2626<br>**dpo_loss**: 0.2624<br>**reward_pos**: 0.9000 | Processed batch 1223/1602 [88.8% time elapsed]. Policy alignment margin: 0.9700, Positive Reward: 0.9000, DPO Loss: 0.2624, KL Div: 0.00426. |
| 2026-08-18 22:24:31 | 2:15:21 | RL Optimization (Epoch 2) | 2850 | **rl_loss**: 0.2466<br>**dpo_loss**: 0.2464<br>**reward_pos**: 0.9054 | Processed batch 1248/1602 [89.6% time elapsed]. Policy alignment margin: 1.0790, Positive Reward: 0.9054, DPO Loss: 0.2464, KL Div: 0.00430. |
| 2026-08-18 22:24:31 | 2:15:21 | Periodic RAG Efficiency Check | 2850 |  | Executing periodic multi-lingual efficiency evaluation at step 2850. |
| 2026-08-18 22:24:56 | 2:15:46 | Efficiency Check Results | 2850 | **recall_5**: 24.0400<br>**mrr_10**: 0.1627<br>**p50_latency_ms**: 6.4200 | Current Multilingual Policy Performance -> Recall@1: 10.58%, Recall@5: 24.04%, MRR@10: 0.1627, p50 Latency: 6.42 ms. |
| 2026-08-18 22:26:54 | 2:17:44 | RL Optimization (Epoch 2) | 2875 | **rl_loss**: 0.3038<br>**dpo_loss**: 0.3036<br>**reward_pos**: 0.8771 | Processed batch 1273/1602 [91.2% time elapsed]. Policy alignment margin: 0.8505, Positive Reward: 0.8771, DPO Loss: 0.3036, KL Div: 0.00449. |
| 2026-08-18 22:28:13 | 2:19:03 | RL Optimization (Epoch 2) | 2900 | **rl_loss**: 0.2811<br>**dpo_loss**: 0.2809<br>**reward_pos**: 0.8686 | Processed batch 1298/1602 [92.1% time elapsed]. Policy alignment margin: 0.8868, Positive Reward: 0.8686, DPO Loss: 0.2809, KL Div: 0.00432. |
| 2026-08-18 22:29:31 | 2:20:20 | RL Optimization (Epoch 2) | 2925 | **rl_loss**: 0.2042<br>**dpo_loss**: 0.2040<br>**reward_pos**: 0.9374 | Processed batch 1323/1602 [93.0% time elapsed]. Policy alignment margin: 1.2253, Positive Reward: 0.9374, DPO Loss: 0.2040, KL Div: 0.00417. |
| 2026-08-18 22:30:49 | 2:21:39 | RL Optimization (Epoch 2) | 2950 | **rl_loss**: 0.2416<br>**dpo_loss**: 0.2414<br>**reward_pos**: 0.9093 | Processed batch 1348/1602 [93.8% time elapsed]. Policy alignment margin: 1.0012, Positive Reward: 0.9093, DPO Loss: 0.2414, KL Div: 0.00445. |
| 2026-08-18 22:32:08 | 2:22:58 | RL Optimization (Epoch 2) | 2975 | **rl_loss**: 0.2201<br>**dpo_loss**: 0.2199<br>**reward_pos**: 0.9136 | Processed batch 1373/1602 [94.7% time elapsed]. Policy alignment margin: 1.1918, Positive Reward: 0.9136, DPO Loss: 0.2199, KL Div: 0.00409. |
| 2026-08-18 22:33:34 | 2:24:23 | RL Optimization (Epoch 2) | 3000 | **rl_loss**: 0.3817<br>**dpo_loss**: 0.3815<br>**reward_pos**: 0.7572 | Processed batch 1398/1602 [95.7% time elapsed]. Policy alignment margin: 0.6188, Positive Reward: 0.7572, DPO Loss: 0.3815, KL Div: 0.00434. |
| 2026-08-18 22:33:34 | 2:24:23 | Periodic RAG Efficiency Check | 3000 |  | Executing periodic multi-lingual efficiency evaluation at step 3000. |
| 2026-08-18 22:34:16 | 2:25:06 | Efficiency Check Results | 3000 | **recall_5**: 24.3100<br>**mrr_10**: 0.1649<br>**p50_latency_ms**: 31.0200 | Current Multilingual Policy Performance -> Recall@1: 10.03%, Recall@5: 24.31%, MRR@10: 0.1649, p50 Latency: 31.02 ms. |
| 2026-08-18 22:34:30 | 2:25:20 | Checkpoint & Model Persistence | 3000 |  | Saved intermediate RL checkpoint to 'checkpoints/rl_policy\rl_policy_step_3000.pt' and updated active model at 'models/msmarco-xi-multilingual-rl-biencoder'. |
| 2026-08-18 22:35:47 | 2:26:36 | RL Optimization (Epoch 2) | 3025 | **rl_loss**: 0.3558<br>**dpo_loss**: 0.3556<br>**reward_pos**: 0.7989 | Processed batch 1423/1602 [97.2% time elapsed]. Policy alignment margin: 0.6902, Positive Reward: 0.7989, DPO Loss: 0.3556, KL Div: 0.00416. |
| 2026-08-18 22:37:06 | 2:27:56 | RL Optimization (Epoch 2) | 3050 | **rl_loss**: 0.1855<br>**dpo_loss**: 0.1853<br>**reward_pos**: 0.9495 | Processed batch 1448/1602 [98.0% time elapsed]. Policy alignment margin: 1.3209, Positive Reward: 0.9495, DPO Loss: 0.1853, KL Div: 0.00429. |
| 2026-08-18 22:38:23 | 2:29:12 | RL Optimization (Epoch 2) | 3075 | **rl_loss**: 0.1739<br>**dpo_loss**: 0.1737<br>**reward_pos**: 0.9346 | Processed batch 1473/1602 [98.9% time elapsed]. Policy alignment margin: 1.3208, Positive Reward: 0.9346, DPO Loss: 0.1737, KL Div: 0.00410. |
| 2026-08-18 22:39:56 | 2:30:46 | RL Optimization (Epoch 2) | 3100 | **rl_loss**: 0.2393<br>**dpo_loss**: 0.2390<br>**reward_pos**: 0.8894 | Processed batch 1498/1602 [99.9% time elapsed]. Policy alignment margin: 1.1172, Positive Reward: 0.8894, DPO Loss: 0.2390, KL Div: 0.00428. |
| 2026-08-18 22:40:05 | 2:30:55 | Target Training Duration Reached | 3102 |  | Target training duration of 2.5 hours reached (2.50 hours total). Finalizing model. |
| 2026-08-18 22:40:05 | 2:30:55 | RL Epoch 2 Completed | 3102 |  | Epoch 2 finished. Average Loss: 0.2525, Mean Positive Reward: 0.8811, Mean Negative Reward: 0.1566, Average Margin: 1.0256. |
| 2026-08-18 22:40:05 | 2:30:55 | Final Model Persistence | 3102 |  | Exporting finalized Reinforcement Learning Policy weights to 'models/msmarco-xi-multilingual-rl-biencoder'. |
| 2026-08-18 22:40:06 | 2:30:56 | Final Comprehensive Multi-Language Evaluation | 3102 |  | Running final post-training multilingual efficiency benchmark across all languages. |
| 2026-08-18 22:43:35 | 2:34:25 | RL Pipeline Completion | 3102 |  | Reinforcement Learning Training Pipeline successfully concluded after 3102 steps. Model is active at 'models/msmarco-xi-multilingual-rl-biencoder'. |
