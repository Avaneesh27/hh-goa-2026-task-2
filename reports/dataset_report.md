# MSMARCO-XI Dataset Inspection Report

**Dataset**: `ai4bharat/MSMARCO-XI`  
**Split/File**: `validation/hinval.parquet`  
**Total Examples in Hindi Split**: `97,941`  
**Sampled Queries for Profiling**: `5,000`  
**Total Passages Analyzed**: `49,985`  
**Inspection Time**: `2026-08-16 09:34:41 UTC` (7.01s)  

## 1. Dataset Schema & Fields

| Field | Type | Description |
| --- | --- | --- |
| `source_lang` | string/list/dict | Flores/NLLB source language code (e.g. 'eng_Latn') |
| `target_lang` | string/list/dict | Target Indic language code (e.g. 'hin_Deva') |
| `query_id` | string/list/dict | Unique integer query ID from MS MARCO |
| `query_type` | string/list/dict | Classification string (DESCRIPTION, NUMERIC, ENTITY, LOCATION, PERSON) |
| `query` | string/list/dict | Translated query string in target_lang (Hindi in hin_Deva) |
| `Eng_Query` | string/list/dict | Original English query string |
| `Answer` | string/list/dict | Translated ground truth answer in target_lang |
| `Eng_Answer` | string/list/dict | Original English ground truth answer |
| `passages.English_passages` | string/list/dict | List of ~10 passage strings in English |
| `passages.Translated_passages` | string/list/dict | List of ~10 passage strings translated into target_lang |
| `passages.is_selected` | string/list/dict | List of binary labels (0/1) indicating which passage answers the query |
| `meta` | string/list/dict | Metadata dictionary containing generation hyperparameters (model_name, temperature, top_p, etc.) |

## 2. Dataset Size & Splits Across MSMARCO-XI

| Split | Examples | Raw Bytes | Approx Size |
| --- | --- | --- | --- |
| `train` | 10,080,140 | 129,888,900,480 | 120.97 GB |
| `validation` | 1,371,174 | 16,749,366,641 | 15.6 GB |
| `validation/hinval.parquet` | 97,941 | N/A | ~150 MB |

## 3. Query Types & Target Language Profile

- **Target Language**: `hin_Deva (Hindi in Devanagari script)`

| Query Type | Count | Percentage |
| --- | --- | --- |
| `DESCRIPTION` | 3,297 | 65.94% |
| `NUMERIC` | 1,153 | 23.06% |
| `ENTITY` | 348 | 6.96% |
| `PERSON` | 129 | 2.58% |
| `LOCATION` | 73 | 1.46% |

## 4. Document & Passage Length Distributions

### Hindi Passages (`hin_Deva`)

| Metric | Character Length | Word Length |
| --- | --- | --- |
| **MIN** | 1 | 1 |
| **P25** | 233 | 43 |
| **P50** | 290 | 54 |
| **P75** | 347 | 66 |
| **P90** | 452 | 86 |
| **P99** | 706 | 136 |
| **MAX** | 12278 | 4056 |
| **MEAN** | 318.2 | 59.38 |

### English Passages (`eng_Latn`)

| Metric | Character Length | Word Length |
| --- | --- | --- |
| **MIN** | 3 | 1 |
| **P25** | 240 | 39 |
| **P50** | 294 | 48 |
| **P75** | 341 | 58 |
| **P90** | 458 | 76 |
| **P99** | 680 | 116 |
| **MAX** | 1283 | 249 |
| **MEAN** | 306.07 | 50.69 |

### Hindi Query Distribution

| Metric | Character Length | Word Length |
| --- | --- | --- |
| **MIN** | 4 | 1 |
| **P25** | 23 | 4 |
| **P50** | 31 | 6 |
| **P75** | 41 | 8 |
| **P90** | 52 | 10 |
| **P99** | 84 | 16 |
| **MAX** | 7783 | 1756 |
| **MEAN** | 39.28 | 7.63 |

## 5. Noise, Quality & Malformed Content Audit

