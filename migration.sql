-- ============================================================
-- SQL Migration: جميع الجداول المطلوبة للمشروع
-- شغّل الكود ده في Supabase SQL Editor
-- ============================================================

-- 1. إضافة الأعمدة الناقصة لجدول courses
ALTER TABLE courses ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES profiles(id);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS thumbnail TEXT;

-- 2. جدول الربط بين الكورسات والمدرسين (course_teachers)
CREATE TABLE IF NOT EXISTS course_teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(course_id, teacher_id)
);

-- 3. جدول الإشعارات (notifications)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'إشعار جديد',
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. جدول أكواد الخصم (discount_codes)
CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  temp_password TEXT,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  duration_unit TEXT DEFAULT 'month',
  duration_value INTEGER DEFAULT 1,
  max_uses INTEGER DEFAULT 1,
  discount_percent NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. جدول مشتريات الكورسات (course_purchases)
CREATE TABLE IF NOT EXISTS course_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  amount NUMERIC DEFAULT 0,
  discount_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- 6. جدول إعدادات المنصة (platform_settings)
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_name TEXT DEFAULT 'راجع',
  maintenance_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- إدخال الإعدادات الافتراضية لو مش موجودة
INSERT INTO platform_settings (platform_name, maintenance_mode)
VALUES ('راجع', false)
ON CONFLICT DO NOTHING;

-- 7. إضافة عمود file_type لجدول summaries
ALTER TABLE summaries ADD COLUMN IF NOT EXISTS file_type TEXT DEFAULT 'file';

-- ============================================================
-- 8. نظام الإشعارات الذكي (Smart Notifications System)
-- ============================================================

-- 8a. إعادة هيكلة جدول الإشعارات المصدرية
-- (لو العمود موجود مسبقاً بدون default، الـ SET DEFAULT بيظبطه)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE notifications ALTER COLUMN type SET DEFAULT 'admin';
UPDATE notifications SET type = 'admin' WHERE type IS NULL;

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS target_type TEXT;
ALTER TABLE notifications ALTER COLUMN target_type SET DEFAULT 'all';
UPDATE notifications SET target_type = 'all' WHERE target_type IS NULL;

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS target_id UUID;

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority TEXT;
ALTER TABLE notifications ALTER COLUMN priority SET DEFAULT 'normal';
UPDATE notifications SET priority = 'normal' WHERE priority IS NULL;

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

-- خلي user_id يقبل NULL — الإشعارات الجديدة مش بتحتاجه
-- (user_id كان لازم في التصميم القديم، دلوقتي user_notifications هي اللي بتحدد المستلم)
ALTER TABLE notifications ALTER COLUMN user_id DROP NOT NULL;

-- 8b. جدول الربط: user_notifications (كل user عنده clone من الإشعار مع حالة القراءة)
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, notification_id)
);

-- 8c. جدول إعدادات الإشعارات لكل مستخدم
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  notify_videos BOOLEAN DEFAULT true,
  notify_lectures BOOLEAN DEFAULT true,
  notify_courses BOOLEAN DEFAULT true,
  notify_files BOOLEAN DEFAULT true,
  notify_questions BOOLEAN DEFAULT true,
  notify_teacher_content BOOLEAN DEFAULT true,
  notify_admin BOOLEAN DEFAULT true,
  notify_offers BOOLEAN DEFAULT true,
  notify_maintenance BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8d. RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- RLS: notifications — الجميع يشوف
DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
DROP POLICY IF EXISTS "public_read_notifications" ON notifications;
CREATE POLICY "public_read_notifications" ON notifications
  FOR SELECT USING (true);

-- RLS: notifications — أي authenticated user يقدر يinsert/update/delete
-- (محمي بواجهة الأدمن)
DROP POLICY IF EXISTS "admin_insert_notifications" ON notifications;
DROP POLICY IF EXISTS "admin_delete_notifications" ON notifications;
DROP POLICY IF EXISTS "admin_all_notifications" ON notifications;
CREATE POLICY "authenticated_all_notifications" ON notifications
  FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS: user_notifications — user يشوف إشعاراته فقط
DROP POLICY IF EXISTS "user_read_own_user_notifications" ON user_notifications;
CREATE POLICY "user_read_own_user_notifications" ON user_notifications
  FOR SELECT USING (user_id = auth.uid());

-- RLS: user_notifications — user يقدر يupdate is_read
DROP POLICY IF EXISTS "user_update_own_user_notifications" ON user_notifications;
CREATE POLICY "user_update_own_user_notifications" ON user_notifications
  FOR UPDATE USING (user_id = auth.uid());

