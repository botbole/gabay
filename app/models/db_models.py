"""
Backward-compatibility shim.

All model classes now live in their respective module packages.
This file re-exports them so legacy imports continue to work.
"""

from app.modules.congregants.models import Congregant, MemberType  # noqa: F401
from app.modules.payments.models import Payment  # noqa: F401
from app.modules.aliyot.models import Aliya  # noqa: F401
from app.modules.seating.models import Place  # noqa: F401
from app.modules.azkarot.models import Azkara  # noqa: F401
from app.modules.smachot.models import Simcha, SimchaType  # noqa: F401
