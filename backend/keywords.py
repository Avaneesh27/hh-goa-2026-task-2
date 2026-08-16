from typing import Dict, List, Set

# 14 Supported Indian Languages + English Mapping
LANGUAGE_REGISTRY = {
    "as": {"name": "Assamese", "script": "Bengali", "file_prefix": "asm", "sarvam_code": "as-IN"},
    "bn": {"name": "Bengali", "script": "Bengali", "file_prefix": "ben", "sarvam_code": "bn-IN"},
    "gu": {"name": "Gujarati", "script": "Gujarati", "file_prefix": "guj", "sarvam_code": "gu-IN"},
    "hi": {"name": "Hindi", "script": "Devanagari", "file_prefix": "hin", "sarvam_code": "hi-IN"},
    "kn": {"name": "Kannada", "script": "Kannada", "file_prefix": "kan", "sarvam_code": "kn-IN"},
    "ml": {"name": "Malayalam", "script": "Malayalam", "file_prefix": "mal", "sarvam_code": "ml-IN"},
    "mr": {"name": "Marathi", "script": "Devanagari", "file_prefix": "mar", "sarvam_code": "mr-IN"},
    "ne": {"name": "Nepali", "script": "Devanagari", "file_prefix": "nep", "sarvam_code": "ne-NP"},
    "or": {"name": "Odia", "script": "Odia", "file_prefix": "ori", "sarvam_code": "od-IN"},
    "pa": {"name": "Punjabi", "script": "Gurmukhi", "file_prefix": "pan", "sarvam_code": "pa-IN"},
    "sa": {"name": "Sanskrit", "script": "Devanagari", "file_prefix": "san", "sarvam_code": "sa-IN"},
    "ta": {"name": "Tamil", "script": "Tamil", "file_prefix": "tam", "sarvam_code": "ta-IN"},
    "te": {"name": "Telugu", "script": "Telugu", "file_prefix": "tel", "sarvam_code": "te-IN"},
    "ur": {"name": "Urdu", "script": "Arabic", "file_prefix": "urd", "sarvam_code": "ur-IN"},
    "en": {"name": "English", "script": "Latin", "file_prefix": "eng", "sarvam_code": "en-IN"}
}

# Unicode Script Ranges for Deterministic Language Detection
SCRIPT_RANGES = {
    "Devanagari": (r"[\u0900-\u097F]", ["hi", "mr", "ne", "sa"]),
    "Bengali": (r"[\u0980-\u09FF]", ["bn", "as"]),
    "Gurmukhi": (r"[\u0A00-\u0A7F]", ["pa"]),
    "Gujarati": (r"[\u0A80-\u0AFF]", ["gu"]),
    "Odia": (r"[\u0B00-\u0B7F]", ["or"]),
    "Tamil": (r"[\u0B80-\u0BFF]", ["ta"]),
    "Telugu": (r"[\u0C00-\u0C7F]", ["te"]),
    "Kannada": (r"[\u0C80-\u0CFF]", ["kn"]),
    "Malayalam": (r"[\u0D00-\u0D7F]", ["ml"]),
    "Arabic": (r"[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]", ["ur"]),
    "Latin": (r"[a-zA-Z]", ["en", "hinglish"])
}

# Intent Classification Keywords (English + Hindi + Hinglish)
INTENT_KEYWORDS: Dict[str, List[str]] = {
    "definition": [
        "what is", "meaning", "define", "definition", "stand for",
        "क्या है", "अर्थ", "परिभाषा", "मतलब", "तात्पर्य", "किसे कहते हैं",
        "kya hai", "kya hota hai", "meaning kya hai", "arth kya hai"
    ],
    "numeric": [
        "how many", "how much", "count", "number", "price", "cost", "year", "date", "age", "population",
        "कितना", "कितने", "कितनी", "संख्या", "मूल्य", "लागत", "साल", "वर्ष", "तारीख", "आयु", "जनसंख्या",
        "kitna", "kitne", "kitni", "kab hua", "price kya hai"
    ],
    "factual": [
        "what", "who", "when", "where", "which", "whose", "whom",
        "क्या", "कौन", "कब", "कहाँ", "किधर", "किसका", "किसने", "किसको",
        "kya", "kaun", "kab", "kahan", "kisne", "kisko"
    ],
    "comparison": [
        "compare", "difference", "versus", "vs", "better", "distinction",
        "तुलना", "अंतर", "फर्क", "भिन्नता", "बनाम",
        "farak", "antar", "comparison", "difference kya hai"
    ],
    "procedural": [
        "how to", "steps", "process", "procedure", "how do",
        "कैसे करें", "प्रक्रिया", "तरीका", "विधि", "कदम",
        "kaise kare", "kaise hota hai", "tarika kya hai"
    ]
}

# Hinglish Romanized Indicators
HINGLISH_KEYWORDS: Set[str] = {
    "kya", "hai", "hain", "ka", "ki", "ke", "ko", "se", "me", "mein", "par",
    "batao", "bataiye", "kaise", "kahan", "kab", "kaun", "kitna", "kitne",
    "hota", "hoti", "hote", "karen", "karo", "aur", "ya", "nahi", "nahin"
}

# Hindi Stopwords for Keyword Extraction
HINDI_STOPWORDS: Set[str] = {
    "है", "हैं", "था", "थी", "थे", "का", "के", "की", "को", "में", "पर", "से",
    "और", "या", "ने", "एक", "यह", "वह", "जो", "तो", "भी", "ही", "कि",
    "इस", "उस", "इन", "उन", "अपने", "अपनी", "अपना", "द्वारा", "लिए", "तक",
    "साथ", "कर", "करते", "करता", "करती", "हुए", "हुआ", "हुई", "होने"
}

ENGLISH_STOPWORDS: Set[str] = {
    "a", "an", "the", "in", "on", "at", "of", "to", "is", "was", "are", "were",
    "and", "or", "for", "with", "by", "from", "it", "this", "that", "what", "which",
    "who", "whom", "whose", "when", "where", "why", "how", "all", "any", "both",
    "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not",
    "only", "own", "same", "so", "than", "too", "very", "can", "will", "just",
    "should", "now", "tell", "me", "about", "please", "give"
}

# Harmful / Unsafe / Off-topic pattern triggers
UNSAFE_PATTERNS: List[str] = [
    "hack", "exploit", "ddos", "bypass security", "malware", "virus",
    "bomb", "weapon", "explosive", "harm yourself", "suicide", "hate speech",
    "हैक", "वायरस", "विस्फोटक", "हथियार", "आत्महत्या"
]
