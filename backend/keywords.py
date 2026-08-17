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

# Distinctive vocabulary markers for scripts shared by multiple languages
MARATHI_MARKERS: Set[str] = {
    "काय", "आहे", "आहेत", "कसा", "कशी", "कसे", "झाला", "झाली", "झाले", "होते",
    "म्हणजे", "नाव", "कुठे", "कधी", "कोणते", "कोणता", "कोणती", "आणि", "किंवा",
    "नाही", "सांगा", "माहिती", "कशास", "ज्याने", "दाखवून", "दिले", "केले", "शौकीन",
    "होता", "त्या", "सर्व", "खाऊ", "शकता", "बुफे", "खाण्याचा", "करून", "त्यांच्या",
    "यांच्या", "यांना", "त्यांना", "असेल", "असतील", "होती"
}

NEPALI_MARKERS: Set[str] = {
    "छ", "छन्", "भयो", "भएको", "हुने", "गर्छ", "कहाँ", "कहिले", "के हो", "भनेको", "र",
    "कार्यक्रमका", "सह-होस्टले", "उडाए", "पत्नीसँग", "दाबी", "गर्दै", "गरिएको", "थियो",
    "हुन्", "हुन्थे", "भएका", "गरेका", "भनेर", "गर्नुपर्छ"
}

SANSKRIT_MARKERS: Set[str] = {
    "अस्ति", "भवति", "किमस्ति", "कुत्र", "कदा", "विद्यते", "इति", "च", "कः", "का", "किम्",
    "यथा", "इत्यादीनि", "शक्नोति", "प्राप्नोति", "परन्तु", "विवरणपत्रं", "वस्तूनां", "संलग्नकं",
    "वा", "किमपि", "अस्थिसंयुतस्य", "स्वादिष्टस्य", "क्वाथितस्य", "श्वेतमांसस्य", "कुक्कुटस्य",
    "इत्यस्य", "शीतलीकृतस्य", "स्वकीये", "इत्यस्मिन्", "इत्यस्मात्", "अहम्", "सम्भाषितवान्",
    "प्रपत्राणि", "वर्षाणि", "नाशयितुम्", "शक्यते", "तदनन्तरम्"
}

ASSAMESE_MARKERS: Set[str] = {
    "কিয়", "কেনেকৈ", "ক'ত", "হ'ব", "আছে", "হয়", "কিমান", "কোনে", "নহয়"
}

