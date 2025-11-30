"""
Script to recalculate scores for existing applicants based on their resume analysis.
Run this script to update scores for applicants who already have resume analysis.

Usage:
    python recalculate_scores.py
"""

import sys
from pathlib import Path

# Add the parent directory to sys.path to import app modules
sys.path.insert(0, str(Path(__file__).parent))

from app.db import SessionLocal
from app.models import Applicant, Resume, ResumeAnalysis


def recalculate_applicant_scores():
    """Recalculate scores for all applicants with resume analysis"""

    db = SessionLocal()
    try:
        print("🔄 Starting score recalculation for all applicants...")
        print("=" * 60)

        # Get all resumes with completed analysis
        resumes = db.query(Resume).filter(
            Resume.processing_status == "completed"
        ).all()

        print(f"📊 Found {len(resumes)} completed resumes")
        print()

        updated_count = 0
        skipped_count = 0

        for resume in resumes:
            # Get the analysis for this resume
            analysis = db.query(ResumeAnalysis).filter(
                ResumeAnalysis.resume_id == resume.id
            ).first()

            if not analysis:
                print(f"⚠️  Resume {resume.id}: No analysis found, skipping...")
                skipped_count += 1
                continue

            # Get the applicant
            applicant = db.query(Applicant).filter(
                Applicant.id == resume.applicant_id
            ).first()

            if not applicant:
                print(f"⚠️  Resume {resume.id}: No applicant found, skipping...")
                skipped_count += 1
                continue

            # Calculate score from skills_summary
            skills = analysis.skills_summary
            applicant_score = 0

            if skills and isinstance(skills, dict) and len(skills) > 0:
                # Calculate average of top 5 skills
                top_skills = sorted(skills.items(), key=lambda x: x[1], reverse=True)[:5]
                if top_skills:
                    total_score = sum(score for _, score in top_skills)
                    applicant_score = int(total_score / len(top_skills))

            # Update applicant score
            old_score = applicant.score
            applicant.score = applicant_score

            print(f"✅ Applicant: {applicant.name} (ID: {applicant.id})")
            print(f"   Old score: {old_score} → New score: {applicant_score}")
            print(f"   Top skills: {dict(sorted(skills.items(), key=lambda x: x[1], reverse=True)[:5]) if skills else 'None'}")
            print()

            updated_count += 1

        # Commit all changes
        db.commit()

        print("=" * 60)
        print(f"✨ Score recalculation completed!")
        print(f"   Updated: {updated_count} applicants")
        print(f"   Skipped: {skipped_count} applicants")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ Error during score recalculation: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    recalculate_applicant_scores()
