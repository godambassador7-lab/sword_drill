# ⚔️ Sword Drill

**Gamified Bible Memorization App with Spaced Repetition**

Sword Drill is a modern web application designed to help users memorize Bible verses through interactive quizzes and intelligent spaced repetition.

## ✨ Features

- 📖 **Multiple Quiz Types**
  - Fill in the Blank
  - Multiple Choice
  - Reference Recall

- 🧠 **Spaced Repetition System**
  - Smart algorithm prevents verse repetition
  - Adaptive review scheduling (1 day → 3 days → 1 week → 2 weeks → 1 month → 3 months)
  - Mastery-based progression

- 🏆 **Achievement System**
  - 100+ achievements across 5 tiers (Apprentice → Squire → Knight → Champion → Scholar)
  - Track your progress through gamified milestones
  - Unlock rewards as you learn

- 📊 **Mastery List**
  - Visual progress tracking with color-coded cards
  - Real-time accuracy percentages
  - Per-verse statistics breakdown
  - Performance by quiz type

- 🔥 **Streak Tracking**
  - Daily streak counter
  - Motivational progress tracking
  - Consistency achievements

- 📚 **Multiple Bible Translations**
  - King James Version (KJV)
  - New King James Version (NKJV)
  - New International Version (NIV)
  - English Standard Version (ESV)
  - New American Standard Bible (NASB)
  - API-powered verse fetching from API.Bible

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- API.Bible API key (free at https://scripture.api.bible/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR-USERNAME/sword-drill.git
   cd sword-drill
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Bible API:
   - Get your free API key from https://scripture.api.bible/
   - Update `src/services/bibleApiService.js` with your API key

4. Start the development server:
   ```bash
   npm start
   ```

5. Open http://localhost:3000 in your browser

## 🛠️ Built With

- **React** - Frontend framework
- **Tailwind CSS** - Styling
- **Lucide React** - Beautiful icons
- **Firebase** (coming soon) - Authentication & Database
- **API.Bible** - Bible verse API

## 📱 Project Structure

```
sword-drill/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── logo192.png
├── src/
│   ├── App.js              # Main application component
│   ├── index.js            # Entry point
│   ├── index.css           # Global styles with Tailwind
│   └── services/
│       ├── authService.js      # Authentication service
│       ├── dbService.js        # Database service
│       └── bibleApiService.js  # Bible API integration
├── package.json
├── tailwind.config.js
└── README.md
```

## 🎮 How to Use

1. **Sign Up/Sign In** - Create an account to track your progress
2. **Choose a Quiz Type** - Select from Fill-in-Blank, Multiple Choice, or Reference Recall
3. **Complete Quizzes** - Answer questions about Bible verses
4. **Track Progress** - View your mastery list and achievements
5. **Build Streaks** - Come back daily to maintain your streak
6. **Master Verses** - Get 90%+ accuracy to master verses and space them out for long-term retention

## 🧠 Spaced Repetition Algorithm

The app uses an intelligent spaced repetition system:

- **First correct answer**: Review in 1 day
- **Second correct answer**: Review in 3 days
- **Third correct answer**: Review in 1 week
- **Fourth correct answer**: Review in 2 weeks
- **Fifth correct answer**: Review in 1 month
- **Sixth+ correct answer**: Review in 3 months

Incorrect answers reset the interval to ensure proper learning.

## 🎯 Mastery Levels

- **Mastered** (Green): 90%+ accuracy with 5+ correct answers
- **Proficient** (Amber): 70%+ accuracy with 3+ correct answers
- **Learning** (Gray): In progress
- **Struggling** (Red): Less than 50% accuracy with 3+ attempts

## 🏆 Achievement Tiers

1. **Apprentice Scroll** - Starting achievements
2. **Squire's Verse** - Intermediate achievements
3. **Knight's Canon** - Advanced achievements
4. **Champion's Chapter** - Expert achievements
5. **Scholar of the Sword** - Master achievements

## 🔧 Configuration

### Bible API Setup

1. Get a free API key from https://scripture.api.bible/
2. Open `src/services/bibleApiService.js`
3. Replace the API_KEY constant with your key:
   ```javascript
   const API_KEY = 'your-api-key-here';
   ```

### Firebase Setup (Optional - Coming Soon)

Instructions for connecting Firebase for authentication and data persistence will be added soon.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Bible verses provided by [API.Bible](https://scripture.api.bible/)
- Built with love for Bible memorization and Christian education
- Inspired by spaced repetition apps like Anki and Duolingo
- Special thanks to the open-source community

## 🐛 Known Issues

- Firebase integration pending
- Need to expand verse database beyond API calls
- PWA features to be added

## 📋 Roadmap

- [ ] Firebase authentication and data persistence
- [ ] Offline mode support
- [ ] Social features (share progress, compete with friends)
- [ ] Custom verse collections
- [ ] Audio verse playback
- [ ] Mobile app (React Native)
- [ ] Dark mode toggle
- [ ] Export progress data

## 📧 Contact

Project Link: [https://github.com/YOUR-USERNAME/sword-drill](https://github.com/YOUR-USERNAME/sword-drill)

---

**Made with ⚔️ and 🙏 for the glory of God**

*"Your word is a lamp to my feet and a light to my path." - Psalm 119:105*