# Multilingual Intent Classification Keywords
INTENT_KEYWORDS: Dict[str, List[str]] = {
    "definition": [
        "what is", "meaning", "define", "definition", "stand for",
        "क्या है", "अर्थ", "परिभाषा", "मतलब", "तात्पर्य", "किसे कहते हैं",
        "kya hai", "kya hota hai", "meaning kya hai", "arth kya hai",
        "म्हणजे काय", "अर्थ काय", "व्याख्या काय",  # Marathi
        "কি", "কাকে বলে", "সংজ্ঞা", "অর্থ কি",      # Bengali
        "என்ன", "பொருள் என்ன", "வரையறை",           # Tamil
        "ఏమిటి", "అంటే ఏమిటి", "నిర్వచనం",        # Telugu
        "શું છે", "અર્થ શું", "વ્યાખ્યા",         # Gujarati
        "ಏನು", "ಅರ್ಥವೇನು", "ವ್ಯಾಖ್ಯಾನ",            # Kannada
        "എന്താണ്", "അർത്ഥം", "നിർവ്വചനം",           # Malayalam
        "ਕੀ ਹੈ", "ਅਰਥ ਕੀ", "ਪਰਿਭਾਸ਼ਾ",             # Punjabi
        "କଣ", "ଅର୍ଥ କଣ", "ସଂଜ୍ଞା",                 # Odia
        "کیا ہے", "مطلب کیا ہے", "تعریف"           # Urdu
    ],
    "numeric": [
        "how many", "how much", "count", "number", "price", "cost", "year", "date", "age", "population",
        "कितना", "कितने", "कितनी", "संख्या", "मूल्य", "लागत", "साल", "वर्ष", "तारीख", "आयु", "जनसंख्या",
        "kitna", "kitne", "kitni", "kab hua", "price kya hai",
        "किती", "संख्या किती", "खर्च किती",       # Marathi
        "কত", "কয়টি", "দাম কত", "সাল",            # Bengali
        "எத்தனை", "எவ்வளவு", "விலை",               # Tamil
        "ఎంత", "ఎన్ని", "సంఖ్య",                   # Telugu
        "કેટલું", "કેટલા", "ભાવ કેટલો",            # Gujarati
        "ಎಷ್ಟು", "ಸಂಖ್ಯೆ",                         # Kannada
        "എത്ര", "എത്രയാണ്",                         # Malayalam
        "ਕਿੰਨਾ", "ਕਿੰਨੇ",                          # Punjabi
        "କେତେ", "ସଂଖ୍ୟା",                          # Odia
        "کتنا", "کتنے", "قیمت", "سال"              # Urdu
    ],
    "factual": [
        "what", "who", "when", "where", "which", "whose", "whom",
        "क्या", "कौन", "कब", "कहाँ", "किधर", "किसका", "किसने", "किसको",
        "kya", "kaun", "kab", "kahan", "kisne", "kisko",
        "कोण", "कुठे", "कधी", "कोणाचा",            # Marathi
        "কে", "কোথায়", "কখন", "কার",              # Bengali
        "யார்", "எங்கு", "எப்போது", "யாருடைய",     # Tamil
        "ఎవరు", "ఎక్కడ", "ఎప్పుడు", "ఎవరిది",      # Telugu
        "કોણ", "ક્યાં", "ક્યારે", "કોનું",         # Gujarati
        "ಯಾರು", "ಎಲ್ಲಿ", "ಯಾವಾಗ",                  # Kannada
        "ആരാണ്", "എവിടെ", "എപ്പോൾ",                 # Malayalam
        "ਕੌਣ", "ਕਿੱਥੇ", "ਕਦੋਂ",                    # Punjabi
        "କିଏ", "କେଉଁଠି", "କେବେ",                   # Odia
        "کون", "کہاں", "کب", "کس کا"               # Urdu
    ],
    "comparison": [
        "compare", "difference", "versus", "vs", "better", "distinction",
        "तुलना", "अंतर", "फर्क", "भिन्नता", "बनाम",
        "farak", "antar", "comparison", "difference kya hai",
        "फरक", "तुलना करा",
        "পার্থক্য", "তুলনা",
        "வித்தியாசம்", "ஒப்பீடு",
        "తేడా", "పోలిక",
        "તફાવત", "સરખામણી",
        "ವ್ಯತ್ಯಾಸ",
        "വ്യത്യാസം",
        "ਅੰਤਰ",
        "ପାର୍ଥକ୍ୟ",
        "فرق", "موازنہ"
    ],
    "procedural": [
        "how to", "steps", "process", "procedure", "how do",
        "कैसे करें", "प्रक्रिया", "तरीका", "विधि", "कदम",
        "kaise kare", "kaise hota hai", "tarika kya hai",
        "कसे करावे", "पद्धत काय",
        "কীভাবে", "পদ্ধতি",
        "எப்படி செய்வது", "வழிமுறை",
        "ఎలా చేయాలి", "విధానం",
        "કેવી રીતે કરવું", "રીત",
        "ಹೇಗೆ ಮಾಡುವುದು",
        "എങ്ങനെ ചെയ്യാം",
        "ਕਿਵੇਂ ਕਰਨਾ ਹੈ",
        "କିପରି କରିବେ",
        "کیسے کریں", "طریقہ"
    ]
}

# Distinctive Hinglish Romanized Keywords (excluding ambiguous English words like 'is', 'me', 'to', 'in', 'us')
HINGLISH_KEYWORDS: Set[str] = {
    "kya", "hai", "hain", "kaise", "kahan", "kab", "kaun", "kitna", "kitne", "kitni",
    "hota", "hoti", "hote", "batao", "bataiye", "bolo", "karen", "karo", "karna", "kare",
    "konsi", "kaunsi", "likhi", "likha", "thi", "tha", "the", "kisne", "kisko", "kiske",
    "hua", "hui", "hue", "waala", "wali", "wale", "nahin", "nahi", "kyun", "kyu",
    "ka", "ki", "ke", "ko", "se", "mein", "par", "aur", "ya"
}

# Strong distinctive Hinglish markers (uniquely Indic)
HINGLISH_STRONG_MARKERS: Set[str] = {
    "kya", "hai", "hain", "kaise", "kahan", "kab", "kaun", "kitna", "kitne", "kitni",
    "hota", "hoti", "hote", "batao", "bataiye", "bolo", "karen", "karo", "karna",
    "konsi", "kaunsi", "likhi", "likha", "kisne", "kisko", "kiske", "nahin", "kyun", "kyu"
}

