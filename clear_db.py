from sqlmodel import Session, delete
from app.core.db import engine
from app.modules.congregants.models import Congregant
from app.modules.payments.models import Payment
from app.modules.aliyot.models import Aliya
from app.modules.seating.models import Place
from app.modules.azkarot.models import Azkara
from app.modules.smachot.models import Simcha

def clear_database():
    with Session(engine) as session:
        # Tables with foreign keys to congregants should be cleared first
        session.exec(delete(Payment))
        session.exec(delete(Aliya))
        session.exec(delete(Place))
        session.exec(delete(Azkara))
        session.exec(delete(Simcha))
        # Finally clear congregants
        session.exec(delete(Congregant))
        session.commit()
    print("Database cleared successfully.")

if __name__ == "__main__":
    clear_database()
