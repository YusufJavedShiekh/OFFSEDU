from sqlalchemy.orm import Session

from database.models import StudyPlan


# =========================================================
# CREATE STUDY PLAN
# =========================================================

def create_study_plan(
    db: Session,
    user_id: int | None,
    title: str,
    subjects: str,
    duration_days: int,
    hours_per_day: float,
    plan_data: str,
    language: str = "English",
):
    study_plan = StudyPlan(
        user_id=user_id,
        title=title,
        subjects=subjects,
        duration_days=duration_days,
        hours_per_day=hours_per_day,
        language=language,
        plan_data=plan_data,
    )

    db.add(study_plan)
    db.commit()
    db.refresh(study_plan)

    return study_plan


# =========================================================
# GET STUDY PLAN
# =========================================================

def get_study_plan(
    db: Session,
    plan_id: int,
):
    return (
        db.query(StudyPlan)
        .filter(
            StudyPlan.id == plan_id
        )
        .first()
    )


# =========================================================
# GET USER STUDY PLANS
# =========================================================

def get_user_study_plans(
    db: Session,
    user_id: int,
):
    return (
        db.query(StudyPlan)
        .filter(
            StudyPlan.user_id == user_id
        )
        .order_by(
            StudyPlan.created_at.desc()
        )
        .all()
    )


# =========================================================
# UPDATE STUDY PLAN
# =========================================================

def update_study_plan(
    db: Session,
    plan_id: int,
    title: str | None = None,
    subjects: str | None = None,
    duration_days: int | None = None,
    hours_per_day: float | None = None,
    plan_data: str | None = None,
):
    study_plan = get_study_plan(
        db,
        plan_id
    )

    if not study_plan:
        return None

    if title is not None:
        study_plan.title = title

    if subjects is not None:
        study_plan.subjects = subjects

    if duration_days is not None:
        study_plan.duration_days = duration_days

    if hours_per_day is not None:
        study_plan.hours_per_day = hours_per_day

    if plan_data is not None:
        study_plan.plan_data = plan_data

    db.commit()
    db.refresh(study_plan)

    return study_plan


# =========================================================
# DELETE STUDY PLAN
# =========================================================

def delete_study_plan(
    db: Session,
    plan_id: int,
):
    study_plan = get_study_plan(
        db,
        plan_id
    )

    if not study_plan:
        return False

    db.delete(study_plan)
    db.commit()

    return True