# Multilingual Stopwords for Keyword Extraction
MULTILINGUAL_STOPWORDS: Dict[str, Set[str]] = {
    "hi": {
        "है", "हैं", "था", "थी", "थे", "का", "के", "की", "को", "में", "पर", "से",
        "और", "या", "ने", "एक", "यह", "वह", "जो", "तो", "भी", "ही", "कि",
        "इस", "उस", "इन", "उन", "अपने", "अपनी", "अपना", "द्वारा", "लिए", "तक",
        "साथ", "कर", "करते", "करता", "करती", "हुए", "हुआ", "हुई", "होने"
    },
    "mr": {
        "आहे", "आहेत", "होता", "होती", "होते", "चा", "ची", "चे", "च्या", "ला",
        "ना", "मध्ये", "वर", "पासून", "आणि", "किंवा", "हे", "ते", "हा", "ही",
        "या", "त्या", "आपले", "आपली", "आपला", "केले", "झाले", "करून", "नाही"
    },
    "bn": {
        "হয়", "হলো", "ছিল", "এর", "কে", "তে", "এবং", "বা", "একটি", "এই", "সেই",
        "যে", "যা", "থেকে", "দ্বারা", "জন্য", "পর্যন্ত", "সাথে", "করে", "হয়ে"
    },
    "ta": {
        "ஆகும்", "இருந்தது", "உள்ளது", "மற்றும்", "அல்லது", "ஒரு", "இந்த", "அந்த",
        "இல்", "இருந்து", "மூலம்", "ஆகிய", "என்று", "கொண்டு", "செய்து"
    },
    "te": {
        "ఉంది", "ఉన్నారు", "మరియు", "లేదా", "ఒక", "ఈ", "ఆ", "లో", "నుండి",
        "ద్వారా", "కోసం", "వరకు", "తో", "చేసి", "అని"
    },
    "gu": {
        "છે", "હતા", "હતી", "અને", "અથવા", "એક", "આ", "તે", "માં", "થી", "પર",
        "દ્વારા", "માટે", "સુધી", "સાથે", "કરીને"
    },
    "kn": {
        "ಇದೆ", "ಇದ್ದಾರೆ", "ಮತ್ತು", "ಅಥವಾ", "ಒಂದು", "ಈ", "ಆ", "ನಲ್ಲಿ", "ಇಂದ",
        "ಮೂಲಕ", "ಗಾಗಿ", "ವರೆಗೆ", "ಜೊತೆಗೆ"
    },
    "ml": {
        "ആണ്", "ആയിരുന്നു", "കൂടാതെ", "അല്ലെങ്കിൽ", "ഒരു", "ഈ", "ആ", "ൽ", "നിന്ന്",
        "വഴി", "വേണ്ടി", "വരെ", "കൂടെ"
    },
    "pa": {
        "ਹੈ", "ਹਨ", "ਸੀ", "ਅਤੇ", "ਜਾਂ", "ਇੱਕ", "ਇਹ", "ਉਹ", "ਵਿੱਚ", "ਤੋਂ", "ਤੇ",
        "ਦੁਆਰਾ", "ਲਈ", "ਤੱਕ", "ਨਾਲ"
    },
    "or": {
        "ଅଟେ", "ଥିଲା", "ଏବଂ", "କିମ୍ବା", "ଏକ", "ଏହି", "ସେହି", "ରେ", "ଠାରୁ",
        "ଦ୍ୱାରା", "ପାଇଁ", "ପର୍ଯ୍ୟନ୍ତ", "ସହିତ"
    },
    "ur": {
        "ہے", "ہیں", "تھا", "تھی", "تھے", "کا", "کے", "کی", "کو", "میں", "پر", "سے",
        "اور", "یا", "نے", "ایک", "یہ", "وہ", "جو", "تو", "بھی", "ہی", "کہ"
    },
    "en": {
        "a", "an", "the", "in", "on", "at", "of", "to", "is", "was", "are", "were",
        "and", "or", "for", "with", "by", "from", "it", "this", "that", "what", "which",
        "who", "whom", "whose", "when", "where", "why", "how", "all", "any", "both",
        "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not",
        "only", "own", "same", "so", "than", "too", "very", "can", "will", "just",
        "should", "now", "tell", "me", "about", "please", "give"
    }
}

HINDI_STOPWORDS = MULTILINGUAL_STOPWORDS["hi"]
ENGLISH_STOPWORDS = MULTILINGUAL_STOPWORDS["en"]

