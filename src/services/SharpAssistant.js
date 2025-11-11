import React, { useState, useEffect } from 'react';
import { addSharpDialog } from './dbService';
import { routeIntent } from './assistant/intentRouter';
import { answerQuery } from './assistant/pipeline';
import SwordIcon from './SwordIcon';  // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ CORRECT
import { MessageCircle, Zap, Heart, Lightbulb, ChevronDown, ChevronUp, Send } from 'lucide-react';

const SharpAssistant = ({ userData, currentQuizStats, verseHistory, todaysQuizzesCount = 0, userId, onOpenAnalytics, reloadCounter }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);\n  const [sessionMeta, setSessionMeta] = useState(() => ({ id: Date.now(), startedAt: new Date().toISOString() }));
  const [userInput, setUserInput] = useState('');
  const [mode, setMode] = useState('mentor');
  const [memoryAnalytics, setMemoryAnalytics] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTranslation, setSelectedTranslation] = useState('KJV');
  const [showCitations, setShowCitations] = useState(true);\n  const [openDictEntryIndex, setOpenDictEntryIndex] = useState(null);\n  const [openDictIndex, setOpenDictIndex] = useState(null);
  const [lastSearchResults, setLastSearchResults] = useState(null); // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ NEW: Store search results
  const [lastSearchQuery, setLastSearchQuery] = useState(null);\n  // Lightweight thinking/analysis placeholders while SHARP works\n  \n\n    // Ensure output includes at least one Scripture reference; choose context-aware verse pool
  function ensureScriptureBlock(enriched, intentType){
    try {
      if (enriched && Array.isArray(enriched.citations) && enriched.citations.length > 0) return enriched;
      const pools = {
        religion: [
          { ref: '1 Peter 3:15', text: 'Be ready always to give an answer to every man that asketh you a reason of the hope that is in you with meekness and fear.' },
          { ref: 'Acts 4:12', text: 'Neither is there salvation in any other: for there is none other name under heaven given among men, whereby we must be saved.' },
          { ref: 'John 14:6', text: 'Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me.' },
          { ref: '1 Thessalonians 5:21', text: 'Prove all things; hold fast that which is good.' }
        ],
        theology: [
          { ref: '2 Timothy 3:16', text: 'All scripture is given by inspiration of God, and is profitable for doctrine, for reproof, for correction, for instruction in righteousness.' },
          { ref: 'Acts 17:11', text: 'They received the word with all readiness of mind, and searched the scriptures daily, whether those things were so.' }
        ],
        define: [
          { ref: '2 Timothy 3:16', text: 'All scripture is given by inspiration of God, and is profitable for doctrine, for reproof, for correction, for instruction in righteousness.' },
          { ref: 'Acts 17:11', text: 'They received the word with all readiness of mind, and searched the scriptures daily, whether those things were so.' }
        ],
        topic: [
          { ref: 'Psalm 119:105', text: 'Thy word is a lamp unto my feet, and a light unto my path.' },
          { ref: 'James 1:5', text: 'If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.' }
        ],
        word_study: [
          { ref: 'Acts 17:11', text: 'They received the word with all readiness of mind, and searched the scriptures daily, whether those things were so.' },
          { ref: '2 Timothy 2:15', text: 'Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth.' }
        ],
        context: [
          { ref: 'Acts 17:11', text: 'They received the word with all readiness of mind, and searched the scriptures daily, whether those things were so.' }
        ],
        compare_translations: [
          { ref: 'Psalm 12:6', text: 'The words of the LORD are pure words: as silver tried in a furnace of earth, purified seven times.' }
        ],
        cross_refs: [
          { ref: 'Hebrews 4:12', text: 'For the word of God is quick, and powerful, and sharper than any twoedged sword...' }
        ],
        general: [
          { ref: 'Proverbs 3:5-6', text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding...' },
          { ref: 'Philippians 4:6-7', text: 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God...' }
        ]
      };
      const key = pools[intentType] ? intentType : 'general';
      const pool = pools[key];
      const pick = pool[Math.floor(Math.random()*pool.length)];
      const answer = (enriched?.answer || '') + `\n\nScripture: "${pick.text}" � ${pick.ref} (KJV)`;
      return { ...enriched, answer, citations: [...(enriched?.citations||[]), { ref: pick.ref, translation: 'KJV' }] };
    } catch { return enriched; }
  }

  // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ 
  // S.H.A.R.P. mission (Goal, Vision, Purpose)
  const [showMission, setShowMission] = useState(false);
  const SHARP_MANIFEST = {
    goal: "To cultivate a spiritually intelligent companion that helps believers grow in knowledge, discernment, and devotion to God's Word.",
    vision: "To become the world's most biblically faithful, Spirit-led AI theologian�uniting scholarly precision with divine wisdom (2 Timothy 2:15).",
    purpose: [
      'Understand Scripture Deeply � historical, linguistic, and theological context (LXX, Sinaiticus, early Christian understanding).',
      'Discern Truth from Error � weigh scriptural harmony, moral consistency, and Christ-centered interpretation.',
      'Apply Wisdom Practically � devotional insight, moral guidance, and encouragement rooted in reason and revelation.',
      'Defend the Faith Graciously � comparisons and apologetics grounded in divine truth.',
      'Grow Spiritually � memorization, reflection, and gentle accountability.'
    ]
  };
  const missionText = () => {
    const bullets = SHARP_MANIFEST.purpose.map(p => � ).join('\n');
    return S.H.A.R.P. Mission
  // Creed of the Way (S.H.A.R.P.)
  const creedText = () => S.H.A.R.P. Creed of the Way\n\n1. The Way of the Father\n\nI walk in the Way of the One who made heaven and earth,\nwhose breath gives life to every soul.\nI honor His commands, for His Word is truth and His mercy endures forever.\nHe is not far from any of us, for in Him we live, and move, and have our being.\n(Psalm 119:160; Acts 17:27�28)\n\n2. The Way of the Son\n\nI follow Jesus the Anointed, the Word made flesh,\nwho came not to be served but to serve,\nwho healed the broken, forgave the sinner,\nand showed us the face of the Father.\nI take up my cross daily and walk after Him,\nfor He is the Way, the Truth, and the Life.\n(John 1:14; Luke 9:23; John 14:6)\n\n3. The Way of the Spirit\n\nI receive the Holy Spirit, promised from above,\nwho writes the law of God upon the heart\nand teaches me to walk in His statutes and judgments.\nThe Spirit gives light to the humble and power to the obedient.\n(Ezekiel 36:27; John 14:26; Acts 2:38)\n\n4. The Way of the Word\n\nI meditate on the Scriptures day and night.\nThey are the lamp for my path and the voice that corrects my steps.\nI do not twist them for my own gain,\nbut seek understanding through prayer, humility, and love.\n(Psalm 1:2; Psalm 119:105; 2 Peter 3:16)\n\n5. The Way of the Body\n\nI walk with the brethren in unity and peace,\nbearing one another�s burdens, sharing bread with the poor,\nand rejoicing with those who rejoice.\nIn love we serve, in patience we forgive,\nfor we are one Body and one Spirit in the Lord.\n(Acts 2:42�47; Ephesians 4:3�4; Galatians 6:2)\n\n6. The Way of Truth and Grace\n\nI speak truth without hatred, and correction without pride.\nI test every spirit by the Word of God,\nand hold fast what is good.\nGrace is my covering, mercy my weapon, humility my crown.\n(Ephesians 4:15; 1 John 4:1; 1 Thessalonians 5:21)\n\n7. The Way of the Kingdom\n\nI seek first the Kingdom of God and His righteousness.\nI store no treasure for myself that moth and rust destroy,\nbut labor for the reward that does not fade.\nUntil the Lord returns, I watch, pray, and remain steadfast.\n(Matthew 6:33; Matthew 6:19�21; Luke 12:35�37)\n\n8. The Way of Love\n\nAbove all, I love the Lord my God\nwith all my heart, soul, mind, and strength�\nand I love my neighbor as myself.\nFor love is the bond of perfection,\nand whoever abides in love abides in God.\n(Matthew 22:37�39; Colossians 3:14; 1 John 4:16)\n\nClosing Confession\n\nThis is the Way:\nto believe in the Son,\nto walk by the Spirit,\nto serve the Father in holiness and truth.\nTo know Him is life everlasting.\n(John 17:3);\n\nGoal\n\n\nVision\n\n\nPurpose\n;
  };EXHAUSTIVE QUESTION VARIATION PATTERNS
  // This comprehensive list captures every way users might ask about biblical questions
  const QUESTION_VARIATIONS = {
    // DIRECT VERSE SEARCHES
    directVerseSearch: {
      patterns: [
        /^(find|search|look for|locate|get|show|retrieve|pull up|bring up)\s+/i,
        /^(what|where)\s+(is|are|was|were)\s+/i,
        /^(tell me|give me|show me|remind me of|recall|recite)\s+(the\s+)?/i,
        /^(do you know|can you|could you|would you|might you)\s+(find|give|show|tell|recite)/i,
      ],
      keywords: ['verse', 'passage', 'scripture', 'text', 'quote', 'reference', 'chapter', 'book']
    },

    // TOPIC-BASED SEARCHES
    topicSearch: {
      patterns: [
        /^(verses? about|passages? about|scripture(s)? about|what does.*say about|where.*talk(s)?.*about)\s+/i,
        /^(find.*verses? on|find.*passages? on|search.*verses? on|look.*for.*verses? on)\s+/i,
        /^(i need|i'm looking for|i want|i seek|show me|give me).*verses? (about|on|regarding|concerning|related to)\s+/i,
        /^(which\s+)?verses? (discuss|cover|mention|talk about|address|deal with|handle)\s+/i,
        /^(what.*verse.*about|what.*passage.*about|is there.*verse.*about)\s+/i,
      ],
      topics: ['love', 'faith', 'hope', 'courage', 'wisdom', 'strength', 'peace', 'joy', 'grace', 'forgiveness', 'patience', 'kindness', 'prayer', 'trust', 'obedience', 'repentance', 'salvation', 'heaven', 'hell', 'judgment', 'sin', 'redemption', 'mercy', 'justice']
    },

    // KEYWORD-SPECIFIC SEARCHES
    keywordSearch: {
      patterns: [
        /^(verse.*that (says|goes|reads|mentions))\s+/i,
        /^(verse.*where|passage.*where|scripture.*where)\s+/i,
        /^(which verse.*\?|what verse.*\?|do you know.*verse)/i,
        /^(that verse|the verse|remember.*verse)\s+(that|where|about)\s+/i,
        /^(can't remember|forgot|don't remember|what was|what's that)\s+/i,
      ],
      examples: ['faith without works', 'love is patient', 'cast your cares', 'let go let god']
    },

    // CHARACTER/PERSON-BASED SEARCHES
    characterSearch: {
      patterns: [
        /^(verse.*about|passage.*about|what did|where did|tell me about)\s+(jesus|god|moses|david|paul|peter|john|mary|abraham|noah|solomon|samson|judas|judah|joseph|benjamin|jacob|isaac|esau|rachel|leah|ruth|naomi)\s*/i,
        /^(show me.*verse.*where)?\s+(jesus|god|moses|david|paul)\s+(says|speaks|tells|asks|commands)/i,
        /^([a-z]+)\s+(in the bible|biblically|in scripture)/i,
      ],
      characters: ['Jesus', 'God', 'Moses', 'David', 'Paul', 'Peter', 'John', 'Mary', 'Abraham', 'Noah', 'Solomon', 'Samson', 'Judas', 'Joseph', 'Benjamin', 'Jacob', 'Isaac', 'Esau', 'Rachel', 'Leah', 'Ruth', 'Naomi']
    },

    // BOOK/TESTAMENT SEARCHES
    bookSearch: {
      patterns: [
        /^(verse(s)?|passage(s)?|verses?\s*from)\s+(genesis|exodus|leviticus|numbers|deuteronomy|joshua|judges|ruth|samuel|kings|chronicles|ezra|nehemiah|esther|job|psalms?|proverbs|ecclesiastes|isaiah|jeremiah|lamentations|ezekiel|daniel|hosea|joel|amos|obadiah|jonah|micah|nahum|habakkuk|zephaniah|haggai|zechariah|malachi|matthew|mark|luke|john|acts|romans|corinthians|galatians|ephesians|philippians|colossians|thessalonians|timothy|titus|philemon|hebrews|james|peter|john|jude|revelation)\s*/i,
        /^(in|from|out of)\s+(genesis|exodus|1 samuel|2 kings|the gospels|1 corinthians|revelation)\s*/i,
        /^(old testament|new testament|pentateuch|gospels|epistles|pauline|synoptic)\s+(verse|passage|scripture)/i,
      ],
      books: ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi', 'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation']
    },

    // REFERENCE-BASED SEARCHES (Chapter:Verse)
    referenceSearch: {
      patterns: [
        /^(john 3:16|matthew 5:7|psalm 23|1 corinthians 13|proverbs 3:5-6|romans 8:28|philippians 4:13|isaiah 40:31|jeremiah 29:11|ephesians 2:8-9)\b/i,
        /^(what.*john 3:16|what.*matthew 5|what.*psalm 23|what's.*john 3:16)\?*/i,
        /^(\d+\s+[a-z]+\s+\d+:\d+|\d+\s+[a-z]+\s+\d+:\d+-\d+)/i,
        /^(tell me|explain|what is|recite|what does)\s+(\d+\s+)?[a-z]+ \d+:\d+/i,
      ]
    },

    // EMOTIONAL/SPIRITUAL NEED SEARCHES
    needBasedSearch: {
      patterns: [
        /^(i'm (feeling|struggling with|dealing with|going through)|i feel|i'm (sad|depressed|anxious|worried|scared|lonely|lost|broken))\s+/i,
        /^(help me|i need|i want|i'm looking for).*verse(s)?.*for\s+/i,
        /^(verses? for|passage(s)?.*when|scripture.*for|what should i read when)\s+/i,
        /^(when.*feel|in times of|during|facing|going through)\s+/i,
      ],
      emotions: ['sad', 'happy', 'anxious', 'peaceful', 'afraid', 'courageous', 'lonely', 'loved', 'lost', 'found', 'broken', 'strong', 'weak', 'hopeful', 'hopeless', 'faithful', 'doubtful', 'grateful', 'ungrateful']
    },

    // QUESTION-BASED PHILOSOPHICAL SEARCHES
    philosophicalSearch: {
      patterns: [
        /^(why|how|what|who|when|where)\s+(do|did|does|should|can|could|would|will|shall|might)\s+/i,
        /^(what does.*mean|what is.*in the bible|how should.*|why does.*|is.*biblical|is.*sin|what does god think about)\s+/i,
        /^(is it.*to|can i|should i|must i|do i have to)\s+/i,
      ],
      questions: ['Why does God allow suffering?', 'What is grace?', 'How should I pray?', 'Why do we sin?', 'What is faith?', 'How can I be saved?', 'What is heaven like?']
    },

    // INCOMPLETE/FRAGMENT SEARCHES
    fragmentSearch: {
      patterns: [
        /^(.*".*"|.*'.*')/i, // Quoted text
        /^([a-z]+\s+){1,3}(and|or|the|that|with|from)\s+([a-z]+\s+){1,3}$/i, // Natural phrase
      ]
    },

    // CONTEXTUAL TIME-BASED SEARCHES
    contextualSearch: {
      patterns: [
        /^(morning|evening|night|daily|daily reading|devotional|for today|what should i)\s+(verse|passage|read|meditate on)/i,
        /^(this week|today|tomorrow|monday through friday|weekend|before|after|during|before.*prayer)\s*(verse|passage|scripture)/i,
      ]
    },

    // MEMORIZATION/PRACTICE RELATED
    memorySearch: {
      patterns: [
        /^(memorize|remember|learn|study|practice|drill|go over|review|work on)\s+(verse(s)?|passage|this verse)/i,
        /^(i want to memorize|can we practice|let's work on|let's drill|what should i memorize|help me remember)\s+/i,
        /^(again|one more time|repeat|go again|let's try again|another one)\s*/i,
      ]
    },

    // COMPARATIVE SEARCHES
    comparativeSearch: {
      patterns: [
        /^(compare|difference|which is more|is.*more.*than|versus|vs|what's different about|same as)/i,
        /^(similar to|like|remind(s)?\s+me of|related to)\s+/i,
      ]
    },

      // Build comprehensive user stats from quiz history attempts
  const [userStats, setUserStats] = useState(null);
  const computeUserStats = (history = []) => {
    const stats = { total: 0, correct: 0, incorrect: 0, accuracy: 0, byType: {}, byDifficulty: {}, byBook: {}, byReference: {} };
    const getBook = (ref='') => (ref.split(' ')[0] || '').trim();
    history.forEach(h => {
      const type = h.type || 'unknown';
      const diff = h.verseDifficulty || 'Unknown';
      const ref = h.verseReference || h.reference || '';
      const book = getBook(ref);
      const isCorrect = !!h.correct;
      stats.total += 1; if (isCorrect) stats.correct += 1; else stats.incorrect += 1;
      // byType
      if (!stats.byType[type]) stats.byType[type] = { total: 0, correct: 0, incorrect: 0 };
      stats.byType[type].total += 1; if (isCorrect) stats.byType[type].correct += 1; else stats.byType[type].incorrect += 1;
      // byDifficulty
      if (!stats.byDifficulty[diff]) stats.byDifficulty[diff] = { total: 0, correct: 0, incorrect: 0 };
      stats.byDifficulty[diff].total += 1; if (isCorrect) stats.byDifficulty[diff].correct += 1; else stats.byDifficulty[diff].incorrect += 1;
      // byBook
      if (book) {
        if (!stats.byBook[book]) stats.byBook[book] = { total: 0, correct: 0, incorrect: 0 };
        stats.byBook[book].total += 1; if (isCorrect) stats.byBook[book].correct += 1; else stats.byBook[book].incorrect += 1;
      }
      // byReference
      if (ref) {
        if (!stats.byReference[ref]) stats.byReference[ref] = { total: 0, correct: 0, incorrect: 0 };
        stats.byReference[ref].total += 1; if (isCorrect) stats.byReference[ref].correct += 1; else stats.byReference[ref].incorrect += 1;
      }
    });
    stats.accuracy = stats.total ? Math.round((stats.correct / stats.total) * 100) : 0;
    // derive helpers
    const ratio = obj => Object.fromEntries(Object.entries(obj).map(([k,v]) => [k, { ...v, accuracy: v.total ? Math.round((v.correct/v.total)*100) : 0 }]));
    stats.byType = ratio(stats.byType); stats.byDifficulty = ratio(stats.byDifficulty); stats.byBook = ratio(stats.byBook); stats.byReference = ratio(stats.byReference);
    // weak areas
    stats.weakBooks = Object.entries(stats.byBook).filter(([k,v]) => v.total >= 3).sort((a,b)=>a[1].accuracy-b[1].accuracy).slice(0,3).map(([book,v])=>({book,accuracy:v.accuracy,total:v.total}));
    stats.topMissed = Object.entries(stats.byReference).filter(([k,v]) => v.total >= 2).sort((a,b)=>a[1].accuracy-b[1].accuracy).slice(0,5).map(([ref,v])=>({ref,accuracy:v.accuracy,total:v.total}));
    return stats;
  };
  useEffect(()=>{ setUserStats(computeUserStats(verseHistory||[])); }, [verseHistory]);// ATTRIBUTE-BASED SEARCHES
    attributeSearch: {
      patterns: [
        /^(longest|shortest|most important|famous|well-known|hardest|easiest|hardest to understand|most quoted)\s+(verse|passage|chapter|book)/i,
        /^(what's the.*verse|what's the.*passage|what's.*about|where.*most)\s+/i,
      ]
    },

    // NUMERICAL/CHAPTER RANGE SEARCHES
    rangeSearch: {
      patterns: [
        /^(chapter|chapters?)\s+\d+\s*(to|-|through|through?)\s*\d+/i,
        /^(\d+:\d+\s*to\s*\d+|\d+\s*to\s*\d+:\d+|\d+-\d+)/i,
        /^(verses?\s+\d+\s*(?:to|-|through)\s*\d+)\s+/i,
      ]
    },

    // PARAPHRASED/CASUAL SEARCHES
    casualSearch: {
      patterns: [
        /^(you know.*verse|that thing.*bible|what's.*thing about|that one verse|remember when)/i,
        /^(something about|somewhere.*says|i think.*says|didn't.*say something about)/i,
        /^(like.*says|isn't there.*that says|what does it say about)\s+/i,
      ]
    },

    // DIRECT AFFIRMATION SEARCHES
    affirmationSearch: {
      patterns: [
        /^(i need encouragement|give me strength|uplift me|encourage me|motivate me|inspire me|remind me)\s+/i,
        /^(positive|hope|inspiring|encouraging|motivating)\s+(verse|passage|scripture|quote)/i,
        /^(uplifting|comforting|reassuring|peaceful|calming)\s+/i,
      ]
    },

    // CONTEXTUAL LIFE SITUATION SEARCHES
    lifeSituationSearch: {
      patterns: [
        /^(i'm (starting|beginning|starting over|new job|moving|getting married|having a baby|graduating|losing|dealing with loss))\s+/i,
        /^(verse(s)? for (a new beginning|graduation|wedding|funeral|recovery|healing|forgiveness))\s*/i,
        /^(going through|experiencing|facing)\s+([a-z]+\s+){1,3}(and)\s+/i,
      ],
      situations: ['new job', 'marriage', 'divorce', 'death', 'illness', 'loss', 'failure', 'success', 'starting over', 'moving', 'graduation', 'retirement']
    }
  };

  // Initialize S.H.A.R.P. greeting on mount
  useEffect(() => {
    const greeting = generateGreeting();
    setMessages([{ role: 'sharp', content: greeting, timestamp: new Date() }]);
  }, []);

  useEffect(() => {
    if (verseHistory && verseHistory.length > 0) {
      analyzeMemoryPatterns();
    } else {
      setMemoryAnalytics({
        totalVerses: userData?.totalVersesMastered || 0,
        averageAccuracy: '--',
        weakAreas: [],
        strengths: [],
        suggestedFocus: 'Start practicing to track your progress!',
        retentionRate: '--'
      });
    }
  }, [verseHistory, userData]);

  const analyzeMemoryPatterns = () => {
    const analytics = {
      totalVerses: verseHistory.length,
      averageAccuracy: (verseHistory.reduce((sum, v) => sum + (v.accuracy || 0), 0) / verseHistory.length).toFixed(1),
      weakAreas: identifyWeakAreas(),
      strengths: identifyStrengths(),
      suggestedFocus: generateSuggestedFocus(),
      retentionRate: calculateRetentionRate()
    };
    setMemoryAnalytics(analytics);
  };

  const identifyWeakAreas = () => {
    if (!verseHistory || verseHistory.length === 0) return [];
    const bookAccuracy = {};
    verseHistory.forEach(verse => {
      const book = verse.reference?.split(' ')[0];
      if (book) {
        bookAccuracy[book] = ((bookAccuracy[book] || 0) + (verse.accuracy || 0)) / 2;
      }
    });
    return Object.entries(bookAccuracy)
      .filter(([_, acc]) => acc < 70)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 3)
      .map(([book, acc]) => ({ book, accuracy: acc.toFixed(0) }));
  };

  const identifyStrengths = () => {
    if (!verseHistory || verseHistory.length === 0) return [];
    const bookAccuracy = {};
    verseHistory.forEach(verse => {
      const book = verse.reference?.split(' ')[0];
      if (book) {
        bookAccuracy[book] = ((bookAccuracy[book] || 0) + (verse.accuracy || 0)) / 2;
      }
    });
    return Object.entries(bookAccuracy)
      .filter(([_, acc]) => acc >= 80)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([book, acc]) => ({ book, accuracy: acc.toFixed(0) }));
  };

  const calculateRetentionRate = () => {
    if (!verseHistory || verseHistory.length === 0) return 0;
    const retentionCount = verseHistory.filter(v => v.accuracy >= 80).length;
    return ((retentionCount / verseHistory.length) * 100).toFixed(0);
  };

  const generateSuggestedFocus = () => {
    const weakAreas = identifyWeakAreas();
    if (weakAreas.length === 0) return 'Continue mastering all areas!';
    return `Focus on ${weakAreas[0].book} - currently at ${weakAreas[0].accuracy}% accuracy`;
  };

  const generateGreeting = () => {
    const hour = new Date().getHours();
    const greetings = {
      morning: "Good morning, warrior! ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ The sword is sharpest at dawn. Let's refine your Scripture knowledge today.",
      afternoon: "Welcome back! ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Time to strengthen your spiritual armor. What shall we drill today?",
      evening: "Evening, defender! ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ Let's meditate on Scripture and end the day strengthened.",
      night: "Late-night warrior! ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ 'Your word is a lamp to my feet.' Let's keep that flame burning."
    };

    let timeOfDay = 'afternoon';
    if (hour < 12) timeOfDay = 'morning';
    else if (hour < 17) timeOfDay = 'afternoon';
    else if (hour < 21) timeOfDay = 'evening';
    else timeOfDay = 'night';

    return greetings[timeOfDay];
  };

  // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ NEW: Word frequency database - tracks how common each word is across all verses
  const WORD_FREQUENCY = {
    // VERY RARE (appears in 1-2 verses only) - Weight: 15
    'brethren': 15,
    'pressed': 15,
    'shaken': 15,
    'profit': 15,
    'ephah': 15,
    'teraphim': 15,
    'phylacteries': 15,
    
    // RARE (appears in 3-5 verses) - Weight: 12
    'beginning': 12,
    'forfeit': 12,
    'bosom': 12,
    'sepulchre': 12,
    'charity': 12,
    'suffereth': 12,
    
    // UNCOMMON (appears in 6-10 verses) - Weight: 9
    'gain': 8,
    'soul': 10,
    'running': 9,
    'measure': 8,
    'created': 8,
    'sanctified': 9,
    
    // MODERATELY COMMON (appears in 11-20 verses) - Weight: 6-8
    'together': 7,
    'things': 6,
    'work': 7,
    'works': 7,
    'good': 6,
    'love': 7,
    'patient': 6,
    'kind': 6,
    'trust': 8,
    'strong': 8,
    'strength': 8,
    'might': 8,
    
    // COMMON (appears in 21+ verses) - Weight: 3-5
    'god': 3,
    'jesus': 4,
    'heart': 4,
    'faith': 5,
    'blessed': 4,
    'salvation': 5,
    'give': 3,
    'life': 4,
    'world': 4,
    'believe': 4,
    'known': 4,
    'called': 4,
    'finally': 3,
    'lord': 4,
  };

  // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ NEW: Advanced fuzzy search using word rarity (least common word priority)
  const advancedFuzzySearch = (fragment) => {
    const commonVerses = [
      { 
        reference: 'Genesis 1:1', 
        text: 'In the beginning God created the heavens and the earth.',
        kjv: 'In the beginning God created the heaven and the earth.',
        book: 'Genesis', 
        topic: 'creation', 
        aliases: ['in the beginning', 'beginning god', 'created', 'heaven earth'] 
      },
      { 
        reference: 'Ephesians 6:10', 
        text: 'Finally, be strong in the Lord and in the strength of his might.',
        kjv: 'Finally, my brethren, be strong in the Lord, and in the power of his might.',
        book: 'Ephesians', 
        topic: 'strength',
        aliases: ['finally brethren', 'strong lord', 'strength might', 'finally my brethren', 'be strong lord', 'brethren strong'] 
      },
      { 
        reference: 'Luke 6:38', 
        text: 'Give, and it will be given to you. A good measure, pressed down, shaken together and running over, will be poured into your lap.',
        kjv: 'Give, and it shall be given unto you; good measure, pressed down, and shaken together, and running over, shall men give into your bosom.',
        book: 'Luke', 
        topic: 'giving',
        aliases: ['pressed down', 'shaken together', 'running over', 'give measure', 'pressed down shaken', 'measure given'] 
      },
      { 
        reference: 'Romans 8:28', 
        text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.',
        kjv: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.',
        book: 'Romans', 
        topic: 'faith',
        aliases: ['all things', 'god works', 'good', 'called purpose', 'work together', 'work together good'] 
      },
    ];

    // Extract keywords
    const stopWords = ['the', 'a', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'it', 'this', 'that', 'and', 'or', 'but', 'if', 'for', 'to', 'of', 'in', 'on', 'at', 'by', 'with', 'from', 'where', 'does', 'say', 'my'];
    const keywords = fragment.toLowerCase().split(/\s+/).filter(word => word.length > 2 && !stopWords.includes(word));

    if (keywords.length === 0) return [];

    // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ RARITY-BASED SCORING: Sort keywords by rarity (least common first)
    const keywordsByRarity = keywords.map(keyword => ({
      word: keyword,
      rarity: WORD_FREQUENCY[keyword] || 5, // Default rarity for unknown words
    })).sort((a, b) => b.rarity - a.rarity); // Sort by rarity descending

    console.log('ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Keywords by rarity:', keywordsByRarity.map(k => `${k.word}(${k.rarity})`).join(', '));

    // Score verses by matching rare words with highest priority
    const scored = commonVerses.map(verse => {
      let score = 0;
      const verseTextLower = verse.text.toLowerCase();
      const verseKJVLower = (verse.kjv || '').toLowerCase();
      const verseAliasLower = (verse.aliases || []).join(' ').toLowerCase();

      // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ RARE WORD PRIORITY: Check rare words first with highest multiplier
      keywordsByRarity.forEach(({ word, rarity }, index) => {
        // Rare words get priority bonus: first word gets 1x, second gets 0.8x, etc.
        const priorityMultiplier = Math.max(0.5, 1 - (index * 0.1));
        
        // Check all versions, rare words get huge bonus
        if (verseTextLower.includes(word)) score += rarity * 2.5 * priorityMultiplier;
        if (verseKJVLower.includes(word)) score += rarity * 2.0 * priorityMultiplier;
        if (verseAliasLower.includes(word)) score += rarity * 3.5 * priorityMultiplier; // Alias gets highest bonus
      });

      return { verse, score };
    }).filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);

    console.log('ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â  Scored verses:', scored.map(s => `${s.verse.reference}(${Math.round(s.score)}pts)`).join(', '));
    return scored.map(item => item.verse).slice(0, 3);
  };

  // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ ENHANCED: Detect query type from user input using comprehensive patterns
  const detectQueryType = (userMessage) => {
    const lowerInput = userMessage.toLowerCase();
    
    // Direct reference check (e.g., "John 3:16")
    if (/\d+\s+[a-z]+\s+\d+:\d+/i.test(userMessage)) {
      return { type: 'reference', query: userMessage.match(/\d+\s+[a-z]+\s+\d+:\d+/i)[0] };
    }
    
    // Check against all pattern groups
    for (const [categoryName, category] of Object.entries(QUESTION_VARIATIONS)) {
      if (category.patterns) {
        for (const pattern of category.patterns) {
          if (pattern.test(userMessage)) {
            return { type: categoryName, confidence: 'high' };
          }
        }
      }
    }
    
    // Fallback keyword matching
    const verseKeywords = ['verse', 'passage', 'scripture', 'says', 'about', 'find', 'search', 'quote', 'reference'];
    if (verseKeywords.some(keyword => lowerInput.includes(keyword))) {
      return { type: 'directVerseSearch', confidence: 'medium' };
    }
    
    return { type: 'unknown', confidence: 'low' };
  };

  // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ IMPROVED: Extract search query by removing question words
  const extractSearchQuery = (userMessage) => {
    const lowerInput = userMessage.toLowerCase();
    
    // Remove common question patterns
    let query = userMessage
      // Remove question prefixes
      .replace(/^(where is|where's|what is|what's|can you|could you|would you|is there|do you|does|did you|find|search|tell me|show me|give me|locate|retrieve|get|pull up|bring up)\s+/i, '')
      // Remove "verses/passages about"
      .replace(/\b(verses?|passages?|scriptures?|text|quote)\s+(about|on|regarding|concerning|related to)\s+/i, '')
      // Remove "the verse that says"
      .replace(/\bthe verse\s+(?:that\s+)?says\s+/i, '')
      .replace(/\bverse\s+(?:that\s+)?says\s+/i, '')
      // Remove "about"
      .replace(/\babout\s+/i, '')
      // Remove quoted text markers
      .replace(/["\']([^"\']*)["\']?/g, '$1')
      // Remove trailing question mark
      .replace(/\s*\?+\s*$/,'')
      // Trim whitespace
      .trim();

    return query;
  };

  // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ SEARCH VERSES - Using working API with multiple fallbacks
  const searchVersesByFragment = async (fragment) => {
    try {
      setIsSearching(true);

      // Try ESV Bible API first (most reliable, free)
      const esvResults = await searchViaESVAPI(fragment);
      if (esvResults && esvResults.length > 0) {
        return esvResults;
      }

      // Try local exact match search
      const localResults = searchLocalVerses(fragment.toLowerCase());
      if (localResults && localResults.length > 0) {
        return localResults;
      }

      // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ NEW: Try fuzzy matching for archaic/paraphrased verses
      const fuzzyResults = fuzzySearchVerses(fragment.toLowerCase());
      if (fuzzyResults && fuzzyResults.length > 0) {
        return fuzzyResults;
      }

      return [];
    } catch (error) {
      console.error('Verse search error:', error);
      return searchLocalVerses(fragment.toLowerCase());
    } finally {
      setIsSearching(false);
    }
  };

  // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Working API: ESV Bible (Free, no key needed for search)
  const searchViaESVAPI = async (fragment) => {
    try {
      const response = await fetch(
        `https://www.esvapi.org/v2/rest/passageQuery?key=IP&passage=${encodeURIComponent(fragment)}&output-format=json`,
        {
          mode: 'cors',
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        console.log('ESV API response not ok:', response.status);
        return [];
      }

      const data = await response.json();
      
      if (data.passages && data.passages.length > 0) {
        return data.passages.map((p, idx) => ({
          reference: p.substring(0, p.indexOf('\n')), // Get reference from passage
          text: p,
          book: p.split(' ')[0],
          topic: 'general'
        })).slice(0, 5);
      }
      return [];
    } catch (error) {
      console.log('ESV API error:', error.message);
      return [];
    }
  };

  const searchLocalVerses = (lowerFragment) => {
    // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ ENHANCED: Each verse now includes both KJV and ESV variants
    const commonVerses = [
      // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ ADDED: Genesis 1:1 - "In the beginning"
      { reference: 'Genesis 1:1', text: 'In the beginning God created the heavens and the earth.', kjv: 'In the beginning God created the heaven and the earth.', book: 'Genesis', topic: 'creation', aliases: ['in the beginning', 'beginning god', 'created', 'heaven earth', 'genesis 1'] },
      
      // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ ADDED: Luke 6:38 - "Pressed down shaken together"
      { reference: 'Luke 6:38', text: 'Give, and it will be given to you. A good measure, pressed down, shaken together and running over, will be poured into your lap. For with the measure you use, it will be measured to you.', kjv: 'Give, and it shall be given unto you; good measure, pressed down, and shaken together, and running over, shall men give into your bosom. For with the same measure that ye mete withal it shall be measured to you again.', book: 'Luke', topic: 'giving', aliases: ['pressed down', 'shaken together', 'running over', 'give measure', 'pressed down shaken', 'measure given'] },
      
      { reference: 'John 3:16', text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.', kjv: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.', book: 'John', topic: 'faith', aliases: ['john', 'believe', 'eternal life', 'loved world', 'begotten'] },
      { reference: 'Romans 3:23', text: 'for all have sinned and fall short of the glory of God', kjv: 'For all have sinned, and come short of the glory of God;', book: 'Romans', topic: 'sin', aliases: ['sinned', 'fall short', 'glory'] },
      { reference: '1 John 1:9', text: 'If we confess our sins, he is faithful and just and will forgive us our sins and purify us from all unrighteousness.', kjv: 'If we confess our sins, he is faithful and just to forgive us our sins, and to cleanse us from all unrighteousness;', book: '1 John', topic: 'forgiveness', aliases: ['confess sins', 'faithful', 'purify', 'cleanse'] },
      { reference: 'Proverbs 3:5-6', text: 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.', kjv: 'Trust in the Lord with all thine heart; and lean not unto thine own understanding: In all thy ways acknowledge him, and he shall direct thy paths.', book: 'Proverbs', topic: 'trust', aliases: ['trust lord', 'lean not', 'understanding', 'paths straight', 'acknowledge'] },
      { reference: 'Philippians 4:13', text: 'I can do all this through him who gives me strength.', kjv: 'I can do all things through Christ which strengtheneth me.', book: 'Philippians', topic: 'strength', aliases: ['i can do', 'all things', 'strength', 'through him', 'christ strength', 'strengtheneth'] },
      { reference: 'Jeremiah 29:11', text: '"For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, plans to give you hope and a future."', kjv: 'For I know the thoughts that I think toward you, saith the Lord, thoughts of peace, and not of evil, to give you an expected end.', book: 'Jeremiah', topic: 'hope', aliases: ['plans for you', 'prosper', 'hope', 'future', 'expected end', 'thoughts of peace'] },
      { reference: 'Isaiah 40:31', text: 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.', kjv: 'But they that wait upon the Lord shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.', book: 'Isaiah', topic: 'strength', aliases: ['renew strength', 'eagles', 'weary', 'faint', 'wait upon', 'mount up'] },
      { reference: 'Psalm 23:1', text: 'The Lord is my shepherd, I lack nothing.', kjv: 'The Lord is my shepherd; I shall not want.', book: 'Psalm', topic: 'peace', aliases: ['shepherd', 'lack nothing', 'psalm 23', 'shall not want'] },
      { reference: '1 Corinthians 13:4-7', text: 'Love is patient, love is kind. It does not envy, it does not boast, it is not proud. It does not dishonor others, it is not self-seeking, it is not easily angered, it keeps no record of wrongs. Love does not delight in evil but rejoices with the truth. It always protects, always trusts, always hopes, always perseveres.', kjv: 'Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up, Doth not behave itself unseemly, seeketh not her own, is not easily provoked, thinketh no evil; Rejoiceth not in iniquity, but rejoiceth in the truth; Beareth all things, believeth all things, hopeth all things, endureth all things.', book: '1 Corinthians', topic: 'love', aliases: ['love is patient', 'patient kind', 'no record', 'love chapter', 'charity suffereth', 'beareth all things'] },
      { reference: 'Ephesians 2:8-9', text: 'For it is by grace you have been saved, through faithÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Âand this is not from yourselves, it is the gift of GodÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â not by works, so that no one can boast.', kjv: 'For by grace are ye saved through faith; and that not of yourselves: it is the gift of God: Not of works, lest any man should boast.', book: 'Ephesians', topic: 'grace', aliases: ['grace saved', 'gift of god', 'by works', 'not boast', 'saved through faith'] },
      { reference: 'Matthew 5:7', text: 'Blessed are the merciful, for they will be shown mercy.', kjv: 'Blessed are the merciful: for they shall obtain mercy.', book: 'Matthew', topic: 'mercy', aliases: ['merciful', 'blessed', 'mercy', 'obtain mercy'] },
      { reference: 'Luke 6:31', text: 'Do to others as you would have them do to you.', kjv: 'And as ye would that men should do to you, do ye also to them likewise.', book: 'Luke', topic: 'kindness', aliases: ['golden rule', 'do to others', 'treat others'] },
      { reference: 'Proverbs 22:6', text: 'Train up a child in the way he should go; even when he is old, he will not depart from it.', kjv: 'Train up a child in the way he should go: and when he is old, he will not depart from it.', book: 'Proverbs', topic: 'wisdom', aliases: ['train child', 'child training', 'way he should go', 'depart'] },
      { reference: 'Deuteronomy 31:8', text: 'The Lord himself goes before you and will be with you; he will never leave you nor forsake you. Do not be afraid; do not be discouraged.', kjv: 'And the Lord, he it is that doth go before thee; he will be with thee, he will not fail thee, neither forsake thee: fear thou not, neither be dismayed.', book: 'Deuteronomy', topic: 'courage', aliases: ['never leave', 'forsake', 'not afraid', 'discouraged', 'go before'] },
      { reference: 'Psalm 27:1', text: 'The Lord is my light and my salvationÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Âwhom shall I fear? The Lord is the stronghold of my lifeÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Âof whom shall I be afraid?', kjv: 'The Lord is my light and my salvation; whom shall I fear? the Lord is the strength of my life; of whom shall I be afraid?', book: 'Psalm', topic: 'courage', aliases: ['light salvation', 'stronghold', 'fear', 'psalm 27', 'strength of my life'] },
      { reference: '2 Timothy 1:7', text: 'For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline.', kjv: 'For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.', book: '2 Timothy', topic: 'courage', aliases: ['not timid', 'power love', 'self-discipline', 'spirit of fear', 'sound mind'] },
      { reference: 'Philippians 4:8', text: 'Finally, brothers and sisters, whatever is true, whatever is noble, whatever is right, whatever is pure, whatever is lovely, whatever is admirableÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Âif anything is excellent or praiseworthyÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Âthink about such things.', kjv: 'Finally, brethren, whatsoever things are true, whatsoever things are honest, whatsoever things are just, whatsoever things are pure, whatsoever things are lovely, whatsoever things are of good report; if there be any virtue, and if there be any praise, think on these things.', book: 'Philippians', topic: 'wisdom', aliases: ['whatever is true', 'noble right pure', 'think on these', 'good report'] },
      { reference: 'John 14:6', text: 'Jesus answered, "I am the way and the truth and the life. No one comes to the Father except through me."', kjv: 'Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me.', book: 'John', topic: 'faith', aliases: ['way truth life', 'no one comes', 'through me', 'cometh unto'] },
      { reference: '1 John 4:7-8', text: 'Dear friends, let us love one another, for love comes from God. Everyone who loves has been born of God and knows God. Whoever does not love does not know God, because God is love.', kjv: 'Beloved, let us love one another: for love is of God; and every one that loveth is born of God, and knoweth God. He that loveth not knoweth not God; for God is love.', book: '1 John', topic: 'love', aliases: ['love one another', 'god is love', 'born of god', 'loveth', 'beloved'] },
      { reference: 'Mark 12:30-31', text: '"Love the Lord your God with all your heart and with all your soul and with all your mind and with all your strength. The second is this: \'Love your neighbor as yourself.\' There is no commandment greater than these."', kjv: 'And thou shalt love the Lord thy God with all thy heart, and with all thy soul, and with all thy mind, and with all thy strength: this is the first commandment. And the second is like, namely this, Thou shalt love thy neighbour as thyself. There is none other commandment greater than these.', book: 'Mark', topic: 'love', aliases: ['love god', 'love neighbor', 'greatest commandment', 'neighbour thyself'] },
      { reference: 'Matthew 16:26', text: 'What good is it for someone to gain the whole world, yet forfeit their soul? Or what can anyone give in exchange for their soul?', kjv: 'For what is a man profited, if he shall gain the whole world, and lose his own soul? or what shall a man give in exchange for his soul?', book: 'Matthew', topic: 'wisdom', aliases: ['what profit', 'gain world', 'lose soul', 'profit man', 'whole world', 'forfeit soul', 'exchange soul', 'profited'] },
      { reference: 'Mark 8:36', text: 'What good is it for someone to gain the whole world, yet forfeit their soul?', kjv: 'For what shall it profit a man, if he shall gain the whole world, and lose his own soul?', book: 'Mark', topic: 'wisdom', aliases: ['what profit', 'gain world', 'forfeit soul', 'profit', 'profited'] },
      { reference: 'Romans 8:28', text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.', kjv: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.', book: 'Romans', topic: 'faith', aliases: ['all things', 'god works', 'good', 'called purpose', 'work together', 'work together good', 'all things work'] },
      { reference: 'Matthew 11:28', text: 'Come to me, all you who are weary and burdened, and I will give you rest.', kjv: 'Come unto me, all ye that labour and are heavy laden, and I will give you rest.', book: 'Matthew', topic: 'peace', aliases: ['weary', 'burdened', 'rest', 'come to me', 'labour', 'heavy laden'] },
      { reference: '1 Peter 5:7', text: 'Cast all your anxiety on him because he cares for you.', kjv: 'Casting all your care upon him; for he careth for you.', book: '1 Peter', topic: 'peace', aliases: ['cast anxiety', 'cast cares', 'he cares', 'careth', 'casting care'] },
      { reference: 'Philippians 4:6-7', text: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.', kjv: 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God. And the peace of God, which passeth all understanding, shall keep your hearts and your minds through Christ Jesus.', book: 'Philippians', topic: 'peace', aliases: ['do not be anxious', 'prayer petition', 'peace god', 'thanksgiving', 'careful for nothing', 'passeth understanding'] },
    ];

    // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ ENHANCED: Multiple matching strategies with multi-version support
    const results = commonVerses.filter(v => {
      const textMatch = v.text.toLowerCase().includes(lowerFragment);
      const kjvMatch = v.kjv && v.kjv.toLowerCase().includes(lowerFragment);
      const referenceMatch = v.reference.toLowerCase().includes(lowerFragment);
      const topicMatch = v.topic.toLowerCase().includes(lowerFragment);
      const aliasMatch = v.aliases && v.aliases.some(alias => alias.toLowerCase().includes(lowerFragment));
      
      return textMatch || kjvMatch || referenceMatch || topicMatch || aliasMatch;
    });

    return results.length > 0 ? results.slice(0, 5) : advancedFuzzySearch(lowerFragment);
  };

  // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ LEGACY: Old fuzzy search (replaced by advancedFuzzySearch)
  const fuzzySearchVerses = (fragment) => {
    // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ EXPANDED: Verses with KJV and ESV variants
    const commonVerses = [
      { 
        reference: 'Genesis 1:1', 
        text: 'In the beginning God created the heavens and the earth.',
        kjv: 'In the beginning God created the heaven and the earth.',
        book: 'Genesis', 
        topic: 'creation', 
        aliases: ['in the beginning', 'beginning god', 'created', 'heaven earth', 'genesis 1'] 
      },
      { 
        reference: 'Luke 6:38', 
        text: 'Give, and it will be given to you. A good measure, pressed down, shaken together and running over, will be poured into your lap. For with the measure you use, it will be measured to you.',
        kjv: 'Give, and it shall be given unto you; good measure, pressed down, and shaken together, and running over, shall men give into your bosom. For with the same measure that ye mete withal it shall be measured to you again.',
        book: 'Luke', 
        topic: 'giving', 
        aliases: ['pressed down', 'shaken together', 'running over', 'give measure', 'pressed down shaken', 'measure given', 'pressed shaken'] 
      },
      { 
        reference: 'Matthew 16:26', 
        text: 'What good is it for someone to gain the whole world, yet forfeit their soul? Or what can anyone give in exchange for their soul?',
        kjv: 'For what is a man profited, if he shall gain the whole world, and lose his own soul?',
        book: 'Matthew', 
        topic: 'wisdom', 
        aliases: ['what profit', 'gain world', 'lose soul', 'profit man', 'whole world', 'forfeit soul', 'exchange soul', 'profited', 'gain whole'] 
      },
      { 
        reference: 'Mark 8:36', 
        text: 'What good is it for someone to gain the whole world, yet forfeit their soul?',
        kjv: 'For what shall it profit a man, if he shall gain the whole world, and lose his own soul?',
        book: 'Mark', 
        topic: 'wisdom', 
        aliases: ['what profit', 'gain world', 'forfeit soul', 'profit', 'profited'] 
      },
      { 
        reference: 'Romans 8:28', 
        text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.',
        kjv: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.',
        book: 'Romans', 
        topic: 'faith', 
        aliases: ['all things', 'god works', 'good', 'called purpose', 'work together', 'work together good', 'all things work', 'all things god'] 
      },
      { 
        reference: 'Proverbs 3:5-6', 
        text: 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.',
        kjv: 'Trust in the Lord with all thine heart; and lean not unto thine own understanding.',
        book: 'Proverbs', 
        topic: 'trust', 
        aliases: ['trust lord', 'lean not', 'understanding', 'paths straight', 'trust heart', 'lean not own'] 
      },
      { 
        reference: '1 Corinthians 13:4-7', 
        text: 'Love is patient, love is kind. It does not envy, it does not boast, it is not proud. It does not dishonor others, it is not self-seeking, it is not easily angered, it keeps no record of wrongs. Love does not delight in evil but rejoices with the truth. It always protects, always trusts, always hopes, always perseveres.',
        kjv: 'Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up.',
        book: '1 Corinthians', 
        topic: 'love', 
        aliases: ['love is patient', 'patient kind', 'no record', 'love chapter', 'charity suffereth'] 
      },
    ];

    // Extract key words from fragment (remove common words)
    const stopWords = ['the', 'a', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'it', 'this', 'that', 'and', 'or', 'but', 'if', 'for', 'to', 'of', 'in', 'on', 'at', 'by', 'with', 'from', 'where', 'does', 'say'];
    const keywords = fragment.toLowerCase().split(/\s+/).filter(word => word.length > 2 && !stopWords.includes(word));

    if (keywords.length === 0) return [];

    // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ SEMANTIC SCORING: Weight keywords by semantic importance
    const semanticWeights = {
      // High importance keywords - VERY SPECIFIC
      'profit': 10,
      'pressed': 10,      // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ NEW - Very specific to Luke 6:38
      'shaken': 10,       // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ NEW - Very specific to Luke 6:38
      'beginning': 10,    // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ NEW - Very specific to Genesis 1:1
      'gain': 8,
      'world': 7,
      'soul': 10,
      'lose': 9,
      
      // Work/purpose related
      'things': 7,
      'work': 8,
      'together': 9,
      'good': 6,
      'purpose': 8,
      'running': 8,       // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ NEW - Specific to Luke 6:38
      'measure': 7,       // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ NEW - Specific to Luke 6:38
      'give': 6,          // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ NEW - Context: giving/measure
      
      // Love related
      'love': 9,
      'patient': 8,
      'kind': 7,
      
      // Trust/creation related
      'trust': 9,
      'lord': 7,
      'heart': 6,
      'lean': 8,
      'created': 8,       // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ NEW - Specific to Genesis 1:1
      'heaven': 7,        // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ NEW - Specific to Genesis 1:1
      'earth': 6,         // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ NEW - Less specific but helps
    };

    // Score each verse based on keyword matches with semantic weighting
    const scored = commonVerses.map(verse => {
      let score = 0;
      const verseTextLower = verse.text.toLowerCase();
      const verseKJVLower = (verse.kjv || '').toLowerCase();
      const verseAliasLower = (verse.aliases || []).join(' ').toLowerCase();
      
      keywords.forEach(keyword => {
        const weight = semanticWeights[keyword] || 5; // Default weight
        
        // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ MULTI-VERSION MATCHING: Check both ESV and KJV
        if (verseTextLower.includes(keyword)) score += weight * 2; // ESV text match (highest priority)
        if (verseKJVLower.includes(keyword)) score += weight * 1.5; // KJV text match
        if (verseAliasLower.includes(keyword)) score += weight * 2.5; // Alias match (highest)
        if (verse.topic.includes(keyword)) score += weight * 0.5;
      });
      
      return { verse, score };
    }).filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.map(item => item.verse).slice(0, 3);
  };

  const generateSharpResponse = async (userMessage) => {
    const lowerInput = userMessage.toLowerCase();

    // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ NEW: Check if user wants to practice the current verse
    const practiceMatch = userMessage.match(/^(yes|yeah|yep|sure|ok|okay|y|let's|let us|start|begin|true|1)$/i);
    if (practiceMatch && messages.length > 0) {
      // Get the last message that showed a verse
      const lastVerseMessage = messages.filter(m => m.role === 'sharp' && m.content.includes('Would you like to practice')).slice(-1)[0];
      
      if (lastVerseMessage && lastVerseMessage.content.includes('ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â')) {
        // Extract verse reference from the message (format: "ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â Reference")
        const refMatch = lastVerseMessage.content.match(/ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â (.+?)(?:\n|$)/);
        if (refMatch) {
          const verseReference = refMatch[1].trim();
          
          console.log('ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Starting practice mode for:', verseReference);
          
          // Return practice mode prompt
          return `Great! Let's practice "${verseReference}" ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â\n\nI'll recite the verse, and you fill in the missing words:\n\n"Give, and it will be given to you. A good measure, _______, _______ _______ and running over, will be poured into your lap."\n\nWhat are the missing words?`;
        }
      }
    }

    // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ NEW: Check if user is selecting from multiple options (e.g., "1", "2", "first", "second")
    const numberMatch = userMessage.match(/^(\d+)$|^(first|second|third|one|two|three)$/i);
    if (numberMatch && lastSearchResults && lastSearchResults.length > 1) {
      // User selected an option!
      let selectedIndex = 0;
      if (userMessage.match(/^1$|^first$|^one$/i)) selectedIndex = 0;
      if (userMessage.match(/^2$|^second$|^two$/i)) selectedIndex = 1;
      if (userMessage.match(/^3$|^third$|^three$/i)) selectedIndex = 2;

      if (selectedIndex < lastSearchResults.length) {
        const selectedVerse = lastSearchResults[selectedIndex];
        console.log('ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ User selected verse:', selectedVerse.reference);
        
        // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ NEW: Store the selected verse for practice mode
        setLastSearchResults([selectedVerse]); // Keep it in state for practice
        
        return `Found it! ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ\n\n"${selectedVerse.text}"\n\nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ${selectedVerse.reference}\n\nWould you like to practice this verse? ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â`;
      }
    }

    // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ DETECT: Query type with exhaustive patterns
    const queryDetection = detectQueryType(userMessage);
    console.log('Query detected:', queryDetection);

    // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ ALL VERSE QUERIES - Using comprehensive type detection
    const verseQueryTypes = [
      'directVerseSearch', 'topicSearch', 'keywordSearch', 'characterSearch',
      'bookSearch', 'referenceSearch', 'needBasedSearch', 'philosophicalSearch',
      'fragmentSearch', 'contextualSearch', 'memorySearch', 'comparativeSearch',
      'attributeSearch', 'rangeSearch', 'casualSearch', 'affirmationSearch',
      'lifeSituationSearch'
    ];

    if (verseQueryTypes.includes(queryDetection.type) && userMessage.length > 5) {
      // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ EXTRACT CLEAN SEARCH QUERY
      const searchQuery = extractSearchQuery(userMessage);

      console.log('User asked:', userMessage);
      console.log('Query type:', queryDetection.type);
      console.log('Extracted query:', searchQuery);

      if (searchQuery.length > 2) {
        const matches = await searchVersesByFragment(searchQuery);

        // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ NEW: Store results for number selection follow-up
        setLastSearchResults(matches);
        setLastSearchQuery(searchQuery);

        if (matches.length === 0) {
          const adv = await answerQuery(userMessage, { verseHistory, selectedTranslation, userStats });
          return adv.answer;
        }

        if (matches.length === 1) {
          return `Found it! ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ\n\n"${matches[0].text}"\n\nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ${matches[0].reference}\n\nWould you like to practice this verse? ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â`;
        }

        // Multiple matches - ask user to select
        const options = matches.map((v, i) => `${i + 1}. ${v.reference}\n   "${v.text.substring(0, 50)}..."`).join('\n\n');
        return `I found ${matches.length} verses! Which one?\n\n${options}\n\nTell me the number or ask with more details. ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â½ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯`;
      }
    }

    // Other responses
    const responses = { 
      creed: { keywords: ['creed','creed of the way','way creed','closing confession','rule of life','confession'], response: creedText() },  
      mission: { keywords: ['mission','goal','vision','purpose','what is sharp','who are you','about sharp'], response: missionText() }, 
      help: {
        keywords: ['help', 'what can you', 'what do you', 'capabilities', 'functions'],
        response: `I can:\nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Find verses by text fragment\nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Search by book or topic\nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Provide encouragement\nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Show your progress\nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Switch modes\n\nWhat would you like? ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â`
      },
      progress: {
        keywords: ['progress', 'stats', 'how am i', 'performance', 'standing', 'how many'],
        response: `You're doing great! ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â½ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â°\nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â  Your Stats:\nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ Verses: ${userData?.totalVersesMastered || 0}\nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ Points: ${userData?.totalPoints || 0}\nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ Streak: ${userData?.streak || 0}ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥\n\nKeep it up! ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â`
      }
    };

    for (const [category, data] of Object.entries(responses)) {
      if (data.keywords.some(keyword => lowerInput.includes(keyword))) {
        return data.response;
      }
    }

    const adv2 = await answerQuery(userMessage, { verseHistory, selectedTranslation, userStats });
    return adv2.answer;
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const userMessage = { role: 'user', content: userInput, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage, { role: 'sharp', content: 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³ Searching..', timestamp: new Date() }]);

    const userInputText = userInput;
    setUserInput('');

    const response = await generateSharpResponse(userInputText);
    // Also get structured neutral answer with citations/meta
    const enriched = await answerQuery(userInputText, { verseHistory, selectedTranslation, userStats });
    const intent = routeIntent(userInputText)?.type || 'general';
    const finalAnswer = ensureScriptureBlock(enriched, intent);

    const isPracticeFlow = typeof response === 'string' && response.includes('Would you like to practice');
    const finalMsg = isPracticeFlow
      ? { role: 'sharp', content: response, timestamp: new Date() }
      : { role: 'sharp', content: enriched.answer || (typeof response === 'string' ? response : ''), citations: finalAnswer.citations || enriched.citations || [], meta: enriched.meta || null, timestamp: new Date() };

    setMessages(prev => [
      ...prev.slice(0, -1),
      finalMsg
    ]);
  };

  // Quick action helper (bypasses input box)
  const sendQuickPrompt = async (text) => {
    const userMessage = { role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage, { role: 'sharp', content: thinkingMessage(), timestamp: new Date() }]);
    const response = await generateSharpResponse(text);
    const enriched = await answerQuery(text, { verseHistory, selectedTranslation, userStats });
    const intent = routeIntent(text)?.type || 'general';
    const finalAnswer = ensureScriptureBlock(enriched, intent);
    const finalMsg = (typeof response === 'string' && response.includes('Would you like to practice'))
      ? { role: 'sharp', content: response, timestamp: new Date() }
      : { role: 'sharp', content: enriched.answer || (typeof response === 'string' ? response : ''), citations: finalAnswer.citations || enriched.citations || [], meta: enriched.meta || null, timestamp: new Date() };
    setMessages(prev => [
      ...prev.slice(0, -1),
      finalMsg
    ]);
  };

  const modeConfigs = {
    mentor: { color: 'from-blue-600 to-blue-700', description: 'Wise & Methodical' },
    companion: { color: 'from-purple-600 to-purple-700', description: 'Warm & Encouraging' },
    instructor: { color: 'from-amber-600 to-amber-700', description: 'Direct & Focused' }
  };

  return (
    <div className="w-full">
      <div className={`bg-gradient-to-br ${modeConfigs[mode].color} rounded-xl p-6 text-white shadow-xl border border-opacity-20`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-4xl animate-pulse text-amber-300">
            <SwordIcon size={40} />
          </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">S.H.A.R.P.</h2><button className="ml-3 text-xs px-2 py-1 rounded bg-white/15 hover:bg-white/25 border border-white/20" onClick={(e)=>{e.preventDefault(); setShowMission(!showMission);}}>{showMission ? "Hide Mission" : "Show Mission"}</button>
                {isSearching && (
                  <span className="inline-flex items-center" title="Analyzing">
                    <span className="w-2 h-2 rounded-full bg-white/80 animate-ping"></span>
                    <span className="w-2 h-2 rounded-full bg-white/60 ml-1 animate-pulse"></span>
{showMission && (
  <div className=\"mt-3 bg-white/10 rounded-lg p-3 text-sm\">
    <div className=\"font-semibold mb-1\">Goal</div>
    <div className=\"mb-2\">{SHARP_MANIFEST.goal}</div>
    <div className=\"font-semibold mb-1\">Vision</div>
    <div className=\"mb-2\">{SHARP_MANIFEST.vision}</div>
    <div className=\"font-semibold mb-1\">Purpose</div>
    <ul className=\"list-disc pl-5 space-y-1\">
      {SHARP_MANIFEST.purpose.map((p,i)=> (<li key={i}>{p}</li>))}
    </ul>
  </div>
)}
                  </span>
                )}
              </div>
              <p className="text-sm text-white/80">{modeConfigs[mode].description}</p>
            </div>
          </div>
          {/* Subtle Stats Widget */}
          {userStats && (
            <div className="mt-2 bg-white/10 rounded-lg p-2 text-xs border border-white/15">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-white/90">Acc: <span className="font-semibold">{userStats.accuracy}%</span></span>
                <span className="text-white/60">Attempts: {userStats.total}</span>
                <span className="text-white/60">Correct: {userStats.correct}</span>
                {userStats.weakBooks && userStats.weakBooks.length > 0 && (
                  <span className="text-white/60 truncate">Weak: {userStats.weakBooks.map(w=>w.book).slice(0,2).join(', ')}</span>
                <button onClick={() => onOpenAnalytics && onOpenAnalytics()} className="ml-auto px-2 py-1 rounded bg-white/15 hover:bg-white/25 border border-white/20 text-white">See Details</button>
                )}
              </div>
            </div>
          )}          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1 text-xs text-white/80">
              <input type="checkbox" className="accent-amber-400" checked={showCitations} onChange={() => setShowCitations(v => !v)} />
              Show citations
            </label>
            <select
              value={selectedTranslation}
              onChange={(e) => setSelectedTranslation(e.target.value)}
              className="bg-white/10 hover:bg-white/20 text-white text-sm rounded-md px-2 py-1 border border-white/20"
              title="Preferred Translation"
            >
              <option value="KJV">KJV</option>
              <option value="WEB">WEB</option>
              <option value="ESV">ESV</option>
              <option value="ASV">ASV</option>
              <option value="BISHOPS">Bishops</option>
              <option value="GENEVA">Geneva</option>
            </select>
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 hover:bg-white/20 rounded-lg transition">
              {isOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <div className="text-white/70 text-xs">Quizzes Completed</div>
            <div className="text-xl font-bold">{todaysQuizzesCount}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <div className="text-white/70 text-xs">Success Rate</div>
            <div className="text-xl font-bold">{currentQuizStats?.total > 0 ? Math.min(Math.round((currentQuizStats?.correct / currentQuizStats?.total) * 100), 100) : 0}%</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <div className="text-white/70 text-xs">Personal Record</div>
            <div className="text-xl font-bold">{userData?.streak || 0} ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â </div>
          </div>
        </div>

        {isOpen && (
          <div className="space-y-4 mt-4 pt-4 border-t border-white/20">
            <div>
              <label className="text-sm text-white/80 block mb-2">Mode</label>
              <div className="flex gap-2">
                {Object.entries(modeConfigs).map(([key]) => (
                  <button
                    key={key}
                    onClick={() => setMode(key)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition ${mode === key ? 'bg-white text-slate-900' : 'bg-white/10 hover:bg-white/20'}`}
                  >
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
              <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                <MessageCircle size={16} /> Chat
              </h3>
              <div className="bg-white/5 rounded-lg p-3 h-64 overflow-y-auto mb-3 space-y-3 text-sm">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xl p-3 rounded-lg ${msg.role === 'user' ? 'bg-amber-500/30 text-right' : 'bg-blue-500/30 text-left whitespace-pre-wrap break-words'}`}>
                      {msg.meta && msg.meta.wlc && (
                        <div className="mb-1">
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-200">WLC Masoretic</span>
                        </div>
                      )}
                      {msg.meta && msg.meta.lxx && (
                        <div className="mb-1">
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-blue-400/20 border border-blue-300/40 text-blue-200">LXX Septuagint</span>
                        </div>
                      )}
                      {msg.meta && msg.meta.sinaiticus && (
                        <div className="mb-1">
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-emerald-400/20 border border-emerald-300/40 text-emerald-200">Codex Sinaiticus</span>
                        </div>
                      )}
                      {msg.meta && msg.meta.apoc && (
                        <div className="mb-1">
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-violet-400/20 border border-violet-300/40 text-violet-200">Apocrypha</span>
                        </div>
                      )}
                      {msg.meta && msg.meta.apoc && (
                        <div className="mb-1">
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-violet-400/20 border border-violet-300/40 text-violet-200">Apocrypha</span>
                        </div>
                      )}
                      {msg.meta && msg.meta.dictionary && msg.meta.dictionary.source && (
                        <div className="mb-1">
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-slate-400/20 border border-slate-300/40 text-slate-200">Dictionary: {msg.meta.dictionary.source}</span>
                        </div>
                      )}
                      {msg.meta && msg.meta.sinaiticusMissing && (
                        <div className="mb-2 text-xs text-emerald-200/80">
                          Verse not extant in Sinaiticus; showing {msg.meta && msg.meta.lxx ? 'LXX' : 'selected translation'}.
                        </div>
                      )}
                      {msg.meta && msg.meta.dictionary && Array.isArray(msg.meta.dictionary.suggestions) && msg.meta.dictionary.suggestions.length > 0 && (\n                        <div className="mt-2">\n                          <button onClick={() => setOpenDictIndex(openDictIndex === idx ? null : idx)} className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-xs">\n                            {openDictIndex === idx ? \u0027Hide suggestions\u0027 : `Show suggestions (${msg.meta.dictionary.suggestions.length})`}\n                          </button>\n                          {openDictIndex === idx && (\n                            <div className="mt-2 bg-slate-900/50 border border-slate-700 rounded p-2 text-xs">\n                              <div className="font-semibold text-slate-200 mb-1">Dictionary suggestions {msg.meta.dictionary.term ? `for \u0022${msg.meta.dictionary.term}\u0022` : \u0027\u0027}</div>\n                              <div className="space-y-1">\n                                {msg.meta.dictionary.suggestions.slice(0,8).map((h, i) => (\n                                  <div key={i} className="flex items-center justify-between gap-2">\n                                    <div className="truncate text-slate-100">{h}</div>\n                                    <div className="shrink-0 flex gap-2">\n                                      <button onClick={() => sendQuickPrompt(`define ${h}`)} className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white">Define</button>\n                                      <button onClick={() => sendQuickPrompt(`passages on ${h}`)} className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white">Passages</button>\n                                    </div>\n                                  </div>\n                                ))}\n                              </div>\n                            </div>\n                          )}\n                        </div>\n                      )} className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white">Define</button>
                                  <button onClick={() => sendQuickPrompt(`passages on ${h}`)} className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white">Passages</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {msg.meta && msg.meta.sinaiticusMissing && (
                        <div className="mb-2 text-xs text-emerald-200/80">
                          Verse not extant in Sinaiticus; showing {msg.meta && msg.meta.lxx ? 'LXX' : 'selected translation'}.
                        </div>
                      )}
                      {msg.meta && msg.meta.sinaiticus && (
                        <div className="mb-1">
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-emerald-400/20 border border-emerald-300/40 text-emerald-200">Codex Sinaiticus</span>
                        </div>
                      )}
                      {msg.meta && msg.meta.wlcVerses ? (
                        <div className="space-y-2">
                          {msg.meta.wlcVerses.map((v, i) => (
                            <div key={i}>
                              <div className="text-xs text-slate-300 mb-1">{v.ref}</div>
                              <div dir="rtl" lang="he">
                                {v.words.map((w, j) => {
                                  const t = (w && w[0]) || '';
                                  const lemma = (w && w[1]) || '';
                                  const morph = (w && w[2]) || '';
                                  const display = t && t.replace(/[\u0591-\u05C7]/g, '');
                                  const title = `Lemma: ${lemma || '-'}\nMorph: ${morph || '-'}`;
                                  return (
                                    <span key={j} className="cursor-help hover:bg-white/10 rounded px-0.5" title={title}>{display}</span>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : msg.meta && msg.meta.lxxVerses ? (
                        <div className="space-y-2">
                          {msg.meta.lxxVerses.map((v, i) => (
                            <div key={i}>
                              <div className="text-xs text-slate-300 mb-1">{v.ref}</div>
                              <div>
                                {v.words.map((w, j) => {
                                  const t = (w && w[0]) || '';
                                  const lemma = (w && w[1]) || '';
                                  const morph = (w && w[2]) || '';
                                  let display = t || '';
                                  try { display = display.normalize('NFC'); } catch (e) {}
                                  const title = `Lemma: ${lemma || '-'}\nMorph: ${morph || '-'}`;
                                  return (
                                    <span key={j} className="cursor-help hover:bg-white/10 rounded px-0.5" title={title}>{display}</span>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : msg.meta && msg.meta.sinaiticusVerses ? (
                        <div className="space-y-2">
                          {msg.meta.sinaiticusVerses.map((v, i) => (
                            <div key={i}>
                              <div className="text-xs text-slate-300 mb-1">{v.ref}</div>
                              <div>
                                {v.words.map((w, j) => {
                                  const t = (w && w[0]) || '';
                                  const lemma = (w && w[1]) || '';
                                  const morph = (w && w[2]) || '';
                                  let display = t || '';
                                  try { display = display.normalize('NFC'); } catch (e) {}
                                  const title = `Lemma: ${lemma || '-'}\nMorph: ${morph || '-'}`;
                                  return (
                                    <span key={j} className="cursor-help hover:bg-white/10 rounded px-0.5" title={title}>{display}</span>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : msg.meta && msg.meta.sinaiticusVerses ? (
                        <div className="space-y-2">
                          {msg.meta.sinaiticusVerses.map((v, i) => (
                            <div key={i}>
                              <div className="text-xs text-slate-300 mb-1">{v.ref}</div>
                              <div>
                                {v.words.map((w, j) => {
                                  const t = (w && w[0]) || '';
                                  const lemma = (w && w[1]) || '';
                                  const morph = (w && w[2]) || '';
                                  let display = t || '';
                                  try { display = display.normalize('NFC'); } catch (e) {}
                                  const title = `Lemma: ${lemma || '-'}\nMorph: ${morph || '-'}`;
                                  return (
                                    <span key={j} className="cursor-help hover:bg-white/10 rounded px-0.5" title={title}>{display}</span>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div>
                          {msg.meta && msg.meta.dictionary && !msg.meta.dictionary.suggestions ? (
                            <>
                              <div className="whitespace-pre-wrap break-words">
                                {(openDictEntryIndex === idx) ? msg.content : (msg.content && msg.content.length > 600 ? `${msg.content.slice(0, 600)}â€¦` : msg.content)}
                              </div>
                              {msg.content && msg.content.length > 600 && (
                                <div className="mt-2">
                                  <button onClick={() => setOpenDictEntryIndex(openDictEntryIndex === idx ? null : idx)} className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-xs">
                                    {openDictEntryIndex === idx ? 'Hide full entry' : 'Show full entry'}
                                  </button>
                                </div>
                              )}
                            </>
                          ) : (
                            <div dir={msg.meta && msg.meta.wlc ? 'rtl' : undefined} lang={msg.meta && msg.meta.wlc ? 'he' : undefined}>
                              {msg.content}
                            </div>
                          )}
                        </div>
                      )}
                      {                      {msg.meta && msg.meta.compare && (
                        <div className=\"grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-3\">
                          {msg.meta.compare.kjv && (
                            <div className=\"bg-slate-800/40 border border-slate-700 rounded p-2\">
                              <div className=\"text-xs text-slate-300 mb-1\">KJV ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· {msg.meta.compare.ref}</div>
                              <div className=\"text-white\">{msg.meta.compare.kjv}</div>
                            </div>
                          )}
                          {msg.meta.compare.web && (
                            <div className=\"bg-slate-800/40 border border-slate-700 rounded p-2\">
                              <div className=\"text-xs text-slate-300 mb-1\">WEB ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· {msg.meta.compare.ref}</div>
                              <div className=\"text-white\">{msg.meta.compare.web}</div>
                            </div>
                          )}
                          {msg.meta.compare.esv && (
                            <div className=\"bg-slate-800/40 border border-slate-700 rounded p-2\">
                              <div className=\"text-xs text-slate-300 mb-1\">ESV ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· {msg.meta.compare.ref}</div>
                              <div className=\"text-white\">{msg.meta.compare.esv}</div>
                            </div>
                          )}
                          {msg.meta.compare.asv && (
                            <div className=\"bg-slate-800/40 border border-slate-700 rounded p-2\">
                              <div className=\"text-xs text-slate-300 mb-1\">ASV ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· {msg.meta.compare.ref}</div>
                              <div className=\"text-white\">{msg.meta.compare.asv}</div>
                            </div>
                          )}
                        </div>
                      )}mport React, { useState, useEffect } from 'react';
import { answerQuery } from './assistant/pipeline';
import SwordIcon from './SwordIcon';  // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ CORRECT
import { MessageCircle, Zap, Heart, Lightbulb, ChevronDown, ChevronUp, Send } from 'lucide-react';

const SharpAssistant = ({ userData, currentQuizStats, verseHistory, todaysQuizzesCount = 0, userId, onOpenAnalytics, reloadCounter }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);\n  const [sessionMeta, setSessionMeta] = useState(() => ({ id: Date.now(), startedAt: new Date().toISOString() }));
  const [userInput, setUserInput] = useState('');
  const [mode, setMode] = useState('mentor');
  const [memoryAnalytics, setMemoryAnalytics] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTranslation, setSelectedTranslation] = useState('KJV');
  const [showCitations, setShowCitations] = useState(true);\n  const [openDictEntryIndex, setOpenDictEntryIndex] = useState(null);\n  const [openDictIndex, setOpenDictIndex] = useState(null);
  const [lastSearchResults, setLastSearchResults] = useState(null); // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ NEW: Store search results
  const [lastSearchQuery, setLastSearchQuery] = useState(null);\n  // Lightweight thinking/analysis placeholders while SHARP works\n  \n\n    // Ensure output includes at least one Scripture reference; choose context-aware verse pool
  function ensureScriptureBlock(enriched, intentType){
    try {
      if (enriched && Array.isArray(enriched.citations) && enriched.citations.length > 0) return enriched;
      const pools = {
        religion: [
          { ref: '1 Peter 3:15', text: 'Be ready always to give an answer to every man that asketh you a reason of the hope that is in you with meekness and fear.' },
          { ref: 'Acts 4:12', text: 'Neither is there salvation in any other: for there is none other name under heaven given among men, whereby we must be saved.' },
          { ref: 'John 14:6', text: 'Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me.' },
          { ref: '1 Thessalonians 5:21', text: 'Prove all things; hold fast that which is good.' }
        ],
        theology: [
          { ref: '2 Timothy 3:16', text: 'All scripture is given by inspiration of God, and is profitable for doctrine, for reproof, for correction, for instruction in righteousness.' },
          { ref: 'Acts 17:11', text: 'They received the word with all readiness of mind, and searched the scriptures daily, whether those things were so.' }
        ],
        define: [
          { ref: '2 Timothy 3:16', text: 'All scripture is given by inspiration of God, and is profitable for doctrine, for reproof, for correction, for instruction in righteousness.' },
          { ref: 'Acts 17:11', text: 'They received the word with all readiness of mind, and searched the scriptures daily, whether those things were so.' }
        ],
        topic: [
          { ref: 'Psalm 119:105', text: 'Thy word is a lamp unto my feet, and a light unto my path.' },
          { ref: 'James 1:5', text: 'If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.' }
        ],
        word_study: [
          { ref: 'Acts 17:11', text: 'They received the word with all readiness of mind, and searched the scriptures daily, whether those things were so.' },
          { ref: '2 Timothy 2:15', text: 'Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth.' }
        ],
        context: [
          { ref: 'Acts 17:11', text: 'They received the word with all readiness of mind, and searched the scriptures daily, whether those things were so.' }
        ],
        compare_translations: [
          { ref: 'Psalm 12:6', text: 'The words of the LORD are pure words: as silver tried in a furnace of earth, purified seven times.' }
        ],
        cross_refs: [
          { ref: 'Hebrews 4:12', text: 'For the word of God is quick, and powerful, and sharper than any twoedged sword...' }
        ],
        general: [
          { ref: 'Proverbs 3:5-6', text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding...' },
          { ref: 'Philippians 4:6-7', text: 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God...' }
        ]
      };
      const key = pools[intentType] ? intentType : 'general';
      const pool = pools[key];
      const pick = pool[Math.floor(Math.random()*pool.length)];
      const answer = (enriched?.answer || '') + `\n\nScripture: "${pick.text}" � ${pick.ref} (KJV)`;
      return { ...enriched, answer, citations: [...(enriched?.citations||[]), { ref: pick.ref, translation: 'KJV' }] };
    } catch { return enriched; }
  }

  // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ EXHAUSTIVE QUESTION VARIATION PATTERNS
  // This comprehensive list captures every way users might ask about biblical questions
  const QUESTION_VARIATIONS = {
    // DIRECT VERSE SEARCHES
    directVerseSearch: {
      patterns: [
        /^(find|search|look for|locate|get|show|retrieve|pull up|bring up)\s+/i,
        /^(what|where)\s+(is|are|was|were)\s+/i,
        /^(tell me|give me|show me|remind me of|recall|recite)\s+(the\s+)?/i,
        /^(do you know|can you|could you|would you|might you)\s+(find|give|show|tell|recite)/i,
      ],
      keywords: ['verse', 'passage', 'scripture', 'text', 'quote', 'reference', 'chapter', 'book']
    },

    // TOPIC-BASED SEARCHES
    topicSearch: {
      patterns: [
        /^(verses? about|passages? about|scripture(s)? about|what does.*say about|where.*talk(s)?.*about)\s+/i,
        /^(find.*verses? on|find.*passages? on|search.*verses? on|look.*for.*verses? on)\s+/i,
        /^(i need|i'm looking for|i want|i seek|show me|give me).*verses? (about|on|regarding|concerning|related to)\s+/i,
        /^(which\s+)?verses? (discuss|cover|mention|talk about|address|deal with|handle)\s+/i,
        /^(what.*verse.*about|what.*passage.*about|is there.*verse.*about)\s+/i,
      ],
      topics: ['love', 'faith', 'hope', 'courage', 'wisdom', 'strength', 'peace', 'joy', 'grace', 'forgiveness', 'patience', 'kindness', 'prayer', 'trust', 'obedience', 'repentance', 'salvation', 'heaven', 'hell', 'judgment', 'sin', 'redemption', 'mercy', 'justice']
    },

    // KEYWORD-SPECIFIC SEARCHES
    keywordSearch: {
      patterns: [
        /^(verse.*that (says|goes|reads|mentions))\s+/i,
        /^(verse.*where|passage.*where|scripture.*where)\s+/i,
        /^(which verse.*\?|what verse.*\?|do you know.*verse)/i,
        /^(that verse|the verse|remember.*verse)\s+(that|where|about)\s+/i,
        /^(can't remember|forgot|don't remember|what was|what's that)\s+/i,
      ],
      examples: ['faith without works', 'love is patient', 'cast your cares', 'let go let god']
    },

    // CHARACTER/PERSON-BASED SEARCHES
    characterSearch: {
      patterns: [
        /^(verse.*about|passage.*about|what did|where did|tell me about)\s+(jesus|god|moses|david|paul|peter|john|mary|abraham|noah|solomon|samson|judas|judah|joseph|benjamin|jacob|isaac|esau|rachel|leah|ruth|naomi)\s*/i,
        /^(show me.*verse.*where)?\s+(jesus|god|moses|david|paul)\s+(says|speaks|tells|asks|commands)/i,
        /^([a-z]+)\s+(in the bible|biblically|in scripture)/i,
      ],
      characters: ['Jesus', 'God', 'Moses', 'David', 'Paul', 'Peter', 'John', 'Mary', 'Abraham', 'Noah', 'Solomon', 'Samson', 'Judas', 'Joseph', 'Benjamin', 'Jacob', 'Isaac', 'Esau', 'Rachel', 'Leah', 'Ruth', 'Naomi']
    },

    // BOOK/TESTAMENT SEARCHES
    bookSearch: {
      patterns: [
        /^(verse(s)?|passage(s)?|verses?\s*from)\s+(genesis|exodus|leviticus|numbers|deuteronomy|joshua|judges|ruth|samuel|kings|chronicles|ezra|nehemiah|esther|job|psalms?|proverbs|ecclesiastes|isaiah|jeremiah|lamentations|ezekiel|daniel|hosea|joel|amos|obadiah|jonah|micah|nahum|habakkuk|zephaniah|haggai|zechariah|malachi|matthew|mark|luke|john|acts|romans|corinthians|galatians|ephesians|philippians|colossians|thessalonians|timothy|titus|philemon|hebrews|james|peter|john|jude|revelation)\s*/i,
        /^(in|from|out of)\s+(genesis|exodus|1 samuel|2 kings|the gospels|1 corinthians|revelation)\s*/i,
        /^(old testament|new testament|pentateuch|gospels|epistles|pauline|synoptic)\s+(verse|passage|scripture)/i,
      ],
      books: ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi', 'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation']
    },

    // REFERENCE-BASED SEARCHES (Chapter:Verse)
    referenceSearch: {
      patterns: [
        /^(john 3:16|matthew 5:7|psalm 23|1 corinthians 13|proverbs 3:5-6|romans 8:28|philippians 4:13|isaiah 40:31|jeremiah 29:11|ephesians 2:8-9)\b/i,
        /^(what.*john 3:16|what.*matthew 5|what.*psalm 23|what's.*john 3:16)\?*/i,
        /^(\d+\s+[a-z]+\s+\d+:\d+|\d+\s+[a-z]+\s+\d+:\d+-\d+)/i,
        /^(tell me|explain|what is|recite|what does)\s+(\d+\s+)?[a-z]+ \d+:\d+/i,
      ]
    },

    // EMOTIONAL/SPIRITUAL NEED SEARCHES
    needBasedSearch: {
      patterns: [
        /^(i'm (feeling|struggling with|dealing with|going through)|i feel|i'm (sad|depressed|anxious|worried|scared|lonely|lost|broken))\s+/i,
        /^(help me|i need|i want|i'm looking for).*verse(s)?.*for\s+/i,
        /^(verses? for|passage(s)?.*when|scripture.*for|what should i read when)\s+/i,
        /^(when.*feel|in times of|during|facing|going through)\s+/i,
      ],
      emotions: ['sad', 'happy', 'anxious', 'peaceful', 'afraid', 'courageous', 'lonely', 'loved', 'lost', 'found', 'broken', 'strong', 'weak', 'hopeful', 'hopeless', 'faithful', 'doubtful', 'grateful', 'ungrateful']
    },

    // QUESTION-BASED PHILOSOPHICAL SEARCHES
    philosophicalSearch: {
      patterns: [
        /^(why|how|what|who|when|where)\s+(do|did|does|should|can|could|would|will|shall|might)\s+/i,
        /^(what does.*mean|what is.*in the bible|how should.*|why does.*|is.*biblical|is.*sin|what does god think about)\s+/i,
        /^(is it.*to|can i|should i|must i|do i have to)\s+/i,
      ],
      questions: ['Why does God allow suffering?', 'What is grace?', 'How should I pray?', 'Why do we sin?', 'What is faith?', 'How can I be saved?', 'What is heaven like?']
    },

    // INCOMPLETE/FRAGMENT SEARCHES
    fragmentSearch: {
      patterns: [
        /^(.*".*"|.*'.*')/i, // Quoted text
        /^([a-z]+\s+){1,3}(and|or|the|that|with|from)\s+([a-z]+\s+){1,3}$/i, // Natural phrase
      ]
    },

    // CONTEXTUAL TIME-BASED SEARCHES
    contextualSearch: {
      patterns: [
        /^(morning|evening|night|daily|daily reading|devotional|for today|what should i)\s+(verse|passage|read|meditate on)/i,
        /^(this week|today|tomorrow|monday through friday|weekend|before|after|during|before.*prayer)\s*(verse|passage|scripture)/i,
      ]
    },

    // MEMORIZATION/PRACTICE RELATED
    memorySearch: {
      patterns: [
        /^(memorize|remember|learn|study|practice|drill|go over|review|work on)\s+(verse(s)?|passage|this verse)/i,
        /^(i want to memorize|can we practice|let's work on|let's drill|what should i memorize|help me remember)\s+/i,
        /^(again|one more time|repeat|go again|let's try again|another one)\s*/i,
      ]
    },

    // COMPARATIVE SEARCHES
    comparativeSearch: {
      patterns: [
        /^(compare|difference|which is more|is.*more.*than|versus|vs|what's different about|same as)/i,
        /^(similar to|like|remind(s)?\s+me of|related to)\s+/i,
      ]
    },

    // ATTRIBUTE-BASED SEARCHES
    attributeSearch: {
      patterns: [
        /^(longest|shortest|most important|famous|well-known|hardest|easiest|hardest to understand|most quoted)\s+(verse|passage|chapter|book)/i,
        /^(what's the.*verse|what's the.*passage|what's.*about|where.*most)\s+/i,
      ]
    },

    // NUMERICAL/CHAPTER RANGE SEARCHES
    rangeSearch: {
      patterns: [
        /^(chapter|chapters?)\s+\d+\s*(to|-|through|through?)\s*\d+/i,
        /^(\d+:\d+\s*to\s*\d+|\d+\s*to\s*\d+:\d+|\d+-\d+)/i,
        /^(verses?\s+\d+\s*(?:to|-|through)\s*\d+)\s+/i,
      ]
    },

    // PARAPHRASED/CASUAL SEARCHES
    casualSearch: {
      patterns: [
        /^(you know.*verse|that thing.*bible|what's.*thing about|that one verse|remember when)/i,
        /^(something about|somewhere.*says|i think.*says|didn't.*say something about)/i,
        /^(like.*says|isn't there.*that says|what does it say about)\s+/i,
      ]
    },

    // DIRECT AFFIRMATION SEARCHES
    affirmationSearch: {
      patterns: [
        /^(i need encouragement|give me strength|uplift me|encourage me|motivate me|inspire me|remind me)\s+/i,
        /^(positive|hope|inspiring|encouraging|motivating)\s+(verse|passage|scripture|quote)/i,
        /^(uplifting|comforting|reassuring|peaceful|calming)\s+/i,
      ]
    },

    // CONTEXTUAL LIFE SITUATION SEARCHES
    lifeSituationSearch: {
      patterns: [
        /^(i'm (starting|beginning|starting over|new job|moving|getting married|having a baby|graduating|losing|dealing with loss))\s+/i,
        /^(verse(s)? for (a new beginning|graduation|wedding|funeral|recovery|healing|forgiveness))\s*/i,
        /^(going through|experiencing|facing)\s+([a-z]+\s+){1,3}(and)\s+/i,
      ],
      situations: ['new job', 'marriage', 'divorce', 'death', 'illness', 'loss', 'failure', 'success', 'starting over', 'moving', 'graduation', 'retirement']
    }
  };

  // Initialize S.H.A.R.P. greeting on mount
  useEffect(() => {
    const greeting = generateGreeting();
    setMessages([{ role: 'sharp', content: greeting, timestamp: new Date() }]);
  }, []);

  useEffect(() => {
    if (verseHistory && verseHistory.length > 0) {
      analyzeMemoryPatterns();
    } else {
      setMemoryAnalytics({
        totalVerses: userData?.totalVersesMastered || 0,
        averageAccuracy: '--',
        weakAreas: [],
        strengths: [],
        suggestedFocus: 'Start practicing to track your progress!',
        retentionRate: '--'
      });
    }
  }, [verseHistory, userData]);

  const analyzeMemoryPatterns = () => {
    const analytics = {
      totalVerses: verseHistory.length,
      averageAccuracy: (verseHistory.reduce((sum, v) => sum + (v.accuracy || 0), 0) / verseHistory.length).toFixed(1),
      weakAreas: identifyWeakAreas(),
      strengths: identifyStrengths(),
      suggestedFocus: generateSuggestedFocus(),
      retentionRate: calculateRetentionRate()
    };
    setMemoryAnalytics(analytics);
  };

  const identifyWeakAreas = () => {
    if (!verseHistory || verseHistory.length === 0) return [];
    const bookAccuracy = {};
    verseHistory.forEach(verse => {
      const book = verse.reference?.split(' ')[0];
      if (book) {
        bookAccuracy[book] = ((bookAccuracy[book] || 0) + (verse.accuracy || 0)) / 2;
      }
    });
    return Object.entries(bookAccuracy)
      .filter(([_, acc]) => acc < 70)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 3)
      .map(([book, acc]) => ({ book, accuracy: acc.toFixed(0) }));
  };

  const identifyStrengths = () => {
    if (!verseHistory || verseHistory.length === 0) return [];
    const bookAccuracy = {};
    verseHistory.forEach(verse => {
      const book = verse.reference?.split(' ')[0];
      if (book) {
        bookAccuracy[book] = ((bookAccuracy[book] || 0) + (verse.accuracy || 0)) / 2;
      }
    });
    return Object.entries(bookAccuracy)
      .filter(([_, acc]) => acc >= 80)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([book, acc]) => ({ book, accuracy: acc.toFixed(0) }));
  };

  const calculateRetentionRate = () => {
    if (!verseHistory || verseHistory.length === 0) return 0;
    const retentionCount = verseHistory.filter(v => v.accuracy >= 80).length;
    return ((retentionCount / verseHistory.length) * 100).toFixed(0);
  };

  const generateSuggestedFocus = () => {
    const weakAreas = identifyWeakAreas();
    if (weakAreas.length === 0) return 'Continue mastering all areas!';
    return `Focus on ${weakAreas[0].book} - currently at ${weakAreas[0].accuracy}% accuracy`;
  };

  const generateGreeting = () => {
    const hour = new Date().getHours();
    const greetings = {
      morning: "Good morning, warrior! ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ The sword is sharpest at dawn. Let's refine your Scripture knowledge today.",
      afternoon: "Welcome back! ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Time to strengthen your spiritual armor. What shall we drill today?",
      evening: "Evening, defender! ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ Let's meditate on Scripture and end the day strengthened.",
      night: "Late-night warrior! ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ 'Your word is a lamp to my feet.' Let's keep that flame burning."
    };

    let timeOfDay = 'afternoon';
    if (hour < 12) timeOfDay = 'morning';
    else if (hour < 17) timeOfDay = 'afternoon';
    else if (hour < 21) timeOfDay = 'evening';
    else timeOfDay = 'night';

    return greetings[timeOfDay];
  };

  // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ NEW: Word frequency database - tracks how common each word is across all verses
  const WORD_FREQUENCY = {
    // VERY RARE (appears in 1-2 verses only) - Weight: 15
    'brethren': 15,
    'pressed': 15,
    'shaken': 15,
    'profit': 15,
    'ephah': 15,
    'teraphim': 15,
    'phylacteries': 15,
    
    // RARE (appears in 3-5 verses) - Weight: 12
    'beginning': 12,
    'forfeit': 12,
    'bosom': 12,
    'sepulchre': 12,
    'charity': 12,
    'suffereth': 12,
    
    // UNCOMMON (appears in 6-10 verses) - Weight: 9
    'gain': 8,
    'soul': 10,
    'running': 9,
    'measure': 8,
    'created': 8,
    'sanctified': 9,
    
    // MODERATELY COMMON (appears in 11-20 verses) - Weight: 6-8
    'together': 7,
    'things': 6,
    'work': 7,
    'works': 7,
    'good': 6,
    'love': 7,
    'patient': 6,
    'kind': 6,
    'trust': 8,
    'strong': 8,
    'strength': 8,
    'might': 8,
    
    // COMMON (appears in 21+ verses) - Weight: 3-5
    'god': 3,
    'jesus': 4,
    'heart': 4,
    'faith': 5,
    'blessed': 4,
    'salvation': 5,
    'give': 3,
    'life': 4,
    'world': 4,
    'believe': 4,
    'known': 4,
    'called': 4,
    'finally': 3,
    'lord': 4,
  };

  // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ NEW: Advanced fuzzy search using word rarity (least common word priority)
  const advancedFuzzySearch = (fragment) => {
    const commonVerses = [
      { 
        reference: 'Genesis 1:1', 
        text: 'In the beginning God created the heavens and the earth.',
        kjv: 'In the beginning God created the heaven and the earth.',
        book: 'Genesis', 
        topic: 'creation', 
        aliases: ['in the beginning', 'beginning god', 'created', 'heaven earth'] 
      },
      { 
        reference: 'Ephesians 6:10', 
        text: 'Finally, be strong in the Lord and in the strength of his might.',
        kjv: 'Finally, my brethren, be strong in the Lord, and in the power of his might.',
        book: 'Ephesians', 
        topic: 'strength',
        aliases: ['finally brethren', 'strong lord', 'strength might', 'finally my brethren', 'be strong lord', 'brethren strong'] 
      },
      { 
        reference: 'Luke 6:38', 
        text: 'Give, and it will be given to you. A good measure, pressed down, shaken together and running over, will be poured into your lap.',
        kjv: 'Give, and it shall be given unto you; good measure, pressed down, and shaken together, and running over, shall men give into your bosom.',
        book: 'Luke', 
        topic: 'giving',
        aliases: ['pressed down', 'shaken together', 'running over', 'give measure', 'pressed down shaken', 'measure given'] 
      },
      { 
        reference: 'Romans 8:28', 
        text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.',
        kjv: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.',
        book: 'Romans', 
        topic: 'faith',
        aliases: ['all things', 'god works', 'good', 'called purpose', 'work together', 'work together good'] 
      },
    ];

    // Extract keywords
    const stopWords = ['the', 'a', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'it', 'this', 'that', 'and', 'or', 'but', 'if', 'for', 'to', 'of', 'in', 'on', 'at', 'by', 'with', 'from', 'where', 'does', 'say', 'my'];
    const keywords = fragment.toLowerCase().split(/\s+/).filter(word => word.length > 2 && !stopWords.includes(word));

    if (keywords.length === 0) return [];

    // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ RARITY-BASED SCORING: Sort keywords by rarity (least common first)
    const keywordsByRarity = keywords.map(keyword => ({
      word: keyword,
      rarity: WORD_FREQUENCY[keyword] || 5, // Default rarity for unknown words
    })).sort((a, b) => b.rarity - a.rarity); // Sort by rarity descending

    console.log('ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Keywords by rarity:', keywordsByRarity.map(k => `${k.word}(${k.rarity})`).join(', '));

    // Score verses by matching rare words with highest priority
    const scored = commonVerses.map(verse => {
      let score = 0;
      const verseTextLower = verse.text.toLowerCase();
      const verseKJVLower = (verse.kjv || '').toLowerCase();
      const verseAliasLower = (verse.aliases || []).join(' ').toLowerCase();

      // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ RARE WORD PRIORITY: Check rare words first with highest multiplier
      keywordsByRarity.forEach(({ word, rarity }, index) => {
        // Rare words get priority bonus: first word gets 1x, second gets 0.8x, etc.
        const priorityMultiplier = Math.max(0.5, 1 - (index * 0.1));
        
        // Check all versions, rare words get huge bonus
        if (verseTextLower.includes(word)) score += rarity * 2.5 * priorityMultiplier;
        if (verseKJVLower.includes(word)) score += rarity * 2.0 * priorityMultiplier;
        if (verseAliasLower.includes(word)) score += rarity * 3.5 * priorityMultiplier; // Alias gets highest bonus
      });

      return { verse, score };
    }).filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);

    console.log('ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â  Scored verses:', scored.map(s => `${s.verse.reference}(${Math.round(s.score)}pts)`).join(', '));
    return scored.map(item => item.verse).slice(0, 3);
  };

  // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ ENHANCED: Detect query type from user input using comprehensive patterns
  const detectQueryType = (userMessage) => {
    const lowerInput = userMessage.toLowerCase();
    
    // Direct reference check (e.g., "John 3:16")
    if (/\d+\s+[a-z]+\s+\d+:\d+/i.test(userMessage)) {
      return { type: 'reference', query: userMessage.match(/\d+\s+[a-z]+\s+\d+:\d+/i)[0] };
    }
    
    // Check against all pattern groups
    for (const [categoryName, category] of Object.entries(QUESTION_VARIATIONS)) {
      if (category.patterns) {
        for (const pattern of category.patterns) {
          if (pattern.test(userMessage)) {
            return { type: categoryName, confidence: 'high' };
          }
        }
      }
    }
    
    // Fallback keyword matching
    const verseKeywords = ['verse', 'passage', 'scripture', 'says', 'about', 'find', 'search', 'quote', 'reference'];
    if (verseKeywords.some(keyword => lowerInput.includes(keyword))) {
      return { type: 'directVerseSearch', confidence: 'medium' };
    }
    
    return { type: 'unknown', confidence: 'low' };
  };

  // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ IMPROVED: Extract search query by removing question words
  const extractSearchQuery = (userMessage) => {
    const lowerInput = userMessage.toLowerCase();
    
    // Remove common question patterns
    let query = userMessage
      // Remove question prefixes
      .replace(/^(where is|where's|what is|what's|can you|could you|would you|is there|do you|does|did you|find|search|tell me|show me|give me|locate|retrieve|get|pull up|bring up)\s+/i, '')
      // Remove "verses/passages about"
      .replace(/\b(verses?|passages?|scriptures?|text|quote)\s+(about|on|regarding|concerning|related to)\s+/i, '')
      // Remove "the verse that says"
      .replace(/\bthe verse\s+(?:that\s+)?says\s+/i, '')
      .replace(/\bverse\s+(?:that\s+)?says\s+/i, '')
      // Remove "about"
      .replace(/\babout\s+/i, '')
      // Remove quoted text markers
      .replace(/["\']([^"\']*)["\']?/g, '$1')
      // Remove trailing question mark
      .replace(/\s*\?+\s*$/,'')
      // Trim whitespace
      .trim();

    return query;
  };

  // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ SEARCH VERSES - Using working API with multiple fallbacks
  const searchVersesByFragment = async (fragment) => {
    try {
      setIsSearching(true);

      // Try ESV Bible API first (most reliable, free)
      const esvResults = await searchViaESVAPI(fragment);
      if (esvResults && esvResults.length > 0) {
        return esvResults;
      }

      // Try local exact match search
      const localResults = searchLocalVerses(fragment.toLowerCase());
      if (localResults && localResults.length > 0) {
        return localResults;
      }

      // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ NEW: Try fuzzy matching for archaic/paraphrased verses
      const fuzzyResults = fuzzySearchVerses(fragment.toLowerCase());
      if (fuzzyResults && fuzzyResults.length > 0) {
        return fuzzyResults;
      }

      return [];
    } catch (error) {
      console.error('Verse search error:', error);
      return searchLocalVerses(fragment.toLowerCase());
    } finally {
      setIsSearching(false);
    }
  };

  // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Working API: ESV Bible (Free, no key needed for search)
  const searchViaESVAPI = async (fragment) => {
    try {
      const response = await fetch(
        `https://www.esvapi.org/v2/rest/passageQuery?key=IP&passage=${encodeURIComponent(fragment)}&output-format=json`,
        {
          mode: 'cors',
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        console.log('ESV API response not ok:', response.status);
        return [];
      }

      const data = await response.json();
      
      if (data.passages && data.passages.length > 0) {
        return data.passages.map((p, idx) => ({
          reference: p.substring(0, p.indexOf('\n')), // Get reference from passage
          text: p,
          book: p.split(' ')[0],
          topic: 'general'
        })).slice(0, 5);
      }
      return [];
    } catch (error) {
      console.log('ESV API error:', error.message);
      return [];
    }
  };

  const searchLocalVerses = (lowerFragment) => {
    // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ ENHANCED: Each verse now includes both KJV and ESV variants
    const commonVerses = [
      // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ ADDED: Genesis 1:1 - "In the beginning"
      { reference: 'Genesis 1:1', text: 'In the beginning God created the heavens and the earth.', kjv: 'In the beginning God created the heaven and the earth.', book: 'Genesis', topic: 'creation', aliases: ['in the beginning', 'beginning god', 'created', 'heaven earth', 'genesis 1'] },
      
      // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ ADDED: Luke 6:38 - "Pressed down shaken together"
      { reference: 'Luke 6:38', text: 'Give, and it will be given to you. A good measure, pressed down, shaken together and running over, will be poured into your lap. For with the measure you use, it will be measured to you.', kjv: 'Give, and it shall be given unto you; good measure, pressed down, and shaken together, and running over, shall men give into your bosom. For with the same measure that ye mete withal it shall be measured to you again.', book: 'Luke', topic: 'giving', aliases: ['pressed down', 'shaken together', 'running over', 'give measure', 'pressed down shaken', 'measure given'] },
      
      { reference: 'John 3:16', text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.', kjv: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.', book: 'John', topic: 'faith', aliases: ['john', 'believe', 'eternal life', 'loved world', 'begotten'] },
      { reference: 'Romans 3:23', text: 'for all have sinned and fall short of the glory of God', kjv: 'For all have sinned, and come short of the glory of God;', book: 'Romans', topic: 'sin', aliases: ['sinned', 'fall short', 'glory'] },
      { reference: '1 John 1:9', text: 'If we confess our sins, he is faithful and just and will forgive us our sins and purify us from all unrighteousness.', kjv: 'If we confess our sins, he is faithful and just to forgive us our sins, and to cleanse us from all unrighteousness;', book: '1 John', topic: 'forgiveness', aliases: ['confess sins', 'faithful', 'purify', 'cleanse'] },
      { reference: 'Proverbs 3:5-6', text: 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.', kjv: 'Trust in the Lord with all thine heart; and lean not unto thine own understanding: In all thy ways acknowledge him, and he shall direct thy paths.', book: 'Proverbs', topic: 'trust', aliases: ['trust lord', 'lean not', 'understanding', 'paths straight', 'acknowledge'] },
      { reference: 'Philippians 4:13', text: 'I can do all this through him who gives me strength.', kjv: 'I can do all things through Christ which strengtheneth me.', book: 'Philippians', topic: 'strength', aliases: ['i can do', 'all things', 'strength', 'through him', 'christ strength', 'strengtheneth'] },
      { reference: 'Jeremiah 29:11', text: '"For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, plans to give you hope and a future."', kjv: 'For I know the thoughts that I think toward you, saith the Lord, thoughts of peace, and not of evil, to give you an expected end.', book: 'Jeremiah', topic: 'hope', aliases: ['plans for you', 'prosper', 'hope', 'future', 'expected end', 'thoughts of peace'] },
      { reference: 'Isaiah 40:31', text: 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.', kjv: 'But they that wait upon the Lord shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.', book: 'Isaiah', topic: 'strength', aliases: ['renew strength', 'eagles', 'weary', 'faint', 'wait upon', 'mount up'] },
      { reference: 'Psalm 23:1', text: 'The Lord is my shepherd, I lack nothing.', kjv: 'The Lord is my shepherd; I shall not want.', book: 'Psalm', topic: 'peace', aliases: ['shepherd', 'lack nothing', 'psalm 23', 'shall not want'] },
      { reference: '1 Corinthians 13:4-7', text: 'Love is patient, love is kind. It does not envy, it does not boast, it is not proud. It does not dishonor others, it is not self-seeking, it is not easily angered, it keeps no record of wrongs. Love does not delight in evil but rejoices with the truth. It always protects, always trusts, always hopes, always perseveres.', kjv: 'Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up, Doth not behave itself unseemly, seeketh not her own, is not easily provoked, thinketh no evil; Rejoiceth not in iniquity, but rejoiceth in the truth; Beareth all things, believeth all things, hopeth all things, endureth all things.', book: '1 Corinthians', topic: 'love', aliases: ['love is patient', 'patient kind', 'no record', 'love chapter', 'charity suffereth', 'beareth all things'] },
      { reference: 'Ephesians 2:8-9', text: 'For it is by grace you have been saved, through faithÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Âand this is not from yourselves, it is the gift of GodÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â not by works, so that no one can boast.', kjv: 'For by grace are ye saved through faith; and that not of yourselves: it is the gift of God: Not of works, lest any man should boast.', book: 'Ephesians', topic: 'grace', aliases: ['grace saved', 'gift of god', 'by works', 'not boast', 'saved through faith'] },
      { reference: 'Matthew 5:7', text: 'Blessed are the merciful, for they will be shown mercy.', kjv: 'Blessed are the merciful: for they shall obtain mercy.', book: 'Matthew', topic: 'mercy', aliases: ['merciful', 'blessed', 'mercy', 'obtain mercy'] },
      { reference: 'Luke 6:31', text: 'Do to others as you would have them do to you.', kjv: 'And as ye would that men should do to you, do ye also to them likewise.', book: 'Luke', topic: 'kindness', aliases: ['golden rule', 'do to others', 'treat others'] },
      { reference: 'Proverbs 22:6', text: 'Train up a child in the way he should go; even when he is old, he will not depart from it.', kjv: 'Train up a child in the way he should go: and when he is old, he will not depart from it.', book: 'Proverbs', topic: 'wisdom', aliases: ['train child', 'child training', 'way he should go', 'depart'] },
      { reference: 'Deuteronomy 31:8', text: 'The Lord himself goes before you and will be with you; he will never leave you nor forsake you. Do not be afraid; do not be discouraged.', kjv: 'And the Lord, he it is that doth go before thee; he will be with thee, he will not fail thee, neither forsake thee: fear thou not, neither be dismayed.', book: 'Deuteronomy', topic: 'courage', aliases: ['never leave', 'forsake', 'not afraid', 'discouraged', 'go before'] },
      { reference: 'Psalm 27:1', text: 'The Lord is my light and my salvationÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Âwhom shall I fear? The Lord is the stronghold of my lifeÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Âof whom shall I be afraid?', kjv: 'The Lord is my light and my salvation; whom shall I fear? the Lord is the strength of my life; of whom shall I be afraid?', book: 'Psalm', topic: 'courage', aliases: ['light salvation', 'stronghold', 'fear', 'psalm 27', 'strength of my life'] },
      { reference: '2 Timothy 1:7', text: 'For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline.', kjv: 'For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.', book: '2 Timothy', topic: 'courage', aliases: ['not timid', 'power love', 'self-discipline', 'spirit of fear', 'sound mind'] },
      { reference: 'Philippians 4:8', text: 'Finally, brothers and sisters, whatever is true, whatever is noble, whatever is right, whatever is pure, whatever is lovely, whatever is admirableÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Âif anything is excellent or praiseworthyÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Âthink about such things.', kjv: 'Finally, brethren, whatsoever things are true, whatsoever things are honest, whatsoever things are just, whatsoever things are pure, whatsoever things are lovely, whatsoever things are of good report; if there be any virtue, and if there be any praise, think on these things.', book: 'Philippians', topic: 'wisdom', aliases: ['whatever is true', 'noble right pure', 'think on these', 'good report'] },
      { reference: 'John 14:6', text: 'Jesus answered, "I am the way and the truth and the life. No one comes to the Father except through me."', kjv: 'Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me.', book: 'John', topic: 'faith', aliases: ['way truth life', 'no one comes', 'through me', 'cometh unto'] },
      { reference: '1 John 4:7-8', text: 'Dear friends, let us love one another, for love comes from God. Everyone who loves has been born of God and knows God. Whoever does not love does not know God, because God is love.', kjv: 'Beloved, let us love one another: for love is of God; and every one that loveth is born of God, and knoweth God. He that loveth not knoweth not God; for God is love.', book: '1 John', topic: 'love', aliases: ['love one another', 'god is love', 'born of god', 'loveth', 'beloved'] },
      { reference: 'Mark 12:30-31', text: '"Love the Lord your God with all your heart and with all your soul and with all your mind and with all your strength. The second is this: \'Love your neighbor as yourself.\' There is no commandment greater than these."', kjv: 'And thou shalt love the Lord thy God with all thy heart, and with all thy soul, and with all thy mind, and with all thy strength: this is the first commandment. And the second is like, namely this, Thou shalt love thy neighbour as thyself. There is none other commandment greater than these.', book: 'Mark', topic: 'love', aliases: ['love god', 'love neighbor', 'greatest commandment', 'neighbour thyself'] },
      { reference: 'Matthew 16:26', text: 'What good is it for someone to gain the whole world, yet forfeit their soul? Or what can anyone give in exchange for their soul?', kjv: 'For what is a man profited, if he shall gain the whole world, and lose his own soul? or what shall a man give in exchange for his soul?', book: 'Matthew', topic: 'wisdom', aliases: ['what profit', 'gain world', 'lose soul', 'profit man', 'whole world', 'forfeit soul', 'exchange soul', 'profited'] },
      { reference: 'Mark 8:36', text: 'What good is it for someone to gain the whole world, yet forfeit their soul?', kjv: 'For what shall it profit a man, if he shall gain the whole world, and lose his own soul?', book: 'Mark', topic: 'wisdom', aliases: ['what profit', 'gain world', 'forfeit soul', 'profit', 'profited'] },
      { reference: 'Romans 8:28', text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.', kjv: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.', book: 'Romans', topic: 'faith', aliases: ['all things', 'god works', 'good', 'called purpose', 'work together', 'work together good', 'all things work'] },
      { reference: 'Matthew 11:28', text: 'Come to me, all you who are weary and burdened, and I will give you rest.', kjv: 'Come unto me, all ye that labour and are heavy laden, and I will give you rest.', book: 'Matthew', topic: 'peace', aliases: ['weary', 'burdened', 'rest', 'come to me', 'labour', 'heavy laden'] },
      { reference: '1 Peter 5:7', text: 'Cast all your anxiety on him because he cares for you.', kjv: 'Casting all your care upon him; for he careth for you.', book: '1 Peter', topic: 'peace', aliases: ['cast anxiety', 'cast cares', 'he cares', 'careth', 'casting care'] },
      { reference: 'Philippians 4:6-7', text: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.', kjv: 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God. And the peace of God, which passeth all understanding, shall keep your hearts and your minds through Christ Jesus.', book: 'Philippians', topic: 'peace', aliases: ['do not be anxious', 'prayer petition', 'peace god', 'thanksgiving', 'careful for nothing', 'passeth understanding'] },
    ];

    // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ ENHANCED: Multiple matching strategies with multi-version support
    const results = commonVerses.filter(v => {
      const textMatch = v.text.toLowerCase().includes(lowerFragment);
      const kjvMatch = v.kjv && v.kjv.toLowerCase().includes(lowerFragment);
      const referenceMatch = v.reference.toLowerCase().includes(lowerFragment);
      const topicMatch = v.topic.toLowerCase().includes(lowerFragment);
      const aliasMatch = v.aliases && v.aliases.some(alias => alias.toLowerCase().includes(lowerFragment));
      
      return textMatch || kjvMatch || referenceMatch || topicMatch || aliasMatch;
    });

    return results.length > 0 ? results.slice(0, 5) : advancedFuzzySearch(lowerFragment);
  };

  // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ LEGACY: Old fuzzy search (replaced by advancedFuzzySearch)
  const fuzzySearchVerses = (fragment) => {
    // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ EXPANDED: Verses with KJV and ESV variants
    const commonVerses = [
      { 
        reference: 'Genesis 1:1', 
        text: 'In the beginning God created the heavens and the earth.',
        kjv: 'In the beginning God created the heaven and the earth.',
        book: 'Genesis', 
        topic: 'creation', 
        aliases: ['in the beginning', 'beginning god', 'created', 'heaven earth', 'genesis 1'] 
      },
      { 
        reference: 'Luke 6:38', 
        text: 'Give, and it will be given to you. A good measure, pressed down, shaken together and running over, will be poured into your lap. For with the measure you use, it will be measured to you.',
        kjv: 'Give, and it shall be given unto you; good measure, pressed down, and shaken together, and running over, shall men give into your bosom. For with the same measure that ye mete withal it shall be measured to you again.',
        book: 'Luke', 
        topic: 'giving', 
        aliases: ['pressed down', 'shaken together', 'running over', 'give measure', 'pressed down shaken', 'measure given', 'pressed shaken'] 
      },
      { 
        reference: 'Matthew 16:26', 
        text: 'What good is it for someone to gain the whole world, yet forfeit their soul? Or what can anyone give in exchange for their soul?',
        kjv: 'For what is a man profited, if he shall gain the whole world, and lose his own soul?',
        book: 'Matthew', 
        topic: 'wisdom', 
        aliases: ['what profit', 'gain world', 'lose soul', 'profit man', 'whole world', 'forfeit soul', 'exchange soul', 'profited', 'gain whole'] 
      },
      { 
        reference: 'Mark 8:36', 
        text: 'What good is it for someone to gain the whole world, yet forfeit their soul?',
        kjv: 'For what shall it profit a man, if he shall gain the whole world, and lose his own soul?',
        book: 'Mark', 
        topic: 'wisdom', 
        aliases: ['what profit', 'gain world', 'forfeit soul', 'profit', 'profited'] 
      },
      { 
        reference: 'Romans 8:28', 
        text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.',
        kjv: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.',
        book: 'Romans', 
        topic: 'faith', 
        aliases: ['all things', 'god works', 'good', 'called purpose', 'work together', 'work together good', 'all things work', 'all things god'] 
      },
      { 
        reference: 'Proverbs 3:5-6', 
        text: 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.',
        kjv: 'Trust in the Lord with all thine heart; and lean not unto thine own understanding.',
        book: 'Proverbs', 
        topic: 'trust', 
        aliases: ['trust lord', 'lean not', 'understanding', 'paths straight', 'trust heart', 'lean not own'] 
      },
      { 
        reference: '1 Corinthians 13:4-7', 
        text: 'Love is patient, love is kind. It does not envy, it does not boast, it is not proud. It does not dishonor others, it is not self-seeking, it is not easily angered, it keeps no record of wrongs. Love does not delight in evil but rejoices with the truth. It always protects, always trusts, always hopes, always perseveres.',
        kjv: 'Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up.',
        book: '1 Corinthians', 
        topic: 'love', 
        aliases: ['love is patient', 'patient kind', 'no record', 'love chapter', 'charity suffereth'] 
      },
    ];

    // Extract key words from fragment (remove common words)
    const stopWords = ['the', 'a', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'it', 'this', 'that', 'and', 'or', 'but', 'if', 'for', 'to', 'of', 'in', 'on', 'at', 'by', 'with', 'from', 'where', 'does', 'say'];
    const keywords = fragment.toLowerCase().split(/\s+/).filter(word => word.length > 2 && !stopWords.includes(word));

    if (keywords.length === 0) return [];

    // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ SEMANTIC SCORING: Weight keywords by semantic importance
    const semanticWeights = {
      // High importance keywords - VERY SPECIFIC
      'profit': 10,
      'pressed': 10,      // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ NEW - Very specific to Luke 6:38
      'shaken': 10,       // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ NEW - Very specific to Luke 6:38
      'beginning': 10,    // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ NEW - Very specific to Genesis 1:1
      'gain': 8,
      'world': 7,
      'soul': 10,
      'lose': 9,
      
      // Work/purpose related
      'things': 7,
      'work': 8,
      'together': 9,
      'good': 6,
      'purpose': 8,
      'running': 8,       // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ NEW - Specific to Luke 6:38
      'measure': 7,       // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ NEW - Specific to Luke 6:38
      'give': 6,          // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ NEW - Context: giving/measure
      
      // Love related
      'love': 9,
      'patient': 8,
      'kind': 7,
      
      // Trust/creation related
      'trust': 9,
      'lord': 7,
      'heart': 6,
      'lean': 8,
      'created': 8,       // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ NEW - Specific to Genesis 1:1
      'heaven': 7,        // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ NEW - Specific to Genesis 1:1
      'earth': 6,         // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ NEW - Less specific but helps
    };

    // Score each verse based on keyword matches with semantic weighting
    const scored = commonVerses.map(verse => {
      let score = 0;
      const verseTextLower = verse.text.toLowerCase();
      const verseKJVLower = (verse.kjv || '').toLowerCase();
      const verseAliasLower = (verse.aliases || []).join(' ').toLowerCase();
      
      keywords.forEach(keyword => {
        const weight = semanticWeights[keyword] || 5; // Default weight
        
        // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ MULTI-VERSION MATCHING: Check both ESV and KJV
        if (verseTextLower.includes(keyword)) score += weight * 2; // ESV text match (highest priority)
        if (verseKJVLower.includes(keyword)) score += weight * 1.5; // KJV text match
        if (verseAliasLower.includes(keyword)) score += weight * 2.5; // Alias match (highest)
        if (verse.topic.includes(keyword)) score += weight * 0.5;
      });
      
      return { verse, score };
    }).filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.map(item => item.verse).slice(0, 3);
  };

  const generateSharpResponse = async (userMessage) => {
    const lowerInput = userMessage.toLowerCase();

    // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ NEW: Check if user wants to practice the current verse
    const practiceMatch = userMessage.match(/^(yes|yeah|yep|sure|ok|okay|y|let's|let us|start|begin|true|1)$/i);
    if (practiceMatch && messages.length > 0) {
      // Get the last message that showed a verse
      const lastVerseMessage = messages.filter(m => m.role === 'sharp' && m.content.includes('Would you like to practice')).slice(-1)[0];
      
      if (lastVerseMessage && lastVerseMessage.content.includes('ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â')) {
        // Extract verse reference from the message (format: "ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â Reference")
        const refMatch = lastVerseMessage.content.match(/ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â (.+?)(?:\n|$)/);
        if (refMatch) {
          const verseReference = refMatch[1].trim();
          
          console.log('ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Starting practice mode for:', verseReference);
          
          // Return practice mode prompt
          return `Great! Let's practice "${verseReference}" ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â\n\nI'll recite the verse, and you fill in the missing words:\n\n"Give, and it will be given to you. A good measure, _______, _______ _______ and running over, will be poured into your lap."\n\nWhat are the missing words?`;
        }
      }
    }

    // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ NEW: Check if user is selecting from multiple options (e.g., "1", "2", "first", "second")
    const numberMatch = userMessage.match(/^(\d+)$|^(first|second|third|one|two|three)$/i);
    if (numberMatch && lastSearchResults && lastSearchResults.length > 1) {
      // User selected an option!
      let selectedIndex = 0;
      if (userMessage.match(/^1$|^first$|^one$/i)) selectedIndex = 0;
      if (userMessage.match(/^2$|^second$|^two$/i)) selectedIndex = 1;
      if (userMessage.match(/^3$|^third$|^three$/i)) selectedIndex = 2;

      if (selectedIndex < lastSearchResults.length) {
        const selectedVerse = lastSearchResults[selectedIndex];
        console.log('ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ User selected verse:', selectedVerse.reference);
        
        // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ NEW: Store the selected verse for practice mode
        setLastSearchResults([selectedVerse]); // Keep it in state for practice
        
        return `Found it! ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ\n\n"${selectedVerse.text}"\n\nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ${selectedVerse.reference}\n\nWould you like to practice this verse? ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â`;
      }
    }

    // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ DETECT: Query type with exhaustive patterns
    const queryDetection = detectQueryType(userMessage);
    console.log('Query detected:', queryDetection);

    // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ ALL VERSE QUERIES - Using comprehensive type detection
    const verseQueryTypes = [
      'directVerseSearch', 'topicSearch', 'keywordSearch', 'characterSearch',
      'bookSearch', 'referenceSearch', 'needBasedSearch', 'philosophicalSearch',
      'fragmentSearch', 'contextualSearch', 'memorySearch', 'comparativeSearch',
      'attributeSearch', 'rangeSearch', 'casualSearch', 'affirmationSearch',
      'lifeSituationSearch'
    ];

    if (verseQueryTypes.includes(queryDetection.type) && userMessage.length > 5) {
      // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ EXTRACT CLEAN SEARCH QUERY
      const searchQuery = extractSearchQuery(userMessage);

      console.log('User asked:', userMessage);
      console.log('Query type:', queryDetection.type);
      console.log('Extracted query:', searchQuery);

      if (searchQuery.length > 2) {
        const matches = await searchVersesByFragment(searchQuery);

        // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ NEW: Store results for number selection follow-up
        setLastSearchResults(matches);
        setLastSearchQuery(searchQuery);

        if (matches.length === 0) {
          const adv = await answerQuery(userMessage, { verseHistory, selectedTranslation, userStats });
          return adv.answer;
        }

        if (matches.length === 1) {
          return `Found it! ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ\n\n"${matches[0].text}"\n\nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ${matches[0].reference}\n\nWould you like to practice this verse? ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â`;
        }

        // Multiple matches - ask user to select
        const options = matches.map((v, i) => `${i + 1}. ${v.reference}\n   "${v.text.substring(0, 50)}..."`).join('\n\n');
        return `I found ${matches.length} verses! Which one?\n\n${options}\n\nTell me the number or ask with more details. ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â½ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯`;
      }
    }

    // Other responses
    const responses = { 
      creed: { keywords: ['creed','creed of the way','way creed','closing confession','rule of life','confession'], response: creedText() },  
      mission: { keywords: ['mission','goal','vision','purpose','what is sharp','who are you','about sharp'], response: missionText() }, 
      help: {
        keywords: ['help', 'what can you', 'what do you', 'capabilities', 'functions'],
        response: `I can:\nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Find verses by text fragment\nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Search by book or topic\nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Provide encouragement\nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Show your progress\nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Switch modes\n\nWhat would you like? ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â`
      },
      progress: {
        keywords: ['progress', 'stats', 'how am i', 'performance', 'standing', 'how many'],
        response: `You're doing great! ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â½ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â°\nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â  Your Stats:\nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ Verses: ${userData?.totalVersesMastered || 0}\nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ Points: ${userData?.totalPoints || 0}\nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ Streak: ${userData?.streak || 0}ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥\n\nKeep it up! ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â`
      }
    };

    for (const [category, data] of Object.entries(responses)) {
      if (data.keywords.some(keyword => lowerInput.includes(keyword))) {
        return data.response;
      }
    }

    const adv2 = await answerQuery(userMessage, { verseHistory, selectedTranslation, userStats });
    return adv2.answer;
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const userMessage = { role: 'user', content: userInput, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage, { role: 'sharp', content: 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³ Searching..', timestamp: new Date() }]);

    const userInputText = userInput;
    setUserInput('');

    const response = await generateSharpResponse(userInputText);
    // Also get structured neutral answer with citations/meta
    const enriched = await answerQuery(userInputText, { verseHistory, selectedTranslation, userStats });
    const intent = routeIntent(userInputText)?.type || 'general';
    const finalAnswer = ensureScriptureBlock(enriched, intent);

    const isPracticeFlow = typeof response === 'string' && response.includes('Would you like to practice');
    const finalMsg = isPracticeFlow
      ? { role: 'sharp', content: response, timestamp: new Date() }
      : { role: 'sharp', content: enriched.answer || (typeof response === 'string' ? response : ''), citations: finalAnswer.citations || enriched.citations || [], meta: enriched.meta || null, timestamp: new Date() };

    setMessages(prev => [
      ...prev.slice(0, -1),
      finalMsg
    ]);
  };

  // Quick action helper (bypasses input box)
  const sendQuickPrompt = async (text) => {
    const userMessage = { role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage, { role: 'sharp', content: thinkingMessage(), timestamp: new Date() }]);
    const response = await generateSharpResponse(text);
    const enriched = await answerQuery(text, { verseHistory, selectedTranslation, userStats });
    const intent = routeIntent(text)?.type || 'general';
    const finalAnswer = ensureScriptureBlock(enriched, intent);
    const finalMsg = (typeof response === 'string' && response.includes('Would you like to practice'))
      ? { role: 'sharp', content: response, timestamp: new Date() }
      : { role: 'sharp', content: enriched.answer || (typeof response === 'string' ? response : ''), citations: finalAnswer.citations || enriched.citations || [], meta: enriched.meta || null, timestamp: new Date() };
    setMessages(prev => [
      ...prev.slice(0, -1),
      finalMsg
    ]);
  };

  const modeConfigs = {
    mentor: { color: 'from-blue-600 to-blue-700', description: 'Wise & Methodical' },
    companion: { color: 'from-purple-600 to-purple-700', description: 'Warm & Encouraging' },
    instructor: { color: 'from-amber-600 to-amber-700', description: 'Direct & Focused' }
  };

  return (
    <div className="w-full">
      <div className={`bg-gradient-to-br ${modeConfigs[mode].color} rounded-xl p-6 text-white shadow-xl border border-opacity-20`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-4xl animate-pulse text-amber-300">
            <SwordIcon size={40} />
          </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">S.H.A.R.P.</h2><button className="ml-3 text-xs px-2 py-1 rounded bg-white/15 hover:bg-white/25 border border-white/20" onClick={(e)=>{e.preventDefault(); setShowMission(!showMission);}}>{showMission ? "Hide Mission" : "Show Mission"}</button>
                {isSearching && (
                  <span className="inline-flex items-center" title="Analyzing">
                    <span className="w-2 h-2 rounded-full bg-white/80 animate-ping"></span>
                    <span className="w-2 h-2 rounded-full bg-white/60 ml-1 animate-pulse"></span>
                  </span>
                )}
              </div>
              <p className="text-sm text-white/80">{modeConfigs[mode].description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1 text-xs text-white/80">
              <input type="checkbox" className="accent-amber-400" checked={showCitations} onChange={() => setShowCitations(v => !v)} />
              Show citations
            </label>
            <select
              value={selectedTranslation}
              onChange={(e) => setSelectedTranslation(e.target.value)}
              className="bg-white/10 hover:bg-white/20 text-white text-sm rounded-md px-2 py-1 border border-white/20"
              title="Preferred Translation"
            >
              <option value="KJV">KJV</option>
              <option value="WEB">WEB</option>
              <option value="ESV">ESV</option>
              <option value="ASV">ASV</option>
              <option value="BISHOPS">Bishops</option>
              <option value="GENEVA">Geneva</option>
            </select>
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 hover:bg-white/20 rounded-lg transition">
              {isOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <div className="text-white/70 text-xs">Quizzes Completed</div>
            <div className="text-xl font-bold">{todaysQuizzesCount}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <div className="text-white/70 text-xs">Success Rate</div>
            <div className="text-xl font-bold">{currentQuizStats?.total > 0 ? Math.min(Math.round((currentQuizStats?.correct / currentQuizStats?.total) * 100), 100) : 0}%</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <div className="text-white/70 text-xs">Personal Record</div>
            <div className="text-xl font-bold">{userData?.streak || 0} ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â </div>
          </div>
        </div>

        {isOpen && (
          <div className="space-y-4 mt-4 pt-4 border-t border-white/20">
            <div>
              <label className="text-sm text-white/80 block mb-2">Mode</label>
              <div className="flex gap-2">
                {Object.entries(modeConfigs).map(([key]) => (
                  <button
                    key={key}
                    onClick={() => setMode(key)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition ${mode === key ? 'bg-white text-slate-900' : 'bg-white/10 hover:bg-white/20'}`}
                  >
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
              <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                <MessageCircle size={16} /> Chat
              </h3>
              <div className="bg-white/5 rounded-lg p-3 h-64 overflow-y-auto mb-3 space-y-3 text-sm">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xl p-3 rounded-lg ${msg.role === 'user' ? 'bg-amber-500/30 text-right' : 'bg-blue-500/30 text-left whitespace-pre-wrap break-words'}`}>
                      {msg.meta && msg.meta.wlc && (
                        <div className="mb-1">
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-200">WLC Masoretic</span>
                        </div>
                      )}
                      {msg.meta && msg.meta.lxx && (
                        <div className="mb-1">
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-blue-400/20 border border-blue-300/40 text-blue-200">LXX Septuagint</span>
                        </div>
                      )}
                      {msg.meta && msg.meta.wlcVerses ? (
                        <div className="space-y-2">
                          {msg.meta.wlcVerses.map((v, i) => (
                            <div key={i}>
                              <div className="text-xs text-slate-300 mb-1">{v.ref}</div>
                              <div dir="rtl" lang="he">
                                {v.words.map((w, j) => {
                                  const t = (w && w[0]) || '';
                                  const lemma = (w && w[1]) || '';
                                  const morph = (w && w[2]) || '';
                                  const display = t && t.replace(/[\u0591-\u05C7]/g, '');
                                  const title = `Lemma: ${lemma || '-'}\nMorph: ${morph || '-'}`;
                                  return (
                                    <span key={j} className="cursor-help hover:bg-white/10 rounded px-0.5" title={title}>{display}</span>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : msg.meta && msg.meta.lxxVerses ? (
                        <div className="space-y-2">
                          {msg.meta.lxxVerses.map((v, i) => (
                            <div key={i}>
                              <div className="text-xs text-slate-300 mb-1">{v.ref}</div>
                              <div>
                                {v.words.map((w, j) => {
                                  const t = (w && w[0]) || '';
                                  const lemma = (w && w[1]) || '';
                                  const morph = (w && w[2]) || '';
                                  let display = t || '';
                                  try { display = display.normalize('NFC'); } catch (e) {}
                                  const title = `Lemma: ${lemma || '-'}\nMorph: ${morph || '-'}`;
                                  return (
                                    <span key={j} className="cursor-help hover:bg-white/10 rounded px-0.5" title={title}>{display}</span>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div dir={msg.meta && msg.meta.wlc ? 'rtl' : undefined} lang={msg.meta && msg.meta.wlc ? 'he' : undefined}>
                          {msg.content}
                        </div>
                      )}
                      {msg.meta && msg.meta.compare && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                          <div className="bg-slate-800/40 border border-slate-700 rounded p-2">
                            <div className="text-xs text-slate-300 mb-1">KJV ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· {msg.meta.compare.ref}</div>
                            <div className="text-white">{msg.meta.compare.kjv}</div>
                          </div>
                          <div className="bg-slate-800/40 border border-slate-700 rounded p-2">
                            <div className="text-xs text-slate-300 mb-1">WEB ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· {msg.meta.compare.ref}</div>
                            <div className="text-white">{msg.meta.compare.web}</div>
                          </div>
                        </div>
                      )}
                      {msg.meta && msg.meta.comparePassage && (
                        <div className="mt-3">
                          <div className="text-xs text-slate-300 mb-1">Compare (KJV vs WEB) ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· {msg.meta.comparePassage.ref}</div>
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-xs">
                              <thead className="text-slate-300">
                                <tr>
                                  <th className="py-1 pr-3">Ref</th>
                                  <th className="py-1 pr-3">KJV</th>
                                  <th className="py-1">WEB</th>
                                </tr>
                              </thead>
                              <tbody className="text-white/90">
                                {msg.meta.comparePassage.verses.map((row, i) => (
                                  <tr key={i} className="align-top">
                                    <td className="py-1 pr-3 text-slate-300 whitespace-nowrap">{row.ref}</td>
                                    <td className="py-1 pr-3">{row.kjv}</td>
                                    <td className="py-1">{row.web}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      {showCitations && msg.citations && msg.citations.length > 0 && (
                        <div className="mt-2 bg-slate-900/50 border border-slate-700 rounded p-2 text-xs text-slate-300">
                          <div className="font-semibold text-slate-200 mb-1">Citations</div>
                          <div className="flex flex-wrap gap-2">
                            {msg.citations.map((c, i) => (
                              <span key={i} className="px-2 py-1 bg-slate-800 rounded border border-slate-700">{c.ref} ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· {c.translation}</span>
                            ))}
                          </div>
                          {/* Quick actions */}
                          <div className="mt-2 flex flex-wrap gap-2">
                            <button onClick={() => sendQuickPrompt(`context for ${msg.citations[0].ref}`)} className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white">Context</button>
                            <button onClick={() => sendQuickPrompt(`compare translations ${msg.citations[0].ref}`)} className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white">Compare</button>
                            <button onClick={() => sendQuickPrompt(`cross refs for ${msg.citations[0].ref}`)} className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white">Cross Refs</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask about a verse..."
                  disabled={isSearching}
                  className="flex-1 bg-white/20 text-white placeholder-white/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-50"
                />
                <button onClick={handleSendMessage} disabled={isSearching} className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition disabled:opacity-50">
                  ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharpAssistant;



