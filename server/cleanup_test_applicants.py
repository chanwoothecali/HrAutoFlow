"""
Script to clean up test applicants with 'string' as their name.
This will delete applicants and their related data (resumes, analysis, vector store).

Usage:
    python cleanup_test_applicants.py
"""

import sys
from pathlib import Path

# Add the parent directory to sys.path to import app modules
sys.path.insert(0, str(Path(__file__).parent))

from app.db import SessionLocal
from app.models import Applicant, Resume, ResumeAnalysis, VectorStore, UploadedFile


def cleanup_test_applicants():
    """Delete all applicants with 'string' as their name"""

    db = SessionLocal()
    try:
        print("🧹 Starting cleanup of test applicants with name='string'...")
        print("=" * 80)

        # Get all applicants with name='string'
        test_applicants = db.query(Applicant).filter(
            Applicant.name == 'string'
        ).all()

        if not test_applicants:
            print("✅ No test applicants found. Database is clean!")
            return

        print(f"Found {len(test_applicants)} test applicants to delete:")
        print()

        deleted_counts = {
            'applicants': 0,
            'resumes': 0,
            'analyses': 0,
            'vectors': 0,
            'files': 0
        }

        for applicant in test_applicants:
            print(f"Deleting applicant ID {applicant.id}: {applicant.name} ({applicant.email})")

            # Get related resumes
            resumes = db.query(Resume).filter(Resume.applicant_id == applicant.id).all()

            for resume in resumes:
                print(f"  - Deleting resume ID {resume.id}")

                # Delete resume analysis
                analysis_count = db.query(ResumeAnalysis).filter(
                    ResumeAnalysis.resume_id == resume.id
                ).delete()
                deleted_counts['analyses'] += analysis_count

                # Delete vector store entries
                vector_count = db.query(VectorStore).filter(
                    VectorStore.doc_id == f"resume_{resume.id}"
                ).delete()
                deleted_counts['vectors'] += vector_count

                # Delete uploaded file
                if resume.uploaded_file_id:
                    file_count = db.query(UploadedFile).filter(
                        UploadedFile.id == resume.uploaded_file_id
                    ).delete()
                    deleted_counts['files'] += file_count

                # Delete resume
                db.delete(resume)
                deleted_counts['resumes'] += 1

            # Delete applicant
            db.delete(applicant)
            deleted_counts['applicants'] += 1

        # Commit all deletions
        db.commit()

        print()
        print("=" * 80)
        print("✨ Cleanup completed successfully!")
        print(f"   Deleted {deleted_counts['applicants']} applicants")
        print(f"   Deleted {deleted_counts['resumes']} resumes")
        print(f"   Deleted {deleted_counts['analyses']} resume analyses")
        print(f"   Deleted {deleted_counts['vectors']} vector store entries")
        print(f"   Deleted {deleted_counts['files']} uploaded files")
        print("=" * 80)

    except Exception as e:
        print(f"\n❌ Error during cleanup: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("⚠️  WARNING: This will permanently delete all applicants with name='string'")
    print("   This action cannot be undone!")
    print()
    response = input("Are you sure you want to continue? (yes/no): ")

    if response.lower() in ['yes', 'y']:
        cleanup_test_applicants()
    else:
        print("❌ Cleanup cancelled.")
