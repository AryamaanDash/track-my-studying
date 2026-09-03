-- Store study session dates as calendar days, never timestamps.
ALTER TABLE "StudySession"
ALTER COLUMN "date" DROP DEFAULT,
ALTER COLUMN "date" TYPE DATE USING "date"::date,
ALTER COLUMN "date" SET DEFAULT CURRENT_DATE;
