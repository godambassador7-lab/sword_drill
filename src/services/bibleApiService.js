// src/services/bibleApiService.js

const API_KEY = '5a6b9c48cd6f210359d07c90724ec1cf'; // Your API key from the screenshot
const API_BASE_URL = 'https://api.scripture.api.bible/v1';

// Bible IDs for different translations
const BIBLE_IDS = {
  'KJV': 'de4e12af7f28f599-02',      // King James Version
  'NKJV': '5001a2bc5220bb11-01',     // New King James Version  
  'NIV': '78a9f6124f344018-01',      // New International Version
  'ESV': 'f72b840c855f362c-04',      // English Standard Version
  'NASB': '65eec8e0b60e656b-01'      // New American Standard Bible
};

// List of popular Bible verses for random selection
const POPULAR_VERSES = [
  'JHN.3.16',    // John 3:16
  'PSA.23.1',    // Psalm 23:1
  'PHP.4.13',    // Philippians 4:13
  'ROM.8.28',    // Romans 8:28
  'PRO.3.5-6',   // Proverbs 3:5-6
  'JER.29.11',   // Jeremiah 29:11
  'MAT.6.33',    // Matthew 6:33
  '2TI.1.7',     // 2 Timothy 1:7
  'ISA.41.10',   // Isaiah 41:10
  'ROM.12.2',    // Romans 12:2
];

export const getRandomVerse = async (translation = 'NKJV', includeApocrypha = false) => {
  try {
    const bibleId = BIBLE_IDS[translation] || BIBLE_IDS['NKJV'];
    
    // Get a random verse from our list
    const randomVerseId = POPULAR_VERSES[Math.floor(Math.random() * POPULAR_VERSES.length)];
    
    const response = await fetch(
      `${API_BASE_URL}/bibles/${bibleId}/verses/${randomVerseId}?content-type=text&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=false&include-verse-spans=false`,
      {
        headers: {
          'api-key': API_KEY
        }
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Format the verse for our app
    return {
      id: data.data.id,
      reference: data.data.reference,
      text: data.data.content.trim(),
      translation: translation,
      category: 'canonical',
      topic: 'scripture'
    };
  } catch (error) {
    console.error('Error fetching verse from API:', error);
    return null; // Return null so the app can fall back to local database
  }
};

export const getVerseByReference = async (reference, translation = 'NKJV') => {
  try {
    const bibleId = BIBLE_IDS[translation] || BIBLE_IDS['NKJV'];
    
    const response = await fetch(
      `${API_BASE_URL}/bibles/${bibleId}/search?query=${encodeURIComponent(reference)}`,
      {
        headers: {
          'api-key': API_KEY
        }
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.data.verses && data.data.verses.length > 0) {
      const verse = data.data.verses[0];
      return {
        id: verse.id,
        reference: verse.reference,
        text: verse.text.trim(),
        translation: translation,
        category: 'canonical',
        topic: 'scripture'
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching verse by reference:', error);
    return null;
  }
};