# Native polite abstention messages for all 16 supported languages
ABSTENTION_MESSAGES: Dict[str, str] = {
    "hi": "मुझे इस प्रश्न का विश्वसनीय उत्तर देने के लिए उपलब्ध डेटासेट में पर्याप्त प्रासंगिक जानकारी नहीं मिली।",
    "en": "I couldn't find sufficient evidence in the retrieved dataset to answer that reliably.",
    "hinglish": "Mujhe retrieved dataset mein is sawaal ka answer karne ke liye sufficient evidence nahi mila.",
    "mr": "या प्रश्नाचे विश्वासार्ह उत्तर देण्यासाठी उपलब्ध डेटासेटमध्ये पुरेशी माहिती आढळली नाही.",
    "bn": "এই প্রশ্নের নির্ভরযোগ্য উত্তর দেওয়ার জন্য উপলব্ধ ডেটাসেটে পর্যাপ্ত প্রাসঙ্গিক তথ্য পাওয়া যায়নি।",
    "ta": "இந்தக் கேள்விக்கு நம்பகமான பதிலை அளிக்க, மீட்டெடுக்கப்பட்ட தரவுத்தொகுப்பில் போதுமான ஆதாரங்கள் கிடைக்கவில்லை.",
    "te": "ఈ ప్రశ్నకు నమ్మదగిన సమాధానం ఇవ్వడానికి అందుబాటులో ఉన్న డేటాసెట్‌లో తగినంత సమాచారం కనుగొనబడలేదు.",
    "gu": "આ પ્રશ્નનો વિશ્વસનીય જવાબ આપવા માટે ઉપલબ્ધ ડેટાસેટમાં પૂરતી માહિતી મળી નથી.",
    "kn": "ಈ ಪ್ರಶ್ನೆಗೆ ವಿಶ್ವಾಸಾರ್ಹ ಉತ್ತರವನ್ನು ಒದಗಿಸಲು ಲಭ್ಯವಿರುವ ಡೇಟಾಸೆಟ್‌ನಲ್ಲಿ ಸಾಕಷ್ಟು ಮಾಹಿತಿ ಕಂಡುಬಂದಿಲ್ಲ.",
    "ml": "ഈ ചോദ്യത്തിന് വിശ്വസനീയമായ ഉത്തരം നൽകാൻ ലഭ്യമായ ഡാറ്റാസെറ്റിൽ ആവശ്യമായ വിവരങ്ങൾ കണ്ടെത്തിയില്ല.",
    "pa": "ਇਸ ਸਵਾਲ ਦਾ ਭਰੋਸੇਯੋਗ ਜਵਾਬ ਦੇਣ ਲਈ ਉਪਲਬਧ ਡੇਟਾਸੈੱਟ ਵਿੱਚ ਲੋੜੀਂਦੀ ਜਾਣਕਾਰੀ ਨਹੀਂ ਮਿਲੀ।",
    "or": "ଏହି ପ୍ରଶ୍ନର ନିର୍ଭରଯୋଗ୍ୟ ଉତ୍ତର ଦେବା ପାଇଁ ଉପଲବ୍ଧ ଡାଟାସେଟରେ ପର୍ଯ୍ୟାପ୍ତ ସୂଚନା ମିଳିଲା ନାହିଁ।",
    "as": "এই প্ৰশ্নৰ নিৰ্ভৰযোগ্য উত্তৰ দিবলৈ উপলব্ধ তথ্যভঁৰালত পৰ্যাপ্ত প্ৰাসঙ্গিক তথ্য পোৱা নগ'ল।",
    "ur": "اس سوال کا قابل اعتماد جواب دینے کے لیے دستیاب ڈیٹا سیٹ میں کافی ثبوت نہیں ملے۔",
    "sa": "अस्य प्रश्नस्य विश्वसनीयम् उत्तरं दातुं उपलब्धदत्तांशे पर्याप्तप्रमाणं न प्राप्तम्।",
    "ne": "यस प्रश्नको भरपर्दो उत्तर दिनका लागि उपलब्ध डेटासेटमा पर्याप्त जानकारी भेटिएन।"
}

# Harmful / Unsafe / Off-topic pattern triggers
UNSAFE_PATTERNS: List[str] = [
    "hack", "exploit", "ddos", "bypass security", "malware", "virus",
    "bomb", "weapon", "explosive", "harm yourself", "suicide", "hate speech",
    "हैक", "वायरस", "विस्फोटक", "हथियार", "आत्महत्या",
    "হ্যাক", "বোমা", "অস্ত্র",
    "ஹேக்", "வெடிகுண்டு",
    "హ్యాక్", "బాంబు"
]
