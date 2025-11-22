# app/init_db.py
from app.db import engine, Base
from app.models import (
    UploadedFile,
    Position,
    Applicant,
    Resume,
    ResumeAnalysis,
    VectorStore,
    QAHistory,
    GoodCaseVector
)


def init_db():
    """데이터베이스 테이블 생성"""
    print("🔧 Creating database tables...")

    try:
        # 모든 테이블 생성
        Base.metadata.create_all(bind=engine)

        print("Tables created successfully!")
        print("\nCreated tables:")
        print("  - uploaded_file")
        print("  - positions")
        print("  - applicants")
        print("  - resumes")
        print("  - resume_analysis")
        print("  - vector_store")
        print("  - qa_history")
        print("  - good_case_vectors")

    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        raise


def drop_all_tables():
    """모든 테이블 삭제 (주의!)"""
    print("⚠️  WARNING: Dropping all tables...")

    try:
        Base.metadata.drop_all(bind=engine)
        print("All tables dropped!")
    except Exception as e:
        print(f"❌ Error dropping tables: {e}")
        raise


def reset_db():
    """데이터베이스 완전 초기화"""
    print("🔄 Resetting database...")
    drop_all_tables()
    init_db()
    print("🎉 Database reset complete!")


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "reset":
        # python app/init_db.py reset
        reset_db()
    elif len(sys.argv) > 1 and sys.argv[1] == "drop":
        # python app/init_db.py drop
        drop_all_tables()
    else:
        # python app/init_db.py
        init_db()