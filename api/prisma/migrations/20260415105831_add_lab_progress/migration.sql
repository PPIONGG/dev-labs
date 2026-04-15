-- CreateTable
CREATE TABLE "lab_progress" (
    "user_id" TEXT NOT NULL,
    "lab_slug" TEXT NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lab_progress_pkey" PRIMARY KEY ("user_id","lab_slug")
);

-- CreateIndex
CREATE INDEX "lab_progress_user_id_idx" ON "lab_progress"("user_id");

-- AddForeignKey
ALTER TABLE "lab_progress" ADD CONSTRAINT "lab_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