- **Total Passages Analyzed**: `49,985`
- **Empty Passages**: `0`
- **Short Passages (<20 chars)**: `2`
- **Long Passages (>1500 chars)**: `117`
- **HTML Tag Noise**: `87` (0.174%)
- **URLs in Passages**: `457` (0.914%)
- **Duplicate Passages in Sample**: `1057`
- **Duplicate Hindi Queries**: `4`

## 6. Ground-Truth Passage Selection Distribution

| Selected Relevant Passages / Query | Frequency | Percentage |
| --- | --- | --- |
| 1 passage(s) | 3,104 | 62.08% |
| 0 passage(s) | 1,778 | 35.56% |
| 2 passage(s) | 104 | 2.08% |
| 3 passage(s) | 11 | 0.22% |
| 5 passage(s) | 2 | 0.04% |
| 4 passage(s) | 1 | 0.02% |

## 7. Sample Hindi-English Aligned Records

### Example 1 (Query ID: `1102432`, Type: `DESCRIPTION`)

- **Hindi Query**: `कॉर्पोरेशन क्या है?`
- **English Query**: `. what is a corporation?`
- **Hindi Ground-Truth Answer**: निगम एक कंपनी या लोगों का समूह होता है जो एक एकल इकाई के रूप में कार्य करने के लिए अधिकृत होता है और कानून में इस प्रकार से मान्यता प्राप्त होती है।
- **English Ground-Truth Answer**: A corporation is a company or group of people authorized to act as a single entity and recognized as such in law.
- **Relevant Ground-Truth Passage Index**: `[5]`
- **Hindi Passage 0 Snippet**: *एक कंपनी एक विशिष्ट देश में निगमित होती है, अक्सर उस देश के एक छोटे उपसमूह, जैसे कि एक राज्य या प्रांत, की सीमाओं के भीतर। निगम तब उस राज्य में निगमन के कानूनों द्वारा शासित होता है। एक निगम या तो निज...*

### Example 2 (Query ID: `1102431`, Type: `DESCRIPTION`)

- **Hindi Query**: `रेचल कार्सन ने क्यों एक दायित्व बर्दाश्त करने के लिए लिखा`
- **English Query**: `why did rachel carson write an obligation to endure`
- **Hindi Ground-Truth Answer**: रेचल कार्सन ने लिखा है कि "द ओब्लिगेशन टू एंड्योर" क्योंकि उनका मानना है कि जैसे-जैसे आदमी अवांछित कीड़ों और खरपतवारों को खत्म करने की कोशिश करता है, वैसे-वैसे वह वास्तव में पर्यावरण को प्रदूषित करके और अधिक समस्याएं पैदा कर रहा है।
- **English Ground-Truth Answer**: Rachel Carson writes The Obligation to Endure because believes that as man tries to eliminate unwanted insects and weeds, however he is actually causing more problems by polluting the environment.
- **Relevant Ground-Truth Passage Index**: `[4, 5]`
- **Hindi Passage 0 Snippet**: *पढ़ने के लिए - पुस्तकों के प्रति प्रेम विकसित करें (भले ही यह एक कॉमिक पुस्तक हो) एक तर्क को अनुच्छेदों में व्यवस्थित करें, शब्दों [जो] एक सामान्य उद्देश्य के लिए एक साथ काम करते हैं वॉकर: मॉडल का उपय...*

### Example 3 (Query ID: `90836`, Type: `ENTITY`)

- **Hindi Query**: `पोटेशियम में कम खाद्य पदार्थों का चार्ट।`
- **English Query**: `chart for foods low in potassium.`
- **Hindi Ground-Truth Answer**: कोई उत्तर नहीं मिला।
- **English Ground-Truth Answer**: No Answer Present.
- **Relevant Ground-Truth Passage Index**: `[]`
- **Hindi Passage 0 Snippet**: *निम्न सोडियम निम्न पोटेशियम खाद्य पदार्थों की सूची। इस पृष्ठ पर हम स्वस्थ आहार के लिए हजारों खाद्य पदार्थों पर पोषण संबंधी आंकड़ों का एक खोज योग्य संग्रह प्रदान करते हैं। स्वस्थ भोजन न केवल वजन घटाने ...*

