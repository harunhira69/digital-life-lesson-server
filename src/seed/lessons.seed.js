require("dotenv").config();
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
const DB_NAME = "digital_life_lesson";
const COLLECTION_NAME = "public_lesson";

if (!uri) {
  console.error("MONGODB_URI missing in .env");
  process.exit(1);
}

const authors = [
  {
    name: "Ken Adams",
    email: "ken.adams@example.com",
    photo: "https://randomuser.me/api/portraits/men/35.jpg",
  },
  {
    name: "Maria Rodriguez",
    email: "maria.rodriguez@example.com",
    photo: "https://randomuser.me/api/portraits/women/2.jpg",
  },
  {
    name: "Leo Perez",
    email: "leo.perez@example.com",
    photo: "https://randomuser.me/api/portraits/men/19.jpg",
  },
  {
    name: "Elena Rios",
    email: "elena.rios@example.com",
    photo: "https://randomuser.me/api/portraits/women/28.jpg",
  },
  {
    name: "Daniel Brooks",
    email: "daniel.brooks@example.com",
    photo: "https://randomuser.me/api/portraits/men/51.jpg",
  },
];

const lessonData = [
  {
    title: "Never attend a meeting without a clear ask",
    subtitle: "Meetings become useful when everyone knows what decision is needed.",
    category: "Career",
    emotionalTone: "Realization",
    accessLevel: "Free",
    imageUrl: "/lesson-images/meeting-clear-ask.jpg",
    description:
      "A professional lesson about entering meetings with purpose, clarity, and a specific decision in mind.",
    fullStory:
      "Early in my career, I thought attending a meeting meant being present, taking notes, and contributing whenever I had something useful to say. That changed after one painful meeting with senior leadership. I had prepared slides, but I had not prepared the actual ask. When someone asked, 'What do you need from us today?' I froze. I had information, but no decision request. The meeting ended with polite comments and no progress. That day taught me that a meeting without an ask is usually just a conversation with a calendar invite. Now before every meeting, I write one sentence: 'By the end of this meeting, I need a decision on...' That simple habit has made my meetings shorter, clearer, and far more productive.",
    context:
      "The situation happened during a planning meeting where several stakeholders were present, but no one had a clear decision path.",
    mistake:
      "I prepared information but failed to define the decision I needed from the room.",
    turningPoint:
      "The turning point came when a senior manager directly asked what outcome I expected, and I realized I had not decided that myself.",
    practicalAdvice:
      "Before every meeting, define your ask, prepare the supporting context, and end with ownership for the next step.",
    keyInsight:
      "A meeting becomes valuable when the purpose is connected to a decision.",
    quote: "Information fills time. A clear ask creates movement.",
    takeaways: [
      "Write the desired meeting outcome before joining.",
      "Ask for decisions clearly instead of hoping they happen.",
      "Send follow-up notes with owners and deadlines.",
    ],
    reflectionQuestions: [
      "What decision do I need before my next meeting ends?",
      "Am I sharing information or asking for action?",
    ],
    tags: ["career", "meetings", "leadership", "communication"],
    readingTime: 5,
    difficulty: "Beginner",
    imagePrompt:
      "Professional cinematic office meeting room, empty chairs around a polished table, warm sunlight through glass windows, notebook with blank page, premium corporate editorial style, no text, no logo, 16:9.",
  },
  {
    title: "Listening is not waiting for your turn to speak",
    subtitle: "Real listening begins when your reply stops being the priority.",
    category: "Relationships",
    emotionalTone: "Motivational",
    accessLevel: "Free",
    imageUrl: "/lesson-images/listening-skill.jpg",
    description:
      "A relationship lesson about learning to listen with attention instead of preparing a response.",
    fullStory:
      "For a long time, I thought I was a good listener because I stayed quiet while others spoke. Later, I realized I was not listening; I was preparing. I would listen just enough to build my reply, defend my view, or give advice. A close friend once told me, 'You answer quickly, but I do not always feel understood.' That sentence stayed with me. I started practicing a different kind of listening. I asked questions before responding. I repeated what I understood. I allowed silence instead of rushing to fill it. The quality of my relationships changed because people no longer felt processed; they felt heard. Listening became less about intelligence and more about humility.",
    context:
      "This lesson came from repeated conversations where people looked heard on the surface but emotionally unseen.",
    mistake:
      "I treated listening as a pause before my own opinion instead of a responsibility to understand.",
    turningPoint:
      "A friend honestly told me that my fast responses made them feel unheard.",
    practicalAdvice:
      "Pause before replying, ask one clarifying question, and reflect back what you heard before giving advice.",
    keyInsight:
      "People trust you more when they feel understood, not when you respond quickly.",
    quote: "A thoughtful pause can be more caring than a perfect answer.",
    takeaways: [
      "Do not interrupt emotional honesty with quick advice.",
      "Ask questions that help the other person feel understood.",
      "Listen for feelings, not only facts.",
    ],
    reflectionQuestions: [
      "Do I listen to understand or to respond?",
      "Who in my life needs more attention and less advice?",
    ],
    tags: ["relationships", "communication", "listening", "empathy"],
    readingTime: 4,
    difficulty: "Beginner",
    imagePrompt:
      "Warm cinematic scene of two people having a calm conversation in a cozy cafe, soft window light, emotional but professional mood, shallow depth of field, no text, no logo, 16:9.",
  },
  {
    title: "Mistakes are expensive tuition if you actually learn",
    subtitle: "Failure becomes valuable only when it changes your process.",
    category: "Mistakes Learned",
    emotionalTone: "Realization",
    accessLevel: "Premium",
    imageUrl: "/lesson-images/expensive-mistake.jpg",
    description:
      "A business lesson about losing an opportunity and turning the mistake into a better working system.",
    fullStory:
      "I once lost a major client because I rushed through the final review of a proposal. The idea was strong, the relationship was promising, and I believed the deal was almost certain. But I missed several important details: unclear delivery dates, vague responsibilities, and a pricing line that created confusion. The client did not reject me because the work was bad. They rejected me because the process made them doubt my reliability. That failure hurt because it was preventable. Afterward, I built a checklist for every important document I send. Scope, pricing, timeline, responsibilities, risks, and follow-up are reviewed every time. The mistake cost money, but the system it created has saved me far more since.",
    context:
      "The lesson came from a client proposal that failed not because of talent, but because of careless execution.",
    mistake:
      "I assumed a strong relationship would cover weak details.",
    turningPoint:
      "The client explained that the proposal created more uncertainty than confidence.",
    practicalAdvice:
      "Create repeatable review systems for important work instead of relying on memory or confidence.",
    keyInsight:
      "Professional trust is often won or lost in small details.",
    quote: "A mistake becomes tuition only when it changes how you work.",
    takeaways: [
      "Use checklists for high-stakes work.",
      "Do not rush documents that define expectations.",
      "Details communicate professionalism before results do.",
    ],
    reflectionQuestions: [
      "Where am I relying on memory instead of a system?",
      "What mistake should become a checklist?",
    ],
    tags: ["business", "mistakes", "client-work", "professionalism"],
    readingTime: 6,
    difficulty: "Intermediate",
    imagePrompt:
      "Premium cinematic desk with contract papers, pen, laptop, warm dramatic light, business mistake and reflection mood, professional editorial photography, no readable text, no logo, 16:9.",
  },
  {
    title: "Busy is not the same as useful",
    subtitle: "A packed day can still be an unfocused day.",
    category: "Productivity",
    emotionalTone: "Reflective",
    accessLevel: "Free",
    imageUrl: "/lesson-images/busy-vs-useful.jpg",
    description:
      "A productivity lesson about stopping the habit of measuring progress by how exhausted you feel.",
    fullStory:
      "There was a season when I ended every day tired but strangely unsatisfied. My calendar was full, my inbox was active, and I was constantly switching tasks. From the outside, I looked productive. But the important work was barely moving. I realized I had confused activity with contribution. Busy work gave me the comfort of motion without the responsibility of focus. I changed my routine by choosing three meaningful outcomes each morning. Not twenty tasks, not endless reactions, just three outcomes that would make the day valuable. That shift made my work calmer and more honest. I still had busy days, but I stopped allowing busyness to pretend it was progress.",
    context:
      "The lesson came from a work period filled with meetings, emails, and small tasks but very little meaningful progress.",
    mistake:
      "I measured productivity by effort and exhaustion instead of outcomes.",
    turningPoint:
      "I reviewed a full week and realized the most important project had barely moved.",
    practicalAdvice:
      "Start each day by defining outcomes, then protect time for the work that creates those outcomes.",
    keyInsight:
      "Productivity is measured by useful progress, not constant movement.",
    quote: "Motion feels productive until you ask what actually changed.",
    takeaways: [
      "Choose three meaningful outcomes each day.",
      "Separate urgent noise from important work.",
      "Protect deep work before checking distractions.",
    ],
    reflectionQuestions: [
      "What important work am I avoiding through busyness?",
      "What would make today genuinely useful?",
    ],
    tags: ["productivity", "focus", "time-management", "work"],
    readingTime: 5,
    difficulty: "Beginner",
    imagePrompt:
      "Modern workspace with calendar, laptop, notebook, soft dark background, focused productivity mood, warm amber desk light, premium realistic photography, no text, no logo, 16:9.",
  },
  {
    title: "The apology that repaired more than the argument",
    subtitle: "Being responsible mattered more than being right.",
    category: "Relationships",
    emotionalTone: "Gratitude",
    accessLevel: "Free",
    imageUrl: "/lesson-images/apology-repair.jpg",
    description:
      "A personal lesson about how accountability can repair trust after conflict.",
    fullStory:
      "I once entered an argument determined to prove my point. Technically, I had facts on my side, but emotionally I was careless. I interrupted, dismissed the other person's frustration, and treated the conversation like a debate. Later, when the room was quiet, I realized I had won the argument and damaged the relationship. The apology that followed was not easy because it required me to admit that being right did not excuse being harsh. I apologized for the way I made them feel, not just for the disagreement. That changed how I view conflict. The goal is not to defeat someone you care about. The goal is to protect honesty without destroying safety.",
    context:
      "The lesson came from a personal conflict where logic became more important than emotional responsibility.",
    mistake:
      "I focused on proving my point instead of protecting the relationship.",
    turningPoint:
      "After the argument ended, I realized the other person felt smaller, not understood.",
    practicalAdvice:
      "When conflict happens, separate the issue from the person and apologize for harm without adding excuses.",
    keyInsight:
      "An apology is strongest when it takes responsibility for impact.",
    quote: "You can be right and still owe someone gentleness.",
    takeaways: [
      "Do not use facts as permission to be unkind.",
      "Apologize for impact, not only intention.",
      "Repair requires changed behavior after the apology.",
    ],
    reflectionQuestions: [
      "Where am I choosing pride over repair?",
      "Who deserves an apology without defense?",
    ],
    tags: ["relationships", "conflict", "apology", "trust"],
    readingTime: 5,
    difficulty: "Beginner",
    imagePrompt:
      "Cinematic warm interior scene with two coffee cups on a table after a serious conversation, soft window light, emotional healing mood, no people faces, no text, no logo, 16:9.",
  },
];