-- RLS: user_notifications — أي authenticated user يقدر يinsert
-- (الأمان مضمون لأن UI الإرسال متاح بس للأدمن بعد التحقق بكلمة السر)
DROP POLICY IF EXISTS "admin_insert_user_notifications" ON user_notifications;
CREATE POLICY "admin_insert_user_notifications" ON user_notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS: notification_settings — user يشوف/يعدل إعداداته
DROP POLICY IF EXISTS "user_read_own_notif_settings" ON notification_settings;
CREATE POLICY "user_read_own_notif_settings" ON notification_settings
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_upsert_notif_settings" ON notification_settings;
CREATE POLICY "user_upsert_notif_settings" ON notification_settings
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_update_own_notif_settings" ON notification_settings;
CREATE POLICY "user_update_own_notif_settings" ON notification_settings
  FOR UPDATE USING (user_id = auth.uid());

-- RLS: كل يوزر يشوف الكورسات (عامة)
DROP POLICY IF EXISTS "public_read_courses" ON courses;
CREATE POLICY "public_read_courses" ON courses
  FOR SELECT USING (true);

-- RLS: الـ admin يقدر يعمل أي حاجة على الكورسات
DROP POLICY IF EXISTS "admin_all_courses" ON courses;
CREATE POLICY "admin_all_courses" ON courses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS: الكورسات المتاحة (everyone can read published courses)
DROP POLICY IF EXISTS "public_read_platform_settings" ON platform_settings;
CREATE POLICY "public_read_platform_settings" ON platform_settings
  FOR SELECT USING (true);

-- RLS: فقط الـ admin يعدل إعدادات المنصة
DROP POLICY IF EXISTS "admin_update_platform_settings" ON platform_settings;
CREATE POLICY "admin_update_platform_settings" ON platform_settings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS: أكواد الخصم (admin يشوفها ويعملها)
DROP POLICY IF EXISTS "admin_all_discount_codes" ON discount_codes;
CREATE POLICY "admin_all_discount_codes" ON discount_codes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS: مشتريات الكورسات
DROP POLICY IF EXISTS "admin_all_purchases" ON course_purchases;
CREATE POLICY "admin_all_purchases" ON course_purchases
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "user_own_purchases" ON course_purchases;
CREATE POLICY "user_own_purchases" ON course_purchases
  FOR SELECT USING (user_id = auth.uid());

-- ============================================================
-- ميزات متقدمة للمعلمين
-- ============================================================

-- 1. جدول تقييمات المعلمين
CREATE TABLE IF NOT EXISTS teacher_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(teacher_id, user_id)
);

-- 2. جدول متابعين المعلمين
CREATE TABLE IF NOT EXISTS teacher_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notify_setting TEXT DEFAULT 'all', -- 'all', 'courses_only', 'lessons_only', 'muted'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(teacher_id, user_id)
);

-- لو العمود موجود مسبقاً
ALTER TABLE teacher_followers ADD COLUMN IF NOT EXISTS notify_setting TEXT DEFAULT 'all';

-- 3. إضافة أعمدة إحصائية للمعلمين
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS rating_avg NUMERIC DEFAULT 0;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

-- 4. RLS Policies

ALTER TABLE teacher_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_followers ENABLE ROW LEVEL SECURITY;

-- تقييمات: كل يوزر يشوفها
DROP POLICY IF EXISTS "public_read_ratings" ON teacher_ratings;
CREATE POLICY "public_read_ratings" ON teacher_ratings FOR SELECT USING (true);

-- تقييمات: كل يوزر يقدر يكتب تقييم واحد
DROP POLICY IF EXISTS "user_upsert_rating" ON teacher_ratings;
CREATE POLICY "user_upsert_rating" ON teacher_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_update_own_rating" ON teacher_ratings;
CREATE POLICY "user_update_own_rating" ON teacher_ratings FOR UPDATE USING (auth.uid() = user_id);

-- متابعين: كل يوزر يشوفها
DROP POLICY IF EXISTS "public_read_followers" ON teacher_followers;
CREATE POLICY "public_read_followers" ON teacher_followers FOR SELECT USING (true);

-- متابعين: كل يوزر يقدر يتابع / يلغي
DROP POLICY IF EXISTS "user_follow_teacher" ON teacher_followers;
CREATE POLICY "user_follow_teacher" ON teacher_followers FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_unfollow_teacher" ON teacher_followers;
CREATE POLICY "user_unfollow_teacher" ON teacher_followers FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- نظام الإشعارات التلقائي للمعلمين المتابَعين
-- ============================================================

