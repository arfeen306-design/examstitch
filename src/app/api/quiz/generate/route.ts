import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { YoutubeTranscript } from 'youtube-transcript';

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/quiz/generate
   Body: { lessonId, difficulty?, questionCount?, regenerate? }
   Returns cached quiz or generates one via Gemini + YouTube transcript.
   ═══════════════════════════════════════════════════════════════════════════ */

const GEMINI_KEY = process.env.GEMINI_API_KEY;

interface QuizQuestion {
  question: string;
  options: [string, string, string, string];
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      lessonId,
      difficulty = 'medium',
      questionCount = 5,
      regenerate = false,
    } = body as {
      lessonId: string;
      difficulty?: string;
      questionCount?: number;
      regenerate?: boolean;
    };

    if (!lessonId) {
      return NextResponse.json({ error: 'lessonId is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // ── 1. Check for cached quiz ────────────────────────────────
    if (!regenerate) {
      const { data: cached } = await supabase
        .from('lesson_quizzes')
        .select('id, questions, difficulty, question_count, created_at')
        .eq('lesson_id', lessonId)
        .eq('difficulty', difficulty)
        .maybeSingle();

      if (cached && Array.isArray(cached.questions) && cached.questions.length > 0) {
        return NextResponse.json({
          quiz: cached,
          source: 'cache',
        });
      }
    }

    // ── 2. Fetch lesson → video URL ─────────────────────────────
    const { data: lesson, error: lessonErr } = await supabase
      .from('skill_lessons')
      .select('id, title, video_url')
      .eq('id', lessonId)
      .single();

    if (lessonErr || !lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    if (!lesson.video_url) {
      return NextResponse.json({ error: 'Lesson has no video URL' }, { status: 400 });
    }

    // ── 3. Get YouTube transcript ───────────────────────────────
    const videoId = extractVideoId(lesson.video_url);
    if (!videoId) {
      return NextResponse.json({ error: 'Could not parse YouTube video ID' }, { status: 400 });
    }

    let transcript: string;
    try {
      const segments = await YoutubeTranscript.fetchTranscript(videoId);
      transcript = segments.map((s) => s.text).join(' ');
    } catch {
      // Fallback: generate from title alone if transcript unavailable
      transcript = `Topic: "${lesson.title}". This is an educational lesson. Generate questions based on common knowledge for this topic.`;
    }

    // Truncate to ~8000 chars to stay within token limits
    if (transcript.length > 8000) {
      transcript = transcript.slice(0, 8000) + '...';
    }

    // ── 4. Generate quiz via Gemini ─────────────────────────────
    if (!GEMINI_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-lite'];

    const prompt = `You are an expert academic examiner. Based on the following lesson transcript, create exactly ${questionCount} high-quality multiple choice questions (MCQs).

Difficulty level: ${difficulty}

LESSON TITLE: "${lesson.title}"

TRANSCRIPT:
${transcript}

RULES:
- Each question must test genuine understanding, not just recall.
- Options should be plausible — avoid obviously wrong answers.
- Exactly one correct answer per question.
- Provide a brief explanation for each correct answer.

Return ONLY a valid JSON array with this exact structure — no markdown, no backticks, no extra text:
[
  {
    "question": "What is...?",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "correct_answer": "A",
    "explanation": "Brief explanation why A is correct."
  }
]`;

    let text: string | null = null;
    let lastModelErr: unknown = null;
    for (const modelName of MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        text = result.response.text();
        break; // success
      } catch (modelErr: unknown) {
        lastModelErr = modelErr;
        const errMsg = modelErr instanceof Error ? modelErr.message : String(modelErr);
        console.warn(`[quiz/generate] Model ${modelName} failed: ${errMsg.slice(0, 200)}`);
        continue; // try next model regardless of error type
      }
    }

    if (!text) {
      const errMsg = lastModelErr instanceof Error ? lastModelErr.message : '';
      if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('Too Many Requests')) {
        return NextResponse.json(
          { error: 'AI quota exceeded. Please try again in a few minutes.' },
          { status: 429 },
        );
      }
      console.error('[quiz/generate] All models failed:', lastModelErr);
      return NextResponse.json(
        { error: 'AI service unavailable. Please try again later.' },
        { status: 503 },
      );
    }

    // Parse the JSON response (handle potential markdown wrapping)
    let questions: QuizQuestion[];
    try {
      const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      questions = JSON.parse(cleaned);
      if (!Array.isArray(questions)) throw new Error('Not an array');
    } catch {
      return NextResponse.json(
        { error: 'AI returned invalid format. Please try regenerating.' },
        { status: 502 },
      );
    }

    // Validate structure
    questions = questions.slice(0, questionCount).map((q) => ({
      question: String(q.question || ''),
      options: [
        String(q.options?.[0] || 'Option A'),
        String(q.options?.[1] || 'Option B'),
        String(q.options?.[2] || 'Option C'),
        String(q.options?.[3] || 'Option D'),
      ] as [string, string, string, string],
      correct_answer: (['A', 'B', 'C', 'D'].includes(q.correct_answer) ? q.correct_answer : 'A') as 'A' | 'B' | 'C' | 'D',
      explanation: String(q.explanation || ''),
    }));

    // ── 5. Cache to Supabase ────────────────────────────────────
    const { data: saved, error: saveErr } = await supabase
      .from('lesson_quizzes')
      .upsert(
        {
          lesson_id: lessonId,
          questions,
          difficulty,
          question_count: questions.length,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'lesson_id,difficulty' },
      )
      .select('id, questions, difficulty, question_count, created_at')
      .single();

    if (saveErr) {
      console.error('[quiz/generate] Save error:', saveErr);
      // Still return the quiz even if caching fails
      return NextResponse.json({
        quiz: { questions, difficulty, question_count: questions.length },
        source: 'generated',
      });
    }

    return NextResponse.json({ quiz: saved, source: 'generated' });
  } catch (err) {
    console.error('[quiz/generate] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Failed to generate quiz. Please try again.' },
      { status: 500 },
    );
  }
}

// ── Helper: extract YouTube video ID ──────────────────────────────────────

function extractVideoId(url: string): string | null {
  const m = url.match(/(?:v=|\/embed\/|youtu\.be\/|\/v\/)([a-zA-Z0-9_-]{11})/);
  if (m) return m[1];
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  return null;
}