const categories = [
  "Career",
  "Personal Growth",
  "Relationships",
  "Mindset",
  "Mistakes Learned",
  "Leadership",
  "Productivity",
  "Communication",
  "Business",
  "Finance",
  "Decision Making",
  "Habits",
  "Self Awareness",
  "Health",
  "Learning",
];

const extraTitles = [
  "The feedback I resisted but needed",
  "Why patience became my strongest strategy",
  "The day I stopped confusing confidence with ego",
  "What losing momentum taught me about systems",
  "The financial lesson hidden inside a small purchase",
  "How one difficult season made me more honest",
  "Why emotional control changed my communication",
  "The project that taught me ownership",
  "How gratitude changed my definition of success",
  "The decision that taught me timing matters",
];

function createExtendedLesson(index) {
  const base = lessonData[index % lessonData.length];
  const author = authors[index % authors.length];
  const category = categories[index % categories.length];
  const title =
    index < lessonData.length
      ? base.title
      : extraTitles[index % extraTitles.length] + ` — Lesson ${index + 1}`;

  const createdDate = new Date();
  createdDate.setDate(createdDate.getDate() - (index + 5));

  const updatedDate = new Date(createdDate);
  updatedDate.setDate(updatedDate.getDate() + 2);

  return {
    title,
    subtitle:
      index < lessonData.length
        ? base.subtitle
        : "A detailed reflection on growth, responsibility, and practical wisdom from real experience.",
    description:
      index < lessonData.length
        ? base.description
        : `A thoughtful life lesson about ${category.toLowerCase()}, written with practical examples, emotional honesty, and clear takeaways for real life.`,
    fullStory:
      index < lessonData.length
        ? base.fullStory
        : `This lesson came from a situation I did not fully understand while I was inside it. At first, it looked like a normal challenge: a missed opportunity, a hard conversation, a delayed result, or a decision that felt uncomfortable. But over time, I realized the situation was showing me something deeper about how I work, communicate, and respond under pressure.

The first mistake was assuming that effort alone would solve the problem. I was working hard, but not always thinking clearly. I was reacting instead of reflecting. That made the situation heavier than it needed to be. Once I slowed down, I noticed the pattern: I needed better preparation, better boundaries, and a more honest way of evaluating my choices.

The turning point came when I stopped asking, "Why is this happening to me?" and started asking, "What is this trying to teach me?" That question changed the entire experience. It moved me from frustration into responsibility. I could not control every result, but I could control what I learned and how I adjusted.

Since then, I have treated difficult moments differently. I write down what happened, what I felt, what I avoided, and what I would do differently next time. This simple reflection process has helped me turn confusion into clarity. The lesson is not that life becomes easy. The lesson is that experience becomes useful when we are willing to examine it honestly.`,
    context:
      index < lessonData.length
        ? base.context
        : "This lesson developed through a real challenge where the outcome was uncertain and the emotional pressure was high.",
    mistake:
      index < lessonData.length
        ? base.mistake
        : "The mistake was reacting quickly without first understanding the pattern behind the situation.",
    turningPoint:
      index < lessonData.length
        ? base.turningPoint
        : "The turning point came when reflection replaced frustration and the situation became a teacher instead of only a problem.",
    practicalAdvice:
      index < lessonData.length
        ? base.practicalAdvice
        : "Pause after difficult experiences, write down the lesson, and turn the lesson into one specific behavior change.",
    keyInsight:
      index < lessonData.length
        ? base.keyInsight
        : "Experience becomes wisdom only when it changes how you think, decide, or behave.",
    quote:
      index < lessonData.length
        ? base.quote
        : "The lesson is not always in what happened. Sometimes it is in what you finally notice.",
    takeaways:
      index < lessonData.length
        ? base.takeaways
        : [
            "Slow down before reacting to difficult situations.",
            "Write down what the experience revealed.",
            "Turn every important lesson into a practical habit.",
          ],
    reflectionQuestions:
      index < lessonData.length
        ? base.reflectionQuestions
        : [
            "What pattern is this situation showing me?",
            "What would I do differently if this happened again?",
          ],
    category: index < lessonData.length ? base.category : category,
    emotionalTone:
      index < lessonData.length
        ? base.emotionalTone
        : index % 3 === 0
        ? "Realization"
        : index % 3 === 1
        ? "Motivational"
        : "Reflective",
    difficulty:
      index % 5 === 0 ? "Advanced" : index % 3 === 0 ? "Intermediate" : "Beginner",
    readingTime: 5 + (index % 5),
    visibility: "Public",
    accessLevel: index % 4 === 0 ? "Premium" : "Free",
    imageUrl:
      index < lessonData.length
        ? base.imageUrl
        : `/lesson-images/lesson-${index + 1}.jpg`,
    featuredImage:
      index < lessonData.length
        ? base.imageUrl
        : `/lesson-images/lesson-${index + 1}.jpg`,
    imagePrompt:
      index < lessonData.length
        ? base.imagePrompt
        : `Professional cinematic editorial image for a life lesson about ${category.toLowerCase()}, warm premium lighting, realistic photography, emotional but clean atmosphere, no text, no logo, 16:9.`,
    creatorName: author.name,
    creatorPhotoUrl: author.photo,
    creatorEmail: author.email,
    creatorId: `seed-author-${index % authors.length}`,
    createdDate,
    updatedDate,
    likes: [],
    likesCount: 250 + index * 31,
    favoritesCount: 60 + index * 9,
    savesCount: 60 + index * 9,
    viewsCount: 1500 + index * 220,
    tags: [
      (index < lessonData.length ? base.category : category)
        .toLowerCase()
        .replace(/\s+/g, "-"),
      "life-lessons",
      "personal-growth",
      "reflection",
    ],
    status: "published",
    flagged: false,
    reportCount: 0,
  };
}

const lessons = Array.from({ length: 50 }, (_, index) =>
  createExtendedLesson(index)
);

async function seedLessons() {
  const client = new MongoClient(uri);

  try {
    await client.connect();

    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    if (process.env.RESET_LESSONS === "true") {
      await collection.deleteMany({});
      console.log("Existing lessons deleted");
    }

    const result = await collection.insertMany(lessons);
    console.log(`${result.insertedCount} detailed professional lessons inserted`);

    await collection.createIndex({
      title: "text",
      description: "text",
      fullStory: "text",
      keyInsight: "text",
    });

    await collection.createIndex({ category: 1 });
    await collection.createIndex({ emotionalTone: 1 });
    await collection.createIndex({ accessLevel: 1 });
    await collection.createIndex({ visibility: 1 });
    await collection.createIndex({ creatorEmail: 1 });
    await collection.createIndex({ favoritesCount: -1 });
    await collection.createIndex({ likesCount: -1 });
    await collection.createIndex({ createdDate: -1 });

    console.log("Lesson indexes created");
  } catch (error) {
    console.error("Seed failed:", error);
  } finally {
    await client.close();
    process.exit(0);
  }
}

seedLessons();