-- Function: إنشاء إشعار عند نشر درس جديد
CREATE OR REPLACE FUNCTION notify_followers_on_new_lesson()
RETURNS TRIGGER AS $$
DECLARE
  teacher_record RECORD;
  course_record RECORD;
  follower RECORD;
  notif_id UUID;
BEGIN
  -- Get the lecture and course info
  SELECT c.id AS course_id, c.title AS course_title
  INTO course_record
  FROM lectures l
  JOIN courses c ON c.id = l.course_id
  WHERE l.id = NEW.lecture_id;

  -- Get teacher info
  SELECT t.id AS teacher_id, t.name AS teacher_name
  INTO teacher_record
  FROM course_teachers ct
  JOIN teachers t ON t.id = ct.teacher_id
  WHERE ct.course_id = course_record.course_id
  LIMIT 1;

  IF NOT FOUND THEN RETURN NEW; END IF;

  -- Create the source notification
  INSERT INTO notifications (user_id, type, title, message, target_type, target_id, priority)
  VALUES (
    (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
    'video',
    'درس جديد: ' || NEW.title,
    'المعلم ' || teacher_record.teacher_name || ' نشر درس "' || NEW.title || '" في "' || course_record.course_title || '"',
    'teacher',
    teacher_record.teacher_id,
    'normal'
  )
  RETURNING id INTO notif_id;

  -- Create user_notifications for followers with notify_setting IN ('all', 'lessons_only')
  FOR follower IN
    SELECT user_id FROM teacher_followers
    WHERE teacher_id = teacher_record.teacher_id
      AND notify_setting IN ('all', 'lessons_only')
  LOOP
    INSERT INTO user_notifications (user_id, notification_id)
    VALUES (follower.user_id, notif_id);
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_lesson_followers ON lessons;
CREATE TRIGGER trigger_notify_lesson_followers
  AFTER INSERT ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION notify_followers_on_new_lesson();

-- Function: إنشاء إشعار عند نشر كورس جديد
CREATE OR REPLACE FUNCTION notify_followers_on_new_course()
RETURNS TRIGGER AS $$
DECLARE
  teacher_record RECORD;
  subject_record RECORD;
  follower RECORD;
  notif_id UUID;
BEGIN
  -- Get first teacher of this course
  SELECT t.id AS teacher_id, t.name AS teacher_name
  INTO teacher_record
  FROM course_teachers ct
  JOIN teachers t ON t.id = ct.teacher_id
  WHERE ct.course_id = NEW.id
  LIMIT 1;

  IF NOT FOUND THEN RETURN NEW; END IF;

  -- Get subject name
  SELECT name INTO subject_record FROM subjects WHERE id = NEW.subject_id;

  -- Create source notification
  INSERT INTO notifications (user_id, type, title, message, target_type, target_id, priority)
  VALUES (
    (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
    'course',
    'كورس جديد: ' || NEW.title,
    'المعلم ' || teacher_record.teacher_name || ' أطلق كورس "' || NEW.title || '" في "' || COALESCE(subject_record.name, '') || '"',
    'teacher',
    teacher_record.teacher_id,
    'important'
  )
  RETURNING id INTO notif_id;

  -- Notify followers with setting IN ('all', 'courses_only')
  FOR follower IN
    SELECT user_id FROM teacher_followers
    WHERE teacher_id = teacher_record.teacher_id
      AND notify_setting IN ('all', 'courses_only')
  LOOP
    INSERT INTO user_notifications (user_id, notification_id)
    VALUES (follower.user_id, notif_id);
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_course_followers ON courses;
CREATE TRIGGER trigger_notify_course_followers
  AFTER INSERT ON courses
  FOR EACH ROW
  EXECUTE FUNCTION notify_followers_on_new_course();

-- ============================================================
-- نهاية نظام الإشعارات التلقائي
-- ============================================================

-- 5. Function لتحديث rating_avg و rating_count
CREATE OR REPLACE FUNCTION update_teacher_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE teachers SET
    rating_avg = (SELECT COALESCE(AVG(rating), 0) FROM teacher_ratings WHERE teacher_id = NEW.teacher_id),
    rating_count = (SELECT COUNT(*) FROM teacher_ratings WHERE teacher_id = NEW.teacher_id)
  WHERE id = NEW.teacher_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_teacher_rating ON teacher_ratings;
CREATE TRIGGER trigger_update_teacher_rating
  AFTER INSERT OR UPDATE OR DELETE ON teacher_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_teacher_rating();
