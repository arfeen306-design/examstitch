-- Fix CS A-Level category slugs to match frontend navigation config.
--
-- The frontend video-lectures page calls getCategoryBySlug(subject, paper)
-- where `paper` comes from navigation.ts aLevelPapersBySubject config.
-- CS category slugs were using a cs-prefixed format (e.g. cs-a-paper-1-theory)
-- that didn't match the expected format (e.g. paper-1-theory-fundamentals).
--
-- Maths categories already used the correct format, so this aligns CS to match.

UPDATE categories SET slug = 'paper-1-theory-fundamentals'
WHERE id = '605065c8-6b84-4831-ba2b-f97b37a141f2'
  AND slug = 'cs-a-paper-1-theory';

UPDATE categories SET slug = 'paper-2-problem-solving-programming'
WHERE id = '254f3a4b-9413-48bd-8fba-08061de83089'
  AND slug = 'cs-a-paper-2-problem-solving';

UPDATE categories SET slug = 'paper-3-advanced-theory'
WHERE id = '064fd2dd-33cf-4b4c-9b8e-c8e48a788b8a'
  AND slug = 'cs-a-paper-3-advanced-theory';

UPDATE categories SET slug = 'paper-4-practical'
WHERE id = '6bde33b6-1e94-4608-a2b8-bbcac2ad4df1'
  AND slug = 'cs-a-paper-4-practical';